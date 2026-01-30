# backend/test_weekly_metrics.py
import asyncio
import json
import logging
from datetime import datetime, timedelta
from uuid import uuid4
import uuid

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.future import select

from app.core.config import settings
from app.db.session import get_db
from app.db.models import User, Goal, Task
from app.services.pinecone_service import PineconeService
from app.services.gemini_config import GeminiModelConfig
from app.background_jobs.calculate_metrics import WeeklyMetricsCalculator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def setup_test_data(db_session, user_id: uuid.UUID):
    """Creates a test user, goal, and tasks in the database."""
    logging.info(f"Setting up test data for user {user_id}...")
    
    # Create a test user
    test_user = User(id=user_id, email=f"test-{user_id}@example.com", full_name=f"Test User {user_id}")
    db_session.add(test_user)
    
    # Create a test goal
    test_goal = Goal(id=uuid4(), user_id=user_id, title="Weekly Metrics Test Goal", category="Fitness")
    db_session.add(test_goal)
    
    # Create recently completed tasks
    for i in range(5):
        task = Task(
            id=uuid4(),
            goal_id=test_goal.id,
            title=f"Test Task {i+1}",
            status='completed',
            due_date=datetime.utcnow() - timedelta(days=i),
            updated_at=datetime.utcnow() - timedelta(days=i, hours=-2) # Completed 2 hours early
        )
        db_session.add(task)
        
    await db_session.commit()
    logging.info("Test data setup complete.")

async def cleanup_test_data(db_session, pinecone_service: PineconeService, user_id: str):
    """Removes test data from the database and Pinecone."""
    logging.info(f"Cleaning up test data for user {user_id}...")
    
    # Delete from database (tasks and goals will cascade)
    user = await db_session.get(User, user_id)
    if user:
        await db_session.delete(user)
        await db_session.commit()
        
    # Delete from Pinecone
    # Note: Pinecone doesn't have a direct 'delete by metadata' without a vector.
    # A more robust implementation would fetch vectors then delete by ID.
    # For this test, we assume the snapshot ID format is known.
    logging.info("Cleanup in Pinecone would require fetching and deleting by ID. Skipping for this test.")
    logging.info("Test data cleanup complete.")

async def main():
    """Main function to run the test."""
    test_user_id = uuid4() # Generate a valid UUID
    
    # 1. Initialize services
    gemini_config = GeminiModelConfig()
    pinecone_service = PineconeService(
        api_key=settings.PINECONE_API_KEY,
        environment="aws", # Placeholder
        index_name=settings.PINECONE_INDEX_NAME
    )
    await pinecone_service.initialize()
    
    # Create a standalone async engine for the test
    async_engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(async_engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as db:
        try:
            # 2. Setup mock data
            await setup_test_data(db, test_user_id)
            
            # 3. Run the engine for our test user
            logging.info("\n--- Running the WeeklyMetricsCalculator for the test user ---")
            calculator = WeeklyMetricsCalculator(
                db_session=db,
                pinecone_service=pinecone_service,
                gemini_config=gemini_config
            )
            # We'll process the single user directly instead of all users
            test_user = await db.get(User, test_user_id)
            await calculator._process_user(test_user)
            
            # 4. Verify Pinecone Storage by Retrieving
            logging.info("\n--- Verifying data in Pinecone ---")
            await asyncio.sleep(5) # Allow a moment for Pinecone index to update
            
            snapshots = await pinecone_service.get_historical_snapshots(user_id=test_user_id, weeks=1)
            
            # 5. Assert and Validate
            assert len(snapshots) > 0, "Assertion Failed: No snapshot was stored in Pinecone."
            logging.info("✅ SUCCESS: Found a snapshot in Pinecone.")
            
            snapshot = snapshots[0]
            assert "character_trait_analysis" in snapshot, "Assertion Failed: Snapshot is missing 'character_trait_analysis'."
            assert "growth_trajectory" in snapshot, "Assertion Failed: Snapshot is missing 'growth_trajectory'."
            logging.info("✅ SUCCESS: Retrieved snapshot has the correct structure.")
            logging.info(f"Retrieved Snapshot Analysis: {snapshot.get('character_trait_analysis')}")

            print("\n🎉🎉🎉 Test Passed Successfully! 🎉🎉🎉")

        except Exception as e:
            logging.error("💥💥💥 Test Failed 💥💥💥", exc_info=True)
        finally:
            # 6. Cleanup
            await cleanup_test_data(db, pinecone_service, test_user_id)

if __name__ == "__main__":
    asyncio.run(main())
