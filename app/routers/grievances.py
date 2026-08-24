from datetime import datetime, timezone

import httpx
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
    TransparencyOut,
)
from app.services.classifier import classify_text
from app.services.playbooks import assemble_description, get_playbook, list_playbooks
from app.services.review import appeal_window, build_review, find_reply
from app.services.transparency import build_transparency

router = APIRouter(prefix="/api/grievances", tags=["grievances"])


def _reg_id(kind: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    prefix = "PMOPG" if kind == "public" else "PENPG"
    return f"{prefix}/{stamp}"


def _to_out(row: Grievance) -> GrievanceOut:
    if row.answers is None:
        row.answers = {}
    if row.evidence is None:
        row.evidence = []
    return GrievanceOut.model_validate(row)


@router.get("/playbooks")
def grievance_playbooks():
    return list_playbooks()


@router.get("/transparency", response_model=TransparencyOut)
def grievance_transparency(db: Session = Depends(get_db)):
    return build_transparency(db)


@router.get("/geo/reverse")
def reverse_geocode(lat: float, lon: float):
    empty = {"village": "", "ward": "", "district": "", "street": ""}
    try:
        with httpx.Client(timeout=8.0) as client:
            res = client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "format": "jsonv2",
                    "lat": lat,
                    "lon": lon,
                    "accept-language": "hi,en",
                },
                headers={"User-Agent": "Sahayak-demo/1.0 (cpgrams recreation)"},
            )
        res.raise_for_status()
        address = (res.json() or {}).get("address") or {}
    except Exception:
        return empty
    return {
        "village": (
            address.get("village")
            or address.get("hamlet")
            or address.get("town")
            or address.get("suburb")
            or address.get("neighbourhood")
            or address.get("city")
            or ""
        ),
        "ward": address.get("suburb") or address.get("neighbourhood") or address.get("city_district") or "",
        "district": address.get("state_district") or address.get("county") or address.get("district") or "",
        "street": address.get("road") or address.get("neighbourhood") or "",
    }


@router.post("", response_model=GrievanceOut)
def create_grievance(
    body: GrievanceCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    routing = classify_text(f"{body.subject} {body.description} {body.category} {body.playbook_id}")
    ministry = body.ministry or routing["ministry"]
    category = body.category or routing["category"]
    playbook = get_playbook(body.playbook_id or routing.get("playbook_id"))
    evidence = [
        item.model_dump()
        for item in (body.evidence or [])[:3]
        if item.data_url.startswith("data:image/") and len(item.data_url) < 900_000
    ]
    description = (body.description or "").strip()
    if len(description) < 20:
        description = assemble_description(
            playbook,
            body.answers,
            {
                "street": body.street,
                "village": body.village,
                "ward": body.ward,
                "district": body.district,
                "latitude": body.latitude,
                "longitude": body.longitude,
            },
            {
                "role": body.filer_role,
                "helper_name": body.helper_name,
                "helper_relation": body.helper_relation,
            },
        )
    if len(description) < 20:
        raise HTTPException(status_code=400, detail="Please add a short description of the problem.")
    row = Grievance(
        registration_id=_reg_id(body.kind),
        user_id=user.id if user else None,
        kind=body.kind,
        name=body.name,
        mobile=body.mobile,
        ministry=ministry,
        category=category,
        subject=body.subject,
        description=description,
        playbook_id=playbook["id"],
        village=body.village,
        ward=body.ward,
        district=body.district,
        street=body.street,
        latitude=body.latitude,
        longitude=body.longitude,
        filer_role=body.filer_role if body.filer_role in {"self", "helper"} else "self",
        helper_name=body.helper_name,
        helper_relation=body.helper_relation,
        answers=body.answers or {},
        evidence=evidence,
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
            detail="Grievance registered successfully on CPGRAMS.",
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
