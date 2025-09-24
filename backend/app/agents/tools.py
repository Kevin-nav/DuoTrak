# backend/app/agents/tools.py

from typing import Dict, Any
from app.services.pinecone_service import pinecone_service
from app.services.embedding_service import embedding_service
from app.db.session import engine # Import engine directly
from app.db.models import UserBehavioralMetrics
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession

async def get_user_profile(user_id: str, goal_context: str) -> Dict[str, Any]:
    """
    Retrieves a comprehensive user profile by combining semantic search
    of behavioral history with the latest calculated metrics.
    """
    print(f"TOOL: getUserProfile called for user {user_id} with context '{goal_context}'")

    # 1. Embed the goal context to create a query vector
    query_vector = await embedding_service.embed_query(goal_context)

    # 2. Query Pinecone for relevant snapshots using the vector
    relevant_snapshots = pinecone_service.query_relevant_snapshots(user_id, query_vector)
    
    # 3. Get the latest calculated metrics from PostgreSQL
    async_session_factory = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session_factory() as db:
        stmt = select(UserBehavioralMetrics).where(UserBehavioralMetrics.user_id == user_id)
        result = await db.execute(stmt)
        latest_metrics = result.scalars().first()

    # 3. Combine and format the data
    profile = {
        "archetype": latest_metrics.archetype if latest_metrics else "Newcomer",
        "procrastination_index": {
            "value": latest_metrics.procrastination_index if latest_metrics else 0,
            "rubric": "Value is average hours between task due and completion. < 2 is proactive."
        },
        "time_of_day_success": latest_metrics.time_of_day_success if latest_metrics else {},
        "relevant_history": [snapshot.get('text', '') for snapshot in relevant_snapshots]
    }

    return profile
