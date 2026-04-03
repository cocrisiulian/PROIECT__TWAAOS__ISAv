"""
Unit tests for app/core/security.py

Covers:
  - hash_password  : hashes are non-empty, different salts per call
  - verify_password: correct password passes, wrong password fails
  - create_access_token: returns a decodable JWT with correct payload
  - decode_access_token: valid token → payload; tampered/expired token → None
"""
import time
from datetime import timedelta

import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


# ---------------------------------------------------------------------------
# hash_password
# ---------------------------------------------------------------------------

class TestHashPassword:
    def test_returns_non_empty_string(self):
        result = hash_password("mypassword")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_hash_is_not_plain_text(self):
        pw = "secret123"
        assert hash_password(pw) != pw

    def test_two_hashes_of_same_password_differ(self):
        """bcrypt generates a new salt each time."""
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2

    def test_hash_starts_with_bcrypt_prefix(self):
        result = hash_password("anypassword")
        assert result.startswith("$2b$") or result.startswith("$2a$")


# ---------------------------------------------------------------------------
# verify_password
# ---------------------------------------------------------------------------

class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        pw = "correct_password"
        hashed = hash_password(pw)
        assert verify_password(pw, hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_empty_password_does_not_match_non_empty_hash(self):
        hashed = hash_password("notempty")
        assert verify_password("", hashed) is False

    def test_case_sensitive(self):
        hashed = hash_password("Password")
        assert verify_password("password", hashed) is False
        assert verify_password("PASSWORD", hashed) is False

    def test_verify_after_hash_roundtrip(self):
        passwords = ["admin123", "org123", "P@ssw0rd!", "unicode_ăîâșț"]
        for pw in passwords:
            assert verify_password(pw, hash_password(pw)), f"Failed for: {pw}"


# ---------------------------------------------------------------------------
# create_access_token
# ---------------------------------------------------------------------------

class TestCreateAccessToken:
    def test_returns_string(self):
        token = create_access_token({"sub": "user-id", "role": "admin"})
        assert isinstance(token, str)
        assert len(token) > 0

    def test_token_has_three_parts(self):
        """JWT format: header.payload.signature"""
        token = create_access_token({"sub": "abc"})
        parts = token.split(".")
        assert len(parts) == 3

    def test_payload_is_preserved(self):
        data = {"sub": "user-123", "role": "admin"}
        token = create_access_token(data)
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["role"] == "admin"

    def test_expiry_is_set(self):
        token = create_access_token({"sub": "x"})
        payload = decode_access_token(token)
        assert payload is not None
        assert "exp" in payload

    def test_custom_expiry_delta(self):
        short_token = create_access_token({"sub": "x"}, expires_delta=timedelta(seconds=5))
        long_token = create_access_token({"sub": "x"}, expires_delta=timedelta(hours=8))
        short_payload = decode_access_token(short_token)
        long_payload = decode_access_token(long_token)
        assert short_payload is not None
        assert long_payload is not None
        assert long_payload["exp"] > short_payload["exp"]


# ---------------------------------------------------------------------------
# decode_access_token
# ---------------------------------------------------------------------------

class TestDecodeAccessToken:
    def test_valid_token_returns_payload(self):
        token = create_access_token({"sub": "abc", "role": "organizer"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "abc"

    def test_invalid_token_returns_none(self):
        assert decode_access_token("not.a.valid.jwt") is None

    def test_tampered_token_returns_none(self):
        token = create_access_token({"sub": "abc"})
        tampered = token[:-5] + "XXXXX"
        assert decode_access_token(tampered) is None

    def test_empty_string_returns_none(self):
        assert decode_access_token("") is None

    def test_expired_token_returns_none(self):
        token = create_access_token({"sub": "x"}, expires_delta=timedelta(seconds=-1))
        assert decode_access_token(token) is None
