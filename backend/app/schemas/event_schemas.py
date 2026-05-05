import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator

from app.models.event import EventStatus, ParticipationMode
from app.schemas.user_schemas import UserRead
from app.schemas.lookup_schemas import FacultyRead, DepartmentRead, CategoryRead


class EventMaterialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    original_filename: str
    file_url: str
    file_type: str
    file_size_bytes: Optional[int] = None
    uploaded_at: Optional[datetime] = None


class EventCreate(BaseModel):
    title: str
    description: str
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = None
    online_link: Optional[str] = None
    participation_mode: ParticipationMode
    is_free: bool = True
    requires_registration: bool = False
    registration_link: Optional[str] = None
    max_participants: Optional[int] = None
    cover_image_url: Optional[str] = None
    faculty_id: Optional[int] = None
    department_id: Optional[int] = None
    category_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.end_datetime <= self.start_datetime:
            raise ValueError("End date/time must be after start date/time")
        return self


class EventUpdate(EventCreate):
    pass


class EventListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = None
    participation_mode: ParticipationMode
    is_free: bool
    requires_registration: bool
    status: EventStatus
    cover_image_url: Optional[str] = None
    category: Optional[CategoryRead] = None
    faculty: Optional[FacultyRead] = None
    organizer: Optional[UserRead] = None
    registration_count: Optional[int] = None
    rejection_reason: Optional[str] = None


class EventDetail(EventListItem):
    online_link: Optional[str] = None
    registration_link: Optional[str] = None
    max_participants: Optional[int] = None
    department: Optional[DepartmentRead] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    materials: List[EventMaterialRead] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_registered: bool = False
    is_waitlisted: bool = False
    waitlist_count: int = 0


class EventStatusUpdate(BaseModel):
    reason: Optional[str] = None
