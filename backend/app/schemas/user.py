"""User-related schemas.

Privacy note: we never store or expose raw identity documents. We store only
a verification *status* per channel. Exact home addresses are never stored;
users provide an approximate city/zone.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from .common import Role, VehicleType


class VerificationStatus(BaseModel):
    email: bool = False
    phone: bool = False
    identity: bool = False
    college: bool = False
    vehicle: bool = False


class VehicleInfo(BaseModel):
    type: VehicleType = VehicleType.none
    model: Optional[str] = None
    color: Optional[str] = None
    seats: int = 0
    # Only a hint (e.g. "DL ** ** 1234") is ever shown; never the full plate publicly.
    plate_hint: Optional[str] = None


class UserStats(BaseModel):
    rating: float = 0.0
    ratings_count: int = 0
    completed_trips: int = 0
    cancellation_rate: float = 0.0
    no_show_rate: float = 0.0
    member_since: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=20)
    password: str = Field(..., min_length=6, max_length=128)
    city: str
    date_of_birth: Optional[str] = None  # ISO date; used only for age eligibility
    photo_url: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    preferred_travel_type: Optional[str] = None
    college_or_company: Optional[str] = None
    vehicle: Optional[VehicleInfo] = None


class UserPublic(BaseModel):
    """Safe representation shown to other users."""
    id: str
    full_name: str
    photo_url: Optional[str] = None
    city: str
    bio: Optional[str] = None
    role: Role = Role.user
    preferred_travel_type: Optional[str] = None
    college_or_company: Optional[str] = None
    vehicle: VehicleInfo = VehicleInfo()
    verification: VerificationStatus = VerificationStatus()
    stats: UserStats = UserStats()
    trust_level: str = "New"


class UserProfile(UserPublic):
    """Full self-profile including contact fields the owner may see."""
    email: EmailStr
    phone: str
    blocked_user_ids: List[str] = []


class VerificationRequest(BaseModel):
    channel: str = Field(..., description="email | phone | identity | college | vehicle")
    # For demo: a code the user 'received'. No real documents are uploaded.
    code: Optional[str] = None
