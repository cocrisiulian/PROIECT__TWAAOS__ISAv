from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AccountEventItem(BaseModel):
    id: str
    title: str
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = None
    participation_mode: str
    registration_status: str
    checked_in: bool
    checked_in_at: Optional[datetime] = None


class MonthlyStats(BaseModel):
    year: int
    month: int
    total_registrations: int
    attended_events: int
    waitlisted_events: int


class StudentAccountProfile(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    faculty_id: Optional[int] = None
    faculty_name: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    member_since: Optional[datetime] = None


class StudentAccountOverview(BaseModel):
    profile: StudentAccountProfile
    monthly_stats: MonthlyStats
    month_events: List[AccountEventItem]


class StudentAccountUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    faculty_id: Optional[int] = None
    department_id: Optional[int] = None
