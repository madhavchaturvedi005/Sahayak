"""Idempotent seed for demo departments, officers, news, and a sample grievance."""

from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.models.content import DepartmentStat, NewsItem, NodalOfficer  # noqa: E402
from app.models.grievance import Appeal, Grievance, GrievanceEvent  # noqa: E402
from app.models.user import User  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.services.desk import apply_role_desk, assign_on_create  # noqa: E402

DESK_ACCOUNTS = [
    ("9111111111", "Ramesh Yadav", "officer", "Field officer — ward desk", "ramesh.field@gov.in"),
    ("9111111112", "Sunita Devi", "officer", "Field officer — municipal desk", "sunita.field@gov.in"),
    ("9111111113", "Imran Khan", "officer", "Field officer — revenue desk", "imran.field@gov.in"),
    ("9222222221", "Priya Sharma", "supervisor", "District supervisor", "priya.super@gov.in"),
    ("9222222222", "Vikram Rathore", "supervisor", "District supervisor — civic cell", "vikram.super@gov.in"),
    ("9333333331", "CM Grievance Cell", "cm", "Chief Minister's Office", "cm.cell@gov.in"),
    ("9333333332", "Asha Banerjee", "cm", "Principal Secretary, CM Office", "asha.cm@gov.in"),
]


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

