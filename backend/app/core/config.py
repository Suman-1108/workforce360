from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Enterprise Application Settings loaded from Environment Variables."""

    APP_NAME: str = "WorkForce 360"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "wf360_super_secret_jwt_key_98a76d54c32b10fe87ba65dc43210987"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database Configuration (MySQL 8.0.46)
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "workforce_app"
    DB_PASSWORD: str = "Root123"
    DB_NAME: str = "workforce360"
    DATABASE_URL: str = ""

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None], info) -> str:
        if isinstance(v, str) and v.startswith("mysql"):
            return v
        data = info.data
        user = data.get("DB_USER", "workforce_app")
        password = data.get("DB_PASSWORD", "Root123")
        host = data.get("DB_HOST", "127.0.0.1")
        port = data.get("DB_PORT", 3306)
        db = data.get("DB_NAME", "workforce360")
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{db}?charset=utf8mb4"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        elif isinstance(v, list):
            return v
        return []

    # Gmail SMTP Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = "hellosuman29@gmail.com"
    SMTP_PASSWORD: str = "slqoycomlvzjhvjq"
    SMTP_FROM_EMAIL: str = "hellosuman29@gmail.com"
    SMTP_FROM_NAME: str = "WorkForce 360"
    SMTP_SSL: bool = True

    # Cloudinary Image Storage Configuration
    CLOUDINARY_CLOUD_NAME: str = "Root"
    CLOUDINARY_API_KEY: str = "213666385561332"
    CLOUDINARY_API_SECRET: str = "gJhclMWSRdKuPv8HnH4rM5Nus1I"

    # Geoapify Geolocation Configuration
    GEOAPIFY_API_KEY: str = "f82bddd7501c4bfa918f4987a3844cfc"

    # Razorpay Payment Gateway Configuration
    RAZORPAY_KEY_ID: str = "rzp_test_U0wstPiJpFsNk0"
    RAZORPAY_KEY_SECRET: str = "TdhykvW0lnGWoiq1ZwK6b2Vz"
    RAZORPAY_MODE: str = "test"

    # Security & Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 120

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
