from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_user
from app.models.grievance import Appeal, Grievance, GrievanceEvent
from app.models.user import User
from app.schemas.grievance import (
    AppealCreate,
    AppealWindowOut,
    BackerStatsOut,
    EventBrief,
    GrievanceCreate,
    GrievanceOut,
    NearbyOut,
    OnsiteVerifyIn,
    RaiseIn,
    RaiseResultOut,
    RateIn,
    ReminderIn,
    ResolutionCheckOut,
    ResolutionReviewOut,
    TransparencyOut,
    VerifyRaiseIn,
)
from app.services.classifier import classify_text
from app.services.community import (
    backer_stats,
    find_nearby,
    infer_impact_scope,
    start_or_update_raise,
    verify_pending_raise,
)
from app.services.desk import apply_due_escalations, assign_on_create, serialize_grievance
from app.services.playbooks import assemble_description, get_playbook, list_playbooks
from app.services.review import appeal_window, build_review, find_reply
from app.services.transparency import build_transparency

router = APIRouter(prefix="/api/grievances", tags=["grievances"])


def _reg_id(kind: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    prefix = "PMOPG" if kind == "public" else "PENPG"
    return f"{prefix}/{stamp}"


def _to_out(row: Grievance, db: Session) -> GrievanceOut:
    return GrievanceOut.model_validate(serialize_grievance(row, db))


def _get_open_or_any(db: Session, registration_id: str, *, require_open: bool = False) -> Grievance:
    row = db.query(Grievance).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    if require_open and row.status in {"Resolved", "Closed", "Rejected"}:
        raise HTTPException(status_code=400, detail="This grievance is closed and cannot be raised further.")
    return row


@router.get("/playbooks")
def grievance_playbooks():
    return list_playbooks()


@router.get("/transparency", response_model=TransparencyOut)
def grievance_transparency(db: Session = Depends(get_db)):
    return build_transparency(db)


@router.get("/nearby", response_model=list[NearbyOut])
def nearby_grievances(
    lat: float = Query(...),
    lon: float = Query(...),
    playbook_id: str = "",
    village: str = "",
    ward: str = "",
    radius_m: float | None = None,
    db: Session = Depends(get_db),
):
    rows = find_nearby(
        db,
        lat,
        lon,
        playbook_id=playbook_id,
        village=village,
        ward=ward,
        radius_m=radius_m,
    )
    return [NearbyOut.model_validate(item) for item in rows]


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
    impact = body.impact_scope if body.impact_scope in {"self", "street", "village"} else infer_impact_scope(body.answers)
    consent = body.consent_capture or (
        f"Verbal consent captured for helper filing ({body.helper_relation})"
        if body.filer_role == "helper"
        else ""
    )
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
        consent_capture=consent,
        impact_scope=impact,
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
    assign_on_create(db, row)
    db.commit()
    db.refresh(row)
    return _to_out(row, db)


@router.get("/review", response_model=ResolutionReviewOut)
def review_grievance(registration_id: str, db: Session = Depends(get_db)):
    row = db.query(Grievance).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    apply_due_escalations(db, row)
    review = build_review(row)
    reply = review["reply"]
    check = review["check"]
    return ResolutionReviewOut(
        grievance=_to_out(row, db),
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
    return [_to_out(row, db) for row in q.order_by(Grievance.created_at.desc()).all()]


@router.post("/{registration_id}/raise", response_model=RaiseResultOut)
def raise_grievance(registration_id: str, body: RaiseIn, db: Session = Depends(get_db)):
    row = _get_open_or_any(db, registration_id, require_open=True)
    result = start_or_update_raise(
        db,
        row,
        name=body.name,
        mobile=body.mobile,
        otp=body.otp,
        latitude=body.latitude,
        longitude=body.longitude,
        village=body.village,
        ward=body.ward,
        photo_data_url=body.photo_data_url,
        source=body.source or "remote",
        prefer_onsite=body.prefer_onsite,
    )
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Could not raise")
    db.commit()
    db.refresh(row)
    result["grievance"] = _to_out(row, db)
    result["stats"] = backer_stats(db, row)
    return RaiseResultOut.model_validate(result)


@router.post("/{registration_id}/onsite-verify", response_model=RaiseResultOut)
def onsite_verify(registration_id: str, body: OnsiteVerifyIn, db: Session = Depends(get_db)):
    row = _get_open_or_any(db, registration_id, require_open=True)
    result = start_or_update_raise(
        db,
        row,
        name=body.name,
        mobile=body.mobile,
        otp=body.otp,
        latitude=body.latitude,
        longitude=body.longitude,
        photo_data_url=body.photo_data_url,
        source="onsite",
        prefer_onsite=True,
    )
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Could not verify on-site")
    db.commit()
    db.refresh(row)
    result["grievance"] = _to_out(row, db)
    result["stats"] = backer_stats(db, row)
    return RaiseResultOut.model_validate(result)


@router.post("/{registration_id}/verify-raise", response_model=RaiseResultOut)
def verify_raise(registration_id: str, body: VerifyRaiseIn, db: Session = Depends(get_db)):
    row = _get_open_or_any(db, registration_id, require_open=True)
    result = verify_pending_raise(
        db,
        row,
        mobile=body.mobile,
        otp=body.otp,
        latitude=body.latitude,
        longitude=body.longitude,
        village=body.village,
        ward=body.ward,
        photo_data_url=body.photo_data_url,
        prefer_onsite=body.prefer_onsite,
    )
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Could not verify raise")
    db.commit()
    db.refresh(row)
    result["grievance"] = _to_out(row, db)
    result["stats"] = backer_stats(db, row)
    return RaiseResultOut.model_validate(result)


@router.get("/{registration_id}/backers", response_model=BackerStatsOut)
def list_backers(registration_id: str, db: Session = Depends(get_db)):
    row = _get_open_or_any(db, registration_id)
    return BackerStatsOut.model_validate(backer_stats(db, row))


@router.get("/{registration_id}", response_model=GrievanceOut)
def get_grievance(registration_id: str, db: Session = Depends(get_db)):
    row = db.query(Grievance).filter(Grievance.registration_id == registration_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Registration number not found")
    apply_due_escalations(db, row)
    return _to_out(row, db)


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
    return _to_out(row, db)


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
    return _to_out(row, db)


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
        "grievance": _to_out(row.grievance, db) if row.grievance else None,
    }
