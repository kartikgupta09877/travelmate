"""Personal dashboard metrics."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import serialize
from app.db.repo import public_user, users_public_map
from app.services import cost as cost_svc

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _is_this_month(dt) -> bool:
    if not isinstance(dt, datetime):
        return False
    now = datetime.now(timezone.utc)
    return dt.year == now.year and dt.month == now.month


@router.get("")
async def dashboard(me: dict = Depends(get_current_user)):
    db = get_database()
    trips = [t async for t in db.trips.find({"participant_ids": me["_id"]})]

    saved_total = 0.0
    saved_month = 0.0
    dist_total = 0.0
    co2_total = 0.0
    trips_month = 0
    partners: set = set()
    upcoming = None

    for t in trips:
        travelers = max(1, len(t.get("participant_ids", [])))
        saving = max(0, (t.get("total_cost", 0) or 0) - (t.get("cost_per_person", 0) or 0))
        saved_total += saving
        dist_total += t.get("distance_km", 0) or 0
        co2_total += (t.get("distance_km", 0) or 0) * 0.135 * max(0, travelers - 1)
        for pid in t.get("participant_ids", []):
            if pid != me["_id"]:
                partners.add(pid)
        if _is_this_month(t.get("created_at")):
            trips_month += 1
            saved_month += saving
        if t.get("status") in ("confirmed", "accepted", "pending") and upcoming is None:
            upcoming = t

    upcoming_out = None
    if upcoming:
        pmap = await users_public_map(upcoming.get("participant_ids", []))
        upcoming_out = serialize(upcoming)
        upcoming_out["participants"] = [
            pmap[i] for i in upcoming.get("participant_ids", []) if i in pmap
        ]

    return {
        "money_saved_month": round(saved_month),
        "money_saved_total": round(saved_total),
        "shared_trips_month": trips_month,
        "shared_distance_km": round(dist_total, 1),
        "co2_reduced_kg": round(co2_total, 1),
        "travel_partners": len(partners),
        "average_rating": me.get("stats", {}).get("rating", 0.0),
        "monthly_trip_count": len(trips),
        "upcoming_trip": upcoming_out,
        "next_match": None,
    }
