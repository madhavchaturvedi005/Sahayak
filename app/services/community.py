"""Community raise, on-site verify, and priority thresholds (Jan Samarthan)."""

from __future__ import annotations

import math
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.grievance import Grievance, GrievanceBacker, GrievanceEvent

BACKER_THRESHOLD = 25
PUSH_THRESHOLD = 5
DEFAULT_VERIFY_RADIUS_M = 800
DEFAULT_ONSITE_RADIUS_M = 150
MOCK_OTP = "123456"


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _norm_place(value: str) -> str:
    return " ".join((value or "").strip().lower().split())


def place_matches(row: Grievance, village: str = "", ward: str = "") -> bool:
    v = _norm_place(village)
    w = _norm_place(ward)
    gv = _norm_place(row.village)
    gw = _norm_place(row.ward)
    if v and gv and (v == gv or v in gv or gv in v):
        return True
    if w and gw and (w == gw or w in gw or gw in w):
        return True
    return False


def distance_to_grievance(row: Grievance, lat: float | None, lon: float | None) -> float | None:
    if lat is None or lon is None or row.latitude is None or row.longitude is None:
        return None
    return haversine_m(float(row.latitude), float(row.longitude), float(lat), float(lon))


def is_open_status(status: str) -> bool:
    return status not in {"Resolved", "Closed", "Rejected"}


def find_nearby(
    db: Session,
    lat: float,
    lon: float,
    *,
    playbook_id: str = "",
    village: str = "",
    ward: str = "",
    radius_m: float | None = None,
    limit: int = 12,
) -> list[dict]:
    radius = radius_m if radius_m is not None else DEFAULT_VERIFY_RADIUS_M
    # Rough degree box to cut candidates (~1 deg lat ≈ 111 km)
    deg = max(radius / 111_000.0, 0.002)
    q = (
        db.query(Grievance)
        .filter(Grievance.latitude.isnot(None), Grievance.longitude.isnot(None))
        .filter(~Grievance.status.in_(["Resolved", "Closed", "Rejected"]))
        .filter(Grievance.latitude >= lat - deg, Grievance.latitude <= lat + deg)
        .filter(Grievance.longitude >= lon - deg, Grievance.longitude <= lon + deg)
    )
    if playbook_id:
        q = q.filter(Grievance.playbook_id == playbook_id)
    rows = q.order_by(Grievance.created_at.desc()).limit(80).all()
    packed: list[dict] = []
    for row in rows:
        dist = distance_to_grievance(row, lat, lon)
        if dist is None or dist > radius:
            continue
        if village or ward:
            # Prefer same place but still include geo matches
            pass
        thumb = ""
        for item in row.evidence or []:
            if isinstance(item, dict) and (item.get("data_url") or "").startswith("data:image/"):
                thumb = item["data_url"]
                break
        packed.append(
            {
                "registration_id": row.registration_id,
                "subject": row.subject,
                "playbook_id": row.playbook_id,
                "village": row.village,
                "ward": row.ward,
                "district": row.district,
                "street": row.street,
                "latitude": row.latitude,
                "longitude": row.longitude,
                "distance_m": round(dist),
                "backer_count": row.backer_count or 0,
                "push_count": row.push_count or 0,
                "pending_raise_count": row.pending_raise_count or 0,
                "status": row.status,
                "photo_thumb": thumb[:200] + "…" if len(thumb) > 200 else thumb,
                "evidence_count": len(row.evidence or []),
                "created_at": row.created_at,
            }
        )
    packed.sort(key=lambda item: item["distance_m"])
    # Also allow village/ward-only search when GPS misses pinned grievances
    if village or ward:
        place_q = db.query(Grievance).filter(~Grievance.status.in_(["Resolved", "Closed", "Rejected"]))
        if playbook_id:
            place_q = place_q.filter(Grievance.playbook_id == playbook_id)
        seen = {p["registration_id"] for p in packed}
        for row in place_q.order_by(Grievance.created_at.desc()).limit(40).all():
            if row.registration_id in seen:
                continue
            if not place_matches(row, village, ward):
                continue
            thumb = ""
            for item in row.evidence or []:
                if isinstance(item, dict) and (item.get("data_url") or "").startswith("data:image/"):
                    thumb = item["data_url"]
                    break
            packed.append(
                {
                    "registration_id": row.registration_id,
                    "subject": row.subject,
                    "playbook_id": row.playbook_id,
                    "village": row.village,
                    "ward": row.ward,
                    "district": row.district,
                    "street": row.street,
                    "latitude": row.latitude,
                    "longitude": row.longitude,
                    "distance_m": distance_to_grievance(row, lat, lon),
                    "backer_count": row.backer_count or 0,
                    "push_count": row.push_count or 0,
                    "pending_raise_count": row.pending_raise_count or 0,
                    "status": row.status,
                    "photo_thumb": thumb[:200] + "…" if len(thumb) > 200 else thumb,
                    "evidence_count": len(row.evidence or []),
                    "created_at": row.created_at,
                }
            )
            seen.add(row.registration_id)
    return packed[:limit]


