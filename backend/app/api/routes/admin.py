"""Admin / moderation dashboard endpoints (role-guarded)."""
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_admin_user
from app.core.database import get_database
from app.core.utils import serialize, utcnow
from app.db.repo import public_user
from app.schemas.dashboard import AdminStats
from app.schemas.report import ReportOut, ReportUpdate
from app.schemas.user import UserPublic

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_admin_user)])


@router.get("/stats", response_model=AdminStats)
async def admin_stats():
    db = get_database()
    users = [u async for u in db.users.find({})]
    verified = sum(1 for u in users if u.get("verification", {}).get("identity"))
    pending = sum(1 for u in users if u.get("verification_pending"))
    active_journeys = await db.journeys.count_documents({"status": {"$in": ["open", "full"]}})
    completed = await db.trips.count_documents({"status": "completed"})
    total_trips = await db.trips.count_documents({})
    reported = len({r["reported_user_id"] async for r in db.reports.find({"status": "open"})})
    saved = 0.0
    async for t in db.trips.find({}):
        saved += max(0, (t.get("total_cost", 0) or 0) - (t.get("cost_per_person", 0) or 0))
    return AdminStats(
        total_users=len(users),
        verified_users=verified,
        active_journeys=active_journeys,
        completed_journeys=completed,
        reported_users=reported,
        pending_verification=pending,
        total_shared_trips=total_trips,
        money_saved_total=round(saved),
    )


@router.get("/users", response_model=List[UserPublic])
async def list_users(q: Optional[str] = None):
    db = get_database()
    query = {}
    if q:
        query = {"$or": [{"full_name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]}
    return [public_user(u) async for u in db.users.find(query)]


class VerificationSet(BaseModel):
    channel: str
    value: bool = True


@router.post("/users/{user_id}/verification", response_model=UserPublic)
async def set_verification(user_id: str, body: VerificationSet):
    db = get_database()
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {f"verification.{body.channel}": body.value, "updated_at": utcnow()},
            "$unset": {f"verification_pending.{body.channel}": ""},
        },
    )
    return public_user(await db.users.find_one({"_id": user_id}))


class SuspendBody(BaseModel):
    suspended: bool = True


@router.post("/users/{user_id}/suspend", response_model=UserPublic)
async def suspend_user(user_id: str, body: SuspendBody):
    db = get_database()
    await db.users.update_one({"_id": user_id}, {"$set": {"suspended": body.suspended}})
    return public_user(await db.users.find_one({"_id": user_id}))


@router.get("/reports", response_model=List[ReportOut])
async def list_reports(status_filter: Optional[str] = None):
    db = get_database()
    query = {"status": status_filter} if status_filter else {}
    out = []
    async for doc in db.reports.find(query).sort("created_at", -1):
        item = serialize(doc)
        reported = await db.users.find_one({"_id": doc["reported_user_id"]})
        item["reported_user"] = public_user(reported) if reported else None
        out.append(item)
    return out


@router.post("/reports/{report_id}", response_model=ReportOut)
async def update_report(report_id: str, body: ReportUpdate):
    db = get_database()
    await db.reports.update_one(
        {"_id": report_id},
        {"$set": {"status": body.status.value, "admin_notes": body.admin_notes}},
    )
    doc = await db.reports.find_one({"_id": report_id})
    item = serialize(doc)
    reported = await db.users.find_one({"_id": doc["reported_user_id"]})
    item["reported_user"] = public_user(reported) if reported else None
    return item
