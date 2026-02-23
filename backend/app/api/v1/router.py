from fastapi import APIRouter
from app.api.v1.endpoints import (
    chat,
    goal_creation,
)

api_router = APIRouter()
api_router.include_router(
    goal_creation.router,
    prefix="/goal-creation",
    tags=["goal-creation"],
)
api_router.include_router(
    chat.router,
    prefix="/chat",
    tags=["chat"],
)
