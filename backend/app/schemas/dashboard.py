from typing import List

from pydantic import BaseModel

from .trip import TripOut
from .match import PartnerResult


class DashboardStats(BaseModel):
    money_saved_month: float
    money_saved_total: float
    shared_trips_month: int
    shared_distance_km: float
    co2_reduced_kg: float
    travel_partners: int
    average_rating: float
    upcoming_trip: TripOut | None = None
    next_match: PartnerResult | None = None
    monthly_trip_count: int = 0


class AdminStats(BaseModel):
    total_users: int
    verified_users: int
    active_journeys: int
    completed_journeys: int
    reported_users: int
    pending_verification: int
    total_shared_trips: int
    money_saved_total: float
