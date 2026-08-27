from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from .common import ReportStatus
from .user import UserPublic


class ReportCreate(BaseModel):
    reported_user_id: str
    trip_id: Optional[str] = None
    reason: str
    details: Optional[str] = None


class ReportOut(BaseModel):
    id: str
    reporter_id: str
    reported_user_id: str
    reported_user: Optional[UserPublic] = None
    trip_id: Optional[str] = None
    reason: str
    details: Optional[str] = None
    status: ReportStatus
    admin_notes: Optional[str] = None
    created_at: datetime


class ReportUpdate(BaseModel):
    status: ReportStatus
    admin_notes: Optional[str] = None
