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

import os
from fastapi import HTTPException
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles

origins = settings.cors_origins_list
allow_all = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=not allow_all,
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


# Optional SPA static file serving (for single-service deployment)
frontend_dist = os.environ.get("FRONTEND_DIST")
if not frontend_dist:
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
        os.path.abspath(os.path.join(os.getcwd(), "dist")),
        os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
    ]
    for c in candidates:
        if os.path.isdir(c) and os.path.exists(os.path.join(c, "index.html")):
            frontend_dist = c
            break

if frontend_dist and os.path.isdir(frontend_dist):
    assets_path = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="frontend_assets")

    @app.get("/{catchall:path}", include_in_schema=False)
    async def serve_frontend(catchall: str):
        if catchall.startswith("api") or catchall in ("docs", "openapi.json", "redoc", "health"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, catchall)
        if catchall and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
