# backend/tests/test_goal_creation_flow.py

import pytest
import asyncio
from app.agents.goal_coach_orchestrator import GoalCoachOrchestrator
from typing import Dict, Any, List
import uuid
from app.agents.judge_agent import JudgeAgent

def print_metrics(agent_name: str, metrics: Dict):
    """Helper function to print metrics in a structured way."""
    print(f"\n--- Metrics for {agent_name} ---")
    print(f"  Thought: {metrics.get('thought', 'N/A')}")
    print(f"  Time: {metrics.get('execution_time', 0):.2f}s")
    print(f"  Cost: ${metrics.get('cost', 0):.6f}")
    print(f"  Tokens: {metrics.get('input_tokens', 0)} (in) / {metrics.get('output_tokens', 0)} (out)")
    print("-----------------------------------")

# Mock user ID for testing
TEST_USER_ID = str(uuid.uuid4())

@pytest.fixture(scope="module")
def event_loop():
    """Create an instance of the default event loop for the module."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="module")
def orchestrator() -> GoalCoachOrchestrator:
    """Provides a GoalCoachOrchestrator instance for the tests."""
    return GoalCoachOrchestrator()

@pytest.mark.asyncio
async def test_full_goal_creation_journey(orchestrator: GoalCoachOrchestrator):
    """
    Tests the full, two-step goal creation process from initial idea to final plan,
    including an AI Judge evaluation of the output quality.
    """
    print("\n--- Starting Test: Full Goal Creation Journey ---")
    total_cost = 0
    total_time = 0
    
    # --- Step 1: User provides initial goal idea & context from the wizard ---
    goal_creation_context = {
        "goal_title": "I want to run a 5k in 3 months to improve my fitness.",
        "motivation": "I want to feel healthier and have more energy for my family.",
        "availability": ["Mornings (6-9 AM)", "Weekends only"],
        "time_commitment": "3-4 hours per week",
        "accountability_type": "visual_proof"
    }
    print(f"1. Initial Goal Context: {goal_creation_context['goal_title']}")
    
    questions, user_profile, initial_metrics = await orchestrator.generate_initial_questions(TEST_USER_ID, goal_creation_context)
    
    # Print metrics for the initial phase
    profiler_metrics = initial_metrics['profiler_agent']
    question_metrics = initial_metrics['question_agent']
    print_metrics("UserProfilerAgent", profiler_metrics)
    print_metrics("QuestionAgent", question_metrics)
    total_cost += profiler_metrics.get('cost', 0) + question_metrics.get('cost', 0)
    total_time += profiler_metrics.get('execution_time', 0) + question_metrics.get('execution_time', 0)

    print(f"2. Generated {len(questions)} questions.")
    assert isinstance(questions, list)
    assert len(questions) > 0, "Should generate at least one question"
    
    print("3. Generated user profile.")
    assert isinstance(user_profile, dict)

    # --- Step 2: User answers the generated questions ---
    user_answers = {}
    for q in questions:
        if "motivation" in q["key"]:
            user_answers[q["key"]] = "My main motivation is to feel healthier and have more energy."
        elif "time" in q["key"]:
            user_answers[q["key"]] = "I can commit about 3 hours per week."
        elif "obstacle" in q["key"]:
            user_answers[q["key"]] = "A potential obstacle is staying motivated on rainy days."
        else:
            user_answers[q["key"]] = "My partner and I will go for a celebratory dinner!"

    print(f"4. Simulated user answers: {user_answers}")

    # --- Step 3: Generate the final, personalized plan ---
    print("5. Generating final plan...")
    final_plan, plan_metrics = await orchestrator.generate_final_plan(user_profile, goal_creation_context, user_answers)

    # Print metrics for the plan generation phase
    for i, iteration in enumerate(plan_metrics.get("refinement_history", [])):
        strategist_metrics = iteration[f"iteration_{i+1}"]["goal_strategist"]
        critic_metrics = iteration[f"iteration_{i+1}"]["critic_agent"]
        print_metrics(f"GoalStrategistAgent (Iteration {i+1})", strategist_metrics)
        print_metrics(f"CriticAgent (Iteration {i+1})", critic_metrics)
        total_cost += strategist_metrics.get('cost', 0) + critic_metrics.get('cost', 0)
        total_time += strategist_metrics.get('execution_time', 0) + critic_metrics.get('execution_time', 0)

    print("6. Validating final plan structure...")
    assert isinstance(final_plan, dict)
    assert "tasks" in final_plan and len(final_plan["tasks"]) > 0

    # --- Step 4: The AI Judge evaluates the plan's quality ---
    print("7. Submitting final plan to the AI Judge for evaluation...")
    judge = JudgeAgent()
    evaluation, judge_metrics = await judge.evaluate_plan(
        user_profile, goal_creation_context, user_answers, final_plan
    )

    # Print metrics for the judge phase
    print_metrics("JudgeAgent", judge_metrics)
    total_cost += judge_metrics.get('cost', 0)
    total_time += judge_metrics.get('execution_time', 0)

    print(f"8. Judge's Score: {evaluation.get('final_score', 0)}/10")
    print(f"9. Judge's Reasoning: {evaluation.get('thought', 'No reasoning provided.')}")

    # The test now passes or fails based on the AI Judge's quality score
    assert evaluation.get('final_score', 0) >= 7.5, "The generated plan did not meet the quality threshold."

    print("\n--- Goal Creation Complete: Final Summary ---")
    print(f"  Total Execution Time: {total_time:.2f}s")
    print(f"  Total Estimated Cost: ${total_cost:.6f}")
    print("-------------------------------------------")

    print("--- Test Finished Successfully ---")
