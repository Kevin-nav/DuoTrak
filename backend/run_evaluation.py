# run_evaluation.py
import json
import asyncio
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file in the current directory
load_dotenv()

from app.agents_v2.models import GoalCreationContext, FinalPlan
from app.testing.models import TestResult
from app.testing.judge_crew import JudgeCrew
from app.agents_v2.goal_coach_orchestrator_v2 import GoalCoachOrchestratorV2
from app.services.pinecone_service import PineconeService

# --- Main Evaluation Logic ---
async def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # 1. Initialize Services and Crews
    pinecone_service = PineconeService()
    try:
        pinecone_service.initialize()
        logging.info("Pinecone service initialized successfully.")
    except Exception as e:
        logging.error(f"Failed to initialize Pinecone. Aborting evaluation. Error: {e}")
        return

    goal_coach_orchestrator_v2 = GoalCoachOrchestratorV2(pinecone_service=pinecone_service)
    judge_crew = JudgeCrew()

    # 2. Load the test dataset
    script_dir = os.path.dirname(__file__)
    dataset_path = os.path.join(script_dir, 'test_dataset.json')
    with open(dataset_path, "r") as f:
        test_cases = json.load(f)

    results = []
    
    # 3. Loop through each test case
    for case in test_cases:
        test_case_id = case['test_case_id']
        logging.info(f"--- Running Test Case: {test_case_id} ---")
        
        try:
            # Prepare inputs
            goal_context = GoalCreationContext(**case["input"])
            expected_plan = FinalPlan(**case["expected_output"])

            # 4. Run the main crew to get the actual output
            actual_plan, _, _ = await goal_coach_orchestrator_v2.generate_goal_plan(
                user_id="test_user_001",
                goal_context=goal_context
            )

            # 5. Run the Judge Crew to get the evaluation
            test_result = await judge_crew.evaluate_plan(
                test_case_id=test_case_id,
                user_input=goal_context,
                expected_plan=expected_plan,
                actual_plan=actual_plan
            )
            
            results.append(test_result.model_dump())
            logging.info(f"--- Test Case {test_case_id} Complete. Overall Score: {test_result.overall_quality_score}/10 ---")

        except Exception as e:
            logging.error(f"--- Test Case {test_case_id} FAILED: {e} ---", exc_info=True)
            results.append({"test_case_id": test_case_id, "status": "FAILED", "error": str(e)})

    # 6. Save the final report
    with open("evaluation_report.json", "w") as f:
        json.dump(results, f, indent=2)

    logging.info("======================================================")
    logging.info("Evaluation complete. Report saved to evaluation_report.json")
    logging.info("======================================================")

if __name__ == "__main__":
    asyncio.run(main())
