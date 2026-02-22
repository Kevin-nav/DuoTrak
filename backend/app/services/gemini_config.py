# backend/app/services/gemini_config.py
import logging
from crewai import LLM
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiModelConfig:
    """
    Manages Gemini model configurations for CrewAI using Flash-only routing.
    """

    def __init__(self):
        logger.info("Initializing Gemini models via crewai.LLM with Gemini 3 Flash-only policy.")

    def get_model_for_agent(self, agent_role: str) -> LLM:
        """
        Get the crewai.LLM instance for an agent role.
        All roles are pinned to Gemini 3 Flash.
        """
        _ = agent_role
        model_base_name = settings.FLASH_MODEL or "gemini-3-flash"
        if model_base_name != "gemini-3-flash":
            logger.warning(
                "Overriding FLASH_MODEL=%s to gemini-3-flash due to Flash-only policy.",
                model_base_name,
            )
            model_base_name = "gemini-3-flash"

        model_name = f"gemini/{model_base_name}"

        # Keep role-based temperature, even though model is fixed.
        lowered = agent_role.lower()
        if "critic" in lowered or "judge" in lowered:
            temperature = 0.1
        elif "strategist" in lowered:
            temperature = 0.5
        else:
            temperature = 0.3

        return LLM(
            model=model_name,
            api_key=settings.GEMINI_API_KEY,
            temperature=temperature,
        )
