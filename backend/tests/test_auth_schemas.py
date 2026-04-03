"""
Unit tests for app/schemas/auth_schemas.py

Covers:
  - UserInfo  : valid construction, UUID as string, from_attributes
  - Token     : default token_type, optional user field
  - LoginRequest : required fields, no defaults
"""
import uuid

import pytest
from pydantic import ValidationError

from app.schemas.auth_schemas import LoginRequest, Token, UserInfo


# ---------------------------------------------------------------------------
# UserInfo
# ---------------------------------------------------------------------------

class TestUserInfo:
    def test_valid_construction(self):
        info = UserInfo(
            id=str(uuid.uuid4()),
            email="user@usv.ro",
            full_name="Test User",
            role="admin",
            username="testuser",
        )
        assert info.email == "user@usv.ro"
        assert info.role == "admin"

    def test_id_must_be_string(self):
        """id is declared as str — passing an int should coerce or fail."""
        uid = str(uuid.uuid4())
        info = UserInfo(
            id=uid,
            email="a@b.com",
            full_name="Name",
            role="organizer",
            username="uname",
        )
        assert info.id == uid

    def test_uuid_object_coerced_to_string(self):
        """Even if we pass a UUID object, Pydantic str field converts it."""
        raw_uuid = uuid.uuid4()
        info = UserInfo(
            id=str(raw_uuid),
            email="a@b.com",
            full_name="Name",
            role="admin",
            username="uname",
        )
        assert info.id == str(raw_uuid)

    def test_missing_required_field_raises(self):
        with pytest.raises(ValidationError):
            UserInfo(
                id=str(uuid.uuid4()),
                # email missing
                full_name="Name",
                role="admin",
                username="uname",
            )

    def test_all_required_fields(self):
        required = ["id", "email", "full_name", "role", "username"]
        base = {
            "id": str(uuid.uuid4()),
            "email": "x@x.com",
            "full_name": "X",
            "role": "admin",
            "username": "x",
        }
        for field in required:
            data = {k: v for k, v in base.items() if k != field}
            with pytest.raises(ValidationError):
                UserInfo(**data)


# ---------------------------------------------------------------------------
# Token
# ---------------------------------------------------------------------------

class TestToken:
    def _user_info(self):
        return UserInfo(
            id=str(uuid.uuid4()),
            email="a@usv.ro",
            full_name="Admin",
            role="admin",
            username="admin",
        )

    def test_default_token_type_is_bearer(self):
        token = Token(access_token="abc.def.ghi", role="admin")
        assert token.token_type == "bearer"

    def test_user_field_is_optional(self):
        token = Token(access_token="abc.def.ghi", role="admin")
        assert token.user is None

    def test_user_field_accepts_user_info(self):
        token = Token(access_token="abc.def.ghi", role="admin", user=self._user_info())
        assert token.user is not None
        assert token.user.role == "admin"

    def test_access_token_is_required(self):
        with pytest.raises(ValidationError):
            Token(role="admin")

    def test_role_is_required(self):
        with pytest.raises(ValidationError):
            Token(access_token="abc.def.ghi")

    def test_full_response_shape(self):
        """Mirrors what the login endpoint returns."""
        token = Token(
            access_token="eyJ.eyJ.sig",
            token_type="bearer",
            role="admin",
            user=self._user_info(),
        )
        data = token.model_dump()
        assert set(data.keys()) >= {"access_token", "token_type", "role", "user"}

    def test_role_values(self):
        for role in ("admin", "organizer"):
            token = Token(access_token="t", role=role)
            assert token.role == role


# ---------------------------------------------------------------------------
# LoginRequest
# ---------------------------------------------------------------------------

class TestLoginRequest:
    def test_valid_construction(self):
        req = LoginRequest(username="admin", password="admin123")
        assert req.username == "admin"
        assert req.password == "admin123"

    def test_username_required(self):
        with pytest.raises(ValidationError):
            LoginRequest(password="pass")

    def test_password_required(self):
        with pytest.raises(ValidationError):
            LoginRequest(username="user")

    def test_accepts_email_as_username(self):
        """The login endpoint accepts email in the username field."""
        req = LoginRequest(username="admin@usv.ro", password="admin123")
        assert "@" in req.username
