from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .user import UserPublic


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    text: str
    kind: str = "text"  # text | system | status | location
    created_at: datetime


class MessageCreate(BaseModel):
    text: str
    kind: str = "text"


class ConversationOut(BaseModel):
    id: str
    trip_id: Optional[str] = None
    participant_ids: List[str]
    participants: List[UserPublic] = []
    last_message: Optional[str] = None
    updated_at: datetime
    unread: int = 0


class ConversationContactOut(BaseModel):
    """A confirmed trip partner's contact, visible only to conversation members."""

    user_id: str
    full_name: str
    phone: Optional[str] = None
