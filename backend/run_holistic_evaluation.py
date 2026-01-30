# backend/run_holistic_evaluation.py
import asyncio
import json
import logging
from pathlib import Path

from app.core.config import settings
from app.services.gemini_config import GeminiModelConfig
from app.services.pinecone_service import PineconeService
from app.services.duotrak_crew_orchestrator import DuotrakCrewOrchestrator
from app.services.external_judge_crew import ExternalJudgeCrew
from app.schemas.agent_crew import GoalWizardData

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def main():
    """Main function to run the holistic evaluation."""
    
    # 1. Initialize all services
    gemini_config = GeminiModelConfig()
    
    pinecone_service = PineconeService(
        api_key=settings.PINECONE_API_KEY,
        environment="aws", # Placeholder
        index_name=settings.PINECONE_INDEX_NAME
    )
    await pinecone_service.initialize()

    duotrak_orchestrator = DuotrakCrewOrchestrator(
        pinecone_service=pinecone_service,
        gemini_config=gemini_config
    )

    judge_crew = ExternalJudgeCrew(
        gemini_config=gemini_config,
        test_dataset_path=settings.TEST_DATASET_PATH
    )

    # 2. Load the test dataset
    test_dataset_path = Path(__file__).parent / "data" / "holistic_test_dataset.json"
    with open(test_dataset_path, 'r') as f:
        test_cases = json.load(f)

    logging.info(f"Loaded {len(test_cases)} test case(s) from {test_dataset_path}")

    # 3. Iterate through each test case and run the evaluation
    for i, case in enumerate(test_cases):
        logging.info(f"\n{'='*20} RUNNING TEST CASE {i+1}: {case['test_case_id']} {'='*20}")
        logging.info(f"DESCRIPTION: {case['description']}")

        wizard_input = case['wizard_input']
        session_id = f"eval-session-{case['test_case_id']}"
        
        # --- PHASE 1: QUESTION GENERATION ---
        logging.info("\n--- Phase 1: Evaluating Question Generation ---")
        
        # Run the question generation
        user_context = await pinecone_service.get_user_context(wizard_input['user_id'])
        questions_result = await duotrak_orchestrator.generate_strategic_questions(
            user_id=wizard_input['user_id'],
            session_id=session_id,
            wizard_data=wizard_input['wizard_data'],
            user_context=user_context
        )
        
        # Judge the questions
        question_evaluation = await judge_crew.evaluate_question_phase(
            generated_questions=questions_result['questions'],
            expected_themes=case['expected_question_themes']
        )
        
        logging.info(f"Question Evaluation Score: {question_evaluation}")

        # --- PHASE 2: GOAL PLAN CREATION ---
        logging.info("\n--- Phase 2: Evaluating Goal Plan Creation ---")
        
        # Run the plan creation with simulated answers
        plan_result = await duotrak_orchestrator.create_goal_plan_from_answers(
            session_id=session_id,
            user_id=wizard_input['user_id'],
            answers=case['simulated_answers']
        )
        
        # Judge the plan
        plan_evaluation = await judge_crew.evaluate_goal_plan_phase(
            generated_plan=plan_result['final_plan'],
            golden_plan=case['golden_goal_plan'],
            simulated_answers=case['simulated_answers']
        )
        
        logging.info(f"Plan Evaluation Score: {plan_evaluation}")
        
        logging.info(f"\n{'='*20} TEST CASE {i+1} COMPLETE {'='*20}\n")

if __name__ == "__main__":
    asyncio.run(main())
