from typing import Any, Optional

from app.ai.langgraph_goal_pipeline import LangGraphGoalPipeline
from app.services.duotrak_crew_orchestrator import DuotrakCrewOrchestrator
from app.services.goal_creation_session_store import GoalCreationSessionStore
from app.core.redis_config import redis_client


def create_orchestrator(
    settings: Any,
    pinecone_service: Any,
    gemini_config: Any,
    session_store: Optional[GoalCreationSessionStore] = None,
):
    ttl = int(getattr(settings, "GOAL_CREATION_SESSION_TTL_SECONDS", 900))
    resolved_store = session_store or GoalCreationSessionStore(
        redis_client=redis_client,
        default_ttl_seconds=ttl,
    )

    selected = str(getattr(settings, "AI_ORCHESTRATOR", "crewai")).strip().lower()
    if selected == "langgraph":
        return LangGraphGoalPipeline(
            pinecone_service=pinecone_service,
            session_store=resolved_store,
            session_ttl_seconds=ttl,
        )

    return DuotrakCrewOrchestrator(
        pinecone_service=pinecone_service,
        gemini_config=gemini_config,
        session_store=resolved_store,
        session_ttl_seconds=ttl,
    )
