"""Tests for email service."""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

from app.services.email import (
    send_registration_confirmation,
    send_password_reset_link,
)
from app.config import settings


class TestEmailService:
    """Test email service functions."""

    def test_send_registration_confirmation_when_disabled(self):
        """Test that email returns True when disabled without sending."""
        with patch.object(settings, 'ENABLE_EMAIL', False):
            result = send_registration_confirmation(
                recipient_email="test@example.com",
                recipient_name="Test User",
                event_title="Test Event",
                event_date=datetime.now(),
                status="registered",
            )
            assert result is True

    def test_send_registration_confirmation_when_enabled(self):
        """Test registration confirmation email sends when enabled."""
        with patch.object(settings, 'ENABLE_EMAIL', True):
            with patch('smtplib.SMTP') as mock_smtp:
                mock_server = MagicMock()
                mock_smtp.return_value.__enter__.return_value = mock_server

                result = send_registration_confirmation(
                    recipient_email="student@example.com",
                    recipient_name="Student User",
                    event_title="Lecture on AI",
                    event_date=datetime(2026, 5, 15, 10, 0),
                    status="registered",
                )

                assert result is True
                mock_server.starttls.assert_called_once()
                mock_server.send_message.assert_called_once()

    def test_send_registration_confirmation_waitlist(self):
        """Test registration confirmation email for waitlist status."""
        with patch.object(settings, 'ENABLE_EMAIL', True):
            with patch('smtplib.SMTP') as mock_smtp:
                mock_server = MagicMock()
                mock_smtp.return_value.__enter__.return_value = mock_server

                result = send_registration_confirmation(
                    recipient_email="student@example.com",
                    recipient_name="Student User",
                    event_title="Lecture on AI",
                    event_date=datetime(2026, 5, 15, 10, 0),
                    status="waitlist",
                )

                assert result is True
                call_args = mock_server.send_message.call_args
                message = call_args[0][0]
                
                # Verify message contains waitlist-related content
                message_str = message.as_string().lower()
                assert "waitlist" in message_str

    def test_send_password_reset_link_when_disabled(self):
        """Test that password reset email returns True when disabled."""
        with patch.object(settings, 'ENABLE_EMAIL', False):
            result = send_password_reset_link(
                recipient_email="user@example.com",
                recipient_name="User Name",
                reset_token="test_token_123",
            )
            assert result is True

    def test_send_password_reset_link_when_enabled(self):
        """Test password reset link email sends when enabled."""
        with patch.object(settings, 'ENABLE_EMAIL', True):
            with patch('smtplib.SMTP') as mock_smtp:
                mock_server = MagicMock()
                mock_smtp.return_value.__enter__.return_value = mock_server

                result = send_password_reset_link(
                    recipient_email="user@example.com",
                    recipient_name="User Name",
                    reset_token="test_token_abc123",
                )

                assert result is True
                mock_server.starttls.assert_called_once()
                mock_server.send_message.assert_called_once()

                # Verify message contains reset token
                call_args = mock_server.send_message.call_args
                message = call_args[0][0]
                message_str = message.as_string()
                assert "test_token_abc123" in message_str

    def test_send_email_with_smtp_authentication(self):
        """Test email sending with SMTP authentication."""
        with patch.object(settings, 'ENABLE_EMAIL', True):
            with patch.object(settings, 'SMTP_USER', 'test_user'):
                with patch.object(settings, 'SMTP_PASSWORD', 'test_pass'):
                    with patch('smtplib.SMTP') as mock_smtp:
                        mock_server = MagicMock()
                        mock_smtp.return_value.__enter__.return_value = mock_server

                        send_password_reset_link(
                            recipient_email="user@example.com",
                            recipient_name="User",
                            reset_token="token",
                        )

                        mock_server.login.assert_called_once_with('test_user', 'test_pass')

    def test_send_email_smtp_authentication_error(self):
        """Test handling of SMTP authentication errors."""
        import smtplib
        
        with patch.object(settings, 'ENABLE_EMAIL', True):
            with patch('smtplib.SMTP') as mock_smtp:
                mock_smtp.return_value.__enter__.return_value.starttls.side_effect = (
                    smtplib.SMTPAuthenticationError(534, "Authentication failed")
                )

                result = send_password_reset_link(
                    recipient_email="user@example.com",
                    recipient_name="User",
                    reset_token="token",
                )

                assert result is False

    def test_send_email_smtp_timeout(self):
        """Test handling of SMTP connection timeout."""
        with patch.object(settings, 'ENABLE_EMAIL', True):
            with patch('smtplib.SMTP') as mock_smtp:
                mock_smtp.return_value.__enter__.return_value.starttls.side_effect = (
                    TimeoutError("Connection timeout")
                )

                result = send_password_reset_link(
                    recipient_email="user@example.com",
                    recipient_name="User",
                    reset_token="token",
                )

                assert result is False

    def test_email_contains_required_fields(self):
        """Test that emails contain all required fields."""
        with patch.object(settings, 'ENABLE_EMAIL', True):
            with patch('smtplib.SMTP') as mock_smtp:
                mock_server = MagicMock()
                mock_smtp.return_value.__enter__.return_value = mock_server

                send_registration_confirmation(
                    recipient_email="student@example.com",
                    recipient_name="Test Student",
                    event_title="Math Course",
                    event_date=datetime(2026, 6, 1, 14, 30),
                    status="registered",
                )

                call_args = mock_server.send_message.call_args
                message = call_args[0][0]
                message_str = message.as_string()

                # Verify required email headers
                assert "Subject:" in message_str
                assert "From:" in message_str
                assert "To:" in message_str

                # Verify content
                assert "Test Student" in message_str
                assert "Math Course" in message_str


class TestEmailIntegration:
    """Integration tests for email endpoints."""

    def test_registration_sends_email_on_success(self, client, db_session, test_user_student, test_event):
        """Test that registration endpoint sends email on successful registration."""
        test_event.requires_registration = True
        test_event.status = "published"
        db_session.add(test_event)
        db_session.commit()

        with patch('app.routers.public.send_registration_confirmation') as mock_email:
            response = client.post(
                f"/api/v1/events/{test_event.id}/register",
                headers={"Authorization": f"Bearer {test_user_student['token']}"},
            )

            assert response.status_code == 200
            mock_email.assert_called_once()
            call_kwargs = mock_email.call_args[1]
            assert call_kwargs['recipient_email'] == test_user_student['email']
            assert call_kwargs['event_title'] == test_event.title
            assert call_kwargs['status'] == 'registered'

    def test_password_reset_sends_email_on_request(self, client, test_admin_user, db_session):
        """Test that password reset request sends email."""
        with patch('app.routers.auth.send_password_reset_link') as mock_email:
            response = client.post(
                "/api/v1/auth/password/forgot",
                json={"email": test_admin_user['email']},
            )

            assert response.status_code == 200
            # Email should be sent to valid user
            mock_email.assert_called_once()
            call_kwargs = mock_email.call_args[1]
            assert call_kwargs['recipient_email'] == test_admin_user['email']

    def test_waitlist_promotion_sends_email(self, client, db_session, test_user_student, test_event):
        """Test that waitlist promotion sends email to promoted student."""
        # This would test the _promote_next_waitlisted_registration function
        # Implementation depends on conftest fixtures for setup
        pass
