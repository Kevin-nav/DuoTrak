# testing/models.py
from pydantic import BaseModel, Field
from typing import List

class AgentScore(BaseModel):
    """A Pydantic model for scoring the performance of a single agent."""
    agent_name: str = Field(..., description="The name of the agent being scored (e.g., 'UserProfilerAgent', 'GoalStrategistAgent').")
    score: float = Field(..., ge=0.0, le=10.0, description="A score from 0.0 to 10.0 for this agent's performance.")
    justification: str = Field(..., description="The detailed reasoning behind the score for this specific agent.")

class TestResult(BaseModel):
    """
    The primary Pydantic model for the output of the Judge Crew.
    This ensures the evaluation feedback is always structured and easy to parse.
    """
    test_case_id: str = Field(..., description="The ID of the test case being evaluated.")
    schema_adherence_score: float = Field(..., description="Binary score: 1.0 if the main crew's output was valid Pydantic, 0.0 otherwise.")
    overall_quality_score: float = Field(..., ge=0.0, le=10.0, description="A holistic score from 0.0 to 10.0 for the final plan's quality.")
    agent_scores: List[AgentScore] = Field(..., description="A list of scores for each individual agent in the main crew.")
    strengths: List[str] = Field(..., description="What the system did well compared to the expected output.")
    weaknesses: List[str] = Field(..., description="Where the system fell short and why.")
    recommendations_for_prompt_tuning: List[str] = Field(..., description="Specific, actionable advice on how to improve the prompts, roles, or backstories of specific agents to get closer to the expected output.")
