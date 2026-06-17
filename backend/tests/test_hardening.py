"""Tests for production hardening helpers."""

from unittest.mock import patch

import pytest

from app.core.hardening import (
    DEFAULT_SECRET_KEY,
    get_allowed_hosts,
    is_production_environment,
    should_redirect_https,
    validate_production_settings,
)
from app.config import settings


class TestHardeningHelpers:
    def test_non_production_does_not_require_secret_key(self):
        with patch.object(settings, "APP_ENV", "development"):
            with patch.object(settings, "SECRET_KEY", DEFAULT_SECRET_KEY):
                validate_production_settings()

    def test_production_rejects_default_secret_key(self):
        with patch.object(settings, "APP_ENV", "production"):
            with patch.object(settings, "SECRET_KEY", DEFAULT_SECRET_KEY):
                with pytest.raises(RuntimeError, match="SECRET_KEY must be set"):
                    validate_production_settings()

    def test_production_rejects_short_secret_key(self):
        with patch.object(settings, "APP_ENV", "production"):
            with patch.object(settings, "SECRET_KEY", "too-short-secret"):
                with pytest.raises(RuntimeError, match="SECRET_KEY must be set"):
                    validate_production_settings()

    def test_production_accepts_strong_secret_key(self):
        with patch.object(settings, "APP_ENV", "production"):
            with patch.object(settings, "SECRET_KEY", "a-strong-secret-key-that-is-long-enough-123"):
                validate_production_settings()

    def test_allowed_hosts_are_parsed(self):
        with patch.object(settings, "ALLOWED_HOSTS", "example.com, api.example.com , localhost"):
            assert get_allowed_hosts() == ["example.com", "api.example.com", "localhost"]

    def test_https_redirect_is_enabled_in_production(self):
        with patch.object(settings, "APP_ENV", "production"):
            with patch.object(settings, "FORCE_HTTPS_REDIRECT", False):
                assert should_redirect_https() is True

    def test_https_redirect_can_be_forced_in_dev(self):
        with patch.object(settings, "APP_ENV", "development"):
            with patch.object(settings, "FORCE_HTTPS_REDIRECT", True):
                assert should_redirect_https() is True

    def test_is_production_environment(self):
        with patch.object(settings, "APP_ENV", "production"):
            assert is_production_environment() is True
        with patch.object(settings, "APP_ENV", "development"):
            assert is_production_environment() is False
