import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.database import get_db
from app.models.event import Event, EventStatus, ParticipationMode
from app.models.event_registration import EventRegistration, RegistrationStatus
from app.models.student import Student
from app.models.user import User, UserRole
from app.core.dependencies import get_current_student, require_organizer
from app.routers.organizer import router as organizer_router
from app.routers.public import router as public_router
from app.services.ticketing import build_ticket_token, decode_ticket_token


def make_ticket_app():
    app = FastAPI()
    app.include_router(public_router, prefix="/api/v1")
    app.include_router(organizer_router, prefix="/api/v1")
    return app


def make_student():
    student = MagicMock(spec=Student)
    student.id = uuid.uuid4()
    student.full_name = "Student Test"
    student.email = "student@student.usv.ro"
    student.google_sub = "sub-123"
    return student


def make_organizer():
    organizer = MagicMock(spec=User)
    organizer.id = uuid.uuid4()
    organizer.role = UserRole.organizer
    organizer.full_name = "Organizer Test"
    organizer.email = "org@usv.ro"
    organizer.username = "org"
    organizer.is_active = True
    return organizer


def make_event(organizer_id):
    event = MagicMock(spec=Event)
    event.id = uuid.uuid4()
    event.title = "Ticketed Event"
    event.status = EventStatus.published
    event.organizer_id = organizer_id
    event.participation_mode = ParticipationMode.physical
    event.description = "Desc"
    event.start_datetime = datetime.utcnow() + timedelta(days=7)
    event.end_datetime = datetime.utcnow() + timedelta(days=7, hours=2)
    return event


def make_registration(event, student):
    reg = MagicMock(spec=EventRegistration)
    reg.id = uuid.uuid4()
    reg.event_id = event.id
    reg.student_id = student.id
    reg.status = RegistrationStatus.registered
    reg.checked_in = False
    reg.checked_in_at = None
    reg.event = event
    reg.student = student
    return reg


def test_issue_ticket_returns_qr_and_token():
    app = make_ticket_app()
    db = MagicMock()
    student = make_student()
    event = make_event(uuid.uuid4())
    registration = make_registration(event, student)

    event_query = MagicMock()
    event_query.filter.return_value.first.return_value = event
    reg_query = MagicMock()
    reg_query.filter.return_value.first.return_value = registration

    db.query.side_effect = [event_query, reg_query]

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_student] = lambda: student
    client = TestClient(app)

    response = client.get(f"/api/v1/events/{event.id}/ticket")

    assert response.status_code == 200
    body = response.json()
    assert body["event_title"] == "Ticketed Event"
    assert body["attendee_name"] == "Student Test"
    assert body["ticket_token"]
    assert body["qr_code_base64"]

    decoded = decode_ticket_token(body["ticket_token"])
    assert decoded["registration_id"] == str(registration.id)


def test_verify_ticket_rejects_invalid_token():
    app = make_ticket_app()
    db = MagicMock()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.get("/api/v1/tickets/verify/not-a-real-token")

    assert response.status_code == 400


def test_organizer_can_check_in_with_ticket_token():
    app = make_ticket_app()
    db = MagicMock()
    organizer = make_organizer()
    student = make_student()
    event = make_event(organizer.id)
    registration = make_registration(event, student)
    token = build_ticket_token(registration)

    event_query = MagicMock()
    event_query.filter.return_value.first.return_value = event
    reg_query = MagicMock()
    reg_query.filter.return_value.first.return_value = registration

    db.query.side_effect = [event_query, reg_query]

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_organizer] = lambda: organizer
    client = TestClient(app)

    response = client.post(
        f"/api/v1/organizer/events/{event.id}/checkin-ticket",
        json={"ticket_token": token},
    )

    assert response.status_code == 200
    assert response.json()["detail"] == "Checked in via ticket"
    assert registration.checked_in is True
    assert registration.checked_in_at is not None