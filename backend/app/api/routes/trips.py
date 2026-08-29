"""Trip lifecycle: My Trips and status transitions."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import serialize, utcnow
from app.db.repo import users_public_map
from app.schemas.trip import TripOut, TripStatusUpdate
from app.services import cost as cost_svc

router = APIRouter(prefix="/trips", tags=["trips"])


async def _hydrate(doc: dict) -> dict:
    out = serialize(doc)
    travelers = max(1, len(doc.get("participant_ids", [])))
    # Older persisted trips have only total_cost/cost_per_person.  Hydrating
    # the canonical fields keeps those records and new records equally useful.
    costs = cost_svc.cost_breakdown(
        doc.get("distance_km", 0),
        "none",
        travelers,
        total_cost=doc.get("total_cost", doc.get("shared_travel_cost", 0)),
    )
    out.update(costs)
    out["total_cost"] = costs["shared_travel_cost"]
    out["cost_per_person"] = costs["per_person_cost"]
    pmap = await users_public_map(doc.get("participant_ids", []))
    out["participants"] = [pmap[i] for i in doc.get("participant_ids", []) if i in pmap]
    return out


@router.get("", response_model=List[TripOut])
async def my_trips(me: dict = Depends(get_current_user)):
    cursor = get_database().trips.find({"participant_ids": me["_id"]}).sort("created_at", -1)
    return [await _hydrate(doc) async for doc in cursor]


@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(trip_id: str, me: dict = Depends(get_current_user)):
    doc = await get_database().trips.find_one({"_id": trip_id})
    if not doc or me["_id"] not in doc.get("participant_ids", []):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    return await _hydrate(doc)


@router.get("/{trip_id}/cost")
async def trip_cost(trip_id: str, me: dict = Depends(get_current_user)):
    """Return the current transparent split for a trip participant."""
    doc = await get_database().trips.find_one({"_id": trip_id})
    if not doc or me["_id"] not in doc.get("participant_ids", []):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    hydrated = await _hydrate(doc)
    return {
        "trip_id": hydrated["id"],
        "travelers": len(doc.get("participant_ids", [])),
        "solo_travel_cost": hydrated["solo_travel_cost"],
        "shared_travel_cost": hydrated["shared_travel_cost"],
        "per_person_cost": hydrated["per_person_cost"],
        "estimated_savings": hydrated["estimated_savings"],
    }


@router.post("/{trip_id}/status", response_model=TripOut)
async def update_status(trip_id: str, body: TripStatusUpdate, me: dict = Depends(get_current_user)):
    db = get_database()
    doc = await db.trips.find_one({"_id": trip_id})
    if not doc or me["_id"] not in doc.get("participant_ids", []):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    new_status = body.status.value
    await db.trips.update_one({"_id": trip_id}, {"$set": {"status": new_status, "updated_at": utcnow()}})
    if new_status == "completed":
        for pid in doc.get("participant_ids", []):
            await db.users.update_one({"_id": pid}, {"$inc": {"stats.completed_trips": 1}})
    return await _hydrate(await db.trips.find_one({"_id": trip_id}))
