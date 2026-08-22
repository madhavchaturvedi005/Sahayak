from pydantic import BaseModel, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    mobile: str = Field(min_length=10, max_length=15)
    email: str | None = None
    password: str = Field(min_length=6, max_length=80)


class LoginIn(BaseModel):
    mobile: str
    password: str


class OtpRequestIn(BaseModel):
    mobile: str = Field(min_length=10, max_length=15)
    name: str | None = None


class OtpVerifyIn(BaseModel):
    mobile: str
    otp: str
    name: str | None = None


class UserOut(BaseModel):
    id: str
    name: str
    mobile: str
    email: str | None
    is_verified: bool

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
