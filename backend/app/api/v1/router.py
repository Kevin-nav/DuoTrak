from fastapi import APIRouter
from app.api.v1.endpoints import (
    agent_crew,
    auth,
    goal_creation,
    goals,
    partner_invitations,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(
    partner_invitations.router,
    prefix="/partner-invitations",
    tags=["partner-invitations"],
)
api_router.include_router(
    goal_creation.router,
    prefix="/goal-creation",
    tags=["goal-creation"],
)
api_router.include_router(
    agent_crew.router,
    prefix="/agent-crew",
    tags=["deprecated-agent-crew"],
)
