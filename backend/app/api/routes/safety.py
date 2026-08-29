"""Safety features: report, SOS, share-trip-with-contact.

IMPORTANT: SOS does not replace emergency services. We surface local emergency
numbers and, in production, would notify the user's trusted contacts.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.database import get_database
from app.core.utils import new_id, serialize, utcnow
from app.schemas.report import ReportCreate, ReportOut

router = APIRouter(prefix="/safety", tags=["safety"])

EMERGENCY_DISCLAIMER = (
    "TravelMate does not replace emergency services. If you are in immediate "
    "danger, call your local emergency number right away."
)


@router.post("/report", response_model=ReportOut, status_code=201)
async def report_user(body: ReportCreate, me: dict = Depends(get_current_user)):
    db = get_database()
    if body.reported_user_id == me["_id"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot report yourself")
    report = {
        "_id": new_id(),
        "reporter_id": me["_id"],
        "reported_user_id": body.reported_user_id,
        "trip_id": body.trip_id,
        "reason": body.reason,
        "details": body.details,
        "status": "open",
        "admin_notes": None,
        "created_at": utcnow(),
    }
    await db.reports.insert_one(report)
    return serialize(report)


class SosBody(BaseModel):
    trip_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    note: Optional[str] = None


@router.post("/sos")
async def sos(body: SosBody, me: dict = Depends(get_current_user)):
    db = get_database()
    event = {
        "_id": new_id(),
        "user_id": me["_id"],
        "trip_id": body.trip_id,
        "lat": body.lat,
        "lng": body.lng,
        "note": body.note,
        "created_at": utcnow(),
    }
    await db.sos_events.insert_one(event)
    return {
        "status": "logged",
        "id": event["_id"],
        "disclaimer": EMERGENCY_DISCLAIMER,
        "emergency_numbers": {"police": "112", "ambulance": "108", "women_helpline": "1091"},
        "message": "Your live location has been recorded and your trusted contacts would be notified.",
    }


class ShareBody(BaseModel):
    trip_id: str
    contact_name: Optional[str] = None


@router.post("/share")
async def share_trip(body: ShareBody, me: dict = Depends(get_current_user)):
    db = get_database()
    trip = await db.trips.find_one({"_id": body.trip_id})
    if not trip or me["_id"] not in trip.get("participant_ids", []):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    token = new_id()
    await db.trips.update_one({"_id": body.trip_id}, {"$addToSet": {"share_tokens": token}})
    return {
        "share_url": f"/shared-trip/{token}",
        "shared_with": body.contact_name,
        "note": "Anyone with this link can follow this trip's status and meeting point.",
    }
