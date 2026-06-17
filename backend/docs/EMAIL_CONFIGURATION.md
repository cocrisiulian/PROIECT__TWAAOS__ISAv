# Email Configuration Examples

## Gmail SMTP Configuration

To use Gmail as your email provider:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated password

3. Update your backend .env file:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=USV Events
ENABLE_EMAIL=true
```

## Office 365 / Outlook Configuration

```env
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@company.com
SMTP_FROM_NAME=USV Events
ENABLE_EMAIL=true
```

## SendGrid Configuration

```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=USV Events
ENABLE_EMAIL=true
```

## Mailgun Configuration

```env
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=USV Events
ENABLE_EMAIL=true
```

## Development/Testing (Email Disabled)

For development, emails are sent to console only:

```env
ENABLE_EMAIL=false
```

With `ENABLE_EMAIL=false`, the system will log email operations instead of trying to send via SMTP.

## Email Features

With email enabled, the system will automatically send:

1. **Registration Confirmation**: Sent when a student registers for an event (confirmed or waitlist)
2. **Waitlist Promotion**: Sent when a student is automatically promoted from waitlist to confirmed
3. **Password Reset Link**: Sent when a user requests password reset

## Troubleshooting

### Connection Refused
- Verify SMTP_SERVER and SMTP_PORT are correct
- Check firewall rules for outbound SMTP connections (port 587)
- Some networks block SMTP - you may need to use port 2525 or a different provider

### Authentication Failed
- Double-check SMTP_USER and SMTP_PASSWORD
- For Gmail, ensure you generated an App Password (not personal password)
- For Office 365, use full email address as username

### SSL/TLS Errors
- Port 587 uses STARTTLS (what we use)
- Port 465 uses SMTPS (different protocol)
- Most providers recommend port 587 with STARTTLS

### Emails Not Being Sent
- Check ENABLE_EMAIL setting is true
- Review application logs for email sending errors
- Test with a simple script first:

```python
from app.services.email import send_password_reset_link
from app.config import settings

# Test connection
settings.ENABLE_EMAIL = True
success = send_password_reset_link(
    recipient_email="test@example.com",
    recipient_name="Test User",
    reset_token="test_token_123",
)
print(f"Email sent: {success}")
```
