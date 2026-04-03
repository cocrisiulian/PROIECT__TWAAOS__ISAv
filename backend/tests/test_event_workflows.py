"""
Integration tests for complete event workflows:
  - Organizer creates event (draft) → submits for approval (pending_approval)
  - Admin approves event (published)
  - Student registers for event
  - Student unregisters from event

Uses FastAPI TestClient with mocked database.
"""
import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.event import Event, EventStatus, ParticipationMode
from app.models.event_registration import EventRegistration, RegistrationStatus
from app.core.security import hash_password, create_access_token
from app.core.dependencies import get_current_user, get_current_student, get_current_user_payload
from tests.conftest import make_test_app


# =========================================================================
# Helpers
# =========================================================================

def make_admin():
    admin = MagicMock(spec=User)
    admin.id = uuid.uuid4()
    admin.username = "admin"
    admin.email = "admin@usv.ro"
    admin.full_name = "Admin Test"
    admin.role = UserRole.admin
    admin.is_active = True
    admin.hashed_password = hash_password("admin123")
    return admin


def make_organizer():
    org = MagicMock(spec=User)
    org.id = uuid.uuid4()
    org.username = "organizator"
    org.email = "organizator@usv.ro"
    org.full_name = "Organizer Test"
    org.role = UserRole.organizer
    org.is_active = True
    org.hashed_password = hash_password("org123")
    return org


def make_student():
    student = MagicMock(spec=Student)
    student.id = uuid.uuid4()
    student.email = "student@student.usv.ro"
    student.full_name = "Student Test"
    student.google_sub = "test-google-sub"
    student.avatar_url = None
    return student


def make_event(organizer_id, title="Test Event", status=EventStatus.draft):
    event = MagicMock(spec=Event)
    event.id = uuid.uuid4()
    event.title = title
    event.description = "Test event description"
    event.start_datetime = datetime.utcnow() + timedelta(days=7)
    event.end_datetime = datetime.utcnow() + timedelta(days=7, hours=2)
    event.location = "Test Location"
    event.participation_mode = ParticipationMode.physical
    event.is_free = True
    event.requires_registration = True
    event.max_participants = None
    event.status = status
    event.organizer_id = organizer_id
    event.approved_by_id = None
    event.approved_at = None
    event.rejection_reason = None
    event.organizer = MagicMock()
    event.organizer.id = organizer_id
    event.organizer.full_name = "Organizer Test"
    event.faculty = None
    event.department = None
    event.category = None
    event.materials = []
    return event


def make_client_with_auth(app, user, is_student=False):
    """Create TestClient configured for authenticated requests."""
    token = create_access_token(
        {"sub": str(user.id), "role": "student" if is_student else user.role.value}
    )
    payload = {"sub": str(user.id), "role": "student" if is_student else user.role.value}

    mock_db = MagicMock()

    if is_student:
        def override_get_current_student():
            return user

        app.dependency_overrides[get_current_student] = override_get_current_student
    else:
        def override_get_current_user():
            return user

        app.dependency_overrides[get_current_user] = override_get_current_user

    def override_get_current_user_payload():
        return payload

    app.dependency_overrides[get_current_user_payload] = override_get_current_user_payload
    app.dependency_overrides[get_db] = lambda: iter([mock_db])

    client = TestClient(app)
    client.headers = {"Authorization": f"Bearer {token}"}
    client.mock_db = mock_db
    client.user = user
    return client, mock_db


# =========================================================================
# Tests
# =========================================================================

