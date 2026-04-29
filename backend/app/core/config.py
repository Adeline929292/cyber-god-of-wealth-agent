from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Cyber Caishen API"
    environment: str = "dev"

    api_prefix: str = "/api"

    database_url: str = "sqlite:///./data/app.db"

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    auto_create_db_dir: bool = True

    openai_api_key: str | None = None
    qwen_api_key: str | None = None
    deepseek_api_key: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
