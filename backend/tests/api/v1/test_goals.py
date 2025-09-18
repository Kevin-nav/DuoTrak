import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import models
from app.schemas.user import AccountStatus
from tests.api.v1.test_invitations_and_status import get_authenticated_client

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

async def test_create_onboarding_goal(
    client: AsyncClient,
    db_session: AsyncSession,
    user_onboarding_partnered: models.User, # Uses the new fixture
):
    """
    Tests creating the first goal and task during onboarding.
    """
    # 1. Authenticate as the user in the ONBOARDING_PARTNERED state
    authed_client = await get_authenticated_client(client, user_onboarding_partnered, db_session)

    # 2. Define the goal and task payload
    payload = {
        "goal": {
            "title": "Our First Goal",
            "description": "This is the description for our first goal.",
            "status": "in_progress",
        },
        "task": {
            "title": "Our First Task",
            "description": "This is the description for our first task.",
            "due_date": "2025-12-31T23:59:59.999Z",
        }
    }

    # 3. Call the endpoint
    response = await authed_client.post("/api/v1/goals/onboarding", json=payload)

    # 4. Assert success and data correctness
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Our First Goal"
    assert data["user_id"] == str(user_onboarding_partnered.id)
    assert len(data["tasks"]) == 1
    assert data["tasks"][0]["title"] == "Our First Task"

    # 5. Verify objects in DB
    goal_in_db = await db_session.get(models.Goal, data["id"])
    assert goal_in_db is not None
    await db_session.refresh(goal_in_db, ["tasks"])
    assert len(goal_in_db.tasks) == 1
    assert goal_in_db.tasks[0].title == "Our First Task"
