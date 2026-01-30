# backend/app/services/gemini_service.py
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from app.core.config import settings

class GeminiService:
    """
    Manages the configuration and instantiation of Google Gemini models via LangChain.
    This service provides LLM instances to the CrewAI agents.
    """
    def __init__(self, api_key: str = settings.GEMINI_API_KEY):
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set in environment variables or .env file.")
        self.api_key = api_key

    def get_flash_model(self, use_zero_thinking_budget: bool = True) -> ChatGoogleGenerativeAI:
        """
        Gets a Gemini 2.5 Flash model instance, optimized for speed and cost.

        Args:
            use_zero_thinking_budget: If True, sets the thinking_budget to 0,
                                      ideal for classification or simple extraction tasks.
        
        Returns:
            An instance of ChatGoogleGenerativeAI configured for Gemini 2.5 Flash.
        """
        generation_config = {}
        if use_zero_thinking_budget:
            generation_config["thinking_budget"] = 0

        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=self.api_key,
            temperature=0.7,
            top_p=0.95,
            generation_config=generation_config if generation_config else None
        )

    def get_pro_model(self) -> ChatGoogleGenerativeAI:
        """
        Gets a Gemini 2.5 Pro model instance for complex reasoning,
        creative generation, and critical analysis tasks.
        """
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-pro",
            google_api_key=self.api_key,
            temperature=0.7,
            top_p=0.95
        )

    def get_embedding_model(self) -> GoogleGenerativeAIEmbeddings:
        """
        Gets the text embedding model.
        Using Google's 'text-embedding-004' which produces 768-dimension vectors,
        making it a perfect fit for the Pinecone index.
        """
        return GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=self.api_key
        )

# Singleton instance to be used across the application
gemini_service = GeminiService()
