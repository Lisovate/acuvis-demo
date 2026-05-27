from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env-driven configuration. `.env` is read at the project root if present."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = f"sqlite:///{Path(__file__).resolve().parent.parent / 'data' / 'app.sqlite'}"
    jwt_secret: str = "dev-only-not-for-prod"
    jwt_algorithm: str = "HS256"
    jwt_ttl_seconds: int = 60 * 60 * 24 * 7  # one week
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
