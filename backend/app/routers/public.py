import json
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_

from app.database import get_db
from app.models.event import Event, EventStatus, ParticipationMode
from app.models.faculty import Faculty, Department
from app.models.category import Category
from app.models.event_registration import EventRegistration
from app.models.event_registration import RegistrationStatus
from app.models.feedback import Feedback
from app.core.dependencies import get_optional_student, get_current_student
from app.schemas.event_schemas import EventListItem, EventDetail
from app.schemas.lookup_schemas import FacultyRead, DepartmentRead, CategoryRead
from app.schemas.registration_schemas import FeedbackCreate, FeedbackRead

router = APIRouter(tags=["Public"])


def _build_event_query(db, **filters):
    q = db.query(Event).options(
        joinedload(Event.organizer),
        joinedload(Event.faculty),
        joinedload(Event.category),
        joinedload(Event.department),
    ).filter(Event.status == EventStatus.published)

    if filters.get("faculty_id"):
        q = q.filter(Event.faculty_id == filters["faculty_id"])
    if filters.get("department_id"):
        q = q.filter(Event.department_id == filters["department_id"])
    if filters.get("category_id"):
        q = q.filter(Event.category_id == filters["category_id"])
    if filters.get("participation_mode"):
        q = q.filter(Event.participation_mode == filters["participation_mode"])
    if filters.get("is_free") is not None:
        q = q.filter(Event.is_free == filters["is_free"])
    if filters.get("requires_registration") is not None:
        q = q.filter(Event.requires_registration == filters["requires_registration"])
    if filters.get("organizer_id"):
        q = q.filter(Event.organizer_id == filters["organizer_id"])
    if filters.get("date_from"):
        q = q.filter(Event.start_datetime >= filters["date_from"])
    if filters.get("date_to"):
        q = q.filter(Event.start_datetime <= filters["date_to"])
    if filters.get("search"):
        term = f"%{filters['search']}%"
        q = q.filter(
            Event.title.ilike(term) | Event.description.ilike(term)
        )

    # Advanced OR groups: JSON array of filter objects
    # Example: [{"category_id":1,"faculty_id":2},{"category_id":3,"participation_mode":"online"}]
    or_filters_raw = filters.get("or_filters")
    if or_filters_raw:
        try:
            groups = json.loads(or_filters_raw)
            if not isinstance(groups, list):
                raise ValueError("or_filters must be a list")
            group_clauses = []
            for group in groups:
                if not isinstance(group, dict):
                    continue
                clauses = []
                if group.get("faculty_id"):
                    clauses.append(Event.faculty_id == int(group["faculty_id"]))
                if group.get("department_id"):
                    clauses.append(Event.department_id == int(group["department_id"]))
                if group.get("category_id"):
                    clauses.append(Event.category_id == int(group["category_id"]))
                if group.get("participation_mode"):
                    clauses.append(Event.participation_mode == group["participation_mode"])
                if group.get("is_free") is not None:
                    raw_is_free = group.get("is_free")
                    if isinstance(raw_is_free, str):
                        parsed_is_free = raw_is_free.strip().lower() == "true"
                    else:
                        parsed_is_free = bool(raw_is_free)
                    clauses.append(Event.is_free == parsed_is_free)
                if clauses:
                    group_clauses.append(and_(*clauses))
            if group_clauses:
                q = q.filter(or_(*group_clauses))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid or_filters payload")
    return q


