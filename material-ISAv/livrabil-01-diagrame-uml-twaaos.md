# Livrabil 1 - Diagrame UML pentru aplicatia TWAAOS

## 1. Context aplicatie

Aplicatia este un sistem de management al evenimentelor universitare cu urmatorii actori principali:

- Vizitator (neautentificat)
- Student (autentificare Google OAuth)
- Organizator
- Administrator

Arhitectura functionala este implementata in backend prin routere FastAPI:

- `auth`
- `public`
- `organizer`
- `admin`
- `account`
- `export`

Modelele de domeniu principale sunt: `User`, `Student`, `Event`, `EventRegistration`, `EventMaterial`, `Feedback`, `Faculty`, `Department`, `Category`.

## 2. Diagrama de cazuri de utilizare

### 2.1. Descriere sintetica

- Vizitatorul poate vedea evenimentele publicate si detaliile lor.
- Studentul se autentifica prin Google, se inscrie/renunta la inscriere si trimite feedback dupa incheierea evenimentului.
- Organizatorul creeaza si gestioneaza evenimentele proprii (draft, submit, edit, cancel), materiale si participanti.
- Administratorul aproba/respinge evenimente, gestioneaza utilizatorii si nomenclatoarele.

### 2.2. Cod Mermaid (Use Case) - impartit pe subiecte

#### 2.2.1 Public + Student

```mermaid
flowchart TB
  V[Actor: Vizitator]
  S[Actor: Student]

  UC1([Vizualizare lista evenimente])
  UC2([Vizualizare detalii eveniment])
  UC3([Autentificare student Google OAuth])
  UC4([Inscriere la eveniment])
  UC5([Retragere inscriere])
  UC6([Transmitere feedback])

  V --> UC1
  V --> UC2

  S --> UC3
  S --> UC1
  S --> UC2
  S --> UC4
  S --> UC5
  S --> UC6
```

#### 2.2.2 Organizator

```mermaid
flowchart TB
  O[Actor: Organizator]

  UC7([Creare eveniment])
  UC8([Editare eveniment propriu])
  UC9([Trimitere spre aprobare])
  UC10([Anulare eveniment])
  UC11([Upload materiale eveniment])
  UC12([Export participanti CSV])

  O --> UC7
  O --> UC8
  O --> UC9
  O --> UC10
  O --> UC11
  O --> UC12
```

#### 2.2.3 Administrator

```mermaid
flowchart TB
  A[Actor: Administrator]

  UC13([Aprobare eveniment])
  UC14([Respingere eveniment + motiv])
  UC15([Administrare utilizatori])
  UC16([Gestionare facultati/departamente/categorii])

  A --> UC13
  A --> UC14
  A --> UC15
  A --> UC16
```

## 3. Diagrama de clase (model domeniu)

### 3.1. Observatii

- `Event` este entitatea centrala.
- `User` (organizer/admin) este separat de `Student` (conturi Google OAuth).
- Relatia student-eveniment este modelata prin `EventRegistration`.
- Feedback-ul este unic pe perechea `(event_id, student_id)`.

### 3.2. Cod Mermaid (Class Diagram) - impartit pe module

#### 3.2.1 Entitati principale (Event Lifecycle)

```mermaid
classDiagram
    class User {
      UUID id
      string username
      string email
      UserRole role
    }

    class Student {
      UUID id
      string email
      string full_name
      string google_sub
    }

    class Event {
      UUID id
      string title
      datetime start_datetime
      datetime end_datetime
      EventStatus status
      UUID organizer_id
      UUID approved_by_id
    }

    class EventRegistration {
      UUID id
      UUID event_id
      UUID student_id
      RegistrationStatus status
      bool checked_in
    }

    class Feedback {
      UUID id
      UUID event_id
      UUID student_id
      smallint rating
    }

    User "1" --> "*" Event : organizer
    User "1" --> "*" Event : approved_by
    Student "1" --> "*" EventRegistration : registrations
    Student "1" --> "*" Feedback : feedbacks
    Event "1" --> "*" EventRegistration : registrations
    Event "1" --> "*" Feedback : feedbacks
```

