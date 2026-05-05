# Demo Event Workflows - Setup & Testing

## Quick Start: Seed Database

Populeaza baza de date cu demo users și events:

```bash
docker compose exec usv_events_backend python -m app.seed
```

Aceasta creează:

- **Admin**: `admin` / `admin123` (role: admin)
- **Organizer**: `organizator` / `org123` (role: organizer)
- **Student**: `student@student.usv.ro` (via Google OAuth demo)
- **3 Demo Events**:
  1. **Conferință Inginerie Software** (published) - student can register
  2. **Workshop Python** (published with 30 max participants) - student can register or waitlist
  3. **Webinar Cloud Computing** (pending approval) - admin needs to approve

Faculty: FIESC
Category: Academic

---

## Running Tests

### Prerequisites

Install test dependencies:

```bash
cd backend
pip install -r requirements-test.txt
```

### Run Event Workflow Tests

```bash
pytest tests/test_event_workflows.py -v
```

### What Tests Cover

#### **1. Event Creation Workflow**

- Organizer creates a draft event ✓
- Organizer submits event for approval (pending) ✓
- Admin lists pending events ✓
- Admin approves event (published) ✓
- Admin rejects event with reason ✓

#### **2. Student Registration**

- Student registers for published event ✓
- Student unregisters from event ✓
- Student cannot register twice (409 conflict) ✓
- Student joins waitlist when event is full ✓

#### **3. Organizer Management**

- Organizer lists own events ✓
- Organizer retrieves own event details ✓
- Organizer cannot access other's events (403) ✓
- Organizer updates draft event ✓
- Organizer cannot update published event (400) ✓
- Organizer cancels published event ✓
- Organizer deletes draft event ✓

---

## Manual Testing Flow

### 1. Login as Organizer

```
POST /api/v1/auth/login
{
  "username": "organizator",
  "password": "org123"
}
```

→ Get access token (role: organizer)

### 2. Create Draft Event

```
POST /api/v1/organizer/events
{
  "title": "My Workshop",
  "description": "...",
  "start_datetime": "2026-03-30T10:00:00Z",
  "end_datetime": "2026-03-30T12:00:00Z",
  "location": "Hall A",
  "participation_mode": "physical",
  "is_free": true,
  "requires_registration": true,
  "faculty_id": 1,
  "category_id": 1
}
```

→ `status: draft`

### 3. Submit for Approval

```
PATCH /api/v1/organizer/events/{event_id}/submit
```

→ `status: pending_approval`

### 4. Login as Admin

```
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

→ Get admin token

### 5. Approve Event

```
POST /api/v1/admin/events/{event_id}/approve
```

→ `status: published`

### 6. Login as Student (or use Google OAuth token)

Student registered email: `student@student.usv.ro`

### 7. Register for Event

```
POST /api/v1/events/{event_id}/register
Authorization: Bearer {student_token}
```

→ `status: registered` or `waitlist` if full

### 8. Unregister

```
DELETE /api/v1/events/{event_id}/register
Authorization: Bearer {student_token}
```

---

## Demo Credentials

| User      | Username           | Password     | Role      | Email                  |
| --------- | ------------------ | ------------ | --------- | ---------------------- |
| Admin     | `admin`          | `admin123` | admin     | admin@usv.ro           |
| Organizer | `organizator`    | `org123`   | organizer | organizator@usv.ro     |
| Student   | N/A (Google OAuth) | N/A          | student   | student@student.usv.ro |

---

## API Endpoints Tested

### Organizer

- `POST /api/v1/organizer/events` - Create event
- `GET /api/v1/organizer/events` - List own events
- `GET /api/v1/organizer/events/{id}` - Get event details
- `PUT /api/v1/organizer/events/{id}` - Update event
- `PATCH /api/v1/organizer/events/{id}/submit` - Submit for approval
- `PATCH /api/v1/organizer/events/{id}/cancel` - Cancel published event
- `DELETE /api/v1/organizer/events/{id}` - Delete draft event

### Admin

- `GET /api/v1/admin/events/pending` - List pending events
- `POST /api/v1/admin/events/{id}/approve` - Approve event
- `POST /api/v1/admin/events/{id}/reject` - Reject event

### Public/Student

- `GET /api/v1/events` - List published events
- `GET /api/v1/events/{id}` - Get event details
- `POST /api/v1/events/{id}/register` - Register for event
- `DELETE /api/v1/events/{id}/register` - Unregister from event

---

## Notes

- Tests use mocked database (no actual PostgreSQL needed for unit tests)
- Demo events start 7, 14, and 21 days from current UTC time
- Seed is idempotent (won't create duplicates if run multiple times)
- All timestamps are UTC

For integration testing with real DB, use docker-compose up and test against live endpoints.