class TestEventCreationWorkflow:
    """Organizer creates a draft event, submits it; admin approves."""

    def test_organizer_creates_draft_event(self):
        app = make_test_app()
        org = make_organizer()
        client, mock_db = make_client_with_auth(app, org)

        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()

        event_data = {
            "title": "Conferință Organizator Test",
            "description": "Test event submission",
            "start_datetime": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "end_datetime": (datetime.utcnow() + timedelta(days=7, hours=2)).isoformat(),
            "location": "Test Hall",
            "participation_mode": "physical",
            "is_free": True,
            "requires_registration": True,
        }

        response = client.post("/api/v1/organizer/events", json=event_data)
        assert response.status_code == 201
        assert response.json()["status"] == "draft"
        assert response.json()["title"] == "Conferință Organizator Test"

    def test_organizer_submits_event_for_approval(self):
        app = make_test_app()
        org = make_organizer()
        client, mock_db = make_client_with_auth(app, org)

        event = make_event(org.id, status=EventStatus.draft)
        mock_db.query.return_value.filter.return_value.first.return_value = event

        response = client.patch(f"/api/v1/organizer/events/{event.id}/submit")
        assert response.status_code == 200
        assert event.status == EventStatus.pending_approval

    def test_admin_lists_pending_events(self):
        app = make_test_app()
        admin = make_admin()
        client, mock_db = make_client_with_auth(app, admin)

        org = make_organizer()
        pending_event = make_event(org.id, status=EventStatus.pending_approval)

        mock_db.query.return_value.options.return_value.filter.return_value.count.return_value = 1
        mock_db.query.return_value.options.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [
            pending_event
        ]

        response = client.get("/api/v1/admin/events/pending")
        assert response.status_code == 200
        assert response.json()["total"] == 1

    def test_admin_approves_event(self):
        app = make_test_app()
        admin = make_admin()
        client, mock_db = make_client_with_auth(app, admin)

        org = make_organizer()
        pending_event = make_event(org.id, status=EventStatus.pending_approval)
        mock_db.query.return_value.filter.return_value.first.return_value = pending_event

        response = client.post(f"/api/v1/admin/events/{pending_event.id}/approve")
        assert response.status_code == 200
        assert pending_event.status == EventStatus.published
        assert pending_event.approved_by_id == admin.id

    def test_admin_rejects_event(self):
        app = make_test_app()
        admin = make_admin()
        client, mock_db = make_client_with_auth(app, admin)

        org = make_organizer()
        pending_event = make_event(org.id, status=EventStatus.pending_approval)
        mock_db.query.return_value.filter.return_value.first.return_value = pending_event

        reject_data = {"reason": "Event description is too vague"}
        response = client.post(f"/api/v1/admin/events/{pending_event.id}/reject", json=reject_data)
        assert response.status_code == 200
        assert pending_event.status == EventStatus.rejected
        assert pending_event.rejection_reason == "Event description is too vague"


class TestStudentEventRegistration:
    """Student registers for, and unregisters from published events."""

    def test_student_registers_for_event(self):
        app = make_test_app()
        student = make_student()
        client, mock_db = make_client_with_auth(app, student, is_student=True)

        org = make_organizer()
        published_event = make_event(org.id, status=EventStatus.published)

        def query_side_effect():
            mock = MagicMock()
            mock.filter.return_value.first.side_effect = [
                published_event,  # First call: find event
                None,  # Second call: no existing registration
            ]
            return mock

        mock_db.query.side_effect = query_side_effect
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0

        response = client.post(f"/api/v1/events/{published_event.id}/register")
        assert response.status_code == 200
        assert "registered successfully" in response.json()["detail"].lower() or \
               response.json().get("status") == "registered"

    def test_student_unregisters_from_event(self):
        app = make_test_app()
        student = make_student()
        client, mock_db = make_client_with_auth(app, student, is_student=True)

        org = make_organizer()
        published_event = make_event(org.id, status=EventStatus.published)
        registration = MagicMock(spec=EventRegistration)
        registration.id = uuid.uuid4()
        registration.event_id = published_event.id
        registration.student_id = student.id
        registration.status = RegistrationStatus.registered

        mock_db.query.return_value.filter.return_value.first.return_value = registration

        response = client.delete(f"/api/v1/events/{published_event.id}/register")
        assert response.status_code == 200
        assert "unregistered successfully" in response.json()["detail"].lower()
        mock_db.delete.assert_called_once()

    def test_student_cannot_register_twice(self):
        app = make_test_app()
        student = make_student()
        client, mock_db = make_client_with_auth(app, student, is_student=True)

        org = make_organizer()
        published_event = make_event(org.id, status=EventStatus.published)
        existing_registration = MagicMock(spec=EventRegistration)

        def query_side_effect():
            mock = MagicMock()
            mock.filter.return_value.first.side_effect = [
                published_event,  # First call: find event
                existing_registration,  # Second call: registration exists
            ]
            return mock

        mock_db.query.side_effect = query_side_effect

        response = client.post(f"/api/v1/events/{published_event.id}/register")
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"].lower()

    def test_student_joins_waitlist_when_event_full(self):
        app = make_test_app()
        student = make_student()
        client, mock_db = make_client_with_auth(app, student, is_student=True)

        org = make_organizer()
        published_event = make_event(org.id, status=EventStatus.published)
        published_event.max_participants = 2

        def query_side_effect():
            mock = MagicMock()
            mock.filter.return_value.first.side_effect = [
                published_event,  # First call: find event
                None,  # Second call: no existing registration
            ]
            return mock

        mock_db.query.side_effect = query_side_effect
        mock_db.query.return_value.filter.return_value.scalar.return_value = 2  # Full

        response = client.post(f"/api/v1/events/{published_event.id}/register")
        assert response.status_code == 200
        assert "waitlist" in response.json()["detail"].lower() or \
               response.json().get("status") == "waitlist"


