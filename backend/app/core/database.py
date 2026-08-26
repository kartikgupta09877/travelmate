"""MongoDB access.

Uses Motor (async driver) against a real MongoDB when USE_MOCK_DB is false,
and mongomock-motor (in-memory, same async API) when true. This keeps the
whole app genuinely "wired" to Mongo while remaining runnable with zero infra.
"""
import logging
from typing import Optional

from .config import settings

logger = logging.getLogger("travelmate.db")


class _Database:
    client = None
    db = None


_state = _Database()

# Collection names used across the app
COLLECTIONS = [
    "users",
    "journeys",
    "matches",
    "trips",
    "conversations",
    "messages",
    "reviews",
    "reports",
    "checkpoints",
]


def _create_client():
    if settings.use_mock_db:
        from mongomock_motor import AsyncMongoMockClient

        logger.info("Using in-memory mongomock database (USE_MOCK_DB=true)")
        return AsyncMongoMockClient()
    from motor.motor_asyncio import AsyncIOMotorClient

    logger.info("Connecting to MongoDB at %s", settings.mongodb_uri)
    return AsyncIOMotorClient(settings.mongodb_uri, uuidRepresentation="standard")


async def connect_to_mongo() -> None:
    _state.client = _create_client()
    _state.db = _state.client[settings.mongodb_db]
    # Best-effort indexes (mongomock supports a subset).
    try:
        await _state.db.users.create_index("email", unique=True)
        await _state.db.journeys.create_index([("type", 1), ("status", 1)])
        await _state.db.messages.create_index("conversation_id")
    except Exception as exc:  # pragma: no cover - index creation is non-critical
        logger.warning("Index creation skipped: %s", exc)


async def close_mongo_connection() -> None:
    if _state.client is not None:
        close = getattr(_state.client, "close", None)
        if callable(close):
            try:
                close()
            except Exception:
                pass
    _state.client = None
    _state.db = None


def get_database():
    if _state.db is None:
        raise RuntimeError("Database not initialised. Call connect_to_mongo() first.")
    return _state.db
