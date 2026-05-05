import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    google_sub = Column(String(255), unique=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), onupdate=func.now())

    faculty = relationship("Faculty")
    department = relationship("Department")
    registrations = relationship("EventRegistration", back_populates="student")
    feedbacks = relationship("Feedback", back_populates="student")
