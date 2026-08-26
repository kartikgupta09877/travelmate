"""Small shared helpers."""
from datetime import datetime, timezone
from uuid import uuid4


def new_id() -> str:
    return str(uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def serialize(doc: dict) -> dict:
    """Return a copy of a Mongo doc with _id mapped to id."""
    if not doc:
        return doc
    out = dict(doc)
    if "_id" in out:
        out["id"] = out.pop("_id")
    return out
