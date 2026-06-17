import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class RoleUpgradeRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class RoleType(str, enum.Enum):
    student = "student"
    organizer = "organizer"


class RoleUpgradeRequest(Base):
    __tablename__ = "role_upgrade_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    requested_role = Column(Enum(RoleType), nullable=False)
    status = Column(Enum(RoleUpgradeRequestStatus), default=RoleUpgradeRequestStatus.pending, nullable=False)
    reason = Column(Text, nullable=True)  # Why they want to be student/organizer
    
    # Admin fields
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    decision_reason = Column(Text, nullable=True)  # Why admin approved/rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], primaryjoin="RoleUpgradeRequest.user_id == User.id")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id], primaryjoin="RoleUpgradeRequest.reviewed_by_id == User.id")
