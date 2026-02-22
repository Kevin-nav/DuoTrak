import asyncio
import time

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import goal_creation
from app.ai.shadow_runner import ShadowRunner
from app.core.config import settings


class FastPrimaryOrchestrator:
    async def generate_strategic_questions(self, user_id: str, session_id: str, wizard_data, user_context):
        _ = user_id, session_id, wizard_data, user_context
        return {
            "user_profile_summary": {
                "archetype": "Steady Climber",
                "key_motivators": ["Health"],
                "risk_factors": ["Time management"],
                "confidence_level": 0.7,
            },
            "questions": [
                {
                    "question": "What is your first action?",
                    "question_key": "first_action",
                    "context": "Immediate momentum",
                    "suggested_answers": ["Schedule workout", "Prepare gear"],
                    "allow_custom_answer": True,
                }
            ],
            "execution_time_ms": 1.0,
        }


class SlowShadowOrchestrator:
    async def generate_strategic_questions(self, user_id: str, session_id: str, wizard_data, user_context):
        _ = user_id, session_id, wizard_data, user_context
        await asyncio.sleep(0.35)
        return {"user_profile_summary": {}, "questions": []}


class FakePineconeService:
    async def get_user_context(self, user_id: str):
        _ = user_id
        return {"historical_goals": []}


@pytest.mark.asyncio
async def test_shadow_mode_does_not_block_primary_response(monkeypatch):
    app = FastAPI()
    app.include_router(goal_creation.router, prefix="/api/v1/goal-creation")

    monkeypatch.setattr(goal_creation, "duotrak_orchestrator", FastPrimaryOrchestrator())
    monkeypatch.setattr(goal_creation, "pinecone_service", FakePineconeService())
    monkeypatch.setattr(
        goal_creation,
        "shadow_runner",
        ShadowRunner(enabled=True, shadow_orchestrator=SlowShadowOrchestrator()),
    )

    payload = {
        "user_id": "u1",
        "wizard_data": {
            "goal_description": "Run a 5k",
            "motivation": "Improve fitness",
            "availability": ["weekday mornings"],
            "time_commitment": "3h/week",
            "accountability_type": "visual_proof",
        },
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        start = time.perf_counter()
        response = await client.post(
            "/api/v1/goal-creation/questions",
            headers={"X-Internal-API-Key": settings.INTERNAL_API_SECRET},
            json=payload,
        )
        elapsed = time.perf_counter() - start

    assert response.status_code == 200
    assert elapsed < 0.30
