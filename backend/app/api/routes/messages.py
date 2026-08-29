"""In-app chat. Personal phone numbers are never exposed by default."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import new_id, serialize, utcnow
from app.db.repo import users_public_map
from app.schemas.message import ConversationOut, MessageCreate, MessageOut

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