# organisation, name, designation, email, phone, address
APPEAL_AUTHORITY = [
    (
        "Central Board of Direct Taxes (Income Tax)",
        "Dipi Agarwal",
        "Commissioner of Income Tax (TPS-II and R)",
        "delhi.dittps@incometax.gov.in",
        "011-23416148",
        "Central Board of Direct Taxes, Room No. 428, 4th Floor, Mayur Bhawan, Connaught Circus, New Delhi",
    ),
    (
        "Central Board of Indirect Taxes and Customs",
        "Dr. Shailendra Kumar Sinha",
        "Director General",
        "shailendra.sinha@gov.in",
        "011-23705809",
        "Directorate General of Taxpayer Services, 1st Floor, Central Revenue Building, I.P. Estate, New Delhi",
    ),
    (
        "Department for Promotion of Industry and Internal Trade",
        "Jai Prakash Shivahare",
        "Joint Secretary",
        "js-jps@gov.in",
        "011-23038876",
        "Room No. 221, Vanijya Bhavan, New Delhi",
    ),
    (
        "Department of Commerce",
        "Sunil Kumar",
        "Joint Secretary (PG)",
        "js.pg-doc@gov.in",
        "011-23062704",
        "Udyog Bhawan, New Delhi",
    ),
    (
        "Department of Food and Public Distribution",
        "Anita Meena",
        "Joint Secretary",
        "js.pg-dfpd@gov.in",
        "011-23382529",
        "Krishi Bhawan, New Delhi",
    ),
    (
        "Department of Posts",
        "Rajesh Kumar",
        "Deputy Director General (PG)",
        "ddg.pg@indiapost.gov.in",
        "011-23096131",
        "Dak Bhawan, Sansad Marg, New Delhi",
    ),
    (
        "Department of Telecommunications",
        "Neelam Prasad",
        "Deputy Director General (PG)",
        "ddg.pg-dot@gov.in",
        "011-23372114",
        "Sanchar Bhawan, 20 Ashoka Road, New Delhi",
    ),
    (
        "Ministry of Railways",
        "Vikram Singh",
        "Executive Director (Public Grievances)",
        "edpg@rb.railnet.gov.in",
        "011-23382638",
        "Rail Bhawan, Raisina Road, New Delhi",
    ),
    (
        "Ministry of Health & Family Welfare",
        "Dr. Kavita Sharma",
        "Director (PG)",
        "dir.pg-mohfw@gov.in",
        "011-23061863",
        "Nirman Bhawan, New Delhi",
    ),
    (
        "Ministry of Home Affairs",
        "Arvind Joshi",
        "Joint Secretary (PG)",
        "js.pg-mha@gov.in",
        "011-23092431",
        "North Block, New Delhi",
    ),
    (
        "Ministry of Housing and Urban Affairs",
        "Meera Iyer",
        "Joint Secretary",
        "js.pg-mohua@gov.in",
        "011-23061347",
        "Nirman Bhawan, Maulana Azad Road, New Delhi",
    ),
    (
        "Ministry of Labour & Employment",
        "Sanjay Verma",
        "Joint Secretary (PG)",
        "js.pg-labour@gov.in",
        "011-23710240",
        "Shram Shakti Bhawan, Rafi Marg, New Delhi",
    ),
    (
        "Department of Financial Services",
        "Pooja Bansal",
        "Deputy Secretary (PG)",
        "ds.pg-dfs@gov.in",
        "011-23748764",
        "Jeevan Deep Building, Parliament Street, New Delhi",
    ),
    (
        "Department of Pension & Pensioners' Welfare",
        "Rakesh Nair",
        "Director (PG)",
        "dir.pg-doppw@gov.in",
        "011-24625965",
        "Lok Nayak Bhawan, Khan Market, New Delhi",
    ),
    (
        "Ministry of Education",
        "Anjali Deshmukh",
        "Joint Secretary (PG)",
        "js.pg-moe@gov.in",
        "011-23381098",
        "Shastri Bhawan, New Delhi",
    ),
    (
        "Ministry of Road Transport and Highways",
        "Harish Chandra",
        "Joint Secretary",
        "js.pg-morth@gov.in",
        "011-23718575",
        "Transport Bhawan, 1 Parliament Street, New Delhi",
    ),
    (
        "Unique Identification Authority of India",
        "Nidhi Kapoor",
        "Deputy Director General (Grievances)",
        "ddg.pg@uidai.gov.in",
        "011-23466821",
        "Bangla Sahib Road, Behind Kali Mandir, Gole Market, New Delhi",
    ),
    (
        "Department of Administrative Reforms & Public Grievances",
        "Joint Secretary (PG)",
        "Nodal Authority for Appeal",
        "js.pg-darpg@gov.in",
        "011-23360331",
        "Sardar Patel Bhawan, Sansad Marg, New Delhi",
    ),
    (
        "Ministry of Power",
        "Deepak Rao",
        "Director (PG)",
        "dir.pg-mop@gov.in",
        "011-23715507",
        "Shram Shakti Bhawan, Rafi Marg, New Delhi",
    ),
    (
        "Ministry of Petroleum and Natural Gas",
        "Farah Khan",
        "Joint Secretary (PG)",
        "js.pg-png@gov.in",
        "011-23386765",
        "Shastri Bhawan, New Delhi",
    ),
    (
        "Ministry of Rural Development",
        "Gopal Reddy",
        "Joint Secretary (PG)",
        "js.pg-mord@gov.in",
        "011-23383553",
        "Krishi Bhawan, New Delhi",
    ),
    (
        "Ministry of External Affairs",
        "Smita Menon",
        "Joint Secretary (Consular, Passport & Visa / PG)",
        "js.pg-mea@gov.in",
        "011-23011883",
        "South Block, New Delhi",
    ),
    (
        "Department of Personnel & Training",
        "Amitabh Sen",
        "Joint Secretary (PG)",
        "js.pg-dopt@gov.in",
        "011-23092338",
        "North Block, New Delhi",
    ),
    (
        "Ministry of Defence",
        "Col. (Retd.) Ashok Bhatia",
        "Joint Secretary (PG)",
        "js.pg-mod@gov.in",
        "011-23011431",
        "South Block, New Delhi",
    ),
    (
        "Ministry of Environment, Forest and Climate Change",
        "Lata Krishnan",
        "Joint Secretary (PG)",
        "js.pg-moefcc@gov.in",
        "011-24695262",
        "Indira Paryavaran Bhawan, Jor Bagh Road, New Delhi",
    ),
    (
        "Ministry of Agriculture & Farmers Welfare",
        "Manoj Tiwari",
        "Joint Secretary (PG)",
        "js.pg-agri@gov.in",
        "011-23382542",
        "Krishi Bhawan, New Delhi",
    ),
    (
        "Department of Revenue",
        "Shweta Malhotra",
        "Joint Secretary (Revenue / PG)",
        "js.pg-dor@gov.in",
        "011-23092653",
        "North Block, New Delhi",
    ),
    (
        "Directorate of Public Grievances, Cabinet Secretariat",
        "Secretary, DPG",
        "Nodal Authority for Appeal",
        "secy.dpg@nic.in",
        "011-23743139",
        "2nd Floor, Sardar Patel Bhawan, Sansad Marg, New Delhi",
    ),
]