#### 3.2.2 Catalog + materiale

```mermaid
classDiagram
    class Event {
      UUID id
      int faculty_id
      int department_id
      int category_id
    }

    class Faculty {
      int id
      string name
      string short_name
    }

    class Department {
      int id
      string name
      int faculty_id
    }

    class Category {
      int id
      string name
      string color_hex
    }

    class EventMaterial {
      UUID id
      UUID event_id
      UUID uploaded_by_id
      string file_url
      MaterialType file_type
    }

    class User {
      UUID id
      string username
    }

    Faculty "1" --> "*" Department : departments
    Faculty "1" --> "*" Event : events
    Department "1" --> "*" Event : events
    Category "1" --> "*" Event : events
    Event "1" --> "*" EventMaterial : materials
    User "1" --> "*" EventMaterial : uploaded_by
```

#### 3.2.3 Enum-uri (pentru afisare separata)

```mermaid
classDiagram
    class UserRole {
      <<enumeration>>
      visitor
      student
      organizer
      admin
    }

    class EventStatus {
      <<enumeration>>
      draft
      pending_approval
      published
      rejected
      cancelled
    }

    class ParticipationMode {
      <<enumeration>>
      physical
      online
      hybrid
    }

    class RegistrationStatus {
      <<enumeration>>
      registered
      waitlist
    }

    class MaterialType {
      <<enumeration>>
      presentation
      image
      pdf
      other
    }
```

## 4. Diagrama de stari (lifecycle eveniment)

### 4.1. Reguli extrase din cod

- La creare, un eveniment are status `draft`.
- Organizatorul poate trimite la aprobare: `draft|rejected|cancelled -> pending_approval`.
- Adminul aproba: `pending_approval -> published`.
- Adminul respinge: `pending_approval -> rejected` (cu motiv).
- Organizatorul poate anula: `published|pending_approval -> cancelled`.
- Organizatorul poate edita un eveniment `rejected|cancelled`, iar sistemul il readuce in `draft`.

### 4.2. Cod Mermaid (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> draft : create_event

    draft --> pending_approval : submit_for_approval

    pending_approval --> published : admin_approve
    pending_approval --> rejected : admin_reject
    pending_approval --> cancelled : organizer_cancel

    rejected --> draft : organizer_update
    rejected --> pending_approval : organizer_submit

    published --> cancelled : organizer_cancel

    cancelled --> draft : organizer_update
    cancelled --> pending_approval : organizer_submit
```

## 5. Diagrama de componente

### 5.1. Cod Mermaid (Component Diagram) - impartit pe niveluri

#### 5.1.1 Context general runtime

```mermaid
flowchart TB
    Browser[Browser]
    Frontend[Frontend React + Vite]
    Backend[Backend FastAPI]
    DB[(PostgreSQL)]
    Uploads[(Uploads storage)]
    Google[(Google OAuth)]

    Browser --> Frontend
    Frontend -->|REST /api/v1| Backend
    Backend --> DB
    Backend --> Uploads
    Backend --> Google
```

#### 5.1.2 Structura interna backend

```mermaid
flowchart TB
    subgraph API[Backend FastAPI]
      Auth[Auth Router]
      Public[Public Router]
      Organizer[Organizer Router]
      Admin[Admin Router]
      Account[Account Router]
      Export[Export Router]
      Core[Core Security + Dependencies]
      ORM[SQLAlchemy Models]
    end

    Auth --> Core
    Public --> Core
    Organizer --> Core
    Admin --> Core
    Account --> Core

    Auth --> ORM
    Public --> ORM
    Organizer --> ORM
    Admin --> ORM
    Account --> ORM
    Export --> ORM
```
