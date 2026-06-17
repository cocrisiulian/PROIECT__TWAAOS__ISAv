from unittest.mock import MagicMock

from app.models.event_registration import RegistrationStatus
from app.routers.public import _promote_next_waitlisted_registration


def test_promote_next_waitlisted_registration_marks_first_waitlisted_as_registered():
    db = MagicMock()
    promoted = MagicMock()
    promoted.status = RegistrationStatus.waitlist

    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = promoted

    result = _promote_next_waitlisted_registration(db, "event-123")

    assert result is promoted
    assert promoted.status == RegistrationStatus.registered
    db.commit.assert_called_once()


def test_promote_next_waitlisted_registration_returns_none_when_queue_empty():
    db = MagicMock()
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None

    result = _promote_next_waitlisted_registration(db, "event-123")

    assert result is None
    db.commit.assert_not_called()