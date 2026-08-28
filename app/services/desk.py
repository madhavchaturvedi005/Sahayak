"""Field officer → supervisor → CM office assignment and 21-day escalation."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.grievance import Grievance, GrievanceEvent
from app.models.user import User
from app.services.community import BACKER_THRESHOLD, PUSH_THRESHOLD
from app.services.review import is_resolved

log = logging.getLogger(__name__)

SLA_DAYS = 21
STAFF_ROLES = ("officer", "supervisor", "cm", "admin")
CITIZEN_ROLES = ("citizen",)

LEVELS = {
    1: {
        "key": "officer",
        "role": "officer",
        "label": "Field officer",
        "label_hi": "क्षेत्र अधिकारी",
        "blurb": "First desk after you lodge. They have 21 days to resolve the file or it moves up.",
        "blurb_hi": "दर्ज करने के बाद पहला डेस्क। 21 दिनों में निराकरण न हो तो फ़ाइल ऊपर जाएगी।",
    },
    2: {
        "key": "supervisor",
        "role": "supervisor",
        "label": "Supervisor",
        "label_hi": "वरिष्ठ अधिकारी",
        "blurb": "Takes the file if the field desk misses 21 days, and presses that officer to finish it.",
        "blurb_hi": "क्षेत्र डेस्क 21 दिन चूकने पर फ़ाइल यहाँ आती है। यही अधिकारी नीचे वाले पर दबाव डालते हैं।",
    },
    3: {
        "key": "cm",
        "role": "cm",
        "label": "CM office",
        "label_hi": "मुख्यमंत्री कार्यालय",
        "blurb": "Final desk. If the supervisor also misses 21 days, the file comes here to be closed.",
        "blurb_hi": "अंतिम डेस्क। वरिष्ठ भी 21 दिन चूकें तो फ़ाइल मुख्यमंत्री कार्यालय में बंद होती है।",
    },
}

ROLE_LEVEL = {
    "officer": 1,
    "supervisor": 2,
    "cm": 3,
    "admin": 3,
}

EVENT_COPY = {
    1: (
        "Assigned to field officer",
        "Your grievance is with {name} at the field desk. They have 21 days to resolve it.",
    ),
    2: (
        "Escalated to supervisor",
        "The field desk did not close this in 21 days. It is now with {name}. They will press the field officer and take the case.",
    ),
    3: (
        "Escalated to the Chief Minister's Office",
        "The supervisor desk missed its 21-day window. This file is now with the CM office ({name}).",
    ),
}


def is_staff_role(role: str | None) -> bool:
    return (role or "citizen") in STAFF_ROLES


def desk_level_for_role(role: str | None) -> int | None:
    return ROLE_LEVEL.get(role or "citizen")


def apply_role_desk(user: User) -> None:
    user.desk_level = desk_level_for_role(user.role)


def level_label(level: int, lang: str = "en") -> str:
    meta = LEVELS.get(level) or LEVELS[1]
    return meta["label_hi"] if lang == "hi" else meta["label"]


def sla_due_at(row: Grievance) -> datetime | None:
    start = row.level_assigned_at or row.created_at
    if not start:
        return None
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    return start + timedelta(days=SLA_DAYS)


def sla_overdue(row: Grievance, now: datetime | None = None) -> bool:
    if is_resolved(row.status) or row.status == "Rejected":
        return False
    due = sla_due_at(row)
    if not due:
        return False
    clock = now or datetime.now(timezone.utc)
    return clock > due


def days_on_desk(row: Grievance, now: datetime | None = None) -> int:
    start = row.level_assigned_at or row.created_at
    if not start:
        return 0
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    clock = now or datetime.now(timezone.utc)
    return max(0, int((clock - start).total_seconds() // 86400))


# Common suffixes in desk titles that must not count as a location match.
_TITLE_STOPWORDS = {
    "field",
    "officer",
    "divisional",
    "supervisor",
    "municipal",
    "corporation",
    "office",
    "ward",
    "cell",
    "chief",
    "minister",
    "principal",
    "secretary",
    "grievance",
    "portal",
    "administrator",
    "bmc",
    "cmo",
}


def _location_tokens(row: Grievance | None) -> list[str]:
    """Location words from the grievance, strongest (district/city) first."""
    if row is None:
        return []
    tokens: list[str] = []
    for value in (row.district, row.village, row.ward, row.street):
        if not value:
            continue
        cleaned = str(value).strip().lower()
        if cleaned:
            tokens.append(cleaned)
    return tokens


def _officer_covers_location(officer: User, tokens: list[str]) -> bool:
    """True if the officer's desk title mentions the grievance's place."""
    title = (officer.desk_title or "").lower()
    if not title or not tokens:
        return False
    for token in tokens:
        # Whole phrase match, e.g. "chhatrapati sambhajinagar".
        if len(token) >= 4 and token in title:
            return True
        # Word-by-word match, ignoring generic desk words like "municipal".
        for word in token.split():
            if len(word) >= 4 and word not in _TITLE_STOPWORDS and word in title:
                return True
    return False


# In-memory cache so the same location → officer lookup doesn't hit the API twice.
_ai_assignment_cache: dict[str, str | None] = {}


def _location_description(row: Grievance) -> str:
    """Compact human-readable location string from the grievance."""
    parts: list[str] = []
    if row.district:
        parts.append(f"district: {row.district}")
    if row.village:
        parts.append(f"city/village: {row.village}")
    if row.ward:
        parts.append(f"ward/area: {row.ward}")
    if row.latitude and row.longitude:
        parts.append(f"GPS: {row.latitude:.5f},{row.longitude:.5f}")
    return ", ".join(parts)


def _ai_pick_officer(officers: list[User], row: Grievance) -> User | None:
    """Ask an LLM which officer best covers the grievance location.

    Returns None on any failure; callers must fall back to string / load matching.
    Response is cached by (location + officer list) key so the API is only called once
    per unique combination.
    """
    loc = _location_description(row)
    if not loc or not officers:
        return None

    from app.core.config import settings  # avoid circular at module load
    if not settings.openai_api_key:
        return None

    # Build the officer list once; use it as part of the cache key.
    officer_lines = "\n".join(
        f"{i + 1}. {o.name} — {o.desk_title or 'no title'}"
        for i, o in enumerate(officers)
    )
    cache_key = f"{loc}::{officer_lines}"
    if cache_key in _ai_assignment_cache:
        cached_name = _ai_assignment_cache[cache_key]
        if cached_name:
            for o in officers:
                if o.name == cached_name:
                    return o
        return None  # cached as "no match"

    prompt = (
        "You are routing a public grievance to the correct local officer.\n\n"
        f"Available officers:\n{officer_lines}\n\n"
        f"Grievance location: {loc}\n\n"
        "Which officer number (1-based) is responsible for this location? "
        "Consider city names, districts, municipal areas, and common aliases. "
        "Reply with ONLY a single integer. If none match, reply 0."
    )

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key, timeout=6.0)
        resp = client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4,
            temperature=0,
        )
        raw = (resp.choices[0].message.content or "").strip()
        # Extract the first number from the response defensively.
        match = re.search(r"\d+", raw)
        if match:
            idx = int(match.group()) - 1
            if 0 <= idx < len(officers):
                _ai_assignment_cache[cache_key] = officers[idx].name
                log.info(
                    "AI assigned officer %s for location '%s'",
                    officers[idx].name,
                    loc,
                )
                return officers[idx]
        # Model returned 0 or nothing useful → cache as no-match.
        _ai_assignment_cache[cache_key] = None
    except Exception:
        log.debug("AI officer pick failed, falling back to string match", exc_info=True)

    return None


def pick_officer(db: Session, level: int, row: Grievance | None = None) -> User | None:
    role = LEVELS[level]["role"]
    officers = db.query(User).filter(User.role == role).order_by(User.created_at.asc()).all()
    if not officers and level == 3:
        officers = db.query(User).filter(User.role.in_(["cm", "admin"])).order_by(User.created_at.asc()).all()
    if not officers:
        return None

    def load(officer: User) -> int:
        return (
            db.query(Grievance)
            .filter(Grievance.assigned_user_id == officer.id)
            .filter(~Grievance.status.in_(["Resolved", "Closed", "Rejected"]))
            .count()
        )

    tokens = _location_tokens(row)

    # Strategy 1 — AI semantic matching (fast, cheap, handles aliases & Hindi names).
    if row and tokens:
        ai_pick = _ai_pick_officer(officers, row)
        if ai_pick:
            return ai_pick

    # Strategy 2 — Keyword/word overlap matching on desk title (no API needed).
    if tokens:
        local = [o for o in officers if _officer_covers_location(o, tokens)]
        if local:
            return min(local, key=load)

    # Strategy 3 — Pure load balancing (used only when no location data at all).
    return min(officers, key=load)


def _write_event(row: Grievance, level: int, officer: User | None) -> GrievanceEvent:
    title, detail = EVENT_COPY[level]
    name = officer.name if officer else level_label(level)
    return GrievanceEvent(grievance_id=row.id, title=title, detail=detail.format(name=name))


def assign_on_create(db: Session, row: Grievance) -> User | None:
    officer = pick_officer(db, 1, row)
    now = datetime.now(timezone.utc)
    row.escalation_level = 1
    row.level_assigned_at = now
    if officer:
        row.assigned_user_id = officer.id
        row.field_officer_id = officer.id
    if row.id:
        db.add(_write_event(row, 1, officer))
    return officer


def escalate_one(db: Session, row: Grievance, actor: User | None = None) -> bool:
    if is_resolved(row.status) or row.status == "Rejected":
        return False
    current = row.escalation_level or 1
    if current >= 3:
        return False
    nxt = current + 1
    officer = pick_officer(db, nxt, row)
    row.escalation_level = nxt
    row.assigned_user_id = officer.id if officer else row.assigned_user_id
    row.level_assigned_at = datetime.now(timezone.utc)
    row.status = "Escalated"
    row.updated_at = row.level_assigned_at
    event = _write_event(row, nxt, officer)
    if actor:
        event.detail = f"{event.detail}\n\n— {actor.name}"
    db.add(event)
    return True


def apply_due_escalations(db: Session, row: Grievance | None = None) -> int:
    query = db.query(Grievance)
    if row:
        query = query.filter(Grievance.id == row.id)
    moved = 0
    for item in query.all():
        hops = 0
        while hops < 2 and sla_overdue(item) and (item.escalation_level or 1) < 3:
            if not escalate_one(db, item):
                break
            hops += 1
            moved += 1
    if moved:
        db.commit()
        if row:
            db.refresh(row)
    return moved


def visible_query(db: Session, officer: User):
    q = db.query(Grievance)
    role = officer.role or "citizen"
    if role in {"admin", "cm"}:
        return q
    if role == "supervisor":
        return q.filter(
            (Grievance.escalation_level >= 2)
            | (Grievance.assigned_user_id == officer.id)
            | (Grievance.field_officer_id == officer.id)
        )
    return q.filter((Grievance.assigned_user_id == officer.id) | (Grievance.field_officer_id == officer.id))


def can_act(officer: User, row: Grievance) -> bool:
    role = officer.role or "citizen"
    if role in {"admin", "cm"}:
        return True
    if role == "supervisor":
        return (row.escalation_level or 1) >= 2 or row.assigned_user_id == officer.id
    return row.assigned_user_id == officer.id or row.field_officer_id == officer.id


def serialize_grievance(row: Grievance, db: Session) -> dict:
    assigned = db.query(User).filter(User.id == row.assigned_user_id).first() if row.assigned_user_id else None
    field = db.query(User).filter(User.id == row.field_officer_id).first() if row.field_officer_id else None
    if row.answers is None:
        row.answers = {}
    if row.evidence is None:
        row.evidence = []
    due = sla_due_at(row)
    return {
        "id": row.id,
        "registration_id": row.registration_id,
        "kind": row.kind,
        "name": row.name,
        "mobile": row.mobile,
        "ministry": row.ministry,
        "category": row.category,
        "subject": row.subject,
        "description": row.description,
        "playbook_id": row.playbook_id,
        "village": row.village,
        "ward": row.ward,
        "district": row.district,
        "street": row.street,
        "latitude": row.latitude,
        "longitude": row.longitude,
        "filer_role": row.filer_role,
        "helper_name": row.helper_name,
        "helper_relation": row.helper_relation,
        "consent_capture": getattr(row, "consent_capture", "") or "",
        "impact_scope": getattr(row, "impact_scope", "self") or "self",
        "backer_count": getattr(row, "backer_count", 0) or 0,
        "push_count": getattr(row, "push_count", 0) or 0,
        "pending_raise_count": getattr(row, "pending_raise_count", 0) or 0,
        "verification_radius_m": getattr(row, "verification_radius_m", 800) or 800,
        "onsite_radius_m": getattr(row, "onsite_radius_m", 150) or 150,
        "answers": row.answers,
        "evidence": row.evidence,
        "status": row.status,
        "expected_days": row.expected_days,
        "pendency_pct": row.pendency_pct,
        "routing_reason": row.routing_reason,
        "rating": row.rating,
        "reminder_count": row.reminder_count,
        "closed_at": row.closed_at,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "events": row.events or [],
        "assigned_user_id": row.assigned_user_id,
        "assigned_name": assigned.name if assigned else "",
        "assigned_role": assigned.role if assigned else "",
        "assigned_title": (assigned.desk_title if assigned else "") or "",
        "field_officer_id": row.field_officer_id,
        "field_officer_name": field.name if field else "",
        "escalation_level": row.escalation_level or 1,
        "escalation_label": level_label(row.escalation_level or 1),
        "level_assigned_at": row.level_assigned_at,
        "sla_days": SLA_DAYS,
        "sla_due_at": due,
        "sla_overdue": sla_overdue(row),
        "days_on_desk": days_on_desk(row),
        "priority_crossed": (getattr(row, "backer_count", 0) or 0) >= BACKER_THRESHOLD
        or (getattr(row, "push_count", 0) or 0) >= PUSH_THRESHOLD,
    }


def desk_map(db: Session) -> dict:
    apply_due_escalations(db)
    levels = []
    for level, meta in LEVELS.items():
        people = (
            db.query(User)
            .filter(User.role == meta["role"])
            .order_by(User.name.asc())
            .all()
        )
        open_at_level = (
            db.query(Grievance)
            .filter(Grievance.escalation_level == level)
            .filter(~Grievance.status.in_(["Resolved", "Closed", "Rejected"]))
            .count()
        )
        packed = []
        for person in people:
            packed.append(
                {
                    "id": person.id,
                    "name": person.name,
                    "role": person.role,
                    "desk_title": person.desk_title or meta["label"],
                    "mobile": person.mobile,
                    "open_assigned": (
                        db.query(Grievance)
                        .filter(Grievance.assigned_user_id == person.id)
                        .filter(~Grievance.status.in_(["Resolved", "Closed", "Rejected"]))
                        .count()
                    ),
                }
            )
        levels.append(
            {
                "level": level,
                "key": meta["key"],
                "title": meta["label"],
                "title_hi": meta["label_hi"],
                "blurb": meta["blurb"],
                "blurb_hi": meta["blurb_hi"],
                "sla_days": SLA_DAYS,
                "open": open_at_level,
                "people": packed,
            }
        )
    return {"sla_days": SLA_DAYS, "levels": levels}
