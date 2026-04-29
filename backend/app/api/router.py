from fastapi import APIRouter

from app.api.routes.goals import router as goals_router
from app.api.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(goals_router, tags=["goals"])
