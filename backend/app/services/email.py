"""Email service for sending notifications."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

from app.config import settings

logger = logging.getLogger(__name__)


def _build_email_address(email: str, name: str = "") -> str:
    """Build email address string."""
    if name:
        return f"{name} <{email}>"
    return email


def send_registration_confirmation(
    recipient_email: str,
    recipient_name: str,
    event_title: str,
    event_date: datetime,
    status: str = "registered",
) -> bool:
    """
    Send registration confirmation email to student.
    
    Args:
        recipient_email: Student's email address
        recipient_name: Student's full name
        event_title: Title of the event
        event_date: Date/time of the event
        status: Registration status ('registered' or 'waitlist')
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not settings.ENABLE_EMAIL:
        logger.info(f"Email disabled. Would send registration confirmation to {recipient_email}")
        return True

    try:
        subject = f"Registration Confirmation - {event_title}"
        
        status_text = "confirmed" if status == "registered" else "added to waitlist"
        scheduled_date = event_date.strftime("%d %B %Y at %H:%M") if event_date else "TBD"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Registration {status_text.capitalize()}</h2>
                    
                    <p>Dear {recipient_name},</p>
                    
                    <p>Thank you for registering for <strong>{event_title}</strong>.</p>
                    
                    <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Event Details:</strong></p>
                        <p>Title: {event_title}</p>
                        <p>Scheduled: {scheduled_date}</p>
                        <p>Status: <span style="color: {'#27ae60' if status == 'registered' else '#f39c12'}; font-weight: bold;">{status_text.upper()}</span></p>
                    </div>
                    
                    <p>{"You are confirmed to attend this event." if status == "registered" else "This event is at full capacity. You have been added to the waitlist. If a spot becomes available, you will be automatically promoted to confirmed status."}</p>
                    
                    <p>You can manage your registrations by logging into the USV Events platform.</p>
                    
                    <p>Best regards,<br>
                    <strong>{settings.SMTP_FROM_NAME}</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                    <p style="font-size: 12px; color: #7f8c8d;">
                        This is an automated email. Please do not reply to this message.
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_body = f"""
Registration {status_text.capitalize()}

Dear {recipient_name},

Thank you for registering for {event_title}.

Event Details:
- Title: {event_title}
- Scheduled: {scheduled_date}
- Status: {status_text.upper()}

{"You are confirmed to attend this event." if status == "registered" else "This event is at full capacity. You have been added to the waitlist. If a spot becomes available, you will be automatically promoted to confirmed status."}

You can manage your registrations by logging into the USV Events platform.

Best regards,
{settings.SMTP_FROM_NAME}
        """
        
        return _send_email(
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
        )
    
    except Exception as e:
        logger.error(f"Error sending registration confirmation email: {e}")
        return False


def send_password_reset_link(
    recipient_email: str,
    recipient_name: str,
    reset_token: str,
) -> bool:
    """
    Send password reset link to user.
    
    Args:
        recipient_email: User's email address
        recipient_name: User's full name
        reset_token: Password reset token
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not settings.ENABLE_EMAIL:
        logger.info(f"Email disabled. Would send password reset link to {recipient_email}")
        return True

    try:
        reset_link = f"{settings.FRONTEND_URL}{settings.FRONTEND_RESET_PASSWORD_PATH}?token={reset_token}"
        subject = "Password Reset Request"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Password Reset Request</h2>
                    
                    <p>Dear {recipient_name},</p>
                    
                    <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
                    
                    <p style="margin: 30px 0;">
                        <a href="{reset_link}" style="display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Reset Password
                        </a>
                    </p>
                    
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Or copy and paste this link in your browser:<br>
                        <code>{reset_link}</code>
                    </p>
                    
                    <p style="color: #e74c3c; font-weight: bold;">
                        This link will expire in 30 minutes.
                    </p>
                    
                    <p>If you have any questions, please contact support.</p>
                    
                    <p>Best regards,<br>
                    <strong>{settings.SMTP_FROM_NAME}</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                    <p style="font-size: 12px; color: #7f8c8d;">
                        This is an automated email. Please do not reply to this message.
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_body = f"""
Password Reset Request

Dear {recipient_name},

We received a request to reset your password. If you didn't make this request, you can ignore this email.

Click the link below to reset your password (valid for 30 minutes):
{reset_link}

If you have any questions, please contact support.

Best regards,
{settings.SMTP_FROM_NAME}
        """
        
        return _send_email(
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
        )
    
    except Exception as e:
        logger.error(f"Error sending password reset email: {e}")
        return False


def _send_email(
    recipient_email: str,
    recipient_name: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> bool:
    """
    Internal function to send email via SMTP.
    
    Args:
        recipient_email: Recipient's email address
        recipient_name: Recipient's full name
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text email body
    
    Returns:
        True if sent successfully, False otherwise
    """
    try:
        # Create message with both text and HTML parts
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = _build_email_address(settings.SMTP_FROM_EMAIL, settings.SMTP_FROM_NAME)
        message["To"] = _build_email_address(recipient_email, recipient_name)
        
        # Attach text and HTML parts
        part1 = MIMEText(text_body, "plain")
        part2 = MIMEText(html_body, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Send email
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        
        logger.info(f"Email sent successfully to {recipient_email}")
        return True
    
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failed: {e}")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending email to {recipient_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending email to {recipient_email}: {e}")
        return False
