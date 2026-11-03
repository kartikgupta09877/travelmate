"""Thin data-access helpers shared by routers.

Centralises the public-shape projection of a user so we never leak sensitive
fields (password hash, raw contact details, blocked lists) to other members.
"""
from typing import Dict, List, Optional

from app.core.database import get_database
from app.services.geo import approximate_coord
from app.services.matching import trust_level


def public_user(doc: dict) -> Optional[dict]:
    """Project a user document to its public, privacy-safe shape."""
    if not doc:
        return None
    stats = doc.get("stats", {})
    ver = doc.get("verification", {})
    return {
        "id": doc["_id"],
        "full_name": doc.get("full_name", ""),
        "photo_url": doc.get("photo_url"),
        "city": doc.get("city", ""),
        "bio": doc.get("bio"),
        "role": doc.get("role", "user"),
        "preferred_travel_type": doc.get("preferred_travel_type"),
        "college_or_company": doc.get("college_or_company"),
        "vehicle": doc.get("vehicle", {"type": "none", "seats": 0}),
        "verification": {
            "email": ver.get("email", False),
            "phone": ver.get("phone", False),
            "identity": ver.get("identity", False),
            "college": ver.get("college", False),
            "vehicle": ver.get("vehicle", False),
        },
        "stats": stats,
        "trust_level": trust_level(stats, ver),
    }


def private_profile(doc: dict) -> dict:
    """Public shape plus fields the owner is allowed to see about themselves."""
    pub = public_user(doc) or {}
    pub.update(
        {
            "email": doc.get("email"),
            "phone": doc.get("phone"),
            "blocked_user_ids": doc.get("blocked_user_ids", []),
        }
    )
    return pub


def public_geopoint(point: Optional[dict]) -> Optional[dict]:
    """Coarsen a stored origin/destination for any viewer who is not its owner.

    Exact coordinates must never leave the server for another member. We round
    lat/lng to the public grid (~1.1 km) and mark the point ``approximate`` so
    clients render an area rather than a precise pin. The human-readable
    ``label``/``zone`` (already public area names) are preserved so the map and
    route line keep working. Returns the value unchanged when it is falsy.
    """
    if not point:
        return point
    out = dict(point)
    if out.get("lat") is not None:
        out["lat"] = approximate_coord(out["lat"])
    if out.get("lng") is not None:
        out["lng"] = approximate_coord(out["lng"])
    out["approximate"] = True
    return out


async def get_user(user_id: str) -> Optional[dict]:
    return await get_database().users.find_one({"_id": user_id})


async def users_public_map(ids: List[str]) -> Dict[str, dict]:
    if not ids:
        return {}
    db = get_database()
    cursor = db.users.find({"_id": {"$in": list(set(ids))}})
    out: Dict[str, dict] = {}
    async for doc in cursor:
        out[doc["_id"]] = public_user(doc)
    return out
