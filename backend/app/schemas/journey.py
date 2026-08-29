from datetime import date as date_type
from datetime import datetime
from typing import List, Optional

from pydantic import AliasChoices, BaseModel, Field, field_validator, model_validator

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
    available_seats: int = Field(default=0, ge=0)
    total_seats: int = Field(default=0, ge=0)
    estimated_cost_total: Optional[float] = Field(default=None, ge=0)
    budget: Optional[float] = Field(default=None, ge=0)  # long trips
    trip_type: Optional[TripType] = None           # long trips
    group_capacity: Optional[int] = Field(default=None, ge=1)
    group_size: int = Field(
        default=1,
        ge=1,
        validation_alias=AliasChoices("group_size", "seats_required"),
        description="People in the host party, including the host. `seats_required` is accepted as an alias.",
    )
    notes: Optional[str] = None

    @field_validator("departure_time", "return_time")
    @classmethod
    def validate_time(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        try:
            datetime.strptime(value, "%H:%M")
        except ValueError as exc:
            raise ValueError("must use HH:MM 24-hour time") from exc
        return value

    @model_validator(mode="after")
    def validate_trip_details(self):
        if self.date:
            try:
                date_type.fromisoformat(self.date)
            except ValueError as exc:
                raise ValueError("date must use ISO YYYY-MM-DD format") from exc
        if self.type == JourneyType.long and not self.date:
            raise ValueError("long journeys require a travel date")
        if self.group_capacity is not None and self.group_capacity < self.group_size:
            raise ValueError("group_capacity cannot be smaller than group_size")
        return self


class JourneyCostPreview(BaseModel):
    """Inputs for route-aware pricing before a journey is saved."""

    type: JourneyType
    origin: GeoPoint
    destination: GeoPoint
    departure_time: str = Field(..., description="HH:MM 24h")
    vehicle_type: VehicleType = VehicleType.none
    recurrence: Recurrence = Recurrence.one_time
    group_size: int = Field(
        default=1,
        ge=1,
        validation_alias=AliasChoices("group_size", "seats_required"),
    )
    estimated_cost_total: Optional[float] = Field(default=None, ge=0)

    @field_validator("departure_time")
    @classmethod
    def validate_departure_time(cls, value: str) -> str:
        try:
            datetime.strptime(value, "%H:%M")
        except ValueError as exc:
            raise ValueError("must use HH:MM 24-hour time") from exc
        return value


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
    group_size: int = 1
    distance_km: float = 0
    duration_min: int = 0
    suggested_checkpoint: Optional[dict] = None
    solo_travel_cost: float = 0
    shared_travel_cost: float = 0
    per_person_cost: float = 0
    estimated_savings: float = 0
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
