from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database — defaults to SQLite for local dev; set DATABASE_URL for PostgreSQL in production
    database_url: str = "sqlite+aiosqlite:///./symposium.db"

    # GitHub Models API
    github_token: str = ""
    github_models_endpoint: str = "https://models.inference.ai.azure.com/chat/completions"
    default_model: str = "gpt-4o-mini"

    # OpenAI TTS
    openai_api_key: str = ""
    tts_provider: str = "edge-tts"  # "openai" or "edge-tts"

    # Admin
    admin_api_key: str = ""

    # Application
    app_env: str = "development"
    app_debug: bool = True
    cors_origins: str = "http://localhost:5173,https://max-montes.github.io"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
