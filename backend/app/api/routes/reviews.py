"""Ratings & reviews. Averages feed the reliability score used by matching."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import new_id, serialize, utcnow
from app.db.repo import public_user
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=201)
async def create_review(body: ReviewCreate, me: dict = Depends(get_current_user)):
    db = get_database()
    trip = await db.trips.find_one({"_id": body.trip_id})
    if not trip or me["_id"] not in trip.get("participant_ids", []):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    if body.reviewee_id == me["_id"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot review yourself")
    review = {
        "_id": new_id(),
        "trip_id": body.trip_id,
        "reviewer_id": me["_id"],
        "reviewee_id": body.reviewee_id,
        "rating": body.rating,
        "comment": body.comment,
        "tags": body.tags,
        "created_at": utcnow(),
    }
    await db.reviews.insert_one(review)

    # Recompute reviewee's average rating.
    ratings = [r["rating"] async for r in db.reviews.find({"reviewee_id": body.reviewee_id})]
    avg = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
    await db.users.update_one(
        {"_id": body.reviewee_id},
        {"$set": {"stats.rating": avg, "stats.ratings_count": len(ratings)}},
    )
    out = serialize(review)
    out["reviewer"] = public_user(me)
    return out


@router.get("/user/{user_id}", response_model=List[ReviewOut])
async def reviews_for_user(user_id: str, _: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.reviews.find({"reviewee_id": user_id}).sort("created_at", -1)
    out = []
    async for doc in cursor:
        item = serialize(doc)
        reviewer = await db.users.find_one({"_id": doc["reviewer_id"]})
        item["reviewer"] = public_user(reviewer) if reviewer else None
        out.append(item)
    return out
