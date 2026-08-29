"""AI Match Assistant endpoint (thin wrapper over the matching engine)."""
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.database import get_database
from app.db.repo import public_user
from app.schemas.common import GeoPoint
from app.schemas.match import PartnerResult
from app.services import ai_assistant
from app.services.matching import rank_candidates
from app.api.routes.matches import _candidate_query, _catalog, _hydrate_journey

router = APIRouter(prefix="/assistant", tags=["assistant"])


class AssistantQuery(BaseModel):
    message: str
    origin: Optional[GeoPoint] = None
    destination: Optional[GeoPoint] = None


@router.post("/match")
async def assistant_match(body: AssistantQuery, me: dict = Depends(get_current_user)):
    parsed = ai_assistant.parse_request(body.message)

    # Fall back to the user's most recent journey for origin/destination.
    origin = body.origin.model_dump() if body.origin else None
    destination = body.destination.model_dump() if body.destination else None
    if not origin or not destination:
        recent = await get_database().journeys.find_one(
            {"host_id": me["_id"]}, sort=[("created_at", -1)]
        )
        if recent:
            origin = origin or recent["origin"]
            destination = destination or recent["destination"]

    results: List[dict] = []
    if origin and destination:
        candidates = await _candidate_query(parsed["type"], me)
        catalog = await _catalog()
        req = {
            "origin": origin,
            "destination": destination,
            "departure_time": parsed["departure_time"],
            "type": parsed["type"],
        }
        ranked = rank_candidates(req, candidates, catalog)[:5]
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

    return {
        "understood": parsed,
        "explanation": ai_assistant.explain(results[0] if results else None),
        "results": results,
    }
