import os


class Settings:
    app_name: str = "Sahayak CPGRAMS"
    app_env: str = os.getenv("APP_ENV", "development")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3001")
    database_url: str = os.getenv("DATABASE_URL", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-only-change-me")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    ai_model: str = os.getenv("AI_MODEL", "gemini-2.0-flash")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    openai_realtime_model: str = os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
