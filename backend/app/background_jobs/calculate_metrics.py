# backend/app/background_jobs/calculate_metrics.py

import asyncio
from typing import Dict, Any, List
from app.db.session import get_db
from app.services.pinecone_service import pinecone_service
from app.services.embedding_service import embedding_service
from app.ai.gemini_model_manager import gemini_manager
from app.db.models import User, Goal, Task, UserBehavioralMetrics
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

class MetricsCalculator:
    def __init__(self):
        self.snapshot_prompt_template = """
        Based on the following user metrics, generate a concise, natural language "Behavioral Snapshot" document.
        This document will be used for semantic retrieval to understand the user's patterns when they start a new goal.
        Focus on summarizing their archetype, strengths, and areas for improvement.

        METRICS:
        {metrics}
        """

    async def calculate_and_store_metrics_for_all_users(self):
        print("BACKGROUND JOB: Starting metrics calculation for all users.")
        
        async_session = sessionmaker(get_db(), expire_on_commit=False, class_=asyncio.AsyncSession)
        async with async_session() as db:
            users = await db.execute(select(User))
            for user in users.scalars().all():
                await self._process_user(user, db)

        print("BACKGROUND JOB: Finished metrics calculation for all users.")

    async def _process_user(self, user: User, db):
        """Processes a single user's metrics."""
        print(f"Processing user: {user.id}")
        metrics = await self._calculate_metrics_from_db(user.id, db)
        await self._store_metrics_in_db(user.id, metrics, db)
        
        snapshot_doc = await self._generate_behavioral_snapshot(metrics)
        
        if snapshot_doc:
            # Embed the document before upserting
            vector = await embedding_service.embed_document(snapshot_doc)
            
            pinecone_service.upsert_behavioral_snapshot(
                str(user.id), 
                vector, 
                {
                    "archetype": metrics.get("archetype", "unknown"),
                    "text": snapshot_doc # Store original text in metadata
                }
            )

    async def _calculate_metrics_from_db(self, user_id: str, db) -> Dict[str, Any]:
        """Calculates user metrics from their raw goal and task history."""
        
        # 1. Fetch all relevant tasks for the user
        task_stmt = select(Task).join(Goal).where(Goal.user_id == user_id)
        task_result = await db.execute(task_stmt)
        tasks = task_result.scalars().all()

        # 2. Calculate Time-of-Day Success
        time_of_day_success = {"morning": 0, "afternoon": 0, "evening": 0}
        time_of_day_total = {"morning": 0, "afternoon": 0, "evening": 0}
        for task in tasks:
            if task.status == 'completed' and task.updated_at:
                hour = task.updated_at.hour
                if 6 <= hour < 12:
                    time_of_day_success["morning"] += 1
                    time_of_day_total["morning"] += 1
                elif 12 <= hour < 18:
                    time_of_day_success["afternoon"] += 1
                    time_of_day_total["afternoon"] += 1
                else:
                    time_of_day_success["evening"] += 1
                    time_of_day_total["evening"] += 1
        
        for period in time_of_day_total:
            if time_of_day_total[period] > 0:
                time_of_day_success[period] /= time_of_day_total[period]

        # 3. Calculate Procrastination Index
        procrastination_deltas = []
        for task in tasks:
            if task.status == 'completed' and task.due_date and task.updated_at:
                delta = (task.updated_at - task.due_date).total_seconds() / 3600
                procrastination_deltas.append(delta)
        procrastination_index = sum(procrastination_deltas) / len(procrastination_deltas) if procrastination_deltas else 0

        # 4. Calculate Category Affinity
        goal_stmt = select(Goal).where(Goal.user_id == user_id)
        goal_result = await db.execute(goal_stmt)
        goals = goal_result.scalars().all()
        
        category_success = {}
        category_total = {}
        for goal in goals:
            if goal.category:
                if goal.status == 'Completed':
                    category_success[goal.category] = category_success.get(goal.category, 0) + 1
                category_total[goal.category] = category_total.get(goal.category, 0) + 1
        
        category_affinity = {cat: category_success.get(cat, 0) / total for cat, total in category_total.items()}

        # 5. Determine Archetype
        user = await db.get(User, user_id)
        archetype = "Newcomer"
        if user and user.longest_streak > 30:
            archetype = "Marathoner"
        elif procrastination_index < 2 and len(goals) > 3:
            archetype = "Sprinter"
        elif user and user.goals_conquered > 5:
            archetype = "Visionary"

        return {
            "time_of_day_success": time_of_day_success,
            "procrastination_index": procrastination_index,
            "category_affinity": category_affinity,
            "archetype": archetype,
        }

    async def _store_metrics_in_db(self, user_id: str, metrics: Dict[str, Any], db):
        stmt = select(UserBehavioralMetrics).where(UserBehavioralMetrics.user_id == user_id)
        result = await db.execute(stmt)
        metric_record = result.scalars().first()

        if not metric_record:
            metric_record = UserBehavioralMetrics(user_id=user_id)
        
        metric_record.time_of_day_success = metrics["time_of_day_success"]
        metric_record.procrastination_index = metrics["procrastination_index"]
        metric_record.category_affinity = metrics["category_affinity"]
        metric_record.archetype = metrics["archetype"]
        
        db.add(metric_record)
        await db.commit()

    async def _generate_behavioral_snapshot(self, metrics: Dict[str, Any]) -> str:
        prompt = self.snapshot_prompt_template.format(metrics=json.dumps(metrics, indent=2))
        result = await gemini_manager.execute_with_model(
            model_type='flash',
            config_type='fast_classification',
            prompt=prompt
        )
        if result['success']:
            return result['content'].get('snapshot', "No snapshot generated.")
        return "User is a consistent achiever, excelling in daily habits."

async def run_metrics_calculation():
    calculator = MetricsCalculator()
    await calculator.calculate_and_store_metrics_for_all_users()

if __name__ == "__main__":
    asyncio.run(run_metrics_calculation())