def recount_backers(db: Session, row: Grievance) -> None:
    verified = (
        db.query(GrievanceBacker)
        .filter(GrievanceBacker.grievance_id == row.id, GrievanceBacker.status == "verified")
        .all()
    )
    pending = (
        db.query(GrievanceBacker)
        .filter(GrievanceBacker.grievance_id == row.id, GrievanceBacker.status == "pending")
        .count()
    )
    mobiles = {b.mobile for b in verified}
    pushes = sum(1 for b in verified if b.kind == "onsite_push")
    row.backer_count = len(mobiles)
    row.push_count = pushes
    row.pending_raise_count = pending


def maybe_priority_event(db: Session, row: Grievance, before_backers: int, before_pushes: int) -> None:
    crossed_backers = before_backers < BACKER_THRESHOLD <= (row.backer_count or 0)
    crossed_pushes = before_pushes < PUSH_THRESHOLD <= (row.push_count or 0)
    if not crossed_backers and not crossed_pushes:
        return
    parts = []
    if crossed_backers:
        parts.append(f"{row.backer_count} verified residents have raised this")
    if crossed_pushes:
        parts.append(f"{row.push_count} on-site confirms")
    db.add(
        GrievanceEvent(
            grievance_id=row.id,
            title="Community priority — interim reply due",
            detail=(
                "Verified community weight crossed a threshold ("
                + "; ".join(parts)
                + "). Officer desk should give an interim reply."
            ),
        )
    )


def check_mock_otp(otp: str) -> bool:
    return (otp or "").strip() == MOCK_OTP


def evidence_strong_enough(
    row: Grievance,
    *,
    otp_ok: bool,
    lat: float | None,
    lon: float | None,
    village: str,
    ward: str,
    photo: str,
    onsite: bool,
) -> tuple[bool, str, float | None]:
    """Return (verified_now, reason, distance_m)."""
    if not otp_ok:
        return False, "Mock OTP required (use 123456 for demo).", None
    dist = distance_to_grievance(row, lat, lon)
    onsite_r = row.onsite_radius_m or DEFAULT_ONSITE_RADIUS_M
    verify_r = row.verification_radius_m or DEFAULT_VERIFY_RADIUS_M
    if onsite:
        if dist is not None and dist <= onsite_r:
            return True, f"On-site GPS within {round(dist)} m.", dist
        return False, f"You need to be within {onsite_r} m of the problem pin for on-site push.", dist
    # Remote path: OTP + (place match OR geo within verify radius OR photo)
    place_ok = place_matches(row, village, ward)
    geo_ok = dist is not None and dist <= verify_r
    photo_ok = bool(photo and photo.startswith("data:image/") and len(photo) < 900_000)
    if place_ok or geo_ok or photo_ok:
        bits = []
        if place_ok:
            bits.append("village/ward match")
        if geo_ok:
            bits.append(f"GPS within {round(dist)} m")
        if photo_ok:
            bits.append("photo of the spot")
        return True, "Verified with " + ", ".join(bits) + ".", dist
    return False, "Raise saved as pending. Add village/ward match, GPS within 800 m, or a photo to verify and push.", dist


