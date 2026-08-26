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
from app.models.grievance import Appeal, Grievance, GrievanceBacker, GrievanceEvent  # noqa: E402
from app.models.user import User  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.services.community import recount_backers  # noqa: E402
from app.services.desk import apply_role_desk, assign_on_create  # noqa: E402

DESK_ACCOUNTS = [
    ("9111111111", "Ramesh Yadav", "officer", "Field officer — Nashik municipal", "ramesh.field@gov.in"),
    ("9111111112", "Sunita Devi", "officer", "Field officer — Pune municipal", "sunita.field@gov.in"),
    ("9111111113", "Imran Khan", "officer", "Field officer — Nagpur municipal", "imran.field@gov.in"),
    ("9111111114", "Meera Joshi", "officer", "Field officer — Mumbai BMC Ward L", "meera.field@gov.in"),
    ("9111111115", "Sanjay Patil", "officer", "Field officer — Chhatrapati Sambhajinagar", "sanjay.field@gov.in"),
    ("9222222221", "Priya Sharma", "supervisor", "Divisional supervisor — Nashik", "priya.super@gov.in"),
    ("9222222222", "Vikram Rathore", "supervisor", "Divisional supervisor — Pune / Mumbai", "vikram.super@gov.in"),
    ("9222222223", "Anita Deshmukh", "supervisor", "Divisional supervisor — Nagpur", "anita.super@gov.in"),
    ("9333333331", "CM Grievance Cell", "cm", "Chief Minister's Office — Maharashtra", "cm.cell@gov.in"),
    ("9333333332", "Asha Banerjee", "cm", "Principal Secretary, CMO Maharashtra", "asha.cm@gov.in"),
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

    community = [
        {
            "registration_id": "PMOPG/20260825090000",
            "subject": "Potholes on the village approach road after monsoon",
            "description": "The main approach road is broken for 200 metres. School vans and the ambulance cannot pass after rain.",
            "ministry": "Ministry of Road Transport and Highways",
            "category": "Road / transport",
            "village": "Rampur",
            "ward": "4",
            "district": "Sitapur",
            "street": "School road",
            "latitude": 27.5612,
            "longitude": 80.6814,
            "impact_scope": "village",
            "backers": [
                ("Geeta Devi", "9800000001", "endorse", "remote", "verified", 420),
                ("Hari Lal", "9800000002", "onsite_push", "onsite", "verified", 80),
                ("Raju", "9800000003", "endorse", "link", "pending", None),
            ],
        },
        {
            "registration_id": "PMOPG/20260820110000",
            "subject": "Open drain overflowing onto the lane",
            "description": "The ward drain floods three houses every evening. Children are falling sick.",
            "ministry": "Ministry of Housing and Urban Affairs",
            "category": "Water supply / civic amenities",
            "village": "Aliganj",
            "ward": "12",
            "district": "Lucknow",
            "street": "Lane 3",
            "latitude": 26.8824,
            "longitude": 80.9472,
            "impact_scope": "street",
            "backers": [
                ("Suman", "9800000004", "endorse", "remote", "verified", 610),
                ("Imtiaz", "9800000005", "onsite_push", "onsite", "verified", 40),
                ("Kavita", "9800000006", "endorse", "csc", "verified", 730),
            ],
        },
        {
            "registration_id": "PMOPG/20260812073000",
            "subject": "Handpump dry for two weeks",
            "description": "The only public handpump in the hamlet has no water. Women are walking 2 km.",
            "ministry": "Ministry of Jal Shakti",
            "category": "Drinking water",
            "village": "Bhitauli",
            "ward": "1",
            "district": "Barabanki",
            "street": "Chaupal",
            "latitude": 26.9411,
            "longitude": 81.1886,
            "impact_scope": "village",
            "backers": [
                ("Munni", "9800000007", "endorse", "ivr", "verified", 200),
                ("Shankar", "9800000008", "endorse", "remote", "pending", None),
            ],
        },
    ]
    for item in community:
        row = db.query(Grievance).filter(Grievance.registration_id == item["registration_id"]).first()
        if row is None:
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
                status="Under Process",
                expected_days=21,
                village=item["village"],
                ward=item["ward"],
                district=item["district"],
                street=item["street"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                impact_scope=item["impact_scope"],
            )
            db.add(row)
            db.flush()
            db.add(
                GrievanceEvent(
                    grievance_id=row.id,
                    title="Submission successful",
                    detail="Location grievance registered. Neighbours can raise it after verification.",
                )
            )
        else:
            row.village = item["village"]
            row.ward = item["ward"]
            row.district = item["district"]
            row.street = item["street"]
            row.latitude = item["latitude"]
            row.longitude = item["longitude"]
            row.impact_scope = item["impact_scope"]
            if row.status in {"Resolved", "Closed", "Rejected"}:
                row.status = "Under Process"
                row.closed_at = None
        for name, mobile, kind, source, status, dist in item["backers"]:
            existing = (
                db.query(GrievanceBacker)
                .filter(
                    GrievanceBacker.grievance_id == row.id,
                    GrievanceBacker.mobile == mobile,
                    GrievanceBacker.kind == kind,
                )
                .first()
            )
            if existing:
                continue
            db.add(
                GrievanceBacker(
                    grievance_id=row.id,
                    name=name,
                    mobile=mobile,
                    kind=kind,
                    source=source,
                    status=status,
                    village=item["village"],
                    ward=item["ward"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    distance_m=dist,
                    otp_verified=status == "verified",
                    verified_at=datetime.now(timezone.utc) if status == "verified" else None,
                )
            )
        db.flush()
        recount_backers(db, row)

    staff = {person.mobile: person for person in db.query(User).filter(User.role.in_(["officer", "supervisor", "cm"])).all()}
    mh_issues = [
        {
            "registration_id": "PMOPG/20260826010100",
            "subject": "Mithi nalla flooding homes in Kurla after three days of rain",
            "description": "The nalla has entered ground-floor rooms. Families are sleeping on the flyover. Neighbours raise this every evening and the count keeps climbing.",
            "ministry": "Ministry of Housing and Urban Affairs",
            "category": "Water supply / civic amenities",
            "village": "Kurla",
            "ward": "L",
            "district": "Mumbai",
            "street": "Mithi nalla lane",
            "latitude": 19.0728,
            "longitude": 72.8826,
            "impact_scope": "street",
            "officer": "9111111114",
            "supervisor": "9222222222",
            "level": 2,
            "filed_days": 28,
            "level_days": 7,
            "photo": "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=900&q=80",
            "backers": [
                ("Farida Sheikh", "9810000101", "endorse", "remote", "verified", 380),
                ("Raju Kamble", "9810000102", "onsite_push", "onsite", "verified", 60),
                ("Sana Qureshi", "9810000103", "onsite_push", "onsite", "verified", 90),
                ("Vinod Pawar", "9810000104", "endorse", "link", "verified", 520),
                ("Lata More", "9810000105", "endorse", "csc", "verified", 710),
                ("Imran Shaikh", "9810000106", "endorse", "remote", "pending", None),
            ],
        },
        {
            "registration_id": "PMOPG/20260826010200",
            "subject": "Potholes on the Pune–Satara approach after monsoon",
            "description": "Two-wheeler accidents every week near the ST stand. School vans detour through the inner lanes.",
            "ministry": "Ministry of Road Transport and Highways",
            "category": "Road / transport",
            "village": "Swargate",
            "ward": "Kasba",
            "district": "Pune",
            "street": "Satara road",
            "latitude": 18.5018,
            "longitude": 73.8636,
            "impact_scope": "street",
            "officer": "9111111112",
            "supervisor": "9222222222",
            "level": 1,
            "filed_days": 9,
            "level_days": 9,
            "photo": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=900&q=80",
            "backers": [
                ("Suresh Jadhav", "9810000201", "endorse", "remote", "verified", 240),
                ("Meena Kale", "9810000202", "onsite_push", "onsite", "verified", 45),
                ("Tushar Gokhale", "9810000203", "endorse", "link", "verified", 630),
            ],
        },
        {
            "registration_id": "PMOPG/20260826010300",
            "subject": "Panchavati handpump dry for eleven days",
            "description": "The only public handpump in the lane has no water. Women are walking to the next ward with pots.",
            "ministry": "Ministry of Jal Shakti",
            "category": "Drinking water",
            "village": "Panchavati",
            "ward": "6",
            "district": "Nashik",
            "street": "Godavari ghat road",
            "latitude": 20.0112,
            "longitude": 73.7954,
            "impact_scope": "village",
            "officer": "9111111111",
            "supervisor": "9222222221",
            "level": 1,
            "filed_days": 11,
            "level_days": 11,
            "photo": "https://images.unsplash.com/photo-1541919329513-35f7af297129?auto=format&fit=crop&w=900&q=80",
            "backers": [
                ("Sunita Wagh", "9810000301", "endorse", "remote", "verified", 180),
                ("Balu Shinde", "9810000302", "endorse", "ivr", "verified", 310),
            ],
        },
        {
            "registration_id": "PMOPG/20260826010400",
            "subject": "Street lights dark for a fortnight in Sitabuldi",
            "description": "Twelve poles are dead from the market to the railway overbridge. Women coming from the late train have no light.",
            "ministry": "Ministry of Power",
            "category": "Electricity",
            "village": "Sitabuldi",
            "ward": "Dharampeth",
            "district": "Nagpur",
            "street": "Central Avenue",
            "latitude": 21.1458,
            "longitude": 79.0882,
            "impact_scope": "street",
            "officer": "9111111113",
            "supervisor": "9222222223",
            "level": 1,
            "filed_days": 16,
            "level_days": 16,
            "photo": "https://images.unsplash.com/photo-1519501025268-65e0b3b0b5e2?auto=format&fit=crop&w=900&q=80",
            "backers": [
                ("Kavita Borkar", "9810000401", "endorse", "remote", "verified", 400),
                ("Rahul Meshram", "9810000402", "onsite_push", "onsite", "verified", 70),
            ],
        },
        {
            "registration_id": "PMOPG/20260826010500",
            "subject": "OPD queue spilling onto the road at Ghati hospital",
            "description": "Token counters open late. Elderly patients wait in the sun from 7 am. Relatives have started raising this from the gate.",
            "ministry": "Ministry of Health & Family Welfare",
            "category": "Hospitals and health schemes",
            "village": "Ghati",
            "ward": "Cidco",
            "district": "Chhatrapati Sambhajinagar",
            "street": "Hospital road",
            "latitude": 19.8762,
            "longitude": 75.3433,
            "impact_scope": "street",
            "officer": "9111111115",
            "supervisor": "9222222222",
            "level": 2,
            "filed_days": 24,
            "level_days": 3,
            "photo": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
            "backers": [
                ("Ashok Gaikwad", "9810000501", "endorse", "csc", "verified", 550),
                ("Nanda Kale", "9810000502", "endorse", "remote", "verified", 200),
                ("Yusuf Pathan", "9810000503", "onsite_push", "onsite", "verified", 35),
                ("Rekha Jadhav", "9810000504", "endorse", "link", "pending", None),
            ],
        },
        {
            "registration_id": "PMOPG/20260826010600",
            "subject": "Tanker not arriving in the drought pocket of Solapur",
            "description": "The scheduled tanker missed four turns. Cattle and kitchens are sharing one well that is already low.",
            "ministry": "Ministry of Jal Shakti",
            "category": "Drinking water",
            "village": "Hotgi",
            "ward": "3",
            "district": "Solapur",
            "street": "Well road",
            "latitude": 17.6599,
            "longitude": 75.9064,
            "impact_scope": "village",
            "officer": "9111111112",
            "supervisor": "9222222222",
            "level": 1,
            "filed_days": 6,
            "level_days": 6,
            "photo": "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=900&q=80",
            "backers": [
                ("Maruti Mane", "9810000601", "endorse", "ivr", "verified", 260),
            ],
        },
    ]
    now = datetime.now(timezone.utc)
    for item in mh_issues:
        officer = staff.get(item["officer"])
        supervisor = staff.get(item["supervisor"])
        cm_cell = staff.get("9333333331")
        filed = now - timedelta(days=item["filed_days"])
        level_at = now - timedelta(days=item["level_days"])
        holder = cm_cell if item["level"] >= 3 else supervisor if item["level"] >= 2 else officer
        row = db.query(Grievance).filter(Grievance.registration_id == item["registration_id"]).first()
        if row is None:
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
                status="Escalated" if item["level"] >= 2 else "Under Process",
                expected_days=21,
                village=item["village"],
                ward=item["ward"],
                district=item["district"],
                street=item["street"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                impact_scope=item["impact_scope"],
                evidence=[{"kind": "photo", "name": "site.jpg", "data_url": item["photo"]}],
                assigned_user_id=holder.id if holder else None,
                field_officer_id=officer.id if officer else None,
                escalation_level=item["level"],
                level_assigned_at=level_at,
                created_at=filed,
                updated_at=level_at,
            )
            db.add(row)
            db.flush()
            db.add(
                GrievanceEvent(
                    grievance_id=row.id,
                    title="Submission successful",
                    detail="Maharashtra location grievance registered for the CM office map.",
                    created_at=filed,
                )
            )
            if item["level"] >= 2:
                db.add(
                    GrievanceEvent(
                        grievance_id=row.id,
                        title="Escalated to supervisor",
                        detail=f"Field desk missed its window. Now with {supervisor.name if supervisor else 'the supervisor'}.",
                        created_at=level_at,
                    )
                )
        else:
            row.village = item["village"]
            row.ward = item["ward"]
            row.district = item["district"]
            row.street = item["street"]
            row.latitude = item["latitude"]
            row.longitude = item["longitude"]
            row.impact_scope = item["impact_scope"]
            row.evidence = [{"kind": "photo", "name": "site.jpg", "data_url": item["photo"]}]
            row.assigned_user_id = holder.id if holder else row.assigned_user_id
            row.field_officer_id = officer.id if officer else row.field_officer_id
            row.escalation_level = item["level"]
            row.level_assigned_at = level_at
            row.created_at = filed
            if row.status in {"Resolved", "Closed", "Rejected"}:
                row.status = "Escalated" if item["level"] >= 2 else "Under Process"
                row.closed_at = None
        for name, mobile, kind, source, status, dist in item["backers"]:
            existing = (
                db.query(GrievanceBacker)
                .filter(
                    GrievanceBacker.grievance_id == row.id,
                    GrievanceBacker.mobile == mobile,
                    GrievanceBacker.kind == kind,
                )
                .first()
            )
            if existing:
                continue
            db.add(
                GrievanceBacker(
                    grievance_id=row.id,
                    name=name,
                    mobile=mobile,
                    kind=kind,
                    source=source,
                    status=status,
                    village=item["village"],
                    ward=item["ward"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    distance_m=dist,
                    otp_verified=status == "verified",
                    verified_at=now if status == "verified" else None,
                )
            )
        db.flush()
        recount_backers(db, row)

    place_fill = {
        "PMOPG/20241024103000": ("Rampur", "4", "Sitapur", "Society lane", 27.5620, 80.6820, "street"),
        "PMOPG/20260701110000": ("Rampur", "4", "Sitapur", "Approach road", 27.5604, 80.6801, "village"),
        "PMOPG/20260728080000": ("Aliganj", "12", "Lucknow", "Ward drain", 26.8818, 80.9466, "street"),
    }
    for reg, (village, ward, district, street, lat, lon, scope) in place_fill.items():
        row = db.query(Grievance).filter(Grievance.registration_id == reg).first()
        if not row:
            continue
        if not (row.village or "").strip():
            row.village = village
            row.ward = ward
            row.district = district
            row.street = street
            row.latitude = lat
            row.longitude = lon
            row.impact_scope = scope

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
