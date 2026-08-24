"""Citizen-side resolution review: reply check + 30-day appeal window."""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

from app.models.grievance import Grievance, GrievanceEvent
from app.services.classifier import resolution_check

APPEAL_DAYS = 30
REG_RE = re.compile(r"(?:PMOPG|PENPG)/[A-Za-z0-9]+", re.I)
CLOSURE_HINTS = (
    "they closed",
    "department said",
    "department reply",
    "the reply",
    "visit the office",
    "visit office",
    "matter examined",
    "speaking order",
    "already disposed",
    "brush-off",
    "closed my",
)

CLOSURE_GUIDE = (
    "The citizen is describing a department closure. Generic replies such as "
    '"matter examined", "visit the office", "forwarded", or "already disposed" '
    "are usually not a real resolution. Say that in plain words. Ask for the "
    "registration number if you do not have it. Point them to the status page "
    "so they can use Draft appeal. The appeal window is 30 days after closure. "
    "After that they should file a fresh grievance citing the old ID."
)


def is_resolved(status: str) -> bool:
    return bool(re.search(r"resolv|clos", status or "", re.I))


def find_reply(row: Grievance) -> GrievanceEvent | None:
    events = list(row.events or [])
    for event in reversed(events):
        blob = f"{event.title} {event.detail}"
        if re.search(r"resolv|reply|speaking|closed|redress", blob, re.I) and event.detail:
            return event
    return events[-1] if events else None


def _aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def closed_on(row: Grievance, reply: GrievanceEvent | None) -> datetime | None:
    if row.closed_at:
        return _aware(row.closed_at)
    if is_resolved(row.status):
        if reply and reply.created_at:
            return _aware(reply.created_at)
        return _aware(row.updated_at) or _aware(row.created_at)
    return None


def appeal_window(row: Grievance, reply: GrievanceEvent | None = None) -> dict:
    if not is_resolved(row.status):
        return {
            "applicable": False,
            "closed_at": None,
            "deadline": None,
            "days_left": None,
            "expired": False,
            "message": (
                "The appeal window opens after the department closes the file. "
                "You can still send a reminder while you wait."
            ),
        }
    closed = closed_on(row, reply)
    if closed is None:
        return {
            "applicable": True,
            "closed_at": None,
            "deadline": None,
            "days_left": None,
            "expired": False,
            "message": "This file is marked closed. Rate 1 or 2 stars to open the appeal path.",
        }
    deadline = closed + timedelta(days=APPEAL_DAYS)
    now = datetime.now(timezone.utc)
    days_left = (deadline.date() - now.date()).days
    expired = days_left < 0
    if expired:
        message = (
            f"The 30-day appeal window closed on {deadline.strftime('%d %b %Y')}. "
            f"File a fresh grievance citing {row.registration_id}."
        )
    elif days_left == 0:
        message = f"Appeal window: last day (until {deadline.strftime('%d %b %Y')})."
    else:
        unit = "day" if days_left == 1 else "days"
        message = f"Appeal window: {days_left} {unit} left (until {deadline.strftime('%d %b %Y')})."
    return {
        "applicable": True,
        "closed_at": closed,
        "deadline": deadline,
        "days_left": days_left,
        "expired": expired,
        "message": message,
    }


def build_review(row: Grievance) -> dict:
    reply = find_reply(row)
    window = appeal_window(row, reply)
    check = None
    if reply and reply.detail:
        complaint = f"{row.subject}\n{row.description}"
        check = resolution_check(complaint, reply.detail, enrich=False)
    return {
        "reply": reply,
        "check": check,
        "appeal_window": window,
    }


def format_context(row: Grievance, review: dict) -> str:
    check = review.get("check") or {}
    window = review.get("appeal_window") or {}
    reply = review.get("reply")
    missing = "; ".join(check.get("missing") or [])
    reply_text = (reply.detail if reply else "")[:400]
    return (
        f"The citizen is looking at grievance {row.registration_id}, status {row.status}. "
        f"Subject: {row.subject}. "
        f"Department reply: {reply_text or 'none yet'}. "
        f"Resolution check: addressed={check.get('addressed')}, reason={check.get('reason')}, "
        f"missing={missing}. "
        f"Appeal window: {window.get('message')}. "
        "If the reply did not address the complaint, speak the missing points and offer "
        f"the status page /status/{row.registration_id} so they can tap Draft appeal."
    )


def context_from_text(text: str) -> str:
    match = REG_RE.search(text or "")
    if match:
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            row = (
                db.query(Grievance)
                .filter(Grievance.registration_id.ilike(match.group(0)))
                .first()
            )
            if row:
                return format_context(row, build_review(row))
        finally:
            db.close()
    lowered = (text or "").lower()
    if any(hint in lowered for hint in CLOSURE_HINTS):
        return CLOSURE_GUIDE
    return ""
