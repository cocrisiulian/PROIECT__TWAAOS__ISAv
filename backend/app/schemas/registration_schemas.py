import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.student_schemas import StudentRead
from app.models.event_registration import RegistrationStatus


class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    event_id: uuid.UUID
    student_id: uuid.UUID
    rating: int
    comment: Optional[str] = None
    submitted_at: Optional[datetime] = None


class RegistrationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    event_id: uuid.UUID
    student_id: uuid.UUID
    registered_at: Optional[datetime] = None
    checked_in: bool
    checked_in_at: Optional[datetime] = None
    status: RegistrationStatus
    student: Optional[StudentRead] = None


class EventStatsRead(BaseModel):
    registration_count: int
    checked_in_count: int
    feedback_count: int
    avg_rating: Optional[float] = None
    rating_distribution: dict


class TicketIssueRead(BaseModel):
    event_id: uuid.UUID
    registration_id: uuid.UUID
    event_title: str
    attendee_name: str
    ticket_token: str
    qr_code_base64: str


class TicketValidationRead(BaseModel):
    valid: bool
    event_id: uuid.UUID
    registration_id: uuid.UUID
    attendee_name: str
    event_title: str
    checked_in: bool
    checked_in_at: Optional[datetime] = None


class TicketValidationRequest(BaseModel):
    ticket_token: str