def get_existing_backer(db: Session, grievance_id: str, mobile: str, kind: str) -> GrievanceBacker | None:
    return (
        db.query(GrievanceBacker)
        .filter(
            GrievanceBacker.grievance_id == grievance_id,
            GrievanceBacker.mobile == mobile,
            GrievanceBacker.kind == kind,
        )
        .first()
    )


def start_or_update_raise(
    db: Session,
    row: Grievance,
    *,
    name: str,
    mobile: str,
    otp: str = "",
    latitude: float | None = None,
    longitude: float | None = None,
    village: str = "",
    ward: str = "",
    photo_data_url: str = "",
    source: str = "remote",
    prefer_onsite: bool = False,
) -> dict:
    mobile = "".join(ch for ch in (mobile or "") if ch.isdigit())[-10:]
    if len(mobile) < 10:
        return {"ok": False, "error": "Enter a valid 10-digit mobile number."}

    otp_ok = check_mock_otp(otp) if otp else False
    dist = distance_to_grievance(row, latitude, longitude)
    onsite_r = row.onsite_radius_m or DEFAULT_ONSITE_RADIUS_M
    at_site = prefer_onsite or (dist is not None and dist <= onsite_r)
    kind = "onsite_push" if at_site else "endorse"

    before_b, before_p = row.backer_count or 0, row.push_count or 0
    existing = get_existing_backer(db, row.id, mobile, kind)
    if existing and existing.status == "verified":
        return {
            "ok": True,
            "already_verified": True,
            "message": "This mobile already verified a raise on this grievance.",
            "backer": serialize_backer(existing),
            "stats": backer_stats(db, row),
            "grievance": None,
        }

    verified_now, reason, dist = evidence_strong_enough(
        row,
        otp_ok=otp_ok,
        lat=latitude,
        lon=longitude,
        village=village,
        ward=ward,
        photo=photo_data_url,
        onsite=kind == "onsite_push",
    )
    # If they asked onsite but failed geo, fall back to endorse pending/verified remote
    if kind == "onsite_push" and not verified_now and otp_ok:
        kind = "endorse"
        existing = get_existing_backer(db, row.id, mobile, kind)
        if existing and existing.status == "verified":
            return {
                "ok": True,
                "already_verified": True,
                "message": "On-site failed (too far); this mobile already has a verified raise.",
                "backer": serialize_backer(existing),
                "stats": backer_stats(db, row),
                "grievance": None,
            }
        verified_now, reason, dist = evidence_strong_enough(
            row,
            otp_ok=otp_ok,
            lat=latitude,
            lon=longitude,
            village=village,
            ward=ward,
            photo=photo_data_url,
            onsite=False,
        )

    status = "verified" if verified_now else "pending"
    source_final = "onsite" if kind == "onsite_push" and verified_now else (source or "remote")
    photo = photo_data_url if photo_data_url.startswith("data:image/") and len(photo_data_url) < 900_000 else ""

    if existing:
        backer = existing
        backer.name = name or backer.name
        backer.latitude = latitude if latitude is not None else backer.latitude
        backer.longitude = longitude if longitude is not None else backer.longitude
        backer.distance_m = dist
        backer.village = village or backer.village
        backer.ward = ward or backer.ward
        if photo:
            backer.photo_data_url = photo
        backer.source = source_final
        backer.otp_verified = otp_ok or backer.otp_verified
    else:
        backer = GrievanceBacker(
            grievance_id=row.id,
            name=name or "",
            mobile=mobile,
            latitude=latitude,
            longitude=longitude,
            distance_m=dist,
            kind=kind,
            source=source_final,
            status=status,
            village=village or "",
            ward=ward or "",
            photo_data_url=photo,
            otp_verified=otp_ok,
        )
        db.add(backer)

    if verified_now:
        backer.status = "verified"
        backer.verified_at = datetime.now(timezone.utc)
        backer.otp_verified = True
    else:
        backer.status = "pending"

    db.flush()
    recount_backers(db, row)
    maybe_priority_event(db, row, before_b, before_p)

    if verified_now:
        title = "On-site push verified" if kind == "onsite_push" else "Community raise verified"
        db.add(
            GrievanceEvent(
                grievance_id=row.id,
                title=title,
                detail=f"{name or 'A resident'} ({mobile[-4:].rjust(4, '*')}) — {reason}",
            )
        )
        message = "Verified — this complaint was pushed for officers."
    else:
        db.add(
            GrievanceEvent(
                grievance_id=row.id,
                title="Community raise pending verification",
                detail=f"{name or 'A resident'} submitted a raise. {reason}",
            )
        )
        message = "Raise submitted — verify to push this complaint for officers."

    return {
        "ok": True,
        "already_verified": False,
        "message": message,
        "reason": reason,
        "verified": verified_now,
        "backer": serialize_backer(backer),
        "stats": backer_stats(db, row),
        "grievance": None,
    }


