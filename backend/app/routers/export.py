import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event, EventStatus
from app.config import settings

router = APIRouter(tags=["Export"])


@router.get("/events/{event_id}/qr.png")
def get_event_qr(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id, Event.status == EventStatus.published).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    try:
        import qrcode
        url = f"{settings.FRONTEND_URL}/events/{event_id}"
        qr = qrcode.make(url)
        buf = io.BytesIO()
        qr.save(buf, format="PNG")
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/png")
    except ImportError:
        raise HTTPException(status_code=500, detail="QR code library not available")


def _event_to_ics(event) -> str:
    from icalendar import Calendar, Event as IcsEvent
    cal = Calendar()
    cal.add("prodid", "-//USV Events//usv-events//RO")
    cal.add("version", "2.0")

    ics_event = IcsEvent()
    ics_event.add("summary", event.title)
    ics_event.add("description", event.description)
    ics_event.add("dtstart", event.start_datetime)
    ics_event.add("dtend", event.end_datetime)
    if event.location:
        ics_event.add("location", event.location)
    ics_event.add("url", f"{settings.FRONTEND_URL}/events/{event.id}")
    cal.add_component(ics_event)
    return cal.to_ical()


@router.get("/events/{event_id}/export.ics")
def export_event_ics(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id, Event.status == EventStatus.published).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    ics_bytes = _event_to_ics(event)
    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="event-{event_id}.ics"'},
    )


@router.get("/events/export.ics")
def export_events_ics(db: Session = Depends(get_db)):
    from icalendar import Calendar, Event as IcsEvent
    events = db.query(Event).filter(Event.status == EventStatus.published).all()
    cal = Calendar()
    cal.add("prodid", "-//USV Events//usv-events//RO")
    cal.add("version", "2.0")
    for event in events:
        ics_event = IcsEvent()
        ics_event.add("summary", event.title)
        ics_event.add("description", event.description)
        ics_event.add("dtstart", event.start_datetime)
        ics_event.add("dtend", event.end_datetime)
        if event.location:
            ics_event.add("location", event.location)
        ics_event.add("url", f"{settings.FRONTEND_URL}/events/{event.id}")
        cal.add_component(ics_event)
    return Response(
        content=cal.to_ical(),
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="usv-events.ics"'},
    )
