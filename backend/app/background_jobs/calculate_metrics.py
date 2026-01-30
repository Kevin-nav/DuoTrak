# backend/app/background_jobs/calculate_metrics.py
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pydantic import BaseModel
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from crewai import Agent, Task as CrewTask, Crew

from app.core.config import settings
from app.db.session import get_db
from app.db.models import User, Goal, Task as DBTask
from app.services.pinecone_service import PineconeService
from app.services.gemini_config import GeminiModelConfig
from app.schemas.agent_crew import BehavioralSnapshot

class DatabaseService:
    """Handles all database queries for the metrics calculation job."""
    def __init__(self, db_session):
        self.db = db_session

    async def get_active_users(self) -> List[User]:
        """Fetches all users to be processed."""
        result = await self.db.execute(select(User))
        return result.scalars().all()

    async def get_user_performance_since(self, user_id: str, since_datetime: datetime) -> List[DBTask]:
        """Fetches all of a user's tasks updated since a certain datetime."""
        stmt = select(DBTask).join(Goal).where(Goal.user_id == user_id, DBTask.updated_at >= since_datetime)
        result = await self.db.execute(stmt)
        return result.scalars().all()

class MetricsEngine:
    """Calculates performance metrics from raw task data."""
    def calculate_weekly_performance(self, tasks: List[DBTask]) -> Dict[str, Any]:
        completed_on_time = sum(1 for t in tasks if t.status == 'completed' and t.updated_at <= t.due_date)
        completed_late = sum(1 for t in tasks if t.status == 'completed' and t.updated_at > t.due_date)
        total_completed = completed_on_time + completed_late
        
        completion_rate = (total_completed / len(tasks)) * 100 if tasks else 0
        
        return {
            "tasks_completed_on_time": completed_on_time,
            "tasks_completed_late": completed_late,
            "tasks_missed": len(tasks) - total_completed,
            "total_tasks": len(tasks),
            "completion_rate": round(completion_rate, 2)
        }

class SnapshotGenerator:
    """Uses a CrewAI agent to generate the AI-powered behavioral snapshot."""
    def __init__(self, gemini_config: GeminiModelConfig):
        self.gemini_config = gemini_config
        self.agent = Agent(
            role='Expert Behavioral Analyst',
            goal='Analyze user performance data and historical trends to generate a concise, insightful behavioral snapshot.',
            backstory='You are an expert behavioral analyst and life coach. You can synthesize quantitative performance data and qualitative historical notes into a rich, actionable analysis of a user\'s character and growth trajectory.',
            llm=self.gemini_config.get_model_for_agent('critical_analyst'),
            verbose=True
        )

    async def generate_growth_snapshot(self, weekly_performance: Dict[str, Any], historical_snapshots: List[Dict[str, Any]]) -> BehavioralSnapshot:
        prompt = f"""
        You are an expert behavioral analyst and life coach. A user's performance data for the past week and their historical behavioral snapshots are provided below.

        **This Week's Performance:**
        {json.dumps(weekly_performance, indent=2)}

        **Historical Snapshots (last 4 weeks):**
        {json.dumps(historical_snapshots, indent=2)}

        **Your Task:**
        Generate a new, updated "Behavioral Snapshot" in a structured JSON format. This snapshot must include:
        1.  `character_trait_analysis`: An analysis of the user's current character traits based on their performance. Are they showing discipline, resilience, inconsistency?
        2.  `growth_trajectory`: Compare this week's performance to their historical snapshots. Are they growing, stagnating, or declining in their ability to achieve goals? Provide evidence.
        3.  `emerging_patterns`: Identify any new patterns. For example, "The user is now consistently completing morning tasks, which is a new development."
        4.  `archetype_suggestion`: Suggest an updated user archetype based on this new data.
        
        Ensure your output is only the raw JSON object, without any markdown formatting.
        """
        
        task = CrewTask(
            description=prompt,
            expected_output="A valid JSON object conforming to the BehavioralSnapshot schema.",
            agent=self.agent
        )

        crew = Crew(agents=[self.agent], tasks=[task], verbose=True)
        result = await asyncio.to_thread(crew.kickoff)
        
        # Extract the raw text from the CrewOutput object and clean it
        result_text = result.raw if hasattr(result, 'raw') else str(result)
        clean_json_str = result_text.strip().replace("```json", "").replace("```", "").strip()
        
        snapshot_data = json.loads(clean_json_str)
        return BehavioralSnapshot(**snapshot_data)

class WeeklyMetricsCalculator:
    """Orchestrates the weekly user performance and growth analysis."""
    def __init__(self, db_session, pinecone_service: PineconeService, gemini_config: GeminiModelConfig):
        self.db_service = DatabaseService(db_session)
        self.metrics_engine = MetricsEngine()
        self.snapshot_generator = SnapshotGenerator(gemini_config)
        self.pinecone_service = pinecone_service

    async def run_for_all_users(self):
        """The main entry point to run the weekly analysis for all users."""
        print("BACKGROUND JOB: Starting weekly performance and growth analysis for all users.")
        users = await self.db_service.get_active_users()
        for user in users:
            await self._process_user(user)
        print("BACKGROUND JOB: Finished weekly analysis for all users.")

    async def _process_user(self, user: User):
        """Processes a single user's weekly performance and generates a new snapshot."""
        print(f"Processing user: {user.id}")
        one_week_ago = datetime.utcnow() - timedelta(weeks=1)
        
        recent_tasks = await self.db_service.get_user_performance_since(user.id, one_week_ago)
        if not recent_tasks:
            print(f"No recent activity for user {user.id}. Skipping.")
            return
            
        weekly_performance = self.metrics_engine.calculate_weekly_performance(recent_tasks)
        
        historical_snapshots = await self.pinecone_service.get_historical_snapshots(
            user_id=str(user.id),
            weeks=settings.HISTORICAL_SNAPSHOT_WEEKS
        )
        
        new_snapshot = await self.snapshot_generator.generate_growth_snapshot(
            weekly_performance=weekly_performance,
            historical_snapshots=historical_snapshots
        )
        
        snapshot_text = json.dumps(new_snapshot.dict())
        
        import hashlib
        import numpy as np
        vector = np.random.rand(768).tolist()

        await self.pinecone_service.upsert_behavioral_snapshot(
            user_id=str(user.id),
            vector=vector,
            snapshot=new_snapshot
        )
        print(f"Successfully generated and stored new snapshot for user {user.id}")

async def run_weekly_metrics_job():
    """Initializes services and runs the main calculation job."""
    async_session = sessionmaker(get_db(), expire_on_commit=False, class_=asyncio.AsyncSession)
    async with async_session() as db:
        from app.main import pinecone_service, gemini_config
        
        calculator = WeeklyMetricsCalculator(
            db_session=db,
            pinecone_service=pinecone_service,
            gemini_config=gemini_config
        )
        await calculator.run_for_all_users()

if __name__ == "__main__":
    print("Running weekly metrics calculation job manually...")
    asyncio.run(run_weekly_metrics_job())
    print("Manual run complete.")
