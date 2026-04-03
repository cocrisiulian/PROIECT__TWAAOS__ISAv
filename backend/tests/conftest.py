"""
Shared test fixtures for backend tests.

Avoids importing main.py directly (which connects to PostgreSQL on startup)
by building a minimal FastAPI test app with only the required router.
"""
import uuid
from unittest.mock import MagicMock
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.database import get_db
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.routers.auth import router as auth_router


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(
    username="testadmin",
    email="testadmin@usv.ro",
    password="testpass123",
    role=UserRole.admin,
    is_active=True,
):
    """Build a User MagicMock with all required attributes for auth tests."""
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.username = username
    user.email = email
    user.hashed_password = hash_password(password)
    user.full_name = "Test User"
    user.role = role
    user.is_active = is_active
    return user


def make_test_app():
    """Minimal FastAPI app with only the auth router — no DB init on startup."""
    test_app = FastAPI()
    test_app.include_router(auth_router, prefix="/api/v1")
    return test_app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def test_app():
    return make_test_app()


@pytest.fixture
def admin_user():
    return make_user(username="admin", email="admin@usv.ro", password="admin123", role=UserRole.admin)


@pytest.fixture
def organizer_user():
    return make_user(
        username="organizator",
        email="org@usv.ro",
        password="org123",
        role=UserRole.organizer,
    )


@pytest.fixture
def inactive_user():
    return make_user(
        username="inactive",
        email="inactive@usv.ro",
        password="pass123",
        is_active=False,
    )


@pytest.fixture
def mock_db():
    """Minimal SQLAlchemy Session mock — configure per-test as needed."""
    return MagicMock()


@pytest.fixture
def client_for(test_app, mock_db):
    """
    Returns a factory that creates a TestClient whose mock DB returns the given user.

    Usage in a test:
        def test_something(client_for, admin_user):
            client = client_for(admin_user)
            response = client.post(...)
    """
    def _make_client(user):
        mock_db.query.return_value.filter.return_value.first.return_value = user

        def override_get_db():
            yield mock_db

        test_app.dependency_overrides[get_db] = override_get_db
        return TestClient(test_app)

    yield _make_client
    test_app.dependency_overrides.clear()
