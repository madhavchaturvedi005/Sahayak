"""Field officer → supervisor → CM office assignment and 21-day escalation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.grievance import Grievance, GrievanceEvent
from app.models.user import User
from app.services.community import BACKER_THRESHOLD, PUSH_THRESHOLD
from app.services.review import is_resolved

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


def pick_officer(db: Session, level: int) -> User | None:
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

    return min(officers, key=load)


def _write_event(row: Grievance, level: int, officer: User | None) -> GrievanceEvent:
    title, detail = EVENT_COPY[level]
    name = officer.name if officer else level_label(level)
    return GrievanceEvent(grievance_id=row.id, title=title, detail=detail.format(name=name))


def assign_on_create(db: Session, row: Grievance) -> User | None:
    officer = pick_officer(db, 1)
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
    officer = pick_officer(db, nxt)
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
