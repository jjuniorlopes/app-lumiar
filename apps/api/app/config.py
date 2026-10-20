from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    # 🔐 Core
    debug: bool = False
    environment: str = "development"  # development, staging, production
    
    # 🗄️ Database
    database_url: str = "postgresql+psycopg2://lumiar:lumiar_dev_password@postgres:5432/lumiar"
    
    # 🔑 Security
    secret_key: str = "change-this-secret-in-production-MIN-32-CHARS"
    admin_initial_password: str = ""
    access_token_expire_minutes: int = 15  # 15 minutos
    refresh_token_expire_days: int = 30
    
    # 🌐 CORS & URLs
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    allowed_origins: List[str] = []
    public_url: str = "http://localhost:8001"
    mobile_app_url: str = "http://localhost:8001/api/v1/public/scan"
    
    # 🔴 Redis (Cache & Rate Limiting)
    redis_url: str = "redis://localhost:6379/0"
    redis_enabled: bool = True
    
    # 📊 Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_period: int = 60  # segundos
    
    # 📁 Storage
    storage_path: str = "uploads"
    max_upload_size_mb: int = 100
    
    # 🔌 External APIs
    ai_provider: str = "auto"
    google_api_key: str = ""
    ai_model: str = "gemini-2.5-flash"
    groq_api_key: str = ""
    groq_ai_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""
    openai_ai_model: str = "gpt-4o-mini"
    ai_timeout_seconds: float = Field(default=25.0, gt=0, le=120)
    ai_chat_max_output_tokens: int = Field(default=400, ge=64, le=2048)
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    # 💳 Stripe Billing
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_currency: str = "brl"
    stripe_success_url: str = "http://localhost:5173/?checkout=success"
    stripe_cancel_url: str = "http://localhost:5173/?checkout=cancelled"
    
    # 📊 Logging
    log_level: str = "INFO"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)

settings = Settings()

# Validar configurações críticas em produção
if settings.is_production:
    if settings.secret_key == "change-this-secret-in-production-MIN-32-CHARS":
        raise RuntimeError("SECRET_KEY ausente: configure uma chave segura nas Environment Variables do Render.")
    if len(settings.secret_key) < 32:
        raise RuntimeError("SECRET_KEY muito curta: use uma chave aleatória com pelo menos 32 caracteres.")
