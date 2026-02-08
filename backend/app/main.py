from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.base import Base
from app.db.session import engine
from app.routers import courses, health, lectures, thinkers

# Ensure all models are imported so Base.metadata knows about them
import app.models.thinker  # noqa: F401
import app.models.discipline  # noqa: F401
import app.models.course  # noqa: F401
import app.models.lecture  # noqa: F401


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Create tables on startup (safe no-op if they already exist)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="Synthetic Symposium",
        description="AI-powered lectures from history's greatest minds",
        version="0.1.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(health.router)
    application.include_router(thinkers.router)
    application.include_router(courses.router)
    application.include_router(lectures.router)

    return application


app = create_app()
