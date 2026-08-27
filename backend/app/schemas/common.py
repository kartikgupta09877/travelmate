"""Shared enums and base types."""
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Role(str, Enum):
    user = "user"
    admin = "admin"
    # Reserved for future role-based access; guarded by the same machinery.
    moderator = "moderator"
    verification_agent = "verification_agent"


class JourneyType(str, Enum):
    local = "local"
    long = "long"


class VehicleType(str, Enum):
    car = "car"
    bike = "bike"
    other = "other"
    none = "none"


class Recurrence(str, Enum):
    # Local
    daily = "daily"
    weekdays = "weekdays"
    selected = "selected"
    one_time = "one_time"
    # Long
    one_way = "one_way"
    round_trip = "round_trip"
    multi_day = "multi_day"


class TripType(str, Enum):
    solo = "solo"
    couple = "couple"
    group = "group"
    looking = "looking"


class JourneyStatus(str, Enum):
    open = "open"
    full = "full"
    closed = "closed"
    completed = "completed"
    cancelled = "cancelled"


class MatchStatus(str, Enum):
    suggested = "suggested"
    requested = "requested"
    accepted = "accepted"
    declined = "declined"
    confirmed = "confirmed"
    cancelled = "cancelled"


class TripStatus(str, Enum):
    pending = "pending"
    requested = "requested"
    accepted = "accepted"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ReportStatus(str, Enum):
    open = "open"
    reviewing = "reviewing"
    resolved = "resolved"
    dismissed = "dismissed"


class CheckpointType(str, Enum):
    metro = "metro"
    bus_stop = "bus_stop"
    college_gate = "college_gate"
    mall = "mall"
    petrol_pump = "petrol_pump"
    intersection = "intersection"
    landmark = "landmark"


class GeoPoint(BaseModel):
    label: str = Field(..., description="Human-readable place name")
    lat: float
    lng: float
    zone: Optional[str] = Field(
        default=None,
        description="Approximate public area label. Never an exact home address.",
    )
