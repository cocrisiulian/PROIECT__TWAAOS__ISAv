import uuid
import enum
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class RegistrationStatus(str, enum.Enum):
    registered = "registered"
    waitlist = "waitlist"


class EventRegistration(Base):
    __tablename__ = "event_registrations"
    __table_args__ = (
        UniqueConstraint("event_id", "student_id", name="uq_event_student_registration"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    checked_in = Column(Boolean, default=False, nullable=False)
    checked_in_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(RegistrationStatus), nullable=False, default=RegistrationStatus.registered)

    event = relationship("Event", back_populates="registrations")
    student = relationship("Student", back_populates="registrations")
