"""
One-off migration script for adding students.faculty_id and students.department_id.

Usage:
    python -m app.migrate_student_profile_fields
"""

from sqlalchemy import inspect, text

from app.database import engine


def _run_postgres_migration() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE students
                ADD COLUMN IF NOT EXISTS faculty_id INTEGER;
                """
            )
        )
        conn.execute(
            text(
                """
                ALTER TABLE students
                ADD COLUMN IF NOT EXISTS department_id INTEGER;
                """
            )
        )

        conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'fk_students_faculty_id'
                    ) THEN
                        ALTER TABLE students
                        ADD CONSTRAINT fk_students_faculty_id
                        FOREIGN KEY (faculty_id) REFERENCES faculties(id);
                    END IF;
                END
                $$;
                """
            )
        )

        conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'fk_students_department_id'
                    ) THEN
                        ALTER TABLE students
                        ADD CONSTRAINT fk_students_department_id
                        FOREIGN KEY (department_id) REFERENCES departments(id);
                    END IF;
                END
                $$;
                """
            )
        )


def _run_generic_migration() -> None:
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("students")}

    with engine.begin() as conn:
        if "faculty_id" not in columns:
            conn.execute(text("ALTER TABLE students ADD COLUMN faculty_id INTEGER"))
        if "department_id" not in columns:
            conn.execute(text("ALTER TABLE students ADD COLUMN department_id INTEGER"))


def migrate() -> None:
    dialect = engine.dialect.name.lower()
    if dialect == "postgresql":
        _run_postgres_migration()
    else:
        _run_generic_migration()


if __name__ == "__main__":
    migrate()
    print("Migration complete: student profile fields are available.")
