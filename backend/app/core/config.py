from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    ENV: str# = "development"
    DEBUG: bool# = True
    
    # Feature Flags
    PHONE_VERIFICATION_ENABLED: bool# = False
    USE_MOCK_SERVICES: bool# = True
    AUTO_APPROVE_DOCUMENTS: bool# = True
    ALLOW_EMAIL_AUTH: bool# = True
    MOCK_OTP_CODE: str# = "123456"
    SHOW_DEV_BANNER: bool# = True
    
    # Database
    MONGODB_URL: str #= "mongodb://localhost:27007"
    MONGODB_DATABASE: str #= "domecare_dev"
    
    # JWT
    JWT_SECRET_KEY: str# = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str# = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int# = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int# = 30
    
    # CORS
    CORS_ORIGINS: List[str]# = ["http://localhost:3000"]
    
    # Redis
    REDIS_URL: Optional[str]# = None
    
    # Email
    SMTP_HOST: Optional[str]# = None
    SMTP_PORT: Optional[int]# = 587
    SMTP_USER: Optional[str]# = None
    SMTP_PASSWORD: Optional[str]# = None
    
    # File Upload
    MAX_FILE_SIZE: int# = 10485760  # 10MB
    ALLOWED_EXTENSIONS: List[str]# = ["jpg", "jpeg", "png", "pdf"]
    
    # API Documentation
    SHOW_DOCS: bool# = True
    DOCS_URL: str# = "/docs"
    REDOC_URL: str# = "/redoc"
    
    # OTP Settings
    OTP_LENGTH: int = 6
    OTP_EXPIRY_MINUTES: int = 10
    MAX_OTP_ATTEMPTS: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

settings = get_settings()