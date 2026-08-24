from datetime import datetime

from pydantic import BaseModel, Field


STATUSES = (
    "Registered",
    "Under Process",
    "Forwarded",
    "Resolved",
    "Closed",
    "Rejected",
)


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
