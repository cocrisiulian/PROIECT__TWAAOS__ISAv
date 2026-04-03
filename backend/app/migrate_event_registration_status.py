"""
One-off migration script for adding event_registrations.status without dropping data.

Usage:
    python -m app.migrate_event_registration_status
"""

from sqlalchemy import inspect, text

from app.database import engine


def _run_postgres_migration() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_type
                        WHERE typname = 'registrationstatus'
                    ) THEN
                        CREATE TYPE registrationstatus AS ENUM ('registered', 'waitlist');
                    END IF;
                END
                $$;
                """
            )
        )

        conn.execute(
            text(
                """
                ALTER TABLE event_registrations
                ADD COLUMN IF NOT EXISTS status registrationstatus
                NOT NULL
                DEFAULT 'registered';
                """
            )
        )

        conn.execute(
            text(
                """
                UPDATE event_registrations
                SET status = 'registered'
                WHERE status IS NULL;
                """
            )
        )


def _run_generic_migration() -> None:
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("event_registrations")}
    if "status" in columns:
        return

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE event_registrations
                ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'registered';
                """
            )
        )


def migrate() -> None:
    dialect = engine.dialect.name.lower()
    if dialect == "postgresql":
        _run_postgres_migration()
    else:
        _run_generic_migration()


if __name__ == "__main__":
    migrate()
    print("Migration complete: event_registrations.status is available.")
