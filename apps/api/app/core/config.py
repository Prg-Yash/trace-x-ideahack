from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parents[2]
ROOT_DIR = Path(__file__).resolve().parents[4]
API_ENV = API_DIR / ".env"
ROOT_ENV = ROOT_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "TRACE-X"
    API_V1_STR: str = "/api/v1"

    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str
    GEMINI_API_KEY: str | None = None
    DATABASE_URL: str
    SECRET_KEY: str  # Must be set in .env — no insecure default
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    OPEN_ROUTER_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=(str(ROOT_ENV), str(API_ENV)), extra="ignore")

settings = Settings()
