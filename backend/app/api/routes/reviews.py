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
    """Create a review.

    Every authorization decision is made on the server from the authenticated
    identity (``me``) and the trip record — never from client-supplied
    identifiers — so a review cannot be forged for a trip the caller wasn't on,
    for a person who wasn't on it, or before the trip finished.
    """
    db = get_database()

    # 1) The trip must exist.
    trip = await db.trips.find_one({"_id": body.trip_id})
    if not trip:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")

    participants = trip.get("participant_ids", [])

    # 2) The reviewer must have actually been on the trip. ``me["_id"]`` comes
    #    from the verified token, so a client cannot impersonate another member.
    if me["_id"] not in participants:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only travellers on this trip can review it"
        )

    # 3) No reviewing yourself.
    if body.reviewee_id == me["_id"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot review yourself")

    # 4) The reviewee must also have been on the same trip. This blocks passing
    #    an arbitrary reviewee_id to manipulate a stranger's rating.
    if body.reviewee_id not in participants:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "That person was not part of this trip"
        )

    # 5) A trip can only be reviewed once it is completed.
    if trip.get("status") != "completed":
        raise HTTPException(
            status.HTTP_409_CONFLICT, "You can only review after the trip is completed"
        )

    # 6) One review per (trip, reviewer, reviewee).
    duplicate = await db.reviews.find_one(
        {
            "trip_id": body.trip_id,
            "reviewer_id": me["_id"],
            "reviewee_id": body.reviewee_id,
        }
    )
    if duplicate:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "You have already reviewed this traveller for this trip",
        )

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
