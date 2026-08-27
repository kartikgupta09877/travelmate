from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .user import UserPublic


class ReviewCreate(BaseModel):
    trip_id: str
    reviewee_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    tags: List[str] = []


class ReviewOut(BaseModel):
    id: str
    trip_id: str
    reviewer_id: str
    reviewer: Optional[UserPublic] = None
    reviewee_id: str
    rating: int
    comment: Optional[str] = None
    tags: List[str] = []
    created_at: datetime
