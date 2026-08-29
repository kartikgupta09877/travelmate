"""Authentication & verification.

Verification is a *trust layer*, never a guarantee. Email/phone use a real OTP
mechanism (the code is surfaced in dev instead of sent by SMS/email). Identity,
college and vehicle verification are marked 'pending' and require review by an
admin / verification agent — we never auto-grant them or store raw documents.
"""
import random
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_database
from app.core.security import create_access_token, hash_password, verify_password
from app.core.utils import new_id, utcnow
from app.db.repo import private_profile
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_CHANNELS = {"email", "phone"}
REVIEW_CHANNELS = {"identity", "college", "vehicle"}


def _default_user_doc(payload: UserCreate) -> dict:
    now = utcnow()
    return {
        "_id": new_id(),
        "full_name": payload.full_name,
        "email": payload.email.lower(),
        "phone": payload.phone,
        "hashed_password": hash_password(payload.password),
        "city": payload.city,
        "date_of_birth": payload.date_of_birth,
        "photo_url": payload.photo_url,
        "bio": None,
        "role": "user",
        "preferred_travel_type": "both",
        "college_or_company": None,
        "vehicle": {"type": "none", "seats": 0},
        "verification": {
            "email": False,
            "phone": False,
            "identity": False,
            "college": False,
            "vehicle": False,
        },
        "verification_pending": {},
        "verification_codes": {},
        "stats": {
            "rating": 0.0,
            "ratings_count": 0,
            "completed_trips": 0,
            "cancellation_rate": 0.0,
            "no_show_rate": 0.0,
            "member_since": now,
        },
        "blocked_user_ids": [],
        "suspended": False,
        "created_at": now,
        "updated_at": now,
    }


@router.post("/register", response_model=Token, status_code=201)
async def register(payload: UserCreate):
    db = get_database()
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    doc = _default_user_doc(payload)
    await db.users.insert_one(doc)
    token = create_access_token(doc["_id"], doc["role"])
    return Token(access_token=token)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if user.get("suspended"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been suspended")
    token = create_access_token(user["_id"], user.get("role", "user"))
    return Token(access_token=token)


@router.get("/me", response_model=UserProfile)
async def me(user: dict = Depends(get_current_user)):
    return private_profile(user)


class VerifyChannel(BaseModel):
    channel: str


class VerifyConfirm(BaseModel):
    channel: str
    code: str


@router.post("/verify/send")
async def verify_send(body: VerifyChannel, user: dict = Depends(get_current_user)):
    db = get_database()
    channel = body.channel
    if channel in OTP_CHANNELS:
        code = f"{random.randint(0, 999999):06d}"
        await db.users.update_one(
            {"_id": user["_id"]}, {"$set": {f"verification_codes.{channel}": code}}
        )
        # In production this is sent by SMS/email; in dev we surface it.
        return {
            "channel": channel,
            "status": "code_sent",
            "demo_code": code if settings.debug else None,
            "message": f"A verification code was sent to your {channel}.",
        }
    if channel in REVIEW_CHANNELS:
        await db.users.update_one(
            {"_id": user["_id"]}, {"$set": {f"verification_pending.{channel}": True}}
        )
        return {
            "channel": channel,
            "status": "pending_review",
            "message": "Submitted for review. A verification agent will confirm this shortly.",
        }
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown verification channel")


@router.post("/verify/confirm", response_model=UserProfile)
async def verify_confirm(body: VerifyConfirm, user: dict = Depends(get_current_user)):
    if body.channel not in OTP_CHANNELS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This channel is confirmed by a reviewer, not a code",
        )
    db = get_database()
    fresh = await db.users.find_one({"_id": user["_id"]})
    expected = (fresh.get("verification_codes") or {}).get(body.channel)
    if not expected or body.code != expected:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Incorrect or expired code")
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {f"verification.{body.channel}": True, "updated_at": utcnow()},
            "$unset": {f"verification_codes.{body.channel}": ""},
        },
    )
    return private_profile(await db.users.find_one({"_id": user["_id"]}))
