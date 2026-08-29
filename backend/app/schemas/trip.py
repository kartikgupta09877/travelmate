from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .common import GeoPoint, JourneyType, TripStatus
from .match import CheckpointSuggestion
from .user import UserPublic


class TripOut(BaseModel):
    id: str
    journey_id: str
    section: JourneyType
    host_id: str
    participant_ids: List[str]
    participants: List[UserPublic] = []
    origin: GeoPoint
    destination: GeoPoint
    date: Optional[str] = None
    departure_time: str
    # Only revealed after both accept; otherwise a public checkpoint.
    meeting_point: Optional[CheckpointSuggestion] = None
    cost_per_person: float = 0
    total_cost: float = 0
    solo_travel_cost: float = 0
    shared_travel_cost: float = 0
    per_person_cost: float = 0
    estimated_savings: float = 0
    distance_km: float = 0
    duration_min: int = 0
    status: TripStatus
    created_at: datetime
    conversation_id: Optional[str] = None


class TripStatusUpdate(BaseModel):
    status: TripStatus
