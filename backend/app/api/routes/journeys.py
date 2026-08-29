"""Journey creation, route estimates, checkpoint suggestions, and cost previews."""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import new_id, serialize, utcnow
from app.db.repo import public_user
from app.schemas.common import JourneyType
from app.schemas.journey import JourneyCostPreview, JourneyCreate, JourneyOut
from app.services import cost as cost_svc
from app.services.checkpoint import suggest_route_checkpoints
from app.services.geo import route_estimate

router = APIRouter(prefix="/journeys", tags=["journeys"])


def _distance_and_duration(origin: dict, destination: dict) -> tuple[float, int]:
    return route_estimate(
        (origin["lat"], origin["lng"]),
        (destination["lat"], destination["lng"]),
    )


async def _journey_checkpoint(
    journey_type: str, origin: dict, destination: dict, departure_time: str
) -> dict | None:
    """Return one safe public start checkpoint for local journeys when nearby."""
    if journey_type != "local":
        return None
    catalog = [doc async for doc in get_database().checkpoints.find({})]
    suggestions = suggest_route_checkpoints(
        (origin["lat"], origin["lng"]),
        (destination["lat"], destination["lng"]),
        catalog,
        departure_time=departure_time,
    )
    return suggestions[0] if suggestions else None


def _cost_response(
    distance_km: float,
    vehicle_type: str,
    travelers: int,
    recurrence: str,
    total_cost: float | None = None,
) -> dict:
    costs = cost_svc.cost_breakdown(
        distance_km, vehicle_type, travelers, total_cost=total_cost
    )
    total = costs["shared_travel_cost"]
    return {
        **costs,
        # Existing preview keys remain available to current clients.
        "total": total,
        "per_person": costs["per_person_cost"],
        "split": cost_svc.split_table(total),
        "saving_per_trip": costs["estimated_savings"],
        "monthly": cost_svc.monthly_projection(total, travelers, recurrence),
        "co2_reduced_kg": cost_svc.co2_reduced_kg(distance_km, travelers, vehicle_type),
    }


async def _hydrate(doc: dict) -> dict:
    out = serialize(doc)
    travelers = max(1, int(doc.get("group_current", doc.get("group_size", 1))))
    costs = cost_svc.cost_breakdown(
        doc.get("distance_km", 0),
        doc.get("vehicle_type", "none"),
        travelers,
        total_cost=doc.get("estimated_cost_total"),
    )
    out.update(costs)
    out["estimated_cost_total"] = costs["shared_travel_cost"]
    out.setdefault("group_size", travelers)
    host = await get_database().users.find_one({"_id": doc["host_id"]})
    out["host"] = public_user(host) if host else None
    return out


@router.post("", response_model=JourneyOut, status_code=201)
async def create_journey(body: JourneyCreate, user: dict = Depends(get_current_user)):
    db = get_database()
    origin = body.origin.model_dump()
    destination = body.destination.model_dump()
    distance_km, duration_min = _distance_and_duration(origin, destination)
    costs = cost_svc.cost_breakdown(
        distance_km,
        body.vehicle_type.value,
        body.group_size,
        total_cost=body.estimated_cost_total,
    )
    capacity = body.group_capacity or (body.group_size + max(body.available_seats, 0))
    checkpoint = await _journey_checkpoint(
        body.type.value, origin, destination, body.departure_time
    )
    doc = {
        "_id": new_id(),
        "host_id": user["_id"],
        "type": body.type.value,
        "origin": origin,
        "destination": destination,
        "date": body.date,
        "departure_time": body.departure_time,
        "return_time": body.return_time,
        "return_date": body.return_date,
        "recurrence": body.recurrence.value,
        "days": body.days,
        "vehicle_type": body.vehicle_type.value,
        "available_seats": body.available_seats,
        "total_seats": body.total_seats or body.available_seats,
        "estimated_cost_total": costs["shared_travel_cost"],
        "budget": body.budget,
        "trip_type": body.trip_type.value if body.trip_type else None,
        "group_current": body.group_size,
        "group_capacity": capacity,
        "group_size": body.group_size,
        "distance_km": distance_km,
        "duration_min": duration_min,
        "suggested_checkpoint": checkpoint,
        **costs,
        "status": "open",
        "notes": body.notes,
        "created_at": utcnow(),
    }
    await db.journeys.insert_one(doc)
    return await _hydrate(doc)


@router.post("/preview")
async def preview_journey_cost(
    body: JourneyCostPreview, _: dict = Depends(get_current_user)
):
    """Preview the geo-derived route, cost split, and local checkpoint before saving."""
    origin = body.origin.model_dump()
    destination = body.destination.model_dump()
    distance_km, duration_min = _distance_and_duration(origin, destination)
    checkpoint = await _journey_checkpoint(
        body.type.value, origin, destination, body.departure_time
    )
    return {
        "type": body.type.value,
        "origin": origin,
        "destination": destination,
        "distance_km": distance_km,
        "duration_min": duration_min,
        "group_size": body.group_size,
        "suggested_checkpoint": checkpoint,
        **_cost_response(
            distance_km,
            body.vehicle_type.value,
            body.group_size,
            body.recurrence.value,
            total_cost=body.estimated_cost_total,
        ),
    }


@router.get("", response_model=List[JourneyOut])
async def list_journeys(
    mine: bool = Query(False),
    type: Optional[JourneyType] = None,
    user: dict = Depends(get_current_user),
):
    query: dict = {}
    if mine:
        query["host_id"] = user["_id"]
    if type:
        query["type"] = type.value
    cursor = get_database().journeys.find(query).sort("created_at", -1)
    return [await _hydrate(doc) async for doc in cursor]


@router.get("/{journey_id}", response_model=JourneyOut)
async def get_journey(journey_id: str, _: dict = Depends(get_current_user)):
    from fastapi import HTTPException

    doc = await get_database().journeys.find_one({"_id": journey_id})
    if not doc:
        raise HTTPException(404, "Journey not found")
    return await _hydrate(doc)


@router.get("/preview/cost")
async def preview_cost(
    distance_km: float,
    vehicle_type: str = "car",
    travelers: int = 2,
    recurrence: str = "one_time",
    _: dict = Depends(get_current_user),
):
    return {
        "distance_km": distance_km,
        **_cost_response(distance_km, vehicle_type, travelers, recurrence),
    }
