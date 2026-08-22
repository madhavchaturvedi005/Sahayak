import uuid
from datetime import date

from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NewsItem(Base):
    __tablename__ = "news_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    published_on: Mapped[date] = mapped_column(Date)
    title: Mapped[str] = mapped_column(String(400))
    href: Mapped[str] = mapped_column(String(500), default="#")
    size_label: Mapped[str] = mapped_column(String(40), default="")


class NodalOfficer(Base):
    __tablename__ = "nodal_officers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scope: Mapped[str] = mapped_column(String(20))  # central | state | appeal
    organisation: Mapped[str] = mapped_column(String(240))
    name: Mapped[str] = mapped_column(String(160))
    designation: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(40), default="")
    state: Mapped[str] = mapped_column(String(80), default="")


class DepartmentStat(Base):
    __tablename__ = "department_stats"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ministry: Mapped[str] = mapped_column(String(200), unique=True)
    avg_days: Mapped[int] = mapped_column(Integer, default=30)
    pendency_pct: Mapped[int] = mapped_column(Integer, default=18)
    notes: Mapped[str] = mapped_column(Text, default="")