class TestOrganizerEventManagement:
    """Organizer features: list, get, update, cancel events."""

    def test_organizer_lists_own_events(self):
        app = make_test_app()
        org = make_organizer()
        client, mock_db = make_client_with_auth(app, org)

        event1 = make_event(org.id, "Event 1", EventStatus.draft)
        event2 = make_event(org.id, "Event 2", EventStatus.published)

        mock_db.query.return_value.options.return_value.filter.return_value.count.return_value = 2
        mock_db.query.return_value.options.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [
            event1, event2
        ]
        mock_db.query.return_value.filter.return_value.group_by.return_value.all.return_value = []

        response = client.get("/api/v1/organizer/events")
        assert response.status_code == 200
        assert response.json()["total"] == 2

    def test_organizer_gets_own_event(self):
        app = make_test_app()
        org = make_organizer()
        client, mock_db = make_client_with_auth(app, org)

        event = make_event(org.id, status=EventStatus.draft)
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = event

        response = client.get(f"/api/v1/organizer/events/{event.id}")
        assert response.status_code == 200
        assert response.json()["title"] == event.title

    def test_organizer_cannot_get_other_event(self):
        app = make_test_app()
        org1 = make_organizer()
        org2 = make_organizer()
        org2.id = uuid.uuid4()
        org2.username = "org2"
        
        client, mock_db = make_client_with_auth(app, org1)

        event = make_event(org2.id, status=EventStatus.draft)
        mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = event

        response = client.get(f"/api/v1/organizer/events/{event.id}")
        assert response.status_code == 403

    def test_organizer_updates_draft_event(self):
        app = make_test_app()
        org = make_organizer()
        client, mock_db = make_client_with_auth(app, org)

        event = make_event(org.id, status=EventStatus.draft)
        mock_db.query.return_value.filter.return_value.first.return_value = event

        update_data = {
            "title": "Updated Event Title",
            "description": "Updated description",
            "start_datetime": (datetime.utcnow() + timedelta(days=8)).isoformat(),
            "end_datetime": (datetime.utcnow() + timedelta(days=8, hours=2)).isoformat(),
            "location": "Updated Location",
            "participation_mode": "physical",
        }

        response = client.put(f"/api/v1/organizer/events/{event.id}", json=update_data)
        assert response.status_code == 200
        assert event.title == "Updated Event Title"

    def test_organizer_cannot_update_published_event(self):
        app = make_test_app()
        org = make_organizer()
        client, mock_db = make_client_with_auth(app, org)

        event = make_event(org.id, status=EventStatus.published)
        mock_db.query.return_value.filter.return_value.first.return_value = event

        update_data = {"title": "New Title", "description": "New desc", 
                       "start_datetime": datetime.utcnow().isoformat(),
                       "end_datetime": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
                       "participation_mode": "physical"}

        response = client.put(f"/api/v1/organizer/events/{event.id}", json=update_data)
        assert response.status_code == 400
        assert "published" in response.json()["detail"].lower()

    def test_organizer_cancels_published_event(self):
        app = make_test_app()
        org = make_organizer()
        client, mock_db = make_client_with_auth(app, org)

        event = make_event(org.id, status=EventStatus.published)
        mock_db.query.return_value.filter.return_value.first.return_value = event

        response = client.patch(f"/api/v1/organizer/events/{event.id}/cancel")
        assert response.status_code == 200
        assert event.status == EventStatus.cancelled

    def test_organizer_deletes_draft_event(self):
        app = make_test_app()
        org = make_organizer()
        client, mock_db = make_client_with_auth(app, org)

        event = make_event(org.id, status=EventStatus.draft)
        mock_db.query.return_value.filter.return_value.first.return_value = event

        response = client.delete(f"/api/v1/organizer/events/{event.id}")
        assert response.status_code == 204
        mock_db.delete.assert_called_once()
