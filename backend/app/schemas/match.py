from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .common import CheckpointType, MatchStatus
from .journey import JourneyOut
from .user import UserPublic


class CheckpointSuggestion(BaseModel):
    id: str
    name: str
    type: CheckpointType
    lat: float
    lng: float
    distance_from_requester_km: float
    distance_from_host_km: float
    detour_km: float = 0
    eta: Optional[str] = None
    safety_score: float = 0.9


class MatchBreakdown(BaseModel):
    route: float        # 0-100 (weight 40%)
    time: float         # 0-100 (weight 25%)
    destination: float  # 0-100 (weight 15%)
    checkpoint: float   # 0-100 (weight 10%)
    reliability: float  # 0-100 (weight 10%)


class PartnerResult(BaseModel):
    """A ranked candidate returned by search / AI assistant."""
    journey: JourneyOut
    partner: UserPublic
    score: int                      # 0-100 overall match
    breakdown: MatchBreakdown
    reasons: List[str]
    route_overlap_pct: int
    departure_diff_min: int
    estimated_share: float
    suggested_checkpoint: Optional[CheckpointSuggestion] = None
    alternative_checkpoints: List[CheckpointSuggestion] = []


class MatchOut(BaseModel):
    id: str
    requester_id: str
    host_id: str
    journey_id: str
    partner: Optional[UserPublic] = None
    score: int
    breakdown: MatchBreakdown
    reasons: List[str]
    suggested_checkpoint: Optional[CheckpointSuggestion] = None
    alternative_checkpoints: List[CheckpointSuggestion] = []
    status: MatchStatus
    created_at: datetime


class MatchRequest(BaseModel):
    journey_id: str
    origin: Optional[dict] = None
    destination: Optional[dict] = None
    departure_time: Optional[str] = None
    message: Optional[str] = None


class CheckpointChoice(BaseModel):
    checkpoint_id: str
