"""TravelMate API entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.api.routes import (
    admin,
    assistant,
    auth,
    dashboard,
    journeys,
    matches,
    messages,
    reviews,
    safety,
    trips,
    users,
)

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    if settings.seed_on_startup:
        from app.db.seed import seed_if_empty

        await seed_if_empty()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Verified travel-partner & cost-sharing platform API.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = settings.api_prefix
for module in (
    auth,
    users,
    journeys,
    matches,
    trips,
    messages,
    reviews,
    safety,
    admin,
    dashboard,
    assistant,
):
    app.include_router(module.router, prefix=API)


@app.get("/health", tags=["meta"])
@app.get(f"{API}/health", tags=["meta"])
async def health():
    return {"status": "ok", "app": settings.app_name, "mock_db": settings.use_mock_db}
