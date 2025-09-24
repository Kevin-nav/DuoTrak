# backend/tests/test_goal_creation_flow.py

import pytest
import asyncio
from app.agents.goal_coach_orchestrator import GoalCoachOrchestrator
from typing import Dict, Any, List
import uuid
from app.agents.judge_agent import JudgeAgent

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
    
    # --- Step 1: User provides initial goal idea & context from the wizard ---
    goal_creation_context = {
        "goal_title": "I want to run a 5k in 3 months to improve my fitness.",
        "motivation": "I want to feel healthier and have more energy for my family.",
        "availability": ["Mornings (6-9 AM)", "Weekends only"],
        "time_commitment": "3-4 hours per week",
        "accountability_type": "visual_proof"
    }
    print(f"1. Initial Goal Context: {goal_creation_context['goal_title']}")
    
    questions, user_profile = await orchestrator.generate_initial_questions(TEST_USER_ID, goal_creation_context)
    
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
    
            # Add a delay to avoid hitting free-tier rate limits
            print("\n-- Waiting 30s to avoid API rate limits... --\n")
            await asyncio.sleep(30)

            # --- Step 3: Generate the final, personalized plan ---
            print("5. Generating final plan...")
            final_plan = await orchestrator.generate_final_plan(user_profile, goal_creation_context, user_answers)

    print("6. Validating final plan structure...")
    assert isinstance(final_plan, dict)
    assert "tasks" in final_plan and len(final_plan["tasks"]) > 0

    # --- Step 4: The AI Judge evaluates the plan's quality ---
    print("7. Submitting final plan to the AI Judge for evaluation...")
    judge = JudgeAgent()
    evaluation = await judge.evaluate_plan(
        user_profile, goal_creation_context, user_answers, final_plan
    )

    print(f"8. Judge's Score: {evaluation.get('final_score', 0)}/10")
    print(f"9. Judge's Reasoning: {evaluation.get('reasoning', 'No reasoning provided.')}")

    # The test now passes or fails based on the AI Judge's quality score
    assert evaluation.get('final_score', 0) >= 7.5, "The generated plan did not meet the quality threshold."

    print("--- Test Finished Successfully ---")
