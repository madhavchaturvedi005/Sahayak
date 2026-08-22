from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.activity import AccountActivity
from app.models.user import User
from app.schemas.auth import LoginIn, OtpRequestIn, OtpVerifyIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

MOCK_OTP = "123456"


class ProfileIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: str | None = None


class PasswordIn(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6, max_length=80)


def _client_ip(request: Request) -> str:
    return request.headers.get("x-forwarded-for", request.client.host if request.client else "")


def _log(db: Session, user_id: str, action: str, ip: str) -> None:
    db.add(AccountActivity(user_id=user_id, action=action, ip_address=ip))
    db.commit()


@router.post("/register", response_model=TokenOut)
def register(body: RegisterIn, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.mobile == body.mobile).first():
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    if body.email and db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=body.name,
        mobile=body.mobile,
        email=body.email,
        password_hash=hash_password(body.password),
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _log(db, user.id, "Register", _client_ip(request))
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile == body.mobile).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    _log(db, user.id, "Login", _client_ip(request))
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/otp/request")
def request_otp(body: OtpRequestIn):
    return {
        "ok": True,
        "mocked": True,
        "message": f"Demo OTP sent to {body.mobile}. Use {MOCK_OTP}. No SMS is actually sent.",
    }


@router.post("/otp/verify", response_model=TokenOut)
def verify_otp(body: OtpVerifyIn, request: Request, db: Session = Depends(get_db)):
    if body.otp != MOCK_OTP:
        raise HTTPException(status_code=400, detail="Incorrect OTP. Demo code is 123456.")
    user = db.query(User).filter(User.mobile == body.mobile).first()
    if not user:
        user = User(
            name=body.name or f"Citizen {body.mobile[-4:]}",
            mobile=body.mobile,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        _log(db, user.id, "Register via OTP", _client_ip(request))
    else:
        user.is_verified = True
        db.commit()
        db.refresh(user)
        _log(db, user.id, "Login via OTP", _client_ip(request))
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.put("/profile", response_model=UserOut)
def update_profile(body: ProfileIn, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.name = body.name
    user.email = body.email
    db.commit()
    db.refresh(user)
    _log(db, user.id, "Edit profile", _client_ip(request))
    return user


@router.post("/password")
def change_password(body: PasswordIn, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.password_hash or not verify_password(body.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    _log(db, user.id, "Change password", _client_ip(request))
    return {"ok": True}


@router.get("/activity")
def activity(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(AccountActivity)
        .filter(AccountActivity.user_id == user.id)
        .order_by(AccountActivity.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "action": r.action,
            "ip_address": r.ip_address,
            "created_at": r.created_at,
        }
        for r in rows
    ]
