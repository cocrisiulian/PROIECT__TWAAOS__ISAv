import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.database import get_db

def test_signup_success(test_app, mock_db):
    # Setup mock so no user exists when checking for duplicates
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    def override_get_db():
        yield mock_db
        
    test_app.dependency_overrides[get_db] = override_get_db
    client = TestClient(test_app)
    
    response = client.post("/api/v1/auth/signup", json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "strongpassword123",
        "full_name": "New User"
    })
    
    assert response.status_code == 201
    assert "access_token" in response.json()
    assert mock_db.add.called
    assert mock_db.commit.called

def test_signup_duplicate_username(test_app, mock_db, admin_user):
    # Setup mock to return an existing user to trigger conflict
    def side_effect(*args, **kwargs):
        mock_qs = MagicMock()
        mock_qs.first.return_value = admin_user
        return mock_qs
    # We only need the first call (by username) to return the user
    mock_db.query.return_value.filter.return_value.first.return_value = admin_user
    
    def override_get_db():
        yield mock_db
        
    test_app.dependency_overrides[get_db] = override_get_db
    client = TestClient(test_app)
    
    response = client.post("/api/v1/auth/signup", json={
        "username": "admin",
        "email": "different@example.com",
        "password": "strongpassword123",
        "full_name": "Admin Clone"
    })
    
    assert response.status_code == 409
    assert response.json()["detail"] == "Username already exists"

def test_logout(test_app):
    client = TestClient(test_app)
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"detail": "Logged out successfully"}

def test_request_password_reset_success(test_app, mock_db, admin_user):
    mock_db.query.return_value.filter.return_value.first.return_value = admin_user
    
    def override_get_db():
        yield mock_db
        
    test_app.dependency_overrides[get_db] = override_get_db
    client = TestClient(test_app)
    
    response = client.post("/api/v1/auth/password/forgot", json={
        "email": admin_user.email
    })
    
    assert response.status_code == 200
    assert "a password reset link has been generated" in response.json()["detail"]

def test_request_password_reset_not_found(test_app, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    def override_get_db():
        yield mock_db
        
    test_app.dependency_overrides[get_db] = override_get_db
    client = TestClient(test_app)
    
    response = client.post("/api/v1/auth/password/forgot", json={
        "email": "nobody@example.com"
    })
    
    # Still returns 200 to prevent email enumeration
    assert response.status_code == 200
    assert "a password reset link has been generated" in response.json()["detail"]
