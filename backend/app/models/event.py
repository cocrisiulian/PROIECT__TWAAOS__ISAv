import uuid
import enum
from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, Enum, Integer,
    ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ParticipationMode(str, enum.Enum):
    physical = "physical"
    online = "online"
    hybrid = "hybrid"


class EventStatus(str, enum.Enum):
    draft = "draft"
    pending_approval = "pending_approval"
    published = "published"
    rejected = "rejected"
    cancelled = "cancelled"


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("idx_events_start_datetime", "start_datetime"),
        Index("idx_events_status", "status"),
        Index("idx_events_organizer", "organizer_id"),
        Index("idx_events_faculty", "faculty_id"),
        Index("idx_events_category", "category_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), nullable=True)
    online_link = Column(String(500), nullable=True)
    participation_mode = Column(Enum(ParticipationMode), nullable=False)
    is_free = Column(Boolean, default=True, nullable=False)
    requires_registration = Column(Boolean, default=False, nullable=False)
    registration_link = Column(String(500), nullable=True)
    max_participants = Column(Integer, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    status = Column(Enum(EventStatus), default=EventStatus.draft, nullable=False)

    organizer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organizer = relationship("User", foreign_keys=[organizer_id], back_populates="events")
    approved_by = relationship("User", foreign_keys=[approved_by_id], back_populates="approved_events")
    faculty = relationship("Faculty", back_populates="events")
    department = relationship("Department", back_populates="events")
    category = relationship("Category", back_populates="events")
    materials = relationship("EventMaterial", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="event", cascade="all, delete-orphan")
