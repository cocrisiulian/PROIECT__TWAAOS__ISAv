from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user_payload
from app.database import get_db
from app.models.event import Event
from app.models.event_registration import EventRegistration, RegistrationStatus
from app.models.faculty import Department, Faculty
from app.models.student import Student
from app.models.user import User
from app.schemas.account_schemas import (
    AccountEventItem,
    MonthlyStats,
    StudentAccountOverview,
    StudentAccountProfile,
    StudentAccountUpdate,
)

router = APIRouter(prefix="/account", tags=["Account"])


def _month_bounds(year: int, month: int):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    return start, end


@router.get("/me", response_model=StudentAccountOverview)
def get_my_account(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    now = datetime.utcnow()
    year = year or now.year
    month = month or now.month
    start, end = _month_bounds(year, month)

    role = payload.get("role")
    user_id = payload.get("sub")

    if role == "student":
        student = db.query(Student).options(
            joinedload(Student.faculty),
            joinedload(Student.department),
        ).filter(Student.id == user_id).first()
        if not student:
            raise HTTPException(status_code=401, detail="Student not found")

        rows = db.query(EventRegistration, Event).join(
            Event, Event.id == EventRegistration.event_id
        ).filter(
            EventRegistration.student_id == student.id,
            Event.start_datetime >= start,
            Event.start_datetime < end,
        ).order_by(Event.start_datetime.desc()).all()

        events = [
            AccountEventItem(
                id=str(event.id),
                title=event.title,
                start_datetime=event.start_datetime,
                end_datetime=event.end_datetime,
                location=event.location,
                participation_mode=event.participation_mode.value,
                registration_status=registration.status.value,
                checked_in=registration.checked_in,
                checked_in_at=registration.checked_in_at,
            )
            for registration, event in rows
        ]

        profile = StudentAccountProfile(
            id=str(student.id),
            email=student.email,
            full_name=student.full_name,
            avatar_url=student.avatar_url,
            faculty_id=student.faculty_id,
            faculty_name=student.faculty.name if student.faculty else None,
            department_id=student.department_id,
            department_name=student.department.name if student.department else None,
            member_since=student.created_at,
        )
    elif role in ("organizer", "admin"):
        staff = db.query(User).filter(User.id == user_id).first()
        if not staff:
            raise HTTPException(status_code=401, detail="User not found")

        events = []
        profile = StudentAccountProfile(
            id=str(staff.id),
            email=staff.email,
            full_name=staff.full_name,
            avatar_url=None,
            faculty_id=None,
            faculty_name=None,
            department_id=None,
            department_name=None,
            member_since=staff.created_at,
        )
    else:
        raise HTTPException(status_code=403, detail="Unsupported account role")

    monthly_stats = MonthlyStats(
        year=year,
        month=month,
        total_registrations=len(events),
        attended_events=sum(1 for item in events if item.checked_in),
        waitlisted_events=sum(1 for item in events if item.registration_status == RegistrationStatus.waitlist.value),
    )

    return StudentAccountOverview(
        profile=profile,
        monthly_stats=monthly_stats,
        month_events=events,
    )


@router.put("/me", response_model=StudentAccountProfile)
def update_my_account(
    body: StudentAccountUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    role = payload.get("role")
    user_id = payload.get("sub")

    if role == "student":
        target = db.query(Student).filter(Student.id == user_id).first()
        if not target:
            raise HTTPException(status_code=401, detail="Student not found")

        if body.full_name is not None:
            target.full_name = body.full_name.strip()

        department = None
        if body.department_id is not None:
            department = db.query(Department).filter(Department.id == body.department_id).first()
            if not department:
                raise HTTPException(status_code=404, detail="Department not found")

        faculty_id = body.faculty_id
        if faculty_id is not None:
            faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
            if not faculty:
                raise HTTPException(status_code=404, detail="Faculty not found")

        if department and faculty_id and department.faculty_id != faculty_id:
            raise HTTPException(status_code=400, detail="Department does not belong to selected faculty")

        if department and faculty_id is None:
            faculty_id = department.faculty_id

        if body.faculty_id is not None or body.department_id is not None:
            target.faculty_id = faculty_id
            target.department_id = body.department_id

        db.commit()
        db.refresh(target)
        db.refresh(target, attribute_names=["faculty", "department"])

        return StudentAccountProfile(
            id=str(target.id),
            email=target.email,
            full_name=target.full_name,
            avatar_url=target.avatar_url,
            faculty_id=target.faculty_id,
            faculty_name=target.faculty.name if target.faculty else None,
            department_id=target.department_id,
            department_name=target.department.name if target.department else None,
            member_since=target.created_at,
        )

    if role in ("organizer", "admin"):
        target = db.query(User).filter(User.id == user_id).first()
        if not target:
            raise HTTPException(status_code=401, detail="User not found")

        if body.full_name is not None:
            target.full_name = body.full_name.strip()

        db.commit()
        db.refresh(target)

        return StudentAccountProfile(
            id=str(target.id),
            email=target.email,
            full_name=target.full_name,
            avatar_url=None,
            faculty_id=None,
            faculty_name=None,
            department_id=None,
            department_name=None,
            member_since=target.created_at,
        )

    raise HTTPException(status_code=403, detail="Unsupported account role")
