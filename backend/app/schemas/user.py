"""User-related schemas.

Privacy note: we never store or expose raw identity documents. We store only
a verification *status* per channel. Exact home addresses are never stored;
users provide an approximate city/zone.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, model_validator

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
    seats: int = Field(default=0, ge=0, le=6)
    # Only a hint (e.g. "DL ** ** 1234") is ever shown; never the full plate publicly.
    plate_hint: Optional[str] = None

    @model_validator(mode="after")
    def validate_seats(self):
        if self.type == VehicleType.none:
            self.seats = 0
        elif self.type == VehicleType.bike and self.seats != 1:
            raise ValueError("a bike has one passenger seat")
        elif self.type == VehicleType.car and not 1 <= self.seats <= 6:
            raise ValueError("a car must have between 1 and 6 passenger seats")
        return self


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
    vehicle: VehicleInfo = Field(default_factory=VehicleInfo)


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
