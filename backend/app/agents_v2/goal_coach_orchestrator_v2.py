# backend/app/agents_v2/goal_coach_orchestrator_v2.py
import json
import logging
from typing import Dict, Any, Tuple

from crewai import Agent, Task, Crew, Process
from app.services.gemini_service import gemini_service
from app.services.pinecone_service import PineconeService
from .models import GoalCreationContext, FinalPlan, PlanEvaluation

logger = logging.getLogger(__name__)

class GoalCoachOrchestratorV2:
    """
    Orchestrates the V2 multi-agent goal creation process using the CrewAI framework.
    """

    def __init__(self, pinecone_service: PineconeService):
        self.pinecone_service = pinecone_service
        # Strategic Model Allocation
        self.flash_llm = gemini_service.get_flash_model(use_zero_thinking_budget=True)
        self.pro_llm = gemini_service.get_pro_model()

    async def generate_goal_plan(
        self,
        user_id: str,
        goal_context: GoalCreationContext,
    ) -> Tuple[FinalPlan, PlanEvaluation, Dict[str, Any]]:
        
        historical_context = await self.pinecone_service.get_user_context(
            user_id, f"Past goal plans for user related to '{goal_context.goal_title}'"
        )

        # 1. Define Agents with refined, Duotrak-aware prompts and strategic LLM assignment
        user_profiler = Agent(
            role='Behavioral Psychologist & User Profiler',
            goal='Analyze the user\'s goal, motivation, and context to create a deep psychological and behavioral profile. Identify potential obstacles and key motivators, especially considering if this is a shared goal with a partner.',
            backstory='You are an expert in human motivation and the dynamics of accountability partnerships. Your analysis uncovers the latent needs behind a user\'s stated goal, forming the foundation for a plan that will actually stick.',
            llm=self.flash_llm, # Optimized for speed and cost
            verbose=True
        )

        goal_strategist = Agent(
            role='Hyper-Personalized Goal Strategist for Accountability Partners',
            goal='Synthesize the user profile and goal context to generate a complete, actionable, and psychologically-sound goal plan. Your plan MUST include creative, specific suggestions for how their accountability partner can be involved. The plan must strictly adhere to the required Pydantic JSON schema.',
            backstory='You are a master of strategy and personalization for the Duotrak platform. You don\'t just create task lists; you create comprehensive frameworks for success that leverage the power of one-on-one accountability.',
            llm=self.pro_llm, # Optimized for quality and creativity
            allow_delegation=False,
            verbose=True
        )
        
        # The internal judge provides the final Pydantic score object.
        plan_quality_judge = Agent(
            role='Impartial Plan Scorer',
            goal='Provide a final, objective, quantitative evaluation of the approved plan. Your output must be ONLY the Pydantic JSON object for the final evaluation score.',
            backstory='You are the final arbiter of quality, providing a scored evaluation based on predefined criteria like personalization, actionability, and completeness.',
            llm=self.flash_llm, # Optimized for speed and cost
            verbose=True
        )

        # 2. Define Tasks with structured, Pydantic-driven output
        task_inputs = {
            "goal_context": goal_context.model_dump_json(indent=2),
            "historical_context": historical_context
        }

        profiling_task = Task(
            description="Analyze the user's goal context and historical data. Create a detailed user profile dictionary identifying their archetype, behavioral patterns, success predictors, and risk factors. Pay special attention to the 'is_shared_goal' flag.",
            expected_output='A JSON object representing the user_profile.',
            agent=user_profiler,
        )
        
        strategy_task = Task(
            description=(
                "Using the user profile from the previous step, create a hyper-personalized goal plan. Ensure the plan includes specific, actionable tasks, success tips, and MOST IMPORTANTLY, creative 'partner_involvement_suggestions' that leverage the Duotrak accountability model. "
                "Your final output MUST be a valid JSON that conforms to the `FinalPlan` Pydantic schema."
            ),
            expected_output='A JSON object that strictly adheres to the `FinalPlan` model schema.',
            agent=goal_strategist,
            context=[profiling_task],
            output_pydantic=FinalPlan
        )

        judge_task = Task(
            description="The plan has been generated. Provide a final quantitative evaluation based on personalization, actionability, completeness, and alignment with the user's profile. Your output MUST be a valid JSON that conforms to the `PlanEvaluation` Pydantic schema.",
            expected_output="A JSON object that strictly adheres to the `PlanEvaluation` model schema.",
            agent=plan_quality_judge,
            context=[strategy_task, profiling_task],
            output_pydantic=PlanEvaluation
        )
        
        # 3. Assemble and Kickoff Crew
        # Note: CrewAI's standard sequential process doesn't support a refinement loop.
        # The output of the strategist is considered the final version for this V2 implementation.
        # A more advanced implementation could use CrewAI's upcoming "Flows" feature.
        crew = Crew(
            agents=[user_profiler, goal_strategist, plan_quality_judge],
            tasks=[profiling_task, strategy_task, judge_task],
            process=Process.sequential,
            verbose=True,
        )
        
        logger.info(f"Kicking off V2 Goal Creation Crew for user {user_id}")
        crew_result = await crew.kickoff_async(inputs=task_inputs)
        
        # Extract the Pydantic objects from the task outputs
        final_plan_output = strategy_task.output.pydantic_output
        evaluation_output = judge_task.output.pydantic_output

        if not isinstance(final_plan_output, FinalPlan) or not isinstance(evaluation_output, PlanEvaluation):
             raise ValueError("Crew failed to produce the expected Pydantic output objects.")

        return final_plan_output, evaluation_output, crew.usage_metrics