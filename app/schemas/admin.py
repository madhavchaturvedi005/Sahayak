from datetime import datetime

from pydantic import BaseModel, Field


STATUSES = (
    "Registered",
    "Under Process",
    "Forwarded",
    "Escalated",
    "Resolved",
    "Closed",
    "Rejected",
)

STAFF_ROLES = ("officer", "supervisor", "cm", "admin")
ALL_ROLES = ("citizen",) + STAFF_ROLES


class AdminActionIn(BaseModel):
    status: str
    title: str = ""
    detail: str = Field(min_length=8, max_length=4000)


class AdminUserOut(BaseModel):
    id: str
    name: str
    mobile: str
    email: str | None
    role: str
    desk_level: int | None = None
    desk_title: str = ""
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminRoleIn(BaseModel):
    role: str


class AdminOverviewOut(BaseModel):
    registered: int
    open: int
    under_process: int
    resolved: int
    delayed: int
    appealed: int
    citizens: int
    officers: int


class AdminAppealOut(BaseModel):
    appeal_id: str
    status: str
    reason: str
    created_at: datetime
    registration_id: str
    subject: str
    ministry: str


class AdminConfigOut(BaseModel):
    admin_name: str
    admin_mobile: str
    admin_email: str
    environment: str


class PersonaConfigOut(BaseModel):
    display_name: str
    instructions: str
    updated_by_id: str | None = None
    updated_by_name: str = ""
    updated_at: datetime | None = None


class PersonaConfigIn(BaseModel):
    display_name: str = Field(min_length=2, max_length=80)
    instructions: str = Field(min_length=40, max_length=12000)


NODAL_SCOPES = ("central", "state", "appeal")


class NodalOfficerIn(BaseModel):
    scope: str
    organisation: str = Field(min_length=2, max_length=240)
    name: str = Field(min_length=2, max_length=160)
    designation: str = Field(min_length=2, max_length=200)
    email: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=80)
    address: str = Field(default="", max_length=400)
    state: str = Field(default="", max_length=80)


class NodalOfficerOut(BaseModel):
    id: str
    scope: str
    organisation: str
    name: str
    designation: str
    email: str
    phone: str
    address: str = ""
    state: str

    class Config:
        from_attributes = True
