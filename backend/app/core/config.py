from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pathlib import Path

# Build the absolute path to the .env file, which is in the 'backend' directory.
# This file is in backend/app/core, so we go up three levels to get to the 'backend' root.
# This is the most robust way to ensure the .env file is found.
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    # These settings are loaded from the .env file and are required.
    # If a variable is not found, the app will fail to start.
    DATABASE_URL: str
    FIREBASE_SERVICE_ACCOUNT_JSON_PATH: str
    FIREBASE_PROJECT_ID: str
    CLIENT_ORIGIN_URL: str = "http://localhost:3000"
    REDIS_URL: str
    RESEND_API_KEY: str
    DEFAULT_FROM_EMAIL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SECRET_KEY: str
    CSRF_SECRET_KEY: str

    # These are optional settings with default values
    PROJECT_NAME: str = "DuoTrak API"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] = ["http://127.0.0.1:3000"]

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
