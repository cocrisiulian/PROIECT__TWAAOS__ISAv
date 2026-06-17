from __future__ import annotations

import base64
import io
from datetime import timedelta

from app.core.security import create_action_token, decode_action_token

TICKET_ACTION = "event_ticket"
TICKET_QR_VERSION = 1


def build_ticket_token(registration) -> str:
    return create_action_token(
        TICKET_ACTION,
        {
            "registration_id": str(registration.id),
            "event_id": str(registration.event_id),
            "student_id": str(registration.student_id),
            "version": TICKET_QR_VERSION,
        },
        expires_delta=timedelta(days=3650),
    )


def render_ticket_qr_base64(ticket_token: str) -> str:
    import qrcode

    qr = qrcode.make(ticket_token)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def decode_ticket_token(ticket_token: str):
    return decode_action_token(ticket_token, TICKET_ACTION)
