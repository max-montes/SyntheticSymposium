from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = (
        "postgresql+asyncpg://symposium:symposium_dev@localhost:5432/synthetic_symposium"
    )

    # GitHub Models API
    github_token: str = ""
    github_models_endpoint: str = "https://models.github.ai/inference/chat/completions"
    default_model: str = "openai/gpt-4.1"

    # ElevenLabs TTS
    elevenlabs_api_key: str = ""

    # Application
    app_env: str = "development"
    app_debug: bool = True
    cors_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
