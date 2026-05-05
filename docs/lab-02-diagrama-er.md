# Laborator 02 - Structura modelului de date (Diagrama ER)

Diagrama ER de mai jos este derivata din modelele SQLAlchemy existente in backend.

```mermaid
erDiagram
    USERS {
        UUID id PK
        string username UK
        string email UK
        string hashed_password
        string full_name
        enum role
        bool is_active
        datetime created_at
        UUID created_by_id FK
    }

    STUDENTS {
        UUID id PK
        string email UK
        string full_name
        string google_sub UK
        string avatar_url
        int faculty_id FK
        int department_id FK
        datetime created_at
        datetime last_login_at
    }

    FACULTIES {
        int id PK
        string name UK
        string short_name
    }

    DEPARTMENTS {
        int id PK
        string name
        int faculty_id FK
    }

    CATEGORIES {
        int id PK
        string name UK
        string color_hex
    }

    EVENTS {
        UUID id PK
        string title
        text description
        datetime start_datetime
        datetime end_datetime
        string location
        string online_link
        enum participation_mode
        bool is_free
        bool requires_registration
        string registration_link
        int max_participants
        string cover_image_url
        enum status
        UUID organizer_id FK
        int faculty_id FK
        int department_id FK
        int category_id FK
        UUID approved_by_id FK
        datetime approved_at
        text rejection_reason
        datetime created_at
        datetime updated_at
    }

    EVENT_MATERIALS {
        UUID id PK
        UUID event_id FK
        string original_filename
        string stored_filename
        string file_url
        enum file_type
        int file_size_bytes
        datetime uploaded_at
        UUID uploaded_by_id FK
    }

    EVENT_REGISTRATIONS {
        UUID id PK
        UUID event_id FK
        UUID student_id FK
        datetime registered_at
        bool checked_in
        datetime checked_in_at
        enum status
    }

    FEEDBACK {
        UUID id PK
        UUID event_id FK
        UUID student_id FK
        smallint rating
        text comment
        datetime submitted_at
    }

    FACULTIES ||--o{ DEPARTMENTS : has
    FACULTIES ||--o{ EVENTS : scopes
    DEPARTMENTS ||--o{ EVENTS : scopes
    CATEGORIES ||--o{ EVENTS : classifies

    USERS ||--o{ EVENTS : organizes
    USERS ||--o{ EVENTS : approves
    USERS ||--o{ EVENT_MATERIALS : uploads

    STUDENTS }o--|| FACULTIES : belongs_to
    STUDENTS }o--|| DEPARTMENTS : belongs_to

    EVENTS ||--o{ EVENT_MATERIALS : has
    EVENTS ||--o{ EVENT_REGISTRATIONS : has
    EVENTS ||--o{ FEEDBACK : has

    STUDENTS ||--o{ EVENT_REGISTRATIONS : registers
    STUDENTS ||--o{ FEEDBACK : writes
```

## Constrangeri importante
- unique users.username
- unique users.email
- unique students.email
- unique students.google_sub
- unique (event_id, student_id) in event_registrations
- unique (event_id, student_id) in feedback

## Observatii
- Modelul separa clar conturile staff (users) de conturile studenti autentificati Google (students).
- Fluxul de aprobare este explicit prin approved_by_id si approved_at in events.
- Entitatile pentru participare si feedback sunt normalizate si permit raportare ulterioara.
