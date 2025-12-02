from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_KEY: str = "nocturnal-secret-key"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://nocturnal.vercel.app"]

    class Config:
        env_file = ".env"

settings = Settings()
