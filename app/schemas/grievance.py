from datetime import datetime

from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    kind: str = "photo"
    name: str = ""
    data_url: str = ""


class GrievanceCreate(BaseModel):
    kind: str = "public"
    name: str
    mobile: str
    ministry: str
    category: str
    subject: str = Field(min_length=8, max_length=300)
    description: str = Field(default="", min_length=0)
    playbook_id: str = ""
    village: str = ""
    ward: str = ""
    district: str = ""
    street: str = ""
    latitude: float | None = None
    longitude: float | None = None
    filer_role: str = "self"
    helper_name: str = ""
    helper_relation: str = ""
    answers: dict = Field(default_factory=dict)
    evidence: list[EvidenceItem] = Field(default_factory=list)


class ClassifyIn(BaseModel):
    text: str


class ClassifyOut(BaseModel):
    ministry: str
    category: str
    reason: str
    expected_days: int
    pendency_pct: int
    playbook_id: str = "general"


class EventOut(BaseModel):
    id: str
    title: str
    detail: str
    created_at: datetime

    class Config:
        from_attributes = True


class GrievanceOut(BaseModel):
    id: str
    registration_id: str
    kind: str
    name: str
    mobile: str
    ministry: str
    category: str
    subject: str
    description: str
    playbook_id: str = ""
    village: str = ""
    ward: str = ""
    district: str = ""
    street: str = ""
    latitude: float | None = None
    longitude: float | None = None
    filer_role: str = "self"
    helper_name: str = ""
    helper_relation: str = ""
    answers: dict = {}
    evidence: list = []
    status: str
    expected_days: int
    pendency_pct: int
    routing_reason: str
    rating: int | None
    reminder_count: int
    closed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None
    events: list[EventOut] = []

    class Config:
        from_attributes = True


class ReminderIn(BaseModel):
    registration_id: str
    message: str = ""


class RateIn(BaseModel):
    registration_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class ResolutionCheckIn(BaseModel):
    complaint: str
    reply: str


class ResolutionCheckOut(BaseModel):
    addressed: bool
    missing: list[str]
    missing_tokens: list[str] = []
    reason: str
    appeal_draft: str
    generic: bool = False


class AppealWindowOut(BaseModel):
    applicable: bool
    closed_at: datetime | None = None
    deadline: datetime | None = None
    days_left: int | None = None
    expired: bool = False
    message: str


class EventBrief(BaseModel):
    title: str
    detail: str
    created_at: datetime


class ResolutionReviewOut(BaseModel):
    grievance: GrievanceOut
    reply: EventBrief | None = None
    check: ResolutionCheckOut | None = None
    appeal_window: AppealWindowOut


class AppealCreate(BaseModel):
    registration_id: str
    reason: str


class TransparencyMinistryOut(BaseModel):
    ministry: str
    count: int
    open: int = 0
    delayed: int
    fulfilled: int = 0
    avg_resolution_days: float | None = None


class TransparencyOut(BaseModel):
    registered: int
    open: int
    resolved: int
    delayed: int
    fulfilled_within_days: int
    appealed: int
    avg_resolution_days: float | None = None
    ministries: list[TransparencyMinistryOut] = []
    updated_at: datetime
