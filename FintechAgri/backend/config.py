"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AgroMind application settings. Loaded from .env or defaults."""

    DATABASE_URL: str = "sqlite:///./agromind.db"
    SECRET_KEY: str = "agromind-uat-secret-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for UAT
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
