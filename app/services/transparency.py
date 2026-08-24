"""Public desk numbers from real grievances — not typed in by an officer."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.grievance import Appeal, Grievance
from app.services.review import _aware, is_resolved


def _days_between(start: datetime | None, end: datetime | None) -> float | None:
    left = _aware(start)
    right = _aware(end)
    if not left or not right:
        return None
    return max(0.0, (right - left).total_seconds() / 86400)


def build_transparency(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    rows = db.query(Grievance).all()
    appealed = db.query(Appeal).count()

    registered = len(rows)
    resolved_days: list[float] = []
    delayed = 0
    fulfilled = 0
    still_open = 0
    by_ministry: dict[str, dict[str, float | int | list]] = defaultdict(
        lambda: {"count": 0, "open": 0, "delayed": 0, "fulfilled": 0, "days": []}
    )

    for row in rows:
        created = _aware(row.created_at) or now
        sla = row.expected_days or 21
        ministry = row.ministry or "Unassigned"
        bucket = by_ministry[ministry]
        bucket["count"] = int(bucket["count"]) + 1

        if is_resolved(row.status):
            closed = _aware(row.closed_at) or _aware(row.updated_at) or now
            days = _days_between(created, closed)
            if days is None:
                continue
            resolved_days.append(days)
            bucket["days"].append(days)
            if days <= sla:
                fulfilled += 1
                bucket["fulfilled"] = int(bucket["fulfilled"]) + 1
            else:
                delayed += 1
                bucket["delayed"] = int(bucket["delayed"]) + 1
        else:
            still_open += 1
            bucket["open"] = int(bucket["open"]) + 1
            age = _days_between(created, now) or 0
            if age > sla:
                delayed += 1
                bucket["delayed"] = int(bucket["delayed"]) + 1

    ministries = []
    for name, bucket in by_ministry.items():
        days = bucket["days"]
        ministries.append(
            {
                "ministry": name,
                "count": int(bucket["count"]),
                "open": int(bucket["open"]),
                "delayed": int(bucket["delayed"]),
                "fulfilled": int(bucket["fulfilled"]),
                "avg_resolution_days": round(sum(days) / len(days), 1) if days else None,
            }
        )
    ministries.sort(key=lambda item: item["count"], reverse=True)

    return {
        "registered": registered,
        "open": still_open,
        "resolved": len(resolved_days),
        "delayed": delayed,
        "fulfilled_within_days": fulfilled,
        "appealed": appealed,
        "avg_resolution_days": round(sum(resolved_days) / len(resolved_days), 1) if resolved_days else None,
        "ministries": ministries,
        "updated_at": now,
    }
