# testing/judge_crew.py
import logging
from crewai import Agent, Task, Crew, Process
from app.services.gemini_service import gemini_service
from app.agents_v2.models import GoalCreationContext, FinalPlan
from .models import TestResult

logger = logging.getLogger(__name__)

class JudgeCrew:
    def __init__(self):
        # The Judge Crew always uses the most powerful model for the highest accuracy evaluation.
        self.pro_llm = gemini_service.get_pro_model()

    async def evaluate_plan(
        self,
        test_case_id: str,
        user_input: GoalCreationContext,
        expected_plan: FinalPlan,
        actual_plan: FinalPlan
    ) -> TestResult:

        # 1. Define Judge Agents
        comparison_agent = Agent(
            role='Factual Data Analyst',
            goal='Perform a detailed, unbiased, field-by-field comparison between an "expected" goal plan and an "actual" goal plan. Your output must be a structured report of the differences. Do not score or give opinions, only state the facts.',
            backstory='You are a meticulous analyst. Your only job is to find the delta between two data structures and report it clearly and concisely.',
            llm=self.pro_llm,
            verbose=True
        )

        scoring_agent = Agent(
            role='Agentic System Quality Rater & Prompt Engineer',
            goal='Using a factual comparison report, apply a formal scoring rubric to evaluate the performance of a multi-agent system. Assign quantitative scores and provide qualitative, actionable recommendations for improving the agents\' prompts. Your output must strictly adhere to the `TestResult` Pydantic schema.',
            backstory='You are an expert in prompt engineering and agentic system design. Your analysis is crucial for iterating and improving the reliability of AI agents. You provide clear, structured feedback that developers can act on immediately.',
            llm=self.pro_llm,
            verbose=True
        )

        # 2. Prepare task inputs
        task_inputs = {
            "test_case_id": test_case_id,
            "user_input": user_input.model_dump_json(indent=2),
            "expected_plan": expected_plan.model_dump_json(indent=2),
            "actual_plan": actual_plan.model_dump_json(indent=2)
        }

        # 3. Define Judge Tasks
        comparison_task = Task(
            description='Analyze the user_input, expected_plan, and actual_plan. Create a report that details the key differences between the expected and actual plans. Highlight any deviations in tasks, success tips, and especially the partner_involvement_suggestions.',
            expected_output='A markdown-formatted report detailing the factual differences.',
            agent=comparison_agent,
        )

        scoring_task = Task(
            description=(
                "You have been given a comparison report detailing the differences between an expected and an actual AI-generated goal plan. Your task is to score the performance and provide feedback. "
                "Follow this rubric EXACTLY:\n"
                "1. **schema_adherence_score**: Set to 1.0. This is pre-validated.\n"
                "2. **agent_scores**:\n"
                "   - **UserProfilerAgent**: Score based on how well the nuances of the user_input (motivation, availability) are reflected in the actual_plan. (10 points)\n"
                "   - **GoalStrategistAgent**: Score based on the actionability, creativity, and quality of the `partner_involvement_suggestions`. This is the most important part for Duotrak. (10 points)\n"
                "   - **Internal JudgeAgent**: Score based on the internal consistency and logical soundness of the plan. If the plan is illogical (e.g., tasks outside availability), score this low. (10 points)\n"
                "3. **overall_quality_score**: Provide a holistic score for the final plan's quality. (10 points)\n"
                "4. **strengths/weaknesses**: List the key points.\n"
                "5. **recommendations_for_prompt_tuning**: Provide concrete advice. E.g., 'Refine GoalStrategistAgent's backstory to emphasize...' or 'Add a rule to the CriticAgent's prompt to check for...'.\n\n"
                "Your final output MUST be a single JSON object conforming to the `TestResult` Pydantic schema."
            ),
            expected_output='A JSON object that strictly adheres to the `TestResult` model schema.',
            agent=scoring_agent,
            context=[comparison_task],
            output_pydantic=TestResult,
        )

        # 4. Assemble and Kickoff Judge Crew
        crew = Crew(
            agents=[comparison_agent, scoring_agent],
            tasks=[comparison_task, scoring_task],
            process=Process.sequential,
            verbose=True
        )

        logger.info(f"Kicking off Judge Crew for Test Case: {test_case_id}")
        evaluation_result = await crew.kickoff_async(inputs=task_inputs)
        
        # The result from a Pydantic output task is already the parsed object
        if not isinstance(evaluation_result, TestResult):
            raise ValueError("Judge Crew failed to produce a valid TestResult object.")
        
        return evaluation_result
