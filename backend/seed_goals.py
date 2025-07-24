# backend/seed_goals.py
import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import SessionLocal
from app.db.models.goal import Goal
from app.db.models.task import Task

USER_ID = uuid.UUID("893bb81b-86ad-4157-9c14-096623b0608a")

async def seed_data():
    async with SessionLocal() as db:
        # Create sample goals
        goal1 = Goal(
            name="Daily Meditation",
            category="Wellness",
            icon="Target",
            color="#10B981",
            user_id=USER_ID,
        )
        goal2 = Goal(
            name="Learn Spanish",
            category="Education",
            icon="Star",
            color="#F59E0B",
            user_id=USER_ID,
        )
        
        db.add_all([goal1, goal2])
        await db.flush() # Flush to get the goal IDs

        # Create sample tasks
        task1_1 = Task(name="Morning meditation", status="completed", goal_id=goal1.id)
        task1_2 = Task(name="Evening reflection", status="pending", goal_id=goal1.id)
        
        task2_1 = Task(name="Daily vocabulary", status="verified", goal_id=goal2.id)
        task2_2 = Task(name="Grammar practice", status="completed", goal_id=goal2.id)

        db.add_all([task1_1, task1_2, task2_1, task2_2])
        
        await db.commit()
        print("Successfully seeded goals and tasks for the user.")

if __name__ == "__main__":
    asyncio.run(seed_data())
