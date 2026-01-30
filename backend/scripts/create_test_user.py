# backend/scripts/create_test_user.py
import asyncio
import uuid
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.db.models import User, Goal, Task

# --- Configuration ---
# This is the hardcoded ID for our persistent test user.
# We use a fixed UUID so we can easily find this user in the database.
TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
TEST_USER_EMAIL = "test.user@example.com"
TEST_USER_FIREBASE_UID = "firebase_uid_for_test_user"

async def create_test_user():
    """
    Creates a single, persistent test user with a rich history of tasks.
    This script only needs to be run once.
    """
    print("--- Starting Test User Setup ---")
    
    async_engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(async_engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as db:
        # Check if user already exists
        user = await db.get(User, TEST_USER_ID)
        if user:
            print(f"Test user {TEST_USER_ID} already exists. Skipping creation.")
            return

        print(f"Creating new test user with ID: {TEST_USER_ID}")
        
        # 1. Create the User
        test_user = User(
            id=TEST_USER_ID,
            email=TEST_USER_EMAIL,
            firebase_uid=TEST_USER_FIREBASE_UID,
            full_name="Persistent Test User"
        )
        db.add(test_user)

        # 2. Create a Fitness Goal
        fitness_goal = Goal(
            id=uuid.uuid4(),
            user_id=TEST_USER_ID,
            name="Complete Morning Run",
            category="Fitness"
        )
        db.add(fitness_goal)

        # 3. Create a Learning Goal
        learning_goal = Goal(
            id=uuid.uuid4(),
            user_id=TEST_USER_ID,
            name="Learn Python",
            category="Learning"
        )
        db.add(learning_goal)

        # 4. Create a diverse set of recent tasks for the user
        tasks_to_create = []
        for i in range(1, 15): # Create tasks for the last 14 days
            day = datetime.utcnow() - timedelta(days=i)
            
            # Fitness tasks (mostly on time)
            tasks_to_create.append(Task(
                id=uuid.uuid4(), goal_id=fitness_goal.id, name=f"Morning Run Day {i}",
                status='completed', due_date=day, updated_at=day + timedelta(hours=1) # 1 hour late
            ))
            
            # Learning tasks (often late)
            if i % 2 == 0: # Every other day
                tasks_to_create.append(Task(
                    id=uuid.uuid4(), goal_id=learning_goal.id, name=f"Python Lesson {i}",
                    status='completed', due_date=day, updated_at=day + timedelta(hours=8) # 8 hours late
                ))

        db.add_all(tasks_to_create)
        
        await db.commit()
        print("--- Test User Setup Complete ---")

if __name__ == "__main__":
    asyncio.run(create_test_user())
