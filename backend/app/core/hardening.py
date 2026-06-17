from __future__ import annotations

from app.config import settings


DEFAULT_SECRET_KEY = "change-me-in-production-use-a-long-random-string"


def is_production_environment() -> bool:
    return settings.APP_ENV.strip().lower() == "production"


def get_allowed_hosts() -> list[str]:
    hosts = [host.strip() for host in settings.ALLOWED_HOSTS.split(",")]
    return [host for host in hosts if host]


def should_redirect_https() -> bool:
    return is_production_environment() or settings.FORCE_HTTPS_REDIRECT


def validate_production_settings() -> None:
    if not is_production_environment():
        return

    secret_key = settings.SECRET_KEY.strip()
    if not secret_key or secret_key == DEFAULT_SECRET_KEY or len(secret_key) < 32:
        raise RuntimeError(
            "SECRET_KEY must be set to a unique, random value before starting in production"
        )