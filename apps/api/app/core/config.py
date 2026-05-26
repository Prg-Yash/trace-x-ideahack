from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "G-TEN Platform"
    API_V1_STR: str = "/api/v1"

    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str

    class Config:
        env_file = ".env"

settings = Settings()