def verify_pending_raise(
    db: Session,
    row: Grievance,
    *,
    mobile: str,
    otp: str,
    latitude: float | None = None,
    longitude: float | None = None,
    village: str = "",
    ward: str = "",
    photo_data_url: str = "",
    prefer_onsite: bool = False,
) -> dict:
    mobile = "".join(ch for ch in (mobile or "") if ch.isdigit())[-10:]
    otp_ok = check_mock_otp(otp)
    if not otp_ok:
        return {"ok": False, "error": "Mock OTP required (use 123456 for demo)."}

    candidates = (
        db.query(GrievanceBacker)
        .filter(GrievanceBacker.grievance_id == row.id, GrievanceBacker.mobile == mobile)
        .order_by(GrievanceBacker.created_at.desc())
        .all()
    )
    if not candidates:
        return start_or_update_raise(
            db,
            row,
            name="",
            mobile=mobile,
            otp=otp,
            latitude=latitude,
            longitude=longitude,
            village=village,
            ward=ward,
            photo_data_url=photo_data_url,
            source="remote",
            prefer_onsite=prefer_onsite,
        )

    pending = next((b for b in candidates if b.status == "pending"), None)
    if not pending:
        verified = next((b for b in candidates if b.status == "verified"), None)
        if verified:
            return {
                "ok": True,
                "already_verified": True,
                "message": "Already verified.",
                "backer": serialize_backer(verified),
                "stats": backer_stats(db, row),
            }
        return {"ok": False, "error": "No pending raise found for this mobile."}

    before_b, before_p = row.backer_count or 0, row.push_count or 0
    dist = distance_to_grievance(row, latitude, longitude)
    onsite_r = row.onsite_radius_m or DEFAULT_ONSITE_RADIUS_M
    at_site = prefer_onsite or (dist is not None and dist <= onsite_r)

    if at_site:
        pending.kind = "onsite_push"
        pending.source = "onsite"
        verified_now, reason, dist = evidence_strong_enough(
            row,
            otp_ok=True,
            lat=latitude,
            lon=longitude,
            village=village or pending.village,
            ward=ward or pending.ward,
            photo=photo_data_url or pending.photo_data_url,
            onsite=True,
        )
    else:
        verified_now, reason, dist = evidence_strong_enough(
            row,
            otp_ok=True,
            lat=latitude,
            lon=longitude,
            village=village or pending.village,
            ward=ward or pending.ward,
            photo=photo_data_url or pending.photo_data_url,
            onsite=False,
        )

    pending.otp_verified = True
    if latitude is not None:
        pending.latitude = latitude
    if longitude is not None:
        pending.longitude = longitude
    pending.distance_m = dist
    if village:
        pending.village = village
    if ward:
        pending.ward = ward
    if photo_data_url.startswith("data:image/") and len(photo_data_url) < 900_000:
        pending.photo_data_url = photo_data_url

    if not verified_now:
        db.flush()
        recount_backers(db, row)
        return {
            "ok": True,
            "verified": False,
            "message": reason,
            "reason": reason,
            "backer": serialize_backer(pending),
            "stats": backer_stats(db, row),
        }

    pending.status = "verified"
    pending.verified_at = datetime.now(timezone.utc)
    db.flush()
    recount_backers(db, row)
    maybe_priority_event(db, row, before_b, before_p)
    title = "On-site push verified" if pending.kind == "onsite_push" else "Community raise verified"
    db.add(
        GrievanceEvent(
            grievance_id=row.id,
            title=title,
            detail=f"{pending.name or 'A resident'} ({mobile[-4:].rjust(4, '*')}) — {reason}",
        )
    )
    return {
        "ok": True,
        "verified": True,
        "message": "Verified — this complaint was pushed for officers.",
        "reason": reason,
        "backer": serialize_backer(pending),
        "stats": backer_stats(db, row),
    }


