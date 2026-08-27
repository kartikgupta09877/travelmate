from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .common import (
    GeoPoint,
    JourneyStatus,
    JourneyType,
    Recurrence,
    TripType,
    VehicleType,
)
from .user import UserPublic


class JourneyCreate(BaseModel):
    type: JourneyType
    origin: GeoPoint
    destination: GeoPoint
    date: Optional[str] = None            # ISO date (long trips / one-time)
    departure_time: str = Field(..., description="HH:MM 24h")
    return_time: Optional[str] = None
    return_date: Optional[str] = None
    recurrence: Recurrence = Recurrence.one_time
    days: List[str] = Field(default_factory=list)  # e.g. ["Mon","Tue"]
    vehicle_type: VehicleType = VehicleType.none
    available_seats: int = 0
    total_seats: int = 0
    estimated_cost_total: Optional[float] = None
    budget: Optional[float] = None                 # long trips
    trip_type: Optional[TripType] = None           # long trips
    group_capacity: Optional[int] = None
    notes: Optional[str] = None


class JourneyOut(BaseModel):
    id: str
    host_id: str
    host: Optional[UserPublic] = None
    type: JourneyType
    origin: GeoPoint
    destination: GeoPoint
    date: Optional[str] = None
    departure_time: str
    return_time: Optional[str] = None
    return_date: Optional[str] = None
    recurrence: Recurrence
    days: List[str] = []
    vehicle_type: VehicleType
    available_seats: int
    total_seats: int
    estimated_cost_total: Optional[float] = None
    budget: Optional[float] = None
    trip_type: Optional[TripType] = None
    group_current: int = 1
    group_capacity: Optional[int] = None
    distance_km: float = 0
    duration_min: int = 0
    status: JourneyStatus = JourneyStatus.open
    notes: Optional[str] = None
    created_at: datetime


class PartnerSearchQuery(BaseModel):
    type: JourneyType = JourneyType.local
    origin: GeoPoint
    destination: GeoPoint
    date: Optional[str] = None
    departure_time: str
    seats_needed: int = 1
    budget: Optional[float] = None
