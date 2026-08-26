from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_admin_user, get_staff_user
from app.models.content import NodalOfficer
from app.models.grievance import Appeal, Grievance, GrievanceEvent
from app.models.user import User
from app.schemas.admin import (
    ALL_ROLES,
    NODAL_SCOPES,
    STATUSES,
    AdminActionIn,
    AdminAppealOut,
    AdminConfigOut,
    AdminOverviewOut,
    AdminRoleIn,
    AdminUserOut,
    NodalOfficerIn,
    NodalOfficerOut,
    PersonaConfigIn,
    PersonaConfigOut,
)
from app.services.persona import get_persona, save_persona
from app.schemas.grievance import GrievanceOut
from app.services.desk import (
    STAFF_ROLES,
    apply_due_escalations,
    apply_role_desk,
    can_act,
    desk_map,
    escalate_one,
    serialize_grievance,
    sla_overdue,
    visible_query,
)
from app.services.review import _aware, is_resolved

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _grievance_out(row: Grievance, db: Session) -> GrievanceOut:
    return GrievanceOut.model_validate(serialize_grievance(row, db))


@router.get("/persona", response_model=PersonaConfigOut)
def get_persona_config(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return PersonaConfigOut.model_validate(get_persona(db))


@router.put("/persona", response_model=PersonaConfigOut)
def update_persona_config(
    body: PersonaConfigIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return PersonaConfigOut.model_validate(
        save_persona(db, user, body.display_name, body.instructions)
    )


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
        officers=db.query(User).filter(User.role.in_(STAFF_ROLES)).count(),
    )


@router.get("/grievances", response_model=list[GrievanceOut])
def admin_grievances(
    status: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    officer: User = Depends(get_staff_user),
):
    apply_due_escalations(db)
    query = visible_query(db, officer).order_by(Grievance.created_at.desc())
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
    return [_grievance_out(row, db) for row in query.limit(200).all()]


@router.get("/grievances/{registration_id}", response_model=GrievanceOut)
def admin_grievance(registration_id: str, db: Session = Depends(get_db), officer: User = Depends(get_staff_user)):
    apply_due_escalations(db)
    row = visible_query(db, officer).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    return _grievance_out(row, db)


@router.post("/grievances/{registration_id}/action", response_model=GrievanceOut)
def admin_action(
    registration_id: str,
    body: AdminActionIn,
    db: Session = Depends(get_db),
    officer: User = Depends(get_staff_user),
):
    row = visible_query(db, officer).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    if not can_act(officer, row):
        raise HTTPException(status_code=403, detail="This file is not on your desk")
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
    return _grievance_out(row, db)


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
    if body.role not in ALL_ROLES:
        raise HTTPException(status_code=400, detail="Role must be citizen, officer, supervisor, cm, or admin")
    row = db.query(User).filter(User.id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    if row.id == admin.id and body.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own administrator role")
    row.role = body.role
    apply_role_desk(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/desk-map")
def admin_desk_map(db: Session = Depends(get_db), _: User = Depends(get_staff_user)):
    return desk_map(db)


@router.post("/grievances/{registration_id}/escalate", response_model=GrievanceOut)
def admin_escalate(
    registration_id: str,
    db: Session = Depends(get_db),
    officer: User = Depends(get_staff_user),
):
    row = visible_query(db, officer).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    if officer.role == "officer" and not sla_overdue(row):
        raise HTTPException(status_code=400, detail="Field officers escalate only after the 21-day window")
    if (row.escalation_level or 1) >= 3:
        raise HTTPException(status_code=400, detail="Already with the CM office")
    if not escalate_one(db, row, officer):
        raise HTTPException(status_code=400, detail="This file cannot be escalated")
    db.commit()
    db.refresh(row)
    return _grievance_out(row, db)


def _officer_out(row: NodalOfficer) -> NodalOfficerOut:
    return NodalOfficerOut(
        id=row.id,
        scope=row.scope,
        organisation=row.organisation,
        name=row.name,
        designation=row.designation,
        email=row.email or "",
        phone=row.phone or "",
        address=row.address or "",
        state=row.state or "",
    )


def _apply_officer(row: NodalOfficer, body: NodalOfficerIn) -> None:
    if body.scope not in NODAL_SCOPES:
        raise HTTPException(status_code=400, detail="Scope must be central, state, or appeal")
    row.scope = body.scope
    row.organisation = body.organisation.strip()
    row.name = body.name.strip()
    row.designation = body.designation.strip()
    row.email = body.email.strip()
    row.phone = body.phone.strip()
    row.address = body.address.strip()
    row.state = body.state.strip() if body.scope == "state" else ""


@router.get("/nodal-officers", response_model=list[NodalOfficerOut])
def admin_officers(
    scope: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    q = db.query(NodalOfficer)
    if scope:
        if scope not in NODAL_SCOPES:
            raise HTTPException(status_code=400, detail="Scope must be central, state, or appeal")
        q = q.filter(NodalOfficer.scope == scope)
    return [_officer_out(row) for row in q.order_by(NodalOfficer.organisation).all()]


@router.post("/nodal-officers", response_model=NodalOfficerOut)
def create_officer(
    body: NodalOfficerIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    row = NodalOfficer()
    _apply_officer(row, body)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _officer_out(row)


@router.put("/nodal-officers/{officer_id}", response_model=NodalOfficerOut)
def update_officer(
    officer_id: str,
    body: NodalOfficerIn,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    row = db.query(NodalOfficer).filter(NodalOfficer.id == officer_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Officer not found")
    _apply_officer(row, body)
    db.commit()
    db.refresh(row)
    return _officer_out(row)


@router.delete("/nodal-officers/{officer_id}")
def delete_officer(
    officer_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_staff_user),
):
    row = db.query(NodalOfficer).filter(NodalOfficer.id == officer_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Officer not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
