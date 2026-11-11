import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "CustomerOps AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # LLM Settings
    GEMINI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-1.5-flash"
    
    # Database Settings (Defaults to SQLite for instant local run, or PostgreSQL in Docker)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./customerops.db")
    
    # Salesforce Settings
    SALESFORCE_ENABLED: bool = os.getenv("SALESFORCE_ENABLED", "false").lower() == "true"
    SALESFORCE_INSTANCE_URL: Optional[str] = os.getenv("SALESFORCE_INSTANCE_URL", None)
    SALESFORCE_ACCESS_TOKEN: Optional[str] = os.getenv("SALESFORCE_ACCESS_TOKEN", None)
    
    # HITL Safety Thresholds
    REFUND_APPROVAL_THRESHOLD_USD: float = 50.0
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

