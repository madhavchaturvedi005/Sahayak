import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

PERSONA_ID = "default"


class PersonaConfig(Base):
    __tablename__ = "persona_config"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=PERSONA_ID)
    display_name: Mapped[str] = mapped_column(String(80), default="Sahayak")
    instructions: Mapped[str] = mapped_column(Text, default="")
    updated_by_id: Mapped[str | None] = mapped_column(String, nullable=True)
    updated_by_name: Mapped[str] = mapped_column(String(160), default="")
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
