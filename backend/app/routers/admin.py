from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract

from app.database import get_db
from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.event import Event, EventStatus
from app.models.event_registration import EventRegistration
from app.models.faculty import Faculty, Department
from app.models.category import Category
from app.schemas.user_schemas import UserCreate, UserRead, UserRoleAssign
from app.schemas.event_schemas import EventDetail
from app.schemas.lookup_schemas import FacultyCreate, DepartmentCreate, CategoryCreate, FacultyRead, DepartmentRead, CategoryRead

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=dict)
def list_users(
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    q = db.query(User)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if search:
        term = f"%{search}%"
        q = q.filter(User.full_name.ilike(term) | User.username.ilike(term))
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [UserRead.model_validate(u).model_dump() for u in users],
        "total": total,
    }


@router.post("/users", response_model=UserRead, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    username = body.username.strip().lower()
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=409, detail="Username already exists")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already exists")
    user = User(
        username=username,
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=UserRole.visitor,
        is_active=True,
        created_by_id=admin.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/role", response_model=UserRead)
def assign_user_role(
    user_id: str,
    body: UserRoleAssign,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(user.id) == str(admin.id) and body.role != UserRole.admin:
        raise HTTPException(status_code=400, detail="Admin cannot remove own admin role")

    user.role = body.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/deactivate", response_model=UserRead)
def deactivate_user(user_id: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/activate", response_model=UserRead)
def activate_user(user_id: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


@router.get("/events/pending", response_model=dict)
def list_pending_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    q = db.query(Event).options(
        joinedload(Event.organizer),
        joinedload(Event.faculty),
        joinedload(Event.category),
    ).filter(Event.status == EventStatus.pending_approval)
    total = q.count()
    events = q.order_by(Event.created_at.asc()).offset((page - 1) * per_page).limit(per_page).all()
    from app.schemas.event_schemas import EventListItem
    items = [EventListItem.model_validate(e).model_dump() for e in events]
    return {"items": items, "total": total}


@router.post("/events/{event_id}/approve")
def approve_event(event_id: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != EventStatus.pending_approval:
        raise HTTPException(status_code=400, detail="Event is not pending approval")
    event.status = EventStatus.published
    event.approved_by_id = admin.id
    event.approved_at = datetime.utcnow()
    event.rejection_reason = None
    db.commit()
    return {"detail": "Event approved and published"}


@router.post("/events/{event_id}/reject")
def reject_event(
    event_id: str,
    body: dict,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != EventStatus.pending_approval:
        raise HTTPException(status_code=400, detail="Event is not pending approval")
    event.status = EventStatus.rejected
    event.rejection_reason = body.get("reason", "")
    db.commit()
    return {"detail": "Event rejected"}


@router.get("/reports/events-per-month")
def report_events_per_month(db: Session = Depends(get_db), admin=Depends(require_admin)):
    rows = db.query(
        extract("year", Event.created_at).label("year"),
        extract("month", Event.created_at).label("month"),
        func.count(Event.id).label("count"),
    ).filter(
        Event.status == EventStatus.published
    ).group_by("year", "month").order_by("year", "month").all()
    return [{"year": int(r.year), "month": int(r.month), "count": r.count} for r in rows]


@router.get("/reports/avg-participation")
def report_avg_participation(db: Session = Depends(get_db), admin=Depends(require_admin)):
    from app.models.feedback import Feedback
    events = db.query(Event).filter(Event.status == EventStatus.published).all()
    result = []
    for event in events:
        reg_count = db.query(func.count(EventRegistration.id)).filter(
            EventRegistration.event_id == event.id
        ).scalar() or 0
        checked_in = db.query(func.count(EventRegistration.id)).filter(
            EventRegistration.event_id == event.id,
            EventRegistration.checked_in == True,
        ).scalar() or 0
        avg_rating = db.query(func.avg(Feedback.rating)).filter(
            Feedback.event_id == event.id
        ).scalar()
        result.append({
            "event_id": str(event.id),
            "title": event.title,
            "registration_count": reg_count,
            "checked_in_count": checked_in,
            "avg_rating": round(float(avg_rating), 2) if avg_rating else None,
        })
    return result


@router.get("/reports/events-per-organizer")
def report_events_per_organizer(db: Session = Depends(get_db), admin=Depends(require_admin)):
    organizers = db.query(User).filter(User.role == UserRole.organizer).all()
    result = []
    for org in organizers:
        total = db.query(func.count(Event.id)).filter(Event.organizer_id == org.id).scalar() or 0
        published = db.query(func.count(Event.id)).filter(
            Event.organizer_id == org.id,
            Event.status == EventStatus.published,
        ).scalar() or 0
        result.append({
            "organizer_id": str(org.id),
            "full_name": org.full_name,
            "username": org.username,
            "total_events": total,
            "published_events": published,
        })
    return result


# Lookup management
@router.post("/faculties", response_model=FacultyRead, status_code=201)
def create_faculty(body: FacultyCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    faculty = Faculty(**body.model_dump())
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@router.post("/departments", response_model=DepartmentRead, status_code=201)
def create_department(body: DepartmentCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    dept = Department(**body.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.post("/categories", response_model=CategoryRead, status_code=201)
def create_category(body: CategoryCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    cat = Category(**body.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
