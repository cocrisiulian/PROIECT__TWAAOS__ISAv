import os
import uuid
import csv
import io
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.config import settings
from app.core.dependencies import require_organizer
from app.models.event import Event, EventStatus
from app.models.event_material import EventMaterial, MaterialType
from app.models.event_registration import EventRegistration
from app.models.feedback import Feedback
from app.schemas.event_schemas import EventCreate, EventUpdate, EventDetail, EventListItem, EventStatusUpdate
from app.schemas.registration_schemas import RegistrationRead, EventStatsRead

router = APIRouter(prefix="/organizer", tags=["Organizer"])

ALLOWED_MIME_TYPES = {
    "application/pdf": MaterialType.pdf,
    "image/jpeg": MaterialType.image,
    "image/png": MaterialType.image,
    "image/gif": MaterialType.image,
    "image/webp": MaterialType.image,
    "application/vnd.ms-powerpoint": MaterialType.presentation,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": MaterialType.presentation,
    "application/vnd.ms-excel": MaterialType.other,
    "application/zip": MaterialType.other,
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


@router.get("/events", response_model=dict)
def list_my_events(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(require_organizer),
):
    q = db.query(Event).options(
        joinedload(Event.faculty),
        joinedload(Event.category),
    ).filter(Event.organizer_id == user.id)
    if status:
        q = q.filter(Event.status == status)
    total = q.count()
    events = q.order_by(Event.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    event_ids = [e.id for e in events]
    reg_counts = {}
    if event_ids:
        rows = db.query(
            EventRegistration.event_id, func.count(EventRegistration.id)
        ).filter(EventRegistration.event_id.in_(event_ids)).group_by(EventRegistration.event_id).all()
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
    }


@router.post("/events", response_model=EventDetail, status_code=201)
def create_event(body: EventCreate, db: Session = Depends(get_db), user=Depends(require_organizer)):
    event = Event(**body.model_dump(), organizer_id=user.id, status=EventStatus.draft)
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventDetail.model_validate(event)


@router.get("/events/{event_id}", response_model=EventDetail)
def get_my_event(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    event = db.query(Event).options(
        joinedload(Event.materials),
        joinedload(Event.faculty),
        joinedload(Event.department),
        joinedload(Event.category),
    ).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your event")
    return EventDetail.model_validate(event)


@router.put("/events/{event_id}", response_model=EventDetail)
def update_event(
    event_id: str, body: EventUpdate,
    db: Session = Depends(get_db), user=Depends(require_organizer),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your event")
    if event.status == EventStatus.published:
        raise HTTPException(status_code=400, detail="Cannot edit a published event. Cancel it first.")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(event, k, v)
    if event.status == EventStatus.rejected:
        event.status = EventStatus.draft
    db.commit()
    db.refresh(event)
    return EventDetail.model_validate(event)


@router.patch("/events/{event_id}/submit")
def submit_for_approval(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != EventStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft events can be submitted")
    event.status = EventStatus.pending_approval
    db.commit()
    return {"detail": "Submitted for approval"}


@router.patch("/events/{event_id}/cancel")
def cancel_event(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status not in (EventStatus.published, EventStatus.pending_approval):
        raise HTTPException(status_code=400, detail="Only published or pending events can be cancelled")
    event.status = EventStatus.cancelled
    db.commit()
    return {"detail": "Event cancelled"}


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != EventStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft events can be deleted")
    db.delete(event)
    db.commit()


@router.get("/events/{event_id}/participants", response_model=dict)
def list_participants(
    event_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user=Depends(require_organizer),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    q = db.query(EventRegistration).options(
        joinedload(EventRegistration.student)
    ).filter(EventRegistration.event_id == event_id)
    total = q.count()
    regs = q.order_by(EventRegistration.registered_at.asc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [RegistrationRead.model_validate(r).model_dump() for r in regs],
        "total": total,
    }


@router.get("/events/{event_id}/participants/export")
def export_participants_csv(
    event_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_organizer),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    regs = db.query(EventRegistration).options(
        joinedload(EventRegistration.student)
    ).filter(EventRegistration.event_id == event_id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Full Name", "Email", "Registered At", "Checked In", "Checked In At"])
    for r in regs:
        writer.writerow([
            r.student.full_name if r.student else "",
            r.student.email if r.student else "",
            r.registered_at.isoformat() if r.registered_at else "",
            "Yes" if r.checked_in else "No",
            r.checked_in_at.isoformat() if r.checked_in_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="participants-{event_id}.csv"'},
    )


@router.post("/events/{event_id}/checkin/{registration_id}")
def check_in_participant(
    event_id: str,
    registration_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_organizer),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    reg = db.query(EventRegistration).filter(
        EventRegistration.id == registration_id,
        EventRegistration.event_id == event_id,
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    reg.checked_in = True
    reg.checked_in_at = datetime.utcnow()
    db.commit()
    return {"detail": "Checked in"}


@router.post("/events/{event_id}/materials", status_code=201)
async def upload_material(
    event_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_organizer),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")

    content_type = file.content_type or "application/octet-stream"
    file_type = ALLOWED_MIME_TYPES.get(content_type, MaterialType.other)

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 20MB limit")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "events", str(event_id))
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "file")[1]
    stored_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, stored_name)

    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/events/{event_id}/{stored_name}"
    material = EventMaterial(
        event_id=event.id,
        original_filename=file.filename or stored_name,
        stored_filename=stored_name,
        file_url=file_url,
        file_type=file_type,
        file_size_bytes=len(content),
        uploaded_by_id=user.id,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return {"id": str(material.id), "file_url": file_url, "original_filename": material.original_filename}


@router.delete("/events/{event_id}/materials/{material_id}", status_code=204)
def delete_material(
    event_id: str,
    material_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_organizer),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    material = db.query(EventMaterial).filter(
        EventMaterial.id == material_id,
        EventMaterial.event_id == event_id,
    ).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    # Delete physical file
    stored_path = os.path.join(settings.UPLOAD_DIR, "events", str(event_id), material.stored_filename)
    if os.path.exists(stored_path):
        os.remove(stored_path)
    db.delete(material)
    db.commit()


@router.get("/events/{event_id}/stats", response_model=EventStatsRead)
def get_event_stats(
    event_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_organizer),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")

    reg_count = db.query(func.count(EventRegistration.id)).filter(
        EventRegistration.event_id == event_id
    ).scalar() or 0
    checked_in_count = db.query(func.count(EventRegistration.id)).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.checked_in == True,
    ).scalar() or 0
    feedback_rows = db.query(Feedback).filter(Feedback.event_id == event_id).all()
    feedback_count = len(feedback_rows)
    avg_rating = None
    if feedback_rows:
        avg_rating = round(sum(f.rating for f in feedback_rows) / feedback_count, 2)
    rating_dist = {str(i): 0 for i in range(1, 6)}
    for f in feedback_rows:
        rating_dist[str(f.rating)] = rating_dist.get(str(f.rating), 0) + 1

    return EventStatsRead(
        registration_count=reg_count,
        checked_in_count=checked_in_count,
        feedback_count=feedback_count,
        avg_rating=avg_rating,
        rating_distribution=rating_dist,
    )
