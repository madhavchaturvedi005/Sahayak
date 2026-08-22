from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_user
from app.models.grievance import Appeal, Grievance, GrievanceEvent
from app.models.user import User
from app.schemas.grievance import (
    AppealCreate,
    AppealWindowOut,
    EventBrief,
    GrievanceCreate,
    GrievanceOut,
    RateIn,
    ReminderIn,
    ResolutionCheckOut,
    ResolutionReviewOut,
)
from app.services.classifier import classify_text
from app.services.review import appeal_window, build_review, find_reply

router = APIRouter(prefix="/api/grievances", tags=["grievances"])


def _reg_id(kind: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    prefix = "PMOPG" if kind == "public" else "PENPG"
    return f"{prefix}/{stamp}"


def _to_out(row: Grievance) -> GrievanceOut:
    return GrievanceOut.model_validate(row)


@router.post("", response_model=GrievanceOut)
def create_grievance(
    body: GrievanceCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    routing = classify_text(f"{body.subject} {body.description} {body.category}")
    ministry = body.ministry or routing["ministry"]
    category = body.category or routing["category"]
    row = Grievance(
        registration_id=_reg_id(body.kind),
        user_id=user.id if user else None,
        kind=body.kind,
        name=body.name,
        mobile=body.mobile,
        ministry=ministry,
        category=category,
        subject=body.subject,
        description=body.description,
        status="Registered",
        expected_days=routing["expected_days"],
        pendency_pct=routing["pendency_pct"],
        routing_reason=routing["reason"],
    )
    db.add(row)
    db.flush()
    db.add(
        GrievanceEvent(
            grievance_id=row.id,
            title="Submission successful",
            detail="Grievance registered inside Sahayak. Copy the summary and file it on the official CPGRAMS portal.",
        )
    )
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.get("/review", response_model=ResolutionReviewOut)
def review_grievance(registration_id: str, db: Session = Depends(get_db)):
    row = db.query(Grievance).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    review = build_review(row)
    reply = review["reply"]
    check = review["check"]
    return ResolutionReviewOut(
        grievance=_to_out(row),
        reply=EventBrief(title=reply.title, detail=reply.detail, created_at=reply.created_at) if reply else None,
        check=ResolutionCheckOut.model_validate(check) if check else None,
        appeal_window=AppealWindowOut.model_validate(review["appeal_window"]),
    )


@router.get("", response_model=list[GrievanceOut])
def list_grievances(
    mobile: str | None = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    q = db.query(Grievance)
    if user:
        q = q.filter((Grievance.user_id == user.id) | (Grievance.mobile == user.mobile))
    elif mobile:
        q = q.filter(Grievance.mobile == mobile)
    else:
        return []
    return [_to_out(row) for row in q.order_by(Grievance.created_at.desc()).all()]


@router.get("/{registration_id}", response_model=GrievanceOut)
def get_grievance(registration_id: str, db: Session = Depends(get_db)):
    row = db.query(Grievance).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    return _to_out(row)


@router.post("/reminder", response_model=GrievanceOut)
def send_reminder(body: ReminderIn, db: Session = Depends(get_db)):
    row = db.query(Grievance).filter(Grievance.registration_id == body.registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    row.reminder_count += 1
    db.add(
        GrievanceEvent(
            grievance_id=row.id,
            title="Reminder / clarification sent",
            detail=body.message or "Citizen requested an update on the pending grievance.",
        )
    )
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.post("/rate", response_model=GrievanceOut)
def rate_grievance(body: RateIn, db: Session = Depends(get_db)):
    row = db.query(Grievance).filter(Grievance.registration_id == body.registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    row.rating = body.rating
    db.add(
        GrievanceEvent(
            grievance_id=row.id,
            title=f"Rated {body.rating}/5",
            detail=body.comment or "Citizen rated the redressal experience.",
        )
    )
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.post("/appeal")
def file_appeal(body: AppealCreate, db: Session = Depends(get_db)):
    row = db.query(Grievance).filter(Grievance.registration_id == body.registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    window = appeal_window(row, find_reply(row))
    if window["expired"]:
        raise HTTPException(status_code=400, detail=window["message"])
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    appeal = Appeal(
        appeal_id=f"APPL/{stamp}",
        grievance_id=row.id,
        reason=body.reason,
        draft=body.reason,
        status="Filed",
    )
    db.add(appeal)
    db.add(
        GrievanceEvent(
            grievance_id=row.id,
            title="Appeal filed",
            detail=body.reason[:240],
        )
    )
    db.commit()
    db.refresh(appeal)
    return {"appeal_id": appeal.appeal_id, "status": appeal.status}


@router.get("/appeal-record/{appeal_id}")
def get_appeal(appeal_id: str, db: Session = Depends(get_db)):
    row = db.query(Appeal).filter(Appeal.appeal_id == appeal_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Appeal number not found")
    return {
        "appeal_id": row.appeal_id,
        "status": row.status,
        "reason": row.reason,
        "created_at": row.created_at,
        "grievance": _to_out(row.grievance) if row.grievance else None,
    }
