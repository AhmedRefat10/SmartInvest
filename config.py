from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env file if present


def _clean_env(name):
    value = os.environ.get(name, '').strip()
    if value.lower() in {'', 'your_key_here', 'your_api_key_here', 'replace_me'}:
        return ''
    return value


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'smartinvest-secret-2024-change-in-production')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'smartinvest-jwt-secret-2024')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///smartinvest.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    CORS_HEADERS = 'Content-Type'
    AI_API_KEY = (
        _clean_env('AI_API_KEY')
        or _clean_env('GROQ_API_KEY')
        or _clean_env('DEEPSEEK_API_KEY')
        or _clean_env('OPENAI_API_KEY')
    )
    DEEPSEEK_API_KEY = AI_API_KEY  # backward-compatible name used by routes
    AI_BASE_URL = os.environ.get('AI_BASE_URL', 'https://api.groq.com/openai/v1').strip()
    AI_MODEL = os.environ.get('AI_MODEL', 'llama-3.3-70b-versatile').strip()
