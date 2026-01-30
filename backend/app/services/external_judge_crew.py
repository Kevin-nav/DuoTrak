# backend/app/services/external_judge_crew.py
from crewai import Agent, Task, Crew, Process
from typing import Dict, List, Any, Optional
import json
import logging
import asyncio
from datetime import datetime

from app.services.gemini_config import GeminiModelConfig

logger = logging.getLogger(__name__)

class ExternalJudgeCrew:
    """External Judge Crew for automated, two-phase evaluation of the Duotrak agentic system."""
    
    def __init__(self, gemini_config: GeminiModelConfig, test_dataset_path: str):
        self.gemini_config = gemini_config
        self.test_dataset_path = test_dataset_path
        self.evaluation_history = []

    def _create_judge_crew(self) -> Crew:
        analyst = Agent(
            role='Goal Plan Analysis Expert',
            goal='Perform objective, detailed analysis comparing actual agent outputs against golden standards.',
            backstory='You are an expert analyst specializing in goal plan evaluation. You provide factual, unbiased analysis.',
            llm=self.gemini_config.get_model_for_agent('external_analyst'),
            verbose=True
        )
        scorer = Agent(
            role='Goal Plan Quality Scorer',
            goal='Apply rigorous scoring rubrics to evaluate agent outputs and provide quantitative metrics.',
            backstory='You are a measurement expert who translates qualitative aspects into reliable quantitative scores.',
            llm=self.gemini_config.get_model_for_agent('external_scoring_agent'),
            verbose=True
        )
        return Crew(agents=[analyst, scorer], tasks=[], process=Process.sequential)

    async def evaluate_question_phase(self, generated_questions: List[Dict[str, Any]], expected_themes: List[str]) -> Dict[str, Any]:
        """Evaluates the quality of the generated questions using a two-step analysis and scoring process."""
        crew = self._create_judge_crew()
        
        analysis_task = Task(
            description=f"Analyze the generated questions and compare their themes against the expected themes. Provide a qualitative analysis of relevance and insightfulness. Generated Questions: {json.dumps(generated_questions)}. Expected Themes: {json.dumps(expected_themes)}.",
            expected_output="A detailed textual analysis of the questions' quality.",
            agent=crew.agents[0] # Analyst
        )

        scoring_task = Task(
            description="Based on the provided analysis, score the questions' relevance and insightfulness from 1-10.",
            expected_output="A JSON object with 'relevance_score', 'insightfulness_score', and 'reasoning'.",
            agent=crew.agents[1], # Scorer
            context=[analysis_task]
        )

        crew.tasks.extend([analysis_task, scoring_task])
        result = await asyncio.to_thread(crew.kickoff)
        
        try:
            return json.loads(result.raw)
        except (json.JSONDecodeError, AttributeError):
            return {"relevance_score": 0, "insightfulness_score": 0, "reasoning": "Failed to parse judge output."}

    async def evaluate_goal_plan_phase(self, generated_plan: Dict[str, Any], golden_plan: Dict[str, Any], simulated_answers: Dict[str, str]) -> Dict[str, Any]:
        """Evaluates the final goal plan using a two-step analysis and scoring process."""
        crew = self._create_judge_crew()

        analysis_task = Task(
            description=f"Analyze the generated plan against the golden plan, considering the user's answers. Provide a detailed qualitative analysis. Generated Plan: {json.dumps(generated_plan)}. Golden Plan: {json.dumps(golden_plan)}. User Answers: {json.dumps(simulated_answers)}.",
            expected_output="A detailed textual analysis comparing the generated plan to the golden standard.",
            agent=crew.agents[0] # Analyst
        )

        scoring_task = Task(
            description="Based on the provided analysis, score the plan on personalization, partner integration, and risk mitigation from 1-10 and provide an overall score.",
            expected_output="A JSON object with 'personalization_score', 'partner_integration_score', 'risk_mitigation_score', and a final 'overall_score'.",
            agent=crew.agents[1], # Scorer
            context=[analysis_task]
        )

        crew.tasks.extend([analysis_task, scoring_task])
        result = await asyncio.to_thread(crew.kickoff)
        
        try:
            return json.loads(result.raw)
        except (json.JSONDecodeError, AttributeError):
            return {"overall_score": 0, "reasoning": "Failed to parse judge output."}
