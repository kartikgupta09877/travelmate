"""User profiles, updates, block list."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import utcnow
from app.db.repo import private_profile, public_user
from app.schemas.user import UserProfile, UserPublic, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserPublic)
async def get_profile(user_id: str, _: dict = Depends(get_current_user)):
    doc = await get_database().users.find_one({"_id": user_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return public_user(doc)


@router.patch("/me", response_model=UserProfile)
async def update_me(body: UserUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        updates["updated_at"] = utcnow()
        await get_database().users.update_one({"_id": user["_id"]}, {"$set": updates})
    return private_profile(await get_database().users.find_one({"_id": user["_id"]}))


@router.post("/{user_id}/block", response_model=UserProfile)
async def block_user(user_id: str, user: dict = Depends(get_current_user)):
    if user_id == user["_id"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot block yourself")
    await get_database().users.update_one(
        {"_id": user["_id"]}, {"$addToSet": {"blocked_user_ids": user_id}}
    )
    return private_profile(await get_database().users.find_one({"_id": user["_id"]}))


@router.post("/{user_id}/unblock", response_model=UserProfile)
async def unblock_user(user_id: str, user: dict = Depends(get_current_user)):
    await get_database().users.update_one(
        {"_id": user["_id"]}, {"$pull": {"blocked_user_ids": user_id}}
    )
    return private_profile(await get_database().users.find_one({"_id": user["_id"]}))
