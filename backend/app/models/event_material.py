import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MaterialType(str, enum.Enum):
    presentation = "presentation"
    image = "image"
    pdf = "pdf"
    other = "other"


class EventMaterial(Base):
    __tablename__ = "event_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(Enum(MaterialType), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    event = relationship("Event", back_populates="materials")
    uploaded_by = relationship("User", back_populates="materials")
