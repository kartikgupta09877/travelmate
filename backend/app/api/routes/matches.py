"""Partner search, join requests, acceptance, and safe-checkpoint selection.

Exact meeting details are only attached to a Trip once BOTH sides accept; until
then only an approximate public checkpoint is shared.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import new_id, serialize, utcnow
from app.db.repo import public_user, users_public_map
from app.schemas.match import MatchOut, MatchRequest, PartnerResult
from app.schemas.journey import PartnerSearchQuery
from app.services import cost as cost_svc
from app.services.checkpoint import suggest_checkpoints
from app.services.matching import rank_candidates, score_candidate

router = APIRouter(prefix="/matches", tags=["matching"])


async def _catalog() -> list:
    return [doc async for doc in get_database().checkpoints.find({})]


async def _hydrate_journey(doc: dict) -> dict:
    out = serialize(doc)
    host = await get_database().users.find_one({"_id": doc["host_id"]})
    out["host"] = public_user(host) if host else None
    return out


async def _candidate_query(req_type: str, me: dict) -> list:
    db = get_database()
    blocked = set(me.get("blocked_user_ids", []))
    query = {"type": req_type, "status": {"$in": ["open"]}, "host_id": {"$ne": me["_id"]}}
    out = []
    async for j in db.journeys.find(query):
        if j["host_id"] in blocked:
            continue
        has_room = j.get("available_seats", 0) > 0 or (
            (j.get("group_capacity") or 0) > j.get("group_current", 1)
        )
        if not has_room:
            continue
        host = await db.users.find_one({"_id": j["host_id"]})
        if not host or host.get("suspended") or me["_id"] in host.get("blocked_user_ids", []):
            continue
        out.append((j, host))
    return out


@router.post("/search", response_model=List[PartnerResult])
async def search_partners(body: PartnerSearchQuery, me: dict = Depends(get_current_user)):
    candidates = await _candidate_query(body.type.value, me)
    catalog = await _catalog()
    req = {
        "origin": body.origin.model_dump(),
        "destination": body.destination.model_dump(),
        "departure_time": body.departure_time,
        "type": body.type.value,
    }
    ranked = rank_candidates(req, candidates, catalog)
    results: List[dict] = []
    for r in ranked:
        journey = await _hydrate_journey(r["journey"])
        results.append(
            {
                "journey": journey,
                "partner": public_user(r["partner"]),
                "score": r["score"],
                "breakdown": r["breakdown"],
                "reasons": r["reasons"],
                "route_overlap_pct": r["route_overlap_pct"],
                "departure_diff_min": r["departure_diff_min"],
                "estimated_share": r["estimated_share"],
                "suggested_checkpoint": r["suggested_checkpoint"],
                "alternative_checkpoints": r["alternative_checkpoints"],
            }
        )
    return results


async def _hydrate_match(doc: dict) -> dict:
    out = serialize(doc)
    partner_id = doc["host_id"]
    partner = await get_database().users.find_one({"_id": partner_id})
    out["partner"] = public_user(partner) if partner else None
    return out


@router.post("/request", response_model=MatchOut, status_code=201)
async def request_join(body: MatchRequest, me: dict = Depends(get_current_user)):
    db = get_database()
    journey = await db.journeys.find_one({"_id": body.journey_id})
    if not journey:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Journey not found")
    if journey["host_id"] == me["_id"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot join your own journey")
    host = await db.users.find_one({"_id": journey["host_id"]})

    req_ctx = {
        "origin": body.origin or journey["origin"],
        "destination": body.destination or journey["destination"],
        "departure_time": body.departure_time or journey["departure_time"],
        "type": journey["type"],
    }
    catalog = await _catalog()
    scored = score_candidate(req_ctx, journey, host, catalog)

    match = {
        "_id": new_id(),
        "requester_id": me["_id"],
        "host_id": journey["host_id"],
        "journey_id": journey["_id"],
        "score": scored["score"],
        "breakdown": scored["breakdown"],
        "reasons": scored["reasons"],
        "suggested_checkpoint": scored["suggested_checkpoint"],
        "alternative_checkpoints": scored["alternative_checkpoints"],
        "requester_context": req_ctx,
        "message": body.message,
        "status": "requested",
        "created_at": utcnow(),
    }
    await db.matches.insert_one(match)
    return await _hydrate_match(match)


@router.get("", response_model=List[MatchOut])
async def list_matches(box: str = "incoming", me: dict = Depends(get_current_user)):
    """box=incoming (requests to my journeys) | outgoing (my requests)."""
    field = "host_id" if box == "incoming" else "requester_id"
    cursor = get_database().matches.find({field: me["_id"]}).sort("created_at", -1)
    out = []
    async for doc in cursor:
        other_id = doc["requester_id"] if box == "incoming" else doc["host_id"]
        partner = await get_database().users.find_one({"_id": other_id})
        item = serialize(doc)
        item["partner"] = public_user(partner) if partner else None
        out.append(item)
    return out


@router.post("/{match_id}/checkpoint", response_model=MatchOut)
async def choose_checkpoint(match_id: str, checkpoint_id: str, me: dict = Depends(get_current_user)):
    db = get_database()
    match = await db.matches.find_one({"_id": match_id})
    if not match or me["_id"] not in (match["requester_id"], match["host_id"]):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    options = ([match.get("suggested_checkpoint")] or []) + (match.get("alternative_checkpoints") or [])
    chosen = next((c for c in options if c and c.get("id") == checkpoint_id), None)
    if not chosen:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Checkpoint not among suggestions")
    rest = [c for c in options if c and c.get("id") != checkpoint_id]
    await db.matches.update_one(
        {"_id": match_id},
        {"$set": {"suggested_checkpoint": chosen, "alternative_checkpoints": rest}},
    )
    return await _hydrate_match(await db.matches.find_one({"_id": match_id}))


@router.post("/{match_id}/decline", response_model=MatchOut)
async def decline(match_id: str, me: dict = Depends(get_current_user)):
    db = get_database()
    match = await db.matches.find_one({"_id": match_id})
    if not match or match["host_id"] != me["_id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    await db.matches.update_one({"_id": match_id}, {"$set": {"status": "declined"}})
    return await _hydrate_match(await db.matches.find_one({"_id": match_id}))


@router.post("/{match_id}/accept", response_model=MatchOut)
async def accept(match_id: str, me: dict = Depends(get_current_user)):
    db = get_database()
    match = await db.matches.find_one({"_id": match_id})
    if not match or match["host_id"] != me["_id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Only the host can accept this request")
    if match["status"] in ("accepted", "confirmed"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Already accepted")
    journey = await db.journeys.find_one({"_id": match["journey_id"]})

    # Build the confirmed trip (exact meeting point now revealed to both).
    participants = [match["requester_id"], match["host_id"]]
    travelers = len(participants)
    costs = cost_svc.cost_breakdown(
        journey.get("distance_km", 0),
        journey.get("vehicle_type", "none"),
        travelers,
        total_cost=journey.get("estimated_cost_total"),
    )
    conv_id = new_id()
    trip = {
        "_id": new_id(),
        "journey_id": journey["_id"],
        "section": journey["type"],
        "host_id": match["host_id"],
        "participant_ids": participants,
        "origin": journey["origin"],
        "destination": journey["destination"],
        "date": journey.get("date"),
        "departure_time": journey["departure_time"],
        "meeting_point": match.get("suggested_checkpoint"),
        "cost_per_person": costs["per_person_cost"],
        "total_cost": costs["shared_travel_cost"],
        **costs,
        "distance_km": journey.get("distance_km", 0),
        "duration_min": journey.get("duration_min", 0),
        "status": "confirmed",
        "conversation_id": conv_id,
        "created_at": utcnow(),
    }
    await db.trips.insert_one(trip)
    await db.conversations.insert_one(
        {
            "_id": conv_id,
            "trip_id": trip["_id"],
            "participant_ids": participants,
            "last_message": "You're matched. Say hello and confirm your meeting point.",
            "updated_at": utcnow(),
        }
    )
    await db.messages.insert_one(
        {
            "_id": new_id(),
            "conversation_id": conv_id,
            "sender_id": "system",
            "text": "Match confirmed. Meeting point and departure time are now shared with both travellers.",
            "kind": "system",
            "created_at": utcnow(),
        }
    )
    # Update journey capacity.
    new_current = journey.get("group_current", 1) + 1
    new_seats = max(0, journey.get("available_seats", 1) - 1)
    updates = {"group_current": new_current, "available_seats": new_seats}
    if new_seats == 0 or new_current >= (journey.get("group_capacity") or new_current):
        updates["status"] = "full"
    await db.journeys.update_one({"_id": journey["_id"]}, {"$set": updates})
    await db.matches.update_one(
        {"_id": match_id}, {"$set": {"status": "accepted", "trip_id": trip["_id"]}}
    )
    return await _hydrate_match(await db.matches.find_one({"_id": match_id}))
