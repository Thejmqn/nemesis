from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # Database settings
    database_type: Literal["sqlite", "mysql"] = "sqlite"
    database_url: str = "sqlite:///./nemesis.db"
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "nemesis"
    
    # Email settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    
    # App settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
