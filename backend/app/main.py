from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import courses, health, lectures, thinkers


def create_app() -> FastAPI:
    application = FastAPI(
        title="Synthetic Symposium",
        description="AI-powered lectures from history's greatest minds",
        version="0.1.0",
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
