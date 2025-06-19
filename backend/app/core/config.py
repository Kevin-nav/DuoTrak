import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "DuoTrak API"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_JSON_PATH: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON_PATH", "")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Resend
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()
