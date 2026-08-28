"""Compatibility scoring engine.

Priority order, per product spec: Safety -> Route -> Time -> Reliability -> Cost.
Local match score weights are fixed by the spec:
    route 40% | time 25% | destination 15% | checkpoint 10% | reliability 10%
Everything here is pure (no DB); routers pass in the data. This keeps matching
usable with or without the optional AI assistant layer.
"""
from typing import List, Optional, Tuple

from . import cost as cost_svc
from .checkpoint import checkpoint_score, suggest_checkpoints
from .geo import Point, bearing_alignment, corridor_overlap_pct, haversine

WEIGHTS = {
    "route": 0.40,
    "time": 0.25,
    "destination": 0.15,
    "checkpoint": 0.10,
    "reliability": 0.10,
}

# Tunables per journey type.
PARAMS = {
    "local": {"buffer_km": 1.5, "dest_threshold_km": 2.5, "checkpoints": True},
    "long": {"buffer_km": 9.0, "dest_threshold_km": 20.0, "checkpoints": False},
}


def _to_min(hhmm: str) -> int:
    try:
        h, m = map(int, hhmm.split(":"))
        return h * 60 + m
    except (ValueError, AttributeError):
        return 8 * 60


def time_diff_minutes(t1: str, t2: str) -> int:
    d = abs(_to_min(t1) - _to_min(t2))
    return min(d, 24 * 60 - d)


def time_score(diff_min: int) -> float:
    if diff_min <= 5:
        return 100.0
    if diff_min >= 60:
        return 0.0
    return round(100.0 - (diff_min - 5) * (100.0 / 55.0), 1)


def destination_score(dist_km: float, threshold_km: float) -> float:
    return round(100.0 * max(0.0, 1 - dist_km / threshold_km), 1)


def route_score(corridor_pct: float, alignment: float) -> float:
    """Direction-aware route similarity: corridor overlap gated by heading match."""
    return round(corridor_pct * (0.15 + 0.85 * alignment / 100.0), 1)


def reliability_score(stats: dict, verification: dict) -> float:
    rating = float(stats.get("rating", 0) or 0)
    trips = int(stats.get("completed_trips", 0) or 0)
    cancel = float(stats.get("cancellation_rate", 0) or 0)
    base = (rating / 5.0) * 70
    experience = min(trips / 30.0, 1.0) * 15
    dependable = max(0.0, 1 - cancel) * 15
    score = base + experience + dependable
    if verification.get("identity"):
        score = min(100.0, score + 5)
    return round(min(100.0, score), 1)


def trust_level(stats: dict, verification: dict) -> str:
    verified = sum(1 for v in verification.values() if v)
    rating = float(stats.get("rating", 0) or 0)
    trips = int(stats.get("completed_trips", 0) or 0)
    if verified >= 3 and rating >= 4.5 and trips >= 10:
        return "High"
    if verified >= 2 and rating >= 4.0:
        return "Medium"
    return "New"


def _reasons(
    route: float,
    route_overlap_pct: int,
    diff_min: int,
    dest: float,
    host_stats: dict,
    host_ver: dict,
    checkpoint: Optional[dict],
) -> List[str]:
    out: List[str] = []
    if route >= 55:
        out.append(f"{route_overlap_pct}% route overlap")
    elif route >= 30:
        out.append("Partial route overlap")
    if diff_min <= 10:
        out.append(f"Departure time within {max(diff_min,1)} minutes")
    elif diff_min <= 25:
        out.append(f"{diff_min}-minute departure difference")
    if dest >= 80:
        out.append("Same destination area")
    if host_ver.get("identity"):
        out.append("Identity-verified partner")
    rating = float(host_stats.get("rating", 0) or 0)
    if rating >= 4.5:
        out.append(f"Highly rated traveller ({rating}★)")
    if checkpoint:
        far = max(checkpoint["distance_from_requester_km"], checkpoint["distance_from_host_km"])
        out.append(f"Safe checkpoint {checkpoint['name']} within {far} km")
    return out


def score_candidate(req: dict, journey: dict, user: dict, catalog: List[dict]) -> dict:
    jtype = journey.get("type", "local")
    params = PARAMS.get(jtype, PARAMS["local"])

    req_o: Point = (req["origin"]["lat"], req["origin"]["lng"])
    req_d: Point = (req["destination"]["lat"], req["destination"]["lng"])
    h_o: Point = (journey["origin"]["lat"], journey["origin"]["lng"])
    h_d: Point = (journey["destination"]["lat"], journey["destination"]["lng"])

    corridor = corridor_overlap_pct(req_o, req_d, h_o, h_d, params["buffer_km"])
    alignment = bearing_alignment(req_o, req_d, h_o, h_d)
    r_score = route_score(corridor, alignment)
    route_overlap_pct = int(round(r_score))

    diff_min = time_diff_minutes(req["departure_time"], journey["departure_time"])
    t_score = time_score(diff_min)

    dest_dist = haversine(req_d, h_d)
    d_score = destination_score(dest_dist, params["dest_threshold_km"])

    checkpoints: List[dict] = []
    best_cp: Optional[dict] = None
    if params["checkpoints"] and catalog:
        checkpoints = suggest_checkpoints(
            req_o, h_o, h_d, catalog, departure_time=journey.get("departure_time", "08:00")
        )
        best_cp = checkpoints[0] if checkpoints else None
    c_score = checkpoint_score(best_cp)

    stats = user.get("stats", {})
    ver = user.get("verification", {})
    rel_score = reliability_score(stats, ver)

    overall = (
        WEIGHTS["route"] * r_score
        + WEIGHTS["time"] * t_score
        + WEIGHTS["destination"] * d_score
        + WEIGHTS["checkpoint"] * c_score
        + WEIGHTS["reliability"] * rel_score
    )

    # Cost share estimate
    distance_km = journey.get("distance_km") or haversine(h_o, h_d)
    total = journey.get("estimated_cost_total") or cost_svc.estimate_trip_cost(
        distance_km, journey.get("vehicle_type", "car")
    )
    travelers = max(2, int(journey.get("group_current", 1)) + 1)
    est_share = cost_svc.per_person(total, travelers)

    return {
        "score": int(round(overall)),
        "breakdown": {
            "route": r_score,
            "time": t_score,
            "destination": d_score,
            "checkpoint": c_score,
            "reliability": rel_score,
        },
        "reasons": _reasons(r_score, route_overlap_pct, diff_min, d_score, stats, ver, best_cp),
        "route_overlap_pct": route_overlap_pct,
        "departure_diff_min": diff_min,
        "estimated_share": est_share,
        "suggested_checkpoint": best_cp,
        "alternative_checkpoints": checkpoints[1:] if checkpoints else [],
    }


def rank_candidates(
    req: dict, candidates: List[Tuple[dict, dict]], catalog: List[dict]
) -> List[dict]:
    """candidates: list of (journey, host_user). Returns scored, sorted desc."""
    scored = []
    for journey, user in candidates:
        s = score_candidate(req, journey, user, catalog)
        scored.append((journey, user, s))
    scored.sort(key=lambda x: x[2]["score"], reverse=True)
    return [
        {"journey": j, "partner": u, **s} for j, u, s in scored
    ]
