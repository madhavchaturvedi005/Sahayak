import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
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
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    evidence: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(40), default="Registered")
    expected_days: Mapped[int] = mapped_column(Integer, default=30)
    pendency_pct: Mapped[int] = mapped_column(Integer, default=18)
    routing_reason: Mapped[str] = mapped_column(Text, default="")
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reminder_count: Mapped[int] = mapped_column(Integer, default=0)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="grievances")
    events = relationship("GrievanceEvent", back_populates="grievance", order_by="GrievanceEvent.created_at")
    appeals = relationship("Appeal", back_populates="grievance")


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
