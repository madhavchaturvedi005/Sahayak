"""Idempotent seed for demo departments, officers, news, and a sample grievance."""

from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.models.content import DepartmentStat, NewsItem, NodalOfficer  # noqa: E402
from app.models.grievance import Grievance, GrievanceEvent  # noqa: E402
from app.models.user import User  # noqa: E402
from app.core.security import hash_password  # noqa: E402


DEPARTMENTS = [
    ("Ministry of Housing and Urban Affairs", 28, 22, "Civic amenities and urban local bodies."),
    ("Ministry of External Affairs", 21, 14, "Passport and consular services."),
    ("Department of Revenue", 45, 31, "Income tax, GST, and refunds."),
    ("Department of Pension & Pensioners' Welfare", 35, 19, "PPO and retirement benefits."),
    ("Ministry of Railways", 18, 11, "Train, ticket, and station issues."),
    ("Unique Identification Authority of India", 24, 16, "Aadhaar enrolment and updates."),
    ("Department of Financial Services", 30, 20, "Banks, insurance, and pensions."),
    ("Ministry of Power", 20, 17, "Electricity supply and DISCOMs."),
    ("Ministry of Health & Family Welfare", 32, 23, "Hospitals and health schemes."),
    ("Department of Telecommunications", 22, 15, "SIM, broadband, and TRAI-linked issues."),
    ("Department of Administrative Reforms & Public Grievances", 30, 18, "Default nodal department."),
]

NEWS = [
    (date(2024, 8, 23), "Comprehensive Guidelines for Handling the Public Grievances", "https://pgportal.gov.in", "PDF - 2.14 MB"),
    (date(2022, 7, 27), "Strengthening of Machinery for Redressal of Public Grievance (CPGRAMS)", "https://pgportal.gov.in", "PDF - 1.05 MB"),
]

CENTRAL = [
    ("Department of Administrative Reforms & Public Grievances", "Joint Secretary (PG)", "Nodal PG Officer", "pg.darpg@gov.in", "011-23360331", ""),
    ("Ministry of Railways", "Executive Director (PG)", "Nodal PG Officer", "edpg@rb.railnet.gov.in", "011-23382638", ""),
    ("Department of Financial Services", "Deputy Secretary (PG)", "Nodal PG Officer", "pg.dfs@gov.in", "011-23748764", ""),
    ("Ministry of Health & Family Welfare", "Director (PG)", "Nodal PG Officer", "pg.mohfw@gov.in", "011-23061863", ""),
    ("Department of Telecommunications", "DDG (PG)", "Nodal PG Officer", "pg.dot@gov.in", "011-23372114", ""),
]

STATES = [
    ("Maharashtra", "General Administration Department", "Secretary (PG)", "pg.gad@maharashtra.gov.in", "022-22025014"),
    ("Uttar Pradesh", "Department of Public Grievances", "Special Secretary", "pg.up@gov.in", "0522-2238081"),
    ("Karnataka", "DPAR (Public Grievances)", "Secretary", "pg.kar@gov.in", "080-22253714"),
    ("Tamil Nadu", "Public Department", "Additional Secretary", "pg.tn@gov.in", "044-25671501"),
    ("Delhi", "Department of Administrative Reforms", "Director (PG)", "pg.delhi@gov.in", "011-23392006"),
]

APPEAL_AUTHORITY = [
    ("Directorate of Public Grievances, Cabinet Secretariat", "Secretary, DPG", "Nodal Authority for Appeal", "secy.dpg@nic.in", "011-23743139", ""),
]