def seed(db: Session) -> None:
    if db.query(DepartmentStat).count() == 0:
        for ministry, days, pend, notes in DEPARTMENTS:
            db.add(DepartmentStat(ministry=ministry, avg_days=days, pendency_pct=pend, notes=notes))

    if db.query(NewsItem).count() == 0:
        for published, title, href, size in NEWS:
            db.add(NewsItem(published_on=published, title=title, href=href, size_label=size))

    if db.query(NodalOfficer).filter(NodalOfficer.scope == "central").count() == 0:
        for org, name, desig, email, phone, state in CENTRAL:
            db.add(
                NodalOfficer(
                    scope="central",
                    organisation=org,
                    name=name,
                    designation=desig,
                    email=email,
                    phone=phone,
                    state=state,
                )
            )
    if db.query(NodalOfficer).filter(NodalOfficer.scope == "state").count() == 0:
        for state, org, name, email, phone in STATES:
            db.add(
                NodalOfficer(
                    scope="state",
                    organisation=org,
                    name=name,
                    designation="Nodal PG Officer",
                    email=email,
                    phone=phone,
                    state=state,
                )
            )
    existing_appeal = {
        (row.organisation or "").strip().lower(): row
        for row in db.query(NodalOfficer).filter(NodalOfficer.scope == "appeal").all()
    }
    for org, name, desig, email, phone, address in APPEAL_AUTHORITY:
        key = org.strip().lower()
        row = existing_appeal.get(key)
        if row:
            if not (row.address or "").strip():
                row.address = address
            continue
        db.add(
            NodalOfficer(
                scope="appeal",
                organisation=org,
                name=name,
                designation=desig,
                email=email,
                phone=phone,
                address=address,
                state="",
            )
        )

    admin = db.query(User).filter(User.mobile == settings.admin_mobile).first()
    if not admin:
        admin = User(
            name=settings.admin_name,
            mobile=settings.admin_mobile,
            email=settings.admin_email or None,
            password_hash=hash_password(settings.admin_password),
            role="admin",
            is_verified=True,
        )
        db.add(admin)
    else:
        admin.name = settings.admin_name
        admin.email = settings.admin_email or admin.email
        admin.role = "admin"
        admin.is_verified = True
        admin.password_hash = hash_password(settings.admin_password)
    admin.desk_title = admin.desk_title or "Portal administrator"
    apply_role_desk(admin)

    for mobile, name, role, title, email in DESK_ACCOUNTS:
        person = db.query(User).filter(User.mobile == mobile).first()
        if not person:
            person = User(
                name=name,
                mobile=mobile,
                email=email,
                password_hash=hash_password("sahayak"),
                role=role,
                desk_title=title,
                is_verified=True,
            )
            apply_role_desk(person)
            db.add(person)
        else:
            person.name = name
            person.email = email
            person.role = role
            person.desk_title = title
            person.is_verified = True
            person.password_hash = hash_password("sahayak")
            apply_role_desk(person)
    db.flush()

    demo = db.query(User).filter(User.mobile == "9876543210").first()
    if not demo:
        demo = User(
            name="Demo Citizen",
            mobile="9876543210",
            email="citizen@example.com",
            password_hash=hash_password("sahayak"),
            role="citizen",
            is_verified=True,
        )
        db.add(demo)
        db.flush()
    elif not (demo.role or "").strip():
        demo.role = "citizen"

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
    demo_opened = demo_closed - timedelta(days=19)
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
            created_at=demo_opened,
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
        resolved.created_at = demo_opened
        resolved.closed_at = demo_closed
        resolved.status = "Resolved"

    extra = [
        {
            "registration_id": "PMOPG/20260817090000",
            "ministry": "Ministry of Housing and Urban Affairs",
            "category": "Water supply / civic amenities",
            "subject": "Tap dry for six days in the ward",
            "description": "Municipal tap has been dry. Tanker also missed the street.",
            "status": "Resolved",
            "expected_days": 28,
            "created_at": datetime(2026, 8, 17, 9, 0, tzinfo=timezone.utc),
            "closed_at": datetime(2026, 8, 23, 8, 0, tzinfo=timezone.utc),
        },
        {
            "registration_id": "PMOPG/20260810073000",
            "ministry": "Ministry of Power",
            "category": "Power supply",
            "subject": "Street transformer down after the storm",
            "description": "No bijli on the street since the storm. Wires are hanging.",
            "status": "Resolved",
            "expected_days": 20,
            "created_at": datetime(2026, 8, 10, 7, 30, tzinfo=timezone.utc),
            "closed_at": datetime(2026, 8, 18, 16, 0, tzinfo=timezone.utc),
        },
        {
            "registration_id": "PMOPG/20260701110000",
            "ministry": "Ministry of Road Transport and Highways",
            "category": "Road / transport",
            "subject": "Village approach road blocked after digging",
            "description": "The contractor cut the road and left. Ambulance cannot pass.",
            "status": "Under Process",
            "expected_days": 25,
            "created_at": datetime(2026, 7, 1, 11, 0, tzinfo=timezone.utc),
            "closed_at": None,
        },
        {
            "registration_id": "PMOPG/20260601120000",
            "ministry": "Ministry of Electronics and Information Technology",
            "category": "Cyber / digital fraud",
            "subject": "UPI fraud, money not returned",
            "description": "Fake payment request. Bank closed the file without returning the money.",
            "status": "Resolved",
            "expected_days": 30,
            "created_at": datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc),
            "closed_at": datetime(2026, 7, 20, 10, 0, tzinfo=timezone.utc),
            "appeal": True,
        },
    ]
    for item in extra:
        if db.query(Grievance).filter(Grievance.registration_id == item["registration_id"]).first():
            continue
        row = Grievance(
            registration_id=item["registration_id"],
            user_id=demo.id,
            kind="public",
            name="Demo Citizen",
            mobile="9876543210",
            ministry=item["ministry"],
            category=item["category"],
            subject=item["subject"],
            description=item["description"],
            status=item["status"],
            expected_days=item["expected_days"],
            created_at=item["created_at"],
            closed_at=item["closed_at"],
            updated_at=item["closed_at"] or item["created_at"],
        )
        db.add(row)
        db.flush()
        db.add(
            GrievanceEvent(
                grievance_id=row.id,
                title="Submission successful" if not item["closed_at"] else "Resolution provided by department",
                detail=item["description"],
                created_at=item["closed_at"] or item["created_at"],
            )
        )
        if item.get("appeal"):
            db.add(
                Appeal(
                    appeal_id="APPL/20260721100000",
                    grievance_id=row.id,
                    reason="The bank closed the file without returning the money or naming the officer.",
                    draft="The reply does not return the lost amount or give a speaking order.",
                    status="Filed",
                    created_at=datetime(2026, 7, 21, 10, 0, tzinfo=timezone.utc),
                )
            )

    supervisor = db.query(User).filter(User.mobile == "9222222221").first()
    field = db.query(User).filter(User.mobile == "9111111111").first()
    if (
        supervisor
        and field
        and db.query(Grievance).filter(Grievance.registration_id == "PMOPG/20260728080000").first() is None
    ):
        level_start = datetime.now(timezone.utc) - timedelta(days=23)
        filed = level_start - timedelta(days=22)
        stuck = Grievance(
            registration_id="PMOPG/20260728080000",
            user_id=demo.id,
            kind="public",
            name="Demo Citizen",
            mobile="9876543210",
            ministry="Ministry of Housing and Urban Affairs",
            category="Water supply / civic amenities",
            subject="Drain overflow after the monsoon, still open at supervisor desk",
            description="The ward drain floods the lane. Field desk missed 21 days. Supervisor still has not closed it.",
            status="Escalated",
            expected_days=21,
            assigned_user_id=supervisor.id,
            field_officer_id=field.id,
            escalation_level=2,
            level_assigned_at=level_start,
            created_at=filed,
            updated_at=level_start,
        )
        db.add(stuck)
        db.flush()
        db.add_all(
            [
                GrievanceEvent(
                    grievance_id=stuck.id,
                    title="Submission successful",
                    detail="Grievance registered and assigned to the field desk.",
                    created_at=filed,
                ),
                GrievanceEvent(
                    grievance_id=stuck.id,
                    title="Escalated to supervisor",
                    detail=f"The field desk did not close this in 21 days. It is now with {supervisor.name}.",
                    created_at=level_start,
                ),
            ]
        )

    for row in db.query(Grievance).filter(Grievance.assigned_user_id.is_(None)).all():
        assign_on_create(db, row)
        if row.created_at:
            row.level_assigned_at = row.created_at

    db.commit()
    print("Seed complete.")


if __name__ == "__main__":
    session = SessionLocal()
    try:
        seed(session)
    finally:
        session.close()
