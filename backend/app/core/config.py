from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pathlib import Path
import os

# Build the absolute path to the .env file, which is in the 'backend' directory.
# This file is in backend/app/core, so we go up three levels to get to the 'backend' root.
backend_root = Path(__file__).resolve().parent.parent.parent

# Determine which .env file to load
env_file = backend_root / '.env'
if os.getenv("ENVIRONMENT") == "test":
    env_file = backend_root / '.env.test'

load_dotenv(dotenv_path=env_file)

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    # These settings are loaded from the .env file and are required.
    # If a variable is not found, the app will fail to start.
    DATABASE_URL: str
    FIREBASE_SERVICE_ACCOUNT_JSON_PATH: str
    FIREBASE_PROJECT_ID: str
    CLIENT_ORIGIN_URL: str = "https://localhost:3000"
    REDIS_URL: str
    RESEND_API_KEY: str
    DEFAULT_FROM_EMAIL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SECRET_KEY: str
    CSRF_SECRET_KEY: str
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str

    # AI Service Keys
    GEMINI_API_KEY: str
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "duotrak-user-model-data"

    # Agent-specific Model Names
    FLASH_MODEL: str = "gemini-2.5-flash"
    PRO_MODEL: str = "gemini-2.5-pro"

    # Thinking Budget Configuration
    DEFAULT_THINKING_BUDGET: int = 8000
    MAX_THINKING_BUDGET: int = 32000

    # External Evaluation System
    ENABLE_EXTERNAL_EVALUATION: bool = True
    TEST_DATASET_PATH: str = "data/holistic_test_dataset.json"
    HISTORICAL_SNAPSHOT_WEEKS: int = 4

    # These are optional settings with default values
    PROJECT_NAME: str = "DuoTrak API"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] = ["http://127.0.0.1:3000"]
    # Keep this aligned with src/lib/auth.ts for web/mobile session continuity.
    SESSION_COOKIE_NAME: str = "__session"
    INTERNAL_API_SECRET: str  # Required for internal API communication with Next.js
    GOAL_CREATION_SESSION_TTL_SECONDS: int = 900
    AI_ORCHESTRATOR: str = "crewai"

    class Config:
        # Pydantic-settings will automatically search for a .env file.
        case_sensitive = True

# Create a single, reusable instance of the settings
settings = Settings()

# Create a dedicated settings class for the CSRF protector
class CsrfProtectSettings(BaseSettings):
    secret_key: str = settings.CSRF_SECRET_KEY

    class Config:
        case_sensitive = True