@router.get("/events", response_model=dict)
def list_events(
    faculty_id: Optional[int] = None,
    department_id: Optional[int] = None,
    category_id: Optional[int] = None,
    participation_mode: Optional[ParticipationMode] = None,
    is_free: Optional[bool] = None,
    requires_registration: Optional[bool] = None,
    organizer_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    or_filters: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = _build_event_query(
        db,
        faculty_id=faculty_id,
        department_id=department_id,
        category_id=category_id,
        participation_mode=participation_mode,
        is_free=is_free,
        requires_registration=requires_registration,
        organizer_id=organizer_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        or_filters=or_filters,
    )
    total = q.count()
    events = q.order_by(Event.start_datetime.asc()).offset((page - 1) * per_page).limit(per_page).all()

    # Attach registration counts
    event_ids = [e.id for e in events]
    reg_counts = {}
    if event_ids:
        rows = db.query(
            EventRegistration.event_id, func.count(EventRegistration.id)
        ).filter(
            EventRegistration.event_id.in_(event_ids),
            EventRegistration.status == RegistrationStatus.registered,
        ).group_by(EventRegistration.event_id).all()
        reg_counts = {str(r[0]): r[1] for r in rows}

    items = []
    for e in events:
        item = EventListItem.model_validate(e)
        item.registration_count = reg_counts.get(str(e.id), 0)
        items.append(item)

    return {
        "items": [i.model_dump() for i in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/events/{event_id}", response_model=EventDetail)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_student=Depends(get_optional_student),
):
    event = db.query(Event).options(
        joinedload(Event.organizer),
        joinedload(Event.faculty),
        joinedload(Event.department),
        joinedload(Event.category),
        joinedload(Event.materials),
    ).filter(Event.id == event_id, Event.status == EventStatus.published).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    reg_count = db.query(func.count(EventRegistration.id)).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.status == RegistrationStatus.registered,
    ).scalar()
    waitlist_count = db.query(func.count(EventRegistration.id)).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.status == RegistrationStatus.waitlist,
    ).scalar()
    result = EventDetail.model_validate(event)
    result.registration_count = reg_count
    result.waitlist_count = waitlist_count
    if current_student:
        registration = db.query(EventRegistration).filter(
            EventRegistration.event_id == event.id,
            EventRegistration.student_id == current_student.id,
        ).first()
        result.is_registered = bool(registration and registration.status == RegistrationStatus.registered)
        result.is_waitlisted = bool(registration and registration.status == RegistrationStatus.waitlist)
    return result


@router.get("/faculties", response_model=List[FacultyRead])
def list_faculties(db: Session = Depends(get_db)):
    return db.query(Faculty).all()


@router.get("/departments", response_model=List[DepartmentRead])
def list_departments(faculty_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Department)
    if faculty_id:
        q = q.filter(Department.faculty_id == faculty_id)
    return q.all()


@router.get("/categories", response_model=List[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@router.post("/events/{event_id}/register")
def register_for_event(
    event_id: str,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    event = db.query(Event).filter(Event.id == event_id, Event.status == EventStatus.published).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.requires_registration:
        raise HTTPException(status_code=400, detail="This event does not require registration")
    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.student_id == student.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already registered")
    if event.max_participants:
        count = db.query(func.count(EventRegistration.id)).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.status == RegistrationStatus.registered,
        ).scalar()
        if count >= event.max_participants:
            reg = EventRegistration(
                event_id=event.id,
                student_id=student.id,
                status=RegistrationStatus.waitlist,
            )
            db.add(reg)
            db.commit()
            return {
                "detail": "Event is full. Added to waitlist",
                "status": "waitlist",
            }
    reg = EventRegistration(
        event_id=event.id,
        student_id=student.id,
        status=RegistrationStatus.registered,
    )
    db.add(reg)
    db.commit()
    return {"detail": "Registered successfully", "status": "registered"}


@router.delete("/events/{event_id}/register")
def unregister_from_event(
    event_id: str,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.student_id == student.id,
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    db.delete(reg)
    db.commit()
    return {"detail": "Unregistered successfully"}


@router.post("/events/{event_id}/feedback", response_model=FeedbackRead)
def submit_feedback(
    event_id: str,
    body: FeedbackCreate,
    db: Session = Depends(get_db),
    student=Depends(get_current_student),
):
    event = db.query(Event).filter(Event.id == event_id, Event.status == EventStatus.published).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    now = datetime.utcnow()
    if event.end_datetime.replace(tzinfo=None) > now:
        raise HTTPException(status_code=400, detail="Feedback can only be submitted after the event ends")
    existing = db.query(Feedback).filter(
        Feedback.event_id == event_id,
        Feedback.student_id == student.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Feedback already submitted")
    fb = Feedback(event_id=event.id, student_id=student.id, rating=body.rating, comment=body.comment)
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb
