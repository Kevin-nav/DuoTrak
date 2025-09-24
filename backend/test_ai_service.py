import asyncio
import os
from dotenv import load_dotenv
import logging

# Set up basic logging
logging.basicConfig(level=logging.INFO)

# Load environment variables from .env file
# This is crucial for the script to find the GEMINI_API_KEY
load_dotenv()

from app.schemas.goal import GoalSuggestionRequest, GoalType, AccountabilityType
from app.services.ai_suggestion_service import ai_suggestion_service
from app.db.models.user import User

async def main():
    """Main function to run the test."""
    print("--- Starting AI Suggestion Service Test ---")

    # 1. Create a mock User object
    # The user object can be minimal as the prompt doesn't use all fields heavily yet.
    mock_user = User(
        id="mock_user_id",
        full_name="Test User",
        email="test@example.com",
        timezone="America/New_York",
        current_streak=5,
        longest_streak=10,
        total_tasks_completed=50,
        goals_conquered=3
    )

    # 2. Create a mock GoalSuggestionRequest object
    # This simulates the data coming from the frontend wizard.
    mock_request = GoalSuggestionRequest(
        goal_type=GoalType.PERSONAL,
        goal_name="Learn to play the guitar",
        motivation="I want to play songs for my family and relax in the evenings.",
        availability=["Evenings (6-9 PM)", "Weekends only"],
        time_commitment="30-45 mins daily",
        accountability_type=AccountabilityType.VISUAL_PROOF
    )

    print(f"\n--- Sending Request for Goal: '{mock_request.goal_name}' ---")

    try:
        # 3. Call the service directly
        suggestions = await ai_suggestion_service.generate_task_suggestions(
            request=mock_request,
            user=mock_user
        )

        # 4. Print the results
        print("\n--- AI Service Response --- ")
        print(f"Goal Type: {suggestions.goal_type}")
        print("\nSuggested Tasks:")
        for i, task in enumerate(suggestions.tasks, 1):
            print(f"  {i}. Task Name: {task.task_name}")
            print(f"     Description: {task.description}")
            print(f"     Frequency: {task.repeat_frequency}")
        
        print("\nSuccess Tips:")
        for tip in suggestions.success_tips:
            print(f"  - {tip}")

        print(f"\nModel Version: {suggestions.model_version}")

    except Exception as e:
        print(f"\n--- AN ERROR OCCURRED ---")
        logging.error("Failed to get suggestions from AI service", exc_info=True)

    print("\n--- Test Complete ---")

if __name__ == "__main__":
    # Ensure the script can find the 'app' module
    import sys
    # Add the project root to the Python path
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    
    # On Windows, we might need to set a different event loop policy
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(main())
