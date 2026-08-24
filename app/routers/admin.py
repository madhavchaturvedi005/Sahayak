from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_admin_user, get_staff_user
from app.models.grievance import Appeal, Grievance, GrievanceEvent
from app.models.user import User
from app.schemas.admin import (
    STATUSES,
    AdminActionIn,
    AdminAppealOut,
    AdminConfigOut,
    AdminOverviewOut,
    AdminRoleIn,
    AdminUserOut,
)
from app.schemas.grievance import GrievanceOut
from app.services.review import _aware, is_resolved

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _grievance_out(row: Grievance) -> GrievanceOut:
    if row.answers is None:
        row.answers = {}
    if row.evidence is None:
        row.evidence = []
    return GrievanceOut.model_validate(row)


@router.get("/config", response_model=AdminConfigOut)
def admin_config(_: User = Depends(get_admin_user)):
    mobile = settings.admin_mobile
    masked = f"{mobile[:2]}******{mobile[-2:]}" if len(mobile) >= 4 else "********"
    return AdminConfigOut(
        admin_name=settings.admin_name,
        admin_mobile=masked,
        admin_email=settings.admin_email,
        environment=settings.app_env,
    )


@router.get("/overview", response_model=AdminOverviewOut)
def admin_overview(db: Session = Depends(get_db), _: User = Depends(get_staff_user)):
    now = datetime.now(timezone.utc)
    rows = db.query(Grievance).all()
    open_count = 0
    under = 0
    resolved = 0
    delayed = 0
    for row in rows:
        if is_resolved(row.status):
            resolved += 1
        else:
            open_count += 1
            if (row.status or "").lower().startswith("under"):
                under += 1
            created = _aware(row.created_at) or now
            sla = row.expected_days or 21
            age = (now - created).total_seconds() / 86400
            if age > sla:
                delayed += 1
    return AdminOverviewOut(
        registered=len(rows),
        open=open_count,
        under_process=under,
        resolved=resolved,
        delayed=delayed,
        appealed=db.query(Appeal).count(),
        citizens=db.query(User).filter(User.role == "citizen").count(),
        officers=db.query(User).filter(User.role.in_(["admin", "officer"])).count(),
    )


@router.get("/grievances", response_model=list[GrievanceOut])
def admin_grievances(
    status: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    query = db.query(Grievance).order_by(Grievance.created_at.desc())
    if status:
        query = query.filter(Grievance.status == status)
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter(
            (Grievance.registration_id.ilike(needle))
            | (Grievance.subject.ilike(needle))
            | (Grievance.name.ilike(needle))
            | (Grievance.ministry.ilike(needle))
        )
    return [_grievance_out(row) for row in query.limit(200).all()]


@router.get("/grievances/{registration_id}", response_model=GrievanceOut)
def admin_grievance(registration_id: str, db: Session = Depends(get_db), _: User = Depends(get_staff_user)):
    row = db.query(Grievance).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    return _grievance_out(row)


@router.post("/grievances/{registration_id}/action", response_model=GrievanceOut)
def admin_action(
    registration_id: str,
    body: AdminActionIn,
    db: Session = Depends(get_db),
    officer: User = Depends(get_staff_user),
):
    row = db.query(Grievance).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    if body.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Unknown status")
    row.status = body.status
    row.updated_at = datetime.now(timezone.utc)
    if is_resolved(body.status) or body.status == "Rejected":
        row.closed_at = row.closed_at or datetime.now(timezone.utc)
    elif row.closed_at:
        row.closed_at = None
    title = body.title.strip() or f"Status updated to {body.status}"
    db.add(
        GrievanceEvent(
            grievance_id=row.id,
            title=title,
            detail=f"{body.detail.strip()}\n\n— {officer.name}",
        )
    )
    db.commit()
    db.refresh(row)
    return _grievance_out(row)


@router.get("/appeals", response_model=list[AdminAppealOut])
def admin_appeals(db: Session = Depends(get_db), _: User = Depends(get_staff_user)):
    rows = db.query(Appeal).order_by(Appeal.created_at.desc()).limit(100).all()
    out = []
    for row in rows:
        grievance = db.query(Grievance).filter(Grievance.id == row.grievance_id).first()
        out.append(
            AdminAppealOut(
                appeal_id=row.appeal_id,
                status=row.status,
                reason=row.reason,
                created_at=row.created_at,
                registration_id=grievance.registration_id if grievance else "",
                subject=grievance.subject if grievance else "",
                ministry=grievance.ministry if grievance else "",
            )
        )
    return out


@router.get("/users", response_model=list[AdminUserOut])
def admin_users(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return db.query(User).order_by(User.created_at.desc()).limit(200).all()


@router.post("/users/{user_id}/role", response_model=AdminUserOut)
def set_user_role(
    user_id: str,
    body: AdminRoleIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    if body.role not in {"citizen", "officer", "admin"}:
        raise HTTPException(status_code=400, detail="Role must be citizen, officer, or admin")
    row = db.query(User).filter(User.id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    if row.id == admin.id and body.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own administrator role")
    row.role = body.role
    db.commit()
    db.refresh(row)
    return row
