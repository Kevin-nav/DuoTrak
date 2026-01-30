# backend/app/services/gemini_config.py
import logging
from crewai import LLM
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiModelConfig:
    """
    Manages Gemini model configurations for CrewAI by using the native crewai.LLM wrapper.
    This provides direct control over the LiteLLM model string and resolves provider conflicts.
    """

    def __init__(self):
        logger.info(f"🧠 Initializing Gemini models via crewai.LLM - Flash: {settings.FLASH_MODEL}, Pro: {settings.PRO_MODEL}")

    def get_model_for_agent(self, agent_role: str) -> LLM:
        """
        Get the appropriate crewai.LLM instance based on agent role.
        """
        complex_agents = [
            "goal_strategist",
            "critical_analyst",
            "goal_plan_arbiter",
            "external_analyst",
            "external_scoring_agent"
        ]

        # Determine the model base name (e.g., "gemini-2.5-flash")
        model_base_name = settings.PRO_MODEL if any(role in agent_role.lower().replace(" ", "_") for role in complex_agents) else settings.FLASH_MODEL

        # CRITICAL FIX: Apply the required LiteLLM provider prefix
        model_name = f"gemini/{model_base_name}"

        # Determine temperature based on role for creativity vs. consistency
        if "critic" in agent_role.lower() or "judge" in agent_role.lower():
            temperature = 0.1
        elif "strategist" in agent_role.lower():
            temperature = 0.5
        else:
            temperature = 0.3

        # Create and return the CrewAI LLM instance, which uses LiteLLM correctly
        llm = LLM(
            model=model_name,
            api_key=settings.GEMINI_API_KEY,
            temperature=temperature,
        )
        return llm
