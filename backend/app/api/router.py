from fastapi import APIRouter

from app.api.routes.chat import router as chat_router
from app.api.routes.goals import router as goals_router
from app.api.routes.health import router as health_router
from app.api.routes.prices import router as prices_router
from app.api.routes.sessions import router as sessions_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(goals_router, tags=["goals"])
api_router.include_router(sessions_router, tags=["sessions"])
api_router.include_router(prices_router, tags=["prices"])
api_router.include_router(chat_router, tags=["chat"])
