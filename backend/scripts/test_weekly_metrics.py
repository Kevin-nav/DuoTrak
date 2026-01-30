# backend/scripts/test_weekly_metrics.py
import asyncio
import json
import logging
import uuid
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.db.models import User
from app.services.pinecone_service import PineconeService
from app.services.gemini_config import GeminiModelConfig
from app.background_jobs.calculate_metrics import WeeklyMetricsCalculator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
# Hardcoded ID of the user created by create_test_user.py
TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

async def main():
    """
    Runs a focused test of the WeeklyMetricsCalculator on a persistent test user.
    """
    print("\n--- Starting Weekly Metrics Engine Test ---")
    
    # 1. Initialize services
    gemini_config = GeminiModelConfig()
    pinecone_service = PineconeService(
        api_key=settings.PINECONE_API_KEY,
        environment="aws", # Placeholder
        index_name=settings.PINECONE_INDEX_NAME
    )
    await pinecone_service.initialize()
    
    async_engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(async_engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as db:
        try:
            # 2. Fetch the persistent test user
            logging.info(f"Fetching persistent test user: {TEST_USER_ID}")
            test_user = await db.get(User, TEST_USER_ID)
            if not test_user:
                raise Exception(f"Test user {TEST_USER_ID} not found. Please run create_test_user.py first.")
            
            # 3. Run the engine for our test user
            logging.info("\n--- Running the WeeklyMetricsCalculator for the test user ---")
            calculator = WeeklyMetricsCalculator(
                db_session=db,
                pinecone_service=pinecone_service,
                gemini_config=gemini_config
            )
            await calculator._process_user(test_user)
            
            # 4. Verify Pinecone Storage by Retrieving
            logging.info("\n--- Verifying data in Pinecone ---")
            await asyncio.sleep(5) # Allow a moment for Pinecone index to update
            
            snapshots = await pinecone_service.get_historical_snapshots(user_id=str(TEST_USER_ID), weeks=1)
            
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

if __name__ == "__main__":
    asyncio.run(main())
