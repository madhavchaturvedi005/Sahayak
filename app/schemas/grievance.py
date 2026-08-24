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
    consent_capture: str = ""
    impact_scope: str = "self"
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
    consent_capture: str = ""
    impact_scope: str = "self"
    backer_count: int = 0
    push_count: int = 0
    pending_raise_count: int = 0
    verification_radius_m: int = 800
    onsite_radius_m: int = 150
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
    assigned_user_id: str | None = None
    assigned_name: str = ""
    assigned_role: str = ""
    assigned_title: str = ""
    field_officer_id: str | None = None
    field_officer_name: str = ""
    escalation_level: int = 1
    escalation_label: str = ""
    level_assigned_at: datetime | None = None
    sla_days: int = 21
    sla_due_at: datetime | None = None
    sla_overdue: bool = False
    days_on_desk: int = 0
    priority_crossed: bool = False

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


class RaiseIn(BaseModel):
    name: str = ""
    mobile: str
    otp: str = ""
    latitude: float | None = None
    longitude: float | None = None
    village: str = ""
    ward: str = ""
    photo_data_url: str = ""
    source: str = "remote"
    prefer_onsite: bool = False


class OnsiteVerifyIn(BaseModel):
    name: str = ""
    mobile: str
    otp: str = Field(default="123456")
    latitude: float
    longitude: float
    photo_data_url: str = ""


class VerifyRaiseIn(BaseModel):
    mobile: str
    otp: str = Field(default="123456")
    latitude: float | None = None
    longitude: float | None = None
    village: str = ""
    ward: str = ""
    photo_data_url: str = ""
    prefer_onsite: bool = False


class BackerOut(BaseModel):
    id: str
    grievance_id: str
    name: str
    mobile: str
    latitude: float | None = None
    longitude: float | None = None
    distance_m: float | None = None
    kind: str
    source: str
    status: str
    village: str = ""
    ward: str = ""
    has_photo: bool = False
    otp_verified: bool = False
    verified_at: datetime | None = None
    created_at: datetime


class NearbyOut(BaseModel):
    registration_id: str
    subject: str
    playbook_id: str = ""
    village: str = ""
    ward: str = ""
    district: str = ""
    street: str = ""
    latitude: float | None = None
    longitude: float | None = None
    distance_m: float | None = None
    backer_count: int = 0
    push_count: int = 0
    pending_raise_count: int = 0
    status: str
    evidence_count: int = 0
    created_at: datetime | None = None


class BackerStatsOut(BaseModel):
    registration_id: str
    backer_count: int = 0
    push_count: int = 0
    pending_raise_count: int = 0
    verified_count: int = 0
    pending_count: int = 0
    onsite_count: int = 0
    distinct_mobiles: int = 0
    sources: dict = {}
    avg_distance_m: float | None = None
    collection_span_days: int = 0
    verification_radius_m: int = 800
    onsite_radius_m: int = 150
    priority_threshold_backers: int = 25
    priority_threshold_pushes: int = 5
    priority_crossed: bool = False
    backers: list[BackerOut] = []


class RaiseResultOut(BaseModel):
    ok: bool
    message: str = ""
    reason: str = ""
    verified: bool = False
    already_verified: bool = False
    error: str = ""
    backer: BackerOut | None = None
    stats: BackerStatsOut | None = None
    grievance: GrievanceOut | None = None