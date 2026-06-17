"""
Seed script - run once to create initial data.
Usage: docker exec usv_events_backend python -m app.seed
"""
import sys
import os
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.event import Event, EventStatus, ParticipationMode
from app.models.faculty import Faculty, Department
from app.models.category import Category
from app.core.security import hash_password


def seed():
    db = SessionLocal()
    try:
        # Admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin = User(
                username="admin",
                email="admin@usv.ro",
                full_name="Administrator USV",
                hashed_password=hash_password("admin123"),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            print("Created admin user: admin / admin123")
        else:
            admin_user.role = UserRole.admin
            admin_user.is_active = True
            print("Updated admin user role/status")

        # Faculties
        faculties_data = [
            ("Facultatea de Inginerie Electrică și Știința Calculatoarelor", "FIESC"),
            ("Facultatea de Științe Economice și Administrație Publică", "FSEAP"),
            ("Facultatea de Litere și Științe ale Comunicării", "FLSC"),
            ("Facultatea de Drept și Științe Administrative", "FDSA"),
            ("Facultatea de Educație Fizică și Sport", "FEFS"),
            ("Facultatea de Mecanică, Mecatronică și Management", "FMMM"),
            ("Facultatea de Silvicultură", "FS"),
            ("Facultatea de Alimentație și Turism", "FAT"),
            ("Facultatea de Medicină și Științe Biologice", "FMSB"),
            ("Facultatea de Istorie și Geografie", "FIG"),
        ]
        for name, short in faculties_data:
            if not db.query(Faculty).filter(Faculty.name == name).first():
                db.add(Faculty(name=name, short_name=short))
        db.flush()
        print(f"Seeded {len(faculties_data)} faculties")

        # Departments for FIESC
        fiesc = db.query(Faculty).filter(Faculty.short_name == "FIESC").first()
        if fiesc:
            depts = [
                "Calculatoare și Automatizare",
                "Electronică și Telecomunicații",
                "Energetică, Sisteme Electroenergetice și Inginerie Electrică",
            ]
            for d in depts:
                if not db.query(Department).filter(Department.name == d).first():
                    db.add(Department(name=d, faculty_id=fiesc.id))

        # Categories
        categories_data = [
            ("Academic", "#3B82F6"),
            ("Sport", "#10B981"),
            ("Carieră", "#F59E0B"),
            ("Voluntariat", "#8B5CF6"),
            ("Cultură", "#EC4899"),
            ("Conferință", "#06B6D4"),
            ("Workshop", "#F97316"),
            ("Concurs", "#EF4444"),
            ("Social", "#84CC16"),
            ("Altele", "#6B7280"),
        ]
        for name, color in categories_data:
            if not db.query(Category).filter(Category.name == name).first():
                db.add(Category(name=name, color_hex=color))
        print(f"Seeded {len(categories_data)} categories")

        # Demo organizer (with correct role for creating events)
        organizer_user = db.query(User).filter(User.username == "organizator").first()
        if not organizer_user:
            org = User(
                username="organizator",
                email="organizator@usv.ro",
                full_name="Organizator Demo",
                hashed_password=hash_password("org123"),
                role=UserRole.organizer,
                is_active=True,
            )
            db.add(org)
            print("Created demo organizer: organizator / org123")
        else:
            organizer_user.role = UserRole.organizer
            organizer_user.is_active = True
            print("Updated demo organizer role/status")

        db.flush()

        # Demo events
        admin_user = db.query(User).filter(User.username == "admin").first()
        org_user = db.query(User).filter(User.username == "organizator").first()
        academic_cat = db.query(Category).filter(Category.name == "Academic").first()
        workshop_cat = db.query(Category).filter(Category.name == "Workshop").first()
        conference_cat = db.query(Category).filter(Category.name == "Conferință").first()
        culture_cat = db.query(Category).filter(Category.name == "Cultură").first()
        social_cat = db.query(Category).filter(Category.name == "Social").first()
        career_cat = db.query(Category).filter(Category.name == "Carieră").first()
        fiesc_faculty = db.query(Faculty).filter(Faculty.short_name == "FIESC").first()

        cover_images = {
            "Demo: Conferință Inginerie Software": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
            "Demo: Workshop Python": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80",
            "Demo: Webinar Cloud Computing": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Conferință AI în Educație": "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Workshop Python Avansat": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Webinar Securitate Cibernetică": "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Concurs Roboți Studențești": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Întâlnire Career Hub": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Târg de Voluntariat": "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Expoziție Proiecte Studențești": "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Masă Rotundă Inovație Digitală": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Seară Culturală": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
            "05/05/2026 - Laborator Deschis Cloud": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
        }

        now = datetime.utcnow()

        # Demo event 1: Published event for student registration demo
        if not db.query(Event).filter(Event.title == "Demo: Conferință Inginerie Software").first():
            event1 = Event(
                title="Demo: Conferință Inginerie Software",
                description="Conferință demonstrativă despre bunele practici în ingineria software și arhitecturi moderne.",
                start_datetime=now + timedelta(days=7),
                end_datetime=now + timedelta(days=7, hours=2),
                location="Sala de Conferințe A, Universitatea Stefan cel Mare",
                participation_mode=ParticipationMode.physical,
                is_free=True,
                requires_registration=True,
                organizer_id=org_user.id if org_user else admin_user.id,
                faculty_id=fiesc_faculty.id if fiesc_faculty else None,
                category_id=academic_cat.id if academic_cat else None,
                status=EventStatus.published,
                approved_by_id=admin_user.id,
                approved_at=now,
                cover_image_url=cover_images.get("Demo: Conferință Inginerie Software"),
            )
            db.add(event1)
            print("Created demo event 1 (published): Conferință Inginerie Software")
        else:
            event1 = db.query(Event).filter(Event.title == "Demo: Conferință Inginerie Software").first()
            if event1 and not event1.cover_image_url:
                event1.cover_image_url = cover_images.get("Demo: Conferință Inginerie Software")

        # Demo event 2: Published event with max participants
        if not db.query(Event).filter(Event.title == "Demo: Workshop Python").first():
            event2 = Event(
                title="Demo: Workshop Python",
                description="Workshop practic despre Python, programare orientată obiectelor și best practices.",
                start_datetime=now + timedelta(days=14),
                end_datetime=now + timedelta(days=14, hours=3),
                location="Lab de Informatică, Universitatea Stefan cel Mare",
                participation_mode=ParticipationMode.physical,
                is_free=False,
                requires_registration=True,
                max_participants=30,
                organizer_id=org_user.id if org_user else admin_user.id,
                faculty_id=fiesc_faculty.id if fiesc_faculty else None,
                category_id=academic_cat.id if academic_cat else None,
                status=EventStatus.published,
                approved_by_id=admin_user.id,
                approved_at=now,
                cover_image_url=cover_images.get("Demo: Workshop Python"),
            )
            db.add(event2)
            print("Created demo event 2 (published): Workshop Python")
        else:
            event2 = db.query(Event).filter(Event.title == "Demo: Workshop Python").first()
            if event2 and not event2.cover_image_url:
                event2.cover_image_url = cover_images.get("Demo: Workshop Python")

        db.flush()

        # Demo event 3: Pending approval (admin approval workflow demo)
        if not db.query(Event).filter(Event.title == "Demo: Webinar Cloud Computing").first():
            event3 = Event(
                title="Demo: Webinar Cloud Computing",
                description="Webinar online despre platforme cloud, containerizare și deployment modern.",
                start_datetime=now + timedelta(days=21),
                end_datetime=now + timedelta(days=21, hours=1, minutes=30),
                online_link="https://meet.google.com/demo-cloud-computing",
                participation_mode=ParticipationMode.online,
                is_free=True,
                requires_registration=False,
                organizer_id=org_user.id if org_user else admin_user.id,
                faculty_id=fiesc_faculty.id if fiesc_faculty else None,
                category_id=academic_cat.id if academic_cat else None,
                status=EventStatus.pending_approval,
                cover_image_url=cover_images.get("Demo: Webinar Cloud Computing"),
            )
            db.add(event3)
            print("Created demo event 3 (pending approval): Webinar Cloud Computing")
        else:
            event3 = db.query(Event).filter(Event.title == "Demo: Webinar Cloud Computing").first()
            if event3 and not event3.cover_image_url:
                event3.cover_image_url = cover_images.get("Demo: Webinar Cloud Computing")

        # Requested events for 05/05/2026
        may_5_2026_events = [
            {
                "title": "05/05/2026 - Conferință AI în Educație",
                "description": "Sesiune despre utilizarea inteligenței artificiale în procesele educaționale și administrative.",
                "start": datetime(2026, 5, 5, 9, 0),
                "end": datetime(2026, 5, 5, 10, 30),
                "location": "Aula Magna, Corpul A",
                "mode": ParticipationMode.physical,
                "free": True,
                "registration": True,
                "category": conference_cat,
            },
            {
                "title": "05/05/2026 - Workshop Python Avansat",
                "description": "Atelier practic despre generatoare, decoratori și structurarea proiectelor Python.",
                "start": datetime(2026, 5, 5, 10, 0),
                "end": datetime(2026, 5, 5, 12, 0),
                "location": "Laboratorul 204, Corpul C",
                "mode": ParticipationMode.physical,
                "free": False,
                "registration": True,
                "max_participants": 25,
                "category": workshop_cat,
            },
            {
                "title": "05/05/2026 - Webinar Securitate Cibernetică",
                "description": "Prezentare online despre bune practici de securitate pentru aplicații web și API-uri.",
                "start": datetime(2026, 5, 5, 11, 0),
                "end": datetime(2026, 5, 5, 12, 0),
                "location": "Online",
                "online_link": "https://meet.google.com/demo-cybersecurity-2026",
                "mode": ParticipationMode.online,
                "free": True,
                "registration": False,
                "category": academic_cat,
            },
            {
                "title": "05/05/2026 - Concurs Roboți Studențești",
                "description": "Competiție demonstrativă cu prototipuri realizate de echipele studențești.",
                "start": datetime(2026, 5, 5, 12, 0),
                "end": datetime(2026, 5, 5, 13, 30),
                "location": "Holul central, Corpul D",
                "mode": ParticipationMode.physical,
                "free": True,
                "registration": True,
                "max_participants": 40,
                "category": None,
            },
            {
                "title": "05/05/2026 - Întâlnire Career Hub",
                "description": "Sesiune de consiliere pentru CV, interviuri și oportunități de internship.",
                "start": datetime(2026, 5, 5, 13, 0),
                "end": datetime(2026, 5, 5, 14, 0),
                "location": "Sala de consiliere, Corpul B",
                "mode": ParticipationMode.hybrid,
                "free": True,
                "registration": True,
                "category": career_cat,
            },
            {
                "title": "05/05/2026 - Târg de Voluntariat",
                "description": "Prezentarea oportunităților de voluntariat din cadrul facultăților și ONG-urilor locale.",
                "start": datetime(2026, 5, 5, 14, 0),
                "end": datetime(2026, 5, 5, 16, 0),
                "location": "Esplanada Universității",
                "mode": ParticipationMode.physical,
                "free": True,
                "registration": False,
                "category": social_cat,
            },
            {
                "title": "05/05/2026 - Expoziție Proiecte Studențești",
                "description": "Expoziție cu proiecte dezvoltate în semestrul curent, deschisă publicului universitar.",
                "start": datetime(2026, 5, 5, 15, 0),
                "end": datetime(2026, 5, 5, 17, 0),
                "location": "Galeria de la parter, Corpul A",
                "mode": ParticipationMode.physical,
                "free": True,
                "registration": False,
                "category": academic_cat,
            },
            {
                "title": "05/05/2026 - Masă Rotundă Inovație Digitală",
                "description": "Discuții despre produse digitale, startup-uri și colaborarea dintre studenți și industrie.",
                "start": datetime(2026, 5, 5, 16, 0),
                "end": datetime(2026, 5, 5, 17, 30),
                "location": "Sala Senatului",
                "mode": ParticipationMode.hybrid,
                "free": True,
                "registration": True,
                "category": conference_cat,
            },
            {
                "title": "05/05/2026 - Seară Culturală",
                "description": "Program artistic cu muzică, poezie și momente oferite de cluburile studențești.",
                "start": datetime(2026, 5, 5, 18, 0),
                "end": datetime(2026, 5, 5, 20, 0),
                "location": "Amfiteatrul în aer liber",
                "mode": ParticipationMode.physical,
                "free": True,
                "registration": False,
                "category": culture_cat,
            },
            {
                "title": "05/05/2026 - Laborator Deschis Cloud",
                "description": "Demonstrație practică despre deployment în containere și administrarea serviciilor cloud.",
                "start": datetime(2026, 5, 5, 19, 0),
                "end": datetime(2026, 5, 5, 21, 0),
                "location": "Laboratorul DevOps, Corpul C",
                "mode": ParticipationMode.physical,
                "free": True,
                "registration": True,
                "max_participants": 20,
                "category": workshop_cat,
            },
        ]

        for event_data in may_5_2026_events:
            existing_event = db.query(Event).filter(Event.title == event_data["title"]).first()
            if not existing_event:
                event = Event(
                    title=event_data["title"],
                    description=event_data["description"],
                    start_datetime=event_data["start"],
                    end_datetime=event_data["end"],
                    location=event_data.get("location"),
                    online_link=event_data.get("online_link"),
                    participation_mode=event_data["mode"],
                    is_free=event_data["free"],
                    requires_registration=event_data["registration"],
                    max_participants=event_data.get("max_participants"),
                    organizer_id=org_user.id if org_user else admin_user.id,
                    faculty_id=fiesc_faculty.id if fiesc_faculty else None,
                    category_id=event_data["category"].id if event_data["category"] else None,
                    status=EventStatus.published,
                    approved_by_id=admin_user.id,
                    approved_at=event_data["start"],
                    cover_image_url=cover_images.get(event_data["title"]),
                )
                db.add(event)
                print(f"Created requested event: {event_data['title']}")
            elif not existing_event.cover_image_url:
                existing_event.cover_image_url = cover_images.get(event_data["title"])

        db.commit()
        print("Seed complete!")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
