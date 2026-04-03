"""
Integration tests for POST /api/v1/auth/login

Uses a minimal FastAPI app (no DB init on startup) with a mocked SQLAlchemy
session, so no PostgreSQL instance is needed.

Tested scenarios:
  - successful login with username
  - successful login with email (same field)
  - wrong password → 401
  - nonexistent user → 401
  - inactive account → 403
  - missing fields → 422
  - response shape: access_token, token_type, role, user object
  - returned JWT is decodable and contains correct sub + role
  - organizer login returns role=organizer
"""
import pytest
from fastapi.testclient import TestClient

from app.core.security import decode_access_token
from app.models.user import UserRole
from tests.conftest import make_test_app, make_user
from app.database import get_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_client(user):
    """Create a fresh TestClient whose mock DB returns the given user."""
    from unittest.mock import MagicMock

    app = make_test_app()
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = user

    def override():
        yield mock_db

    app.dependency_overrides[get_db] = override
    return TestClient(app)


# ---------------------------------------------------------------------------
# Successful login
# ---------------------------------------------------------------------------

class TestLoginSuccess:
    def test_login_with_username_returns_200(self):
        user = make_user(username="admin", password="admin123", role=UserRole.admin)
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        assert res.status_code == 200

    def test_login_with_email_returns_200(self):
        """Login endpoint accepts email in the username field."""
        user = make_user(username="admin", email="admin@usv.ro", password="admin123")
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin@usv.ro", "password": "admin123"})
        assert res.status_code == 200

    def test_response_has_access_token(self):
        user = make_user(password="admin123")
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        data = res.json()
        assert "access_token" in data
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 10

    def test_response_token_type_is_bearer(self):
        user = make_user(password="admin123")
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        assert res.json()["token_type"] == "bearer"

    def test_response_role_matches_user(self):
        user = make_user(password="admin123", role=UserRole.admin)
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        assert res.json()["role"] == "admin"

    def test_response_user_object_present(self):
        user = make_user(password="admin123", role=UserRole.admin)
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        user_obj = res.json().get("user")
        assert user_obj is not None
        assert "id" in user_obj
        assert "email" in user_obj
        assert "full_name" in user_obj
        assert "role" in user_obj
        assert "username" in user_obj

    def test_response_user_id_is_string(self):
        """UUID must come back as string, not integer."""
        user = make_user(password="admin123")
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        uid = res.json()["user"]["id"]
        assert isinstance(uid, str)
        assert "-" in uid  # UUID format

    def test_jwt_payload_has_correct_sub_and_role(self):
        user = make_user(password="admin123", role=UserRole.admin)
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        token = res.json()["access_token"]
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == str(user.id)
        assert payload["role"] == "admin"

    def test_organizer_login_returns_organizer_role(self):
        user = make_user(username="org", password="org123", role=UserRole.organizer)
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "org", "password": "org123"})
        assert res.status_code == 200
        assert res.json()["role"] == "organizer"


# ---------------------------------------------------------------------------
# Authentication failures
# ---------------------------------------------------------------------------

class TestLoginFailures:
    def test_wrong_password_returns_401(self):
        user = make_user(password="correctpass")
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrongpass"})
        assert res.status_code == 401

    def test_wrong_password_error_detail(self):
        user = make_user(password="correctpass")
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrongpass"})
        assert "detail" in res.json()

    def test_nonexistent_user_returns_401(self):
        """DB returns None (user not found) → 401."""
        app = make_test_app()
        from unittest.mock import MagicMock
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        app.dependency_overrides[get_db] = lambda: iter([mock_db])

        def override():
            yield mock_db

        app.dependency_overrides[get_db] = override
        client = TestClient(app)
        res = client.post("/api/v1/auth/login", json={"username": "ghost", "password": "pass"})
        assert res.status_code == 401

    def test_inactive_account_returns_403(self):
        user = make_user(password="pass123", is_active=False)
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "inactive", "password": "pass123"})
        assert res.status_code == 403

    def test_inactive_account_detail_message(self):
        user = make_user(password="pass123", is_active=False)
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "inactive", "password": "pass123"})
        assert "deactivated" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

class TestLoginValidation:
    def test_missing_password_returns_422(self):
        user = make_user()
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"username": "admin"})
        assert res.status_code == 422

    def test_missing_username_returns_422(self):
        user = make_user()
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={"password": "pass"})
        assert res.status_code == 422

    def test_empty_body_returns_422(self):
        user = make_user()
        client = make_client(user)
        res = client.post("/api/v1/auth/login", json={})
        assert res.status_code == 422

    def test_non_json_body_returns_422(self):
        user = make_user()
        client = make_client(user)
        res = client.post("/api/v1/auth/login", data="not json", headers={"Content-Type": "text/plain"})
        assert res.status_code in (422, 400)
