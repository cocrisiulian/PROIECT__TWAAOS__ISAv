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
from app.models.student import Student
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

        # Demo student
        if not db.query(Student).filter(Student.email == "student@student.usv.ro").first():
            student = Student(
                email="student@student.usv.ro",
                full_name="Student Demo",
                google_sub="demo-student-google-sub-12345",
                avatar_url="https://via.placeholder.com/150",
            )
            db.add(student)
            print("Created demo student: student@student.usv.ro")

        db.flush()

        # Demo events
        admin_user = db.query(User).filter(User.username == "admin").first()
        org_user = db.query(User).filter(User.username == "organizator").first()
        academic_cat = db.query(Category).filter(Category.name == "Academic").first()
        fiesc_faculty = db.query(Faculty).filter(Faculty.short_name == "FIESC").first()

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
            )
            db.add(event1)
            print("Created demo event 1 (published): Conferință Inginerie Software")

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
            )
            db.add(event2)
            print("Created demo event 2 (published): Workshop Python")

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
            )
            db.add(event3)
            print("Created demo event 3 (pending approval): Webinar Cloud Computing")

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