def serialize_backer(b: GrievanceBacker) -> dict:
    return {
        "id": b.id,
        "grievance_id": b.grievance_id,
        "name": b.name,
        "mobile": b.mobile,
        "latitude": b.latitude,
        "longitude": b.longitude,
        "distance_m": b.distance_m,
        "kind": b.kind,
        "source": b.source,
        "status": b.status,
        "village": b.village,
        "ward": b.ward,
        "has_photo": bool(b.photo_data_url),
        "otp_verified": bool(b.otp_verified),
        "verified_at": b.verified_at,
        "created_at": b.created_at,
    }


def backer_stats(db: Session, row: Grievance) -> dict:
    rows = db.query(GrievanceBacker).filter(GrievanceBacker.grievance_id == row.id).all()
    verified = [b for b in rows if b.status == "verified"]
    pending = [b for b in rows if b.status == "pending"]
    onsite = [b for b in verified if b.kind == "onsite_push"]
    sources: dict[str, int] = {}
    for b in verified:
        sources[b.source] = sources.get(b.source, 0) + 1
    distances = [b.distance_m for b in verified if b.distance_m is not None]
    span_days = 0
    if verified:
        times = [b.created_at for b in verified if b.created_at]
        if len(times) >= 2:
            span_days = max(0, int((max(times) - min(times)).total_seconds() // 86400))
    return {
        "registration_id": row.registration_id,
        "backer_count": row.backer_count or 0,
        "push_count": row.push_count or 0,
        "pending_raise_count": row.pending_raise_count or 0,
        "verified_count": len(verified),
        "pending_count": len(pending),
        "onsite_count": len(onsite),
        "distinct_mobiles": len({b.mobile for b in verified}),
        "sources": sources,
        "avg_distance_m": round(sum(distances) / len(distances)) if distances else None,
        "collection_span_days": span_days,
        "verification_radius_m": row.verification_radius_m or DEFAULT_VERIFY_RADIUS_M,
        "onsite_radius_m": row.onsite_radius_m or DEFAULT_ONSITE_RADIUS_M,
        "priority_threshold_backers": BACKER_THRESHOLD,
        "priority_threshold_pushes": PUSH_THRESHOLD,
        "priority_crossed": (row.backer_count or 0) >= BACKER_THRESHOLD
        or (row.push_count or 0) >= PUSH_THRESHOLD,
        "backers": [serialize_backer(b) for b in sorted(rows, key=lambda x: x.created_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)],
    }


def infer_impact_scope(answers: dict | None) -> str:
    answers = answers or {}
    for key in ("spread", "affect", "traffic"):
        val = (answers.get(key) or "").lower()
        if "village" in val or "ward" in val or "whole" in val:
            return "village"
        if "gali" in val or "street" in val or "ambulance" in val or "buses" in val:
            return "street"
    return "self"
