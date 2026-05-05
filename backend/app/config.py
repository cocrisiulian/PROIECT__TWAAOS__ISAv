from pydantic_settings import BaseSettings
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/events_db"
    API_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Sistem de Management al Evenimentelor Universitare USV"

    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: int = 30
    EXPOSE_RESET_TOKEN_FOR_TESTING: bool = True

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/callback"

    UPLOAD_DIR: str = "./uploads"
    FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_RESET_PASSWORD_PATH: str = "/reset-password"

    class Config:
        env_file = (
            str(PROJECT_ROOT_DIR / ".env"),
            str(BACKEND_DIR / ".env"),
            ".env",
        )
        extra = "ignore"


settings = Settings()
