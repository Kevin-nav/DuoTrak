# backend/debug_agent.py
import asyncio
import logging
from app.core.config import settings
from app.services.gemini_config import GeminiModelConfig
from crewai import Agent, Task, Crew

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def main():
    """A simple script to debug the CrewAI agent initialization."""
    
    logging.info("--- Starting Agent Debug Script ---")
    
    try:
        # 1. Initialize Gemini Model Config
        logging.info("Initializing GeminiModelConfig...")
        gemini_config = GeminiModelConfig()
        logging.info("GeminiModelConfig initialized.")

        # 2. Create a single agent
        logging.info("Creating a test agent...")
        test_agent = Agent(
            role='Test Agent',
            goal='To successfully execute a simple task.',
            backstory='A simple agent for debugging purposes.',
            llm=gemini_config.get_model_for_agent('test_agent'),
            verbose=True
        )
        logging.info("Test agent created.")

        # 3. Create a single task
        logging.info("Creating a test task...")
        test_task = Task(
            description='Count from 1 to 5.',
            expected_output='The numbers 1, 2, 3, 4, 5.',
            agent=test_agent
        )
        logging.info("Test task created.")

        # 4. Create and run the crew
        logging.info("Creating and running the crew...")
        crew = Crew(agents=[test_agent], tasks=[test_task], verbose=True)
        result = await asyncio.to_thread(crew.kickoff)
        
        logging.info(f"--- Crew Execution Result ---")
        logging.info(result)
        logging.info("--- Agent Debug Script Finished Successfully ---")

    except Exception as e:
        logging.error("--- Agent Debug Script Failed ---")
        logging.error(f"Error: {e}", exc_info=True)

if __name__ == "__main__":
    # Ensure you have 'langchain-google-genai' installed:
    # pip install langchain-google-genai
    asyncio.run(main())
