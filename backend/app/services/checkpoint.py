"""Safe common checkpoint suggestion for Local Travel.

Given two travellers' approximate pickup areas and a shared destination, pick
public landmarks (metro/bus stops, college gates, malls, petrol pumps,
intersections) that are easy and safe for BOTH to reach with minimal detour.
Exact home addresses are never used or revealed.
"""
from typing import List, Optional

from .geo import Point, haversine


def _add_minutes(hhmm: str, minutes: int) -> str:
    try:
        h, m = map(int, hhmm.split(":"))
    except (ValueError, AttributeError):
        return hhmm
    total = (h * 60 + m + minutes) % (24 * 60)
    return f"{total // 60:02d}:{total % 60:02d}"


def _eta(req_origin: Point, host_origin: Point, cp: Point, departure_time: str) -> str:
    # ~20 km/h effective local speed; meeting = later traveller's arrival.
    speed = 20.0
    minutes = int(max(haversine(req_origin, cp), haversine(host_origin, cp)) / speed * 60)
    return _add_minutes(departure_time, minutes)


def suggest_checkpoints(
    req_origin: Point,
    host_origin: Point,
    destination: Point,
    catalog: List[dict],
    departure_time: str = "08:00",
    max_reach_km: float = 5.0,
    top: int = 4,
) -> List[dict]:
    """Return ranked checkpoint suggestions (dicts matching CheckpointSuggestion)."""
    d_req_dest = haversine(req_origin, destination)
    scored = []
    for cp in catalog:
        cpp: Point = (cp["lat"], cp["lng"])
        d_req = haversine(req_origin, cpp)
        d_host = haversine(host_origin, cpp)
        if d_req > max_reach_km or d_host > max_reach_km:
            continue
        d_cp_dest = haversine(cpp, destination)
        detour = max(0.0, (d_req + d_cp_dest) - d_req_dest)
        balance = abs(d_req - d_host)
        safety = float(cp.get("safety_score", 0.9))
        # Lower cost = better. Reward proximity to both, balance, minimal detour, safety.
        cost = (d_req + d_host) + detour * 1.3 + balance * 0.8 - safety * 2.0
        scored.append((cost, cp, d_req, d_host, detour))

    scored.sort(key=lambda x: x[0])
    suggestions: List[dict] = []
    for cost, cp, d_req, d_host, detour in scored[:top]:
        cpp = (cp["lat"], cp["lng"])
        suggestions.append(
            {
                "id": cp["_id"],
                "name": cp["name"],
                "type": cp.get("type", "landmark"),
                "lat": cp["lat"],
                "lng": cp["lng"],
                "distance_from_requester_km": round(d_req, 1),
                "distance_from_host_km": round(d_host, 1),
                "detour_km": round(detour, 1),
                "eta": _eta(req_origin, host_origin, cpp, departure_time),
                "safety_score": round(float(cp.get("safety_score", 0.9)), 2),
            }
        )
    return suggestions


def checkpoint_score(suggestion: Optional[dict]) -> float:
    """0-100 quality of the best checkpoint (closer + balanced + low detour)."""
    if not suggestion:
        return 55.0  # neutral when no public checkpoint is nearby
    d_req = suggestion["distance_from_requester_km"]
    d_host = suggestion["distance_from_host_km"]
    detour = suggestion.get("detour_km", 0)
    reach = max(0.0, 1 - (max(d_req, d_host) / 3.0))     # both within ~3km ideal
    balance = max(0.0, 1 - (abs(d_req - d_host) / 3.0))
    low_detour = max(0.0, 1 - (detour / 3.0))
    return round(100 * (0.5 * reach + 0.2 * balance + 0.3 * low_detour), 1)