def seed(db: Session) -> None:
    if db.query(DepartmentStat).count() == 0:
        for ministry, days, pend, notes in DEPARTMENTS:
            db.add(DepartmentStat(ministry=ministry, avg_days=days, pendency_pct=pend, notes=notes))

    if db.query(NewsItem).count() == 0:
        for published, title, href, size in NEWS:
            db.add(NewsItem(published_on=published, title=title, href=href, size_label=size))

    if db.query(NodalOfficer).count() == 0:
        for org, name, desig, email, phone, state in CENTRAL:
            db.add(NodalOfficer(scope="central", organisation=org, name=name, designation=desig, email=email, phone=phone, state=state))
        for state, org, name, email, phone in STATES:
            db.add(NodalOfficer(scope="state", organisation=org, name=name, designation="Nodal PG Officer", email=email, phone=phone, state=state))
        for org, name, desig, email, phone, state in APPEAL_AUTHORITY:
            db.add(NodalOfficer(scope="appeal", organisation=org, name=name, designation=desig, email=email, phone=phone, state=state))

    demo = db.query(User).filter(User.mobile == "9876543210").first()
    if not demo:
        demo = User(
            name="Demo Citizen",
            mobile="9876543210",
            email="citizen@example.com",
            password_hash=hash_password("sahayak"),
            is_verified=True,
        )
        db.add(demo)
        db.flush()

    if db.query(Grievance).filter(Grievance.registration_id == "PMOPG/20241024103000").first() is None:
        g = Grievance(
            registration_id="PMOPG/20241024103000",
            user_id=demo.id,
            kind="public",
            name="Demo Citizen",
            mobile="9876543210",
            ministry="Ministry of Housing and Urban Affairs",
            category="Water supply / civic amenities",
            subject="Delay in municipal water supply connection",
            description="No water supply in our society for three weeks. The local municipal office has not responded.",
            status="Under Process",
            expected_days=28,
            pendency_pct=22,
            routing_reason="Complaints about water, pipelines, or civic amenities are usually filed with Housing and Urban Affairs.",
        )
        db.add(g)
        db.flush()
        db.add_all(
            [
                GrievanceEvent(
                    grievance_id=g.id,
                    title="Submission successful",
                    detail="Grievance registered and initial receipt generated.",
                    created_at=datetime(2024, 10, 24, 10, 30, tzinfo=timezone.utc),
                ),
                GrievanceEvent(
                    grievance_id=g.id,
                    title="Forwarded to nodal agency",
                    detail="Assigned to the local municipal corporation for review.",
                    created_at=datetime(2024, 10, 25, 9, 15, tzinfo=timezone.utc),
                ),
            ]
        )

    demo_closed = datetime.now(timezone.utc) - timedelta(days=12)
    resolved = db.query(Grievance).filter(Grievance.registration_id == "PMOPG/202410128921A").first()
    resolved_description = (
        "Applied for a residential building permit. Environmental clearance papers were already "
        "attached. The file has been pending without a speaking order."
    )
    if resolved is None:
        resolved = Grievance(
            registration_id="PMOPG/202410128921A",
            user_id=demo.id,
            kind="public",
            name="Demo Citizen",
            mobile="9876543210",
            ministry="Ministry of Housing and Urban Affairs",
            category="Building permit / municipal approval",
            subject="Delay in issuance of building permit for residential property.",
            description=resolved_description,
            status="Resolved",
            expected_days=28,
            pendency_pct=22,
            routing_reason="Building permits and municipal approvals are usually handled by Housing and Urban Affairs or the urban local body.",
            closed_at=demo_closed,
            created_at=datetime(2024, 10, 12, 10, 30, tzinfo=timezone.utc),
            updated_at=demo_closed,
        )
        db.add(resolved)
        db.flush()
        db.add_all(
            [
                GrievanceEvent(
                    grievance_id=resolved.id,
                    title="Submission successful",
                    detail="Grievance registered and forwarded to the municipal corporation.",
                    created_at=datetime(2024, 10, 12, 10, 30, tzinfo=timezone.utc),
                ),
                GrievanceEvent(
                    grievance_id=resolved.id,
                    title="Resolution provided by department",
                    detail=(
                        "The delay occurred because the environmental clearance documents were not attached "
                        "to the original application. Please resubmit the file with the missing papers. "
                        "The permit can then be processed in the normal course."
                    ),
                    created_at=demo_closed,
                ),
            ]
        )
    else:
        resolved.description = resolved_description
        resolved.closed_at = demo_closed
        resolved.status = "Resolved"

    db.commit()
    print("Seed complete.")


if __name__ == "__main__":
    session = SessionLocal()
    try:
        seed(session)
    finally:
        session.close()
