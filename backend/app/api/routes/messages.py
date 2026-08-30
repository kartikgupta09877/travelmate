"""In-app chat. Personal phone numbers are never exposed by default."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import new_id, serialize, utcnow
from app.db.repo import users_public_map
from app.schemas.message import ConversationContactOut, ConversationOut, MessageCreate, MessageOut

router = APIRouter(tags=["messages"])


@router.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(me: dict = Depends(get_current_user)):
    cursor = get_database().conversations.find({"participant_ids": me["_id"]}).sort("updated_at", -1)
    out = []
    async for doc in cursor:
        item = serialize(doc)
        pmap = await users_public_map(doc.get("participant_ids", []))
        item["participants"] = [pmap[i] for i in doc.get("participant_ids", []) if i in pmap]
        out.append(item)
    return out


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
async def get_messages(conversation_id: str, me: dict = Depends(get_current_user)):
    db = get_database()
    conv = await db.conversations.find_one({"_id": conversation_id})
    if not conv or me["_id"] not in conv.get("participant_ids", []):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    cursor = db.messages.find({"conversation_id": conversation_id}).sort("created_at", 1)
    return [serialize(doc) async for doc in cursor]


@router.get("/conversations/{conversation_id}/contact", response_model=ConversationContactOut)
async def get_partner_contact(conversation_id: str, me: dict = Depends(get_current_user)):
    """Return the confirmed travel partner's phone number for a direct call.

    Contact data remains private until a trip is confirmed, and is only
    available to the two members of that trip's conversation.
    """
    db = get_database()
    conversation = await db.conversations.find_one({"_id": conversation_id})
    if not conversation or me["_id"] not in conversation.get("participant_ids", []):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")

    trip_id = conversation.get("trip_id")
    trip = await db.trips.find_one({"_id": trip_id}) if trip_id else None
    if (
        not trip
        or me["_id"] not in trip.get("participant_ids", [])
        or trip.get("status") not in {"confirmed", "in_progress", "completed"}
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Contact is available after trip confirmation")

    partner_id = next(
        (participant_id for participant_id in conversation["participant_ids"] if participant_id != me["_id"]),
        None,
    )
    partner = await db.users.find_one({"_id": partner_id}) if partner_id else None
    if not partner:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Travel partner not found")
    return {
        "user_id": partner["_id"],
        "full_name": partner.get("full_name", "Travel partner"),
        "phone": partner.get("phone"),
    }


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=201)
async def send_message(
    conversation_id: str, body: MessageCreate, me: dict = Depends(get_current_user)
):
    db = get_database()
    conv = await db.conversations.find_one({"_id": conversation_id})
    if not conv or me["_id"] not in conv.get("participant_ids", []):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    msg = {
        "_id": new_id(),
        "conversation_id": conversation_id,
        "sender_id": me["_id"],
        "text": body.text,
        "kind": body.kind,
        "created_at": utcnow(),
    }
    await db.messages.insert_one(msg)
    await db.conversations.update_one(
        {"_id": conversation_id}, {"$set": {"last_message": body.text, "updated_at": utcnow()}}
    )
    return serialize(msg)
