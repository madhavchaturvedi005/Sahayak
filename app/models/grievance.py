import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Grievance(Base):
    __tablename__ = "grievances"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(20), default="public")  # public | pension
    name: Mapped[str] = mapped_column(String(160))
    mobile: Mapped[str] = mapped_column(String(15))
    ministry: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(200))
    subject: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text)
    playbook_id: Mapped[str] = mapped_column(String(40), default="")
    village: Mapped[str] = mapped_column(String(120), default="")
    ward: Mapped[str] = mapped_column(String(80), default="")
    district: Mapped[str] = mapped_column(String(120), default="")
    street: Mapped[str] = mapped_column(String(160), default="")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    filer_role: Mapped[str] = mapped_column(String(20), default="self")
    helper_name: Mapped[str] = mapped_column(String(160), default="")
    helper_relation: Mapped[str] = mapped_column(String(80), default="")
    consent_capture: Mapped[str] = mapped_column(String(200), default="")
    impact_scope: Mapped[str] = mapped_column(String(20), default="self")  # self | street | village
    backer_count: Mapped[int] = mapped_column(Integer, default=0)
    push_count: Mapped[int] = mapped_column(Integer, default=0)
    pending_raise_count: Mapped[int] = mapped_column(Integer, default=0)
    verification_radius_m: Mapped[int] = mapped_column(Integer, default=800)
    onsite_radius_m: Mapped[int] = mapped_column(Integer, default=150)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    evidence: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(40), default="Registered")
    expected_days: Mapped[int] = mapped_column(Integer, default=21)
    pendency_pct: Mapped[int] = mapped_column(Integer, default=18)
    routing_reason: Mapped[str] = mapped_column(Text, default="")
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reminder_count: Mapped[int] = mapped_column(Integer, default=0)
    assigned_user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    field_officer_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    escalation_level: Mapped[int] = mapped_column(Integer, default=1)
    level_assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="grievances", foreign_keys=[user_id])
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    field_officer = relationship("User", foreign_keys=[field_officer_id])
    events = relationship("GrievanceEvent", back_populates="grievance", order_by="GrievanceEvent.created_at")
    appeals = relationship("Appeal", back_populates="grievance")
    backers = relationship("GrievanceBacker", back_populates="grievance", order_by="GrievanceBacker.created_at")


class GrievanceEvent(Base):
    __tablename__ = "grievance_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    grievance_id: Mapped[str] = mapped_column(String, ForeignKey("grievances.id"))
    title: Mapped[str] = mapped_column(String(200))
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    grievance = relationship("Grievance", back_populates="events")


class Appeal(Base):
    __tablename__ = "appeals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    appeal_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    grievance_id: Mapped[str] = mapped_column(String, ForeignKey("grievances.id"))
    reason: Mapped[str] = mapped_column(Text)
    draft: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="Filed")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    grievance = relationship("Grievance", back_populates="appeals")


class GrievanceBacker(Base):
    """Community raise / on-site push. Only status=verified bumps grievance counts."""

    __tablename__ = "grievance_backers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    grievance_id: Mapped[str] = mapped_column(String, ForeignKey("grievances.id"), index=True)
    name: Mapped[str] = mapped_column(String(160), default="")
    mobile: Mapped[str] = mapped_column(String(15), index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    kind: Mapped[str] = mapped_column(String(20), default="endorse")  # endorse | onsite_push
    source: Mapped[str] = mapped_column(String(20), default="remote")  # in_person|link|csc|ivr|onsite|remote
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|verified|rejected
    village: Mapped[str] = mapped_column(String(120), default="")
    ward: Mapped[str] = mapped_column(String(80), default="")
    photo_data_url: Mapped[str] = mapped_column(Text, default="")
    otp_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    grievance = relationship("Grievance", back_populates="backers")
