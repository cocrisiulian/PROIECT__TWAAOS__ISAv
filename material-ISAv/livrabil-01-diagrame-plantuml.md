## 1. Use Case - Public + Student

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor Vizitator
actor Student

rectangle "Sistem Management Evenimente USV" {
  usecase "Vizualizare lista\nevenimente" as UC1
  usecase "Vizualizare detalii\neveniment" as UC2
  usecase "Autentificare student\nGoogle OAuth" as UC3
  usecase "Inscriere la\neveniment" as UC4
  usecase "Retragere\ninscriere" as UC5
  usecase "Transmitere\nfeedback" as UC6
}

Vizitator --> UC1
Vizitator --> UC2

Student --> UC3
Student --> UC1
Student --> UC2
Student --> UC4
Student --> UC5
Student --> UC6
@enduml
```

## 2. Use Case - Organizator

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor Organizator

rectangle "Zona Organizator" {
  usecase "Creare eveniment" as UC7
  usecase "Editare eveniment\npropriu" as UC8
  usecase "Trimitere spre\naprobare" as UC9
  usecase "Anulare eveniment" as UC10
  usecase "Upload materiale\neveniment" as UC11
  usecase "Export participanti\nCSV" as UC12
}

Organizator --> UC7
Organizator --> UC8
Organizator --> UC9
Organizator --> UC10
Organizator --> UC11
Organizator --> UC12
@enduml
```

## 3. Use Case - Administrator

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor Administrator

rectangle "Zona Admin" {
  usecase "Aprobare eveniment" as UC13
  usecase "Respingere eveniment\n+ motiv" as UC14
  usecase "Administrare\nutilizatori" as UC15
  usecase "Gestionare facultati /\ndepartamente / categorii" as UC16
}

Administrator --> UC13
Administrator --> UC14
Administrator --> UC15
Administrator --> UC16
@enduml
```

## 4. Class Diagram - Entitati principale

```plantuml
@startuml
skinparam classAttributeIconSize 0

class User {
  +id: UUID
  +username: string
  +email: string
  +role: UserRole
}

class Student {
  +id: UUID
  +email: string
  +full_name: string
  +google_sub: string
}

class Event {
  +id: UUID
  +title: string
  +start_datetime: datetime
  +end_datetime: datetime
  +status: EventStatus
  +organizer_id: UUID
  +approved_by_id: UUID
}

class EventRegistration {
  +id: UUID
  +event_id: UUID
  +student_id: UUID
  +status: RegistrationStatus
  +checked_in: bool
}

class Feedback {
  +id: UUID
  +event_id: UUID
  +student_id: UUID
  +rating: smallint
}

User "1" --> "*" Event : organizer
Event "*" --> "1" User : approved_by
Student "1" --> "*" EventRegistration : registrations
Student "1" --> "*" Feedback : feedbacks
Event "1" --> "*" EventRegistration : registrations
Event "1" --> "*" Feedback : feedbacks
@enduml
```

## 5. Class Diagram - Catalog + materiale

```plantuml
@startuml
skinparam classAttributeIconSize 0

class Event {
  +id: UUID
  +faculty_id: int
  +department_id: int
  +category_id: int
}

class Faculty {
  +id: int
  +name: string
  +short_name: string
}

class Department {
  +id: int
  +name: string
  +faculty_id: int
}

class Category {
  +id: int
  +name: string
  +color_hex: string
}

class EventMaterial {
  +id: UUID
  +event_id: UUID
  +uploaded_by_id: UUID
  +file_url: string
  +file_type: MaterialType
}

class User {
  +id: UUID
  +username: string
}

Faculty "1" --> "*" Department : departments
Faculty "1" --> "*" Event : events
Department "1" --> "*" Event : events
Category "1" --> "*" Event : events
Event "1" --> "*" EventMaterial : materials
User "1" --> "*" EventMaterial : uploaded_by
@enduml
```

## 6. State Diagram - lifecycle eveniment

```plantuml
@startuml
[*] --> draft : create_event

draft --> pending_approval : submit_for_approval

rejected --> draft : organizer_update
rejected --> pending_approval : organizer_submit

pending_approval --> published : admin_approve
pending_approval --> rejected : admin_reject
pending_approval --> cancelled : organizer_cancel

published --> cancelled : organizer_cancel

cancelled --> draft : organizer_update
cancelled --> pending_approval : organizer_submit
@enduml
```

## 7. Component Diagram - runtime

```plantuml
@startuml
skinparam componentStyle rectangle

actor Browser
component "Frontend React + Vite" as FE
component "Backend FastAPI" as BE
database "PostgreSQL" as DB
component "Uploads storage" as UP
cloud "Google OAuth" as GO

Browser --> FE
FE --> BE : REST /api/v1
BE --> DB
BE --> UP
BE --> GO
@enduml
```

## 8. Component Diagram - backend intern

```plantuml
@startuml
skinparam componentStyle rectangle

package "Backend FastAPI" {
  [Auth Router] as Auth
  [Public Router] as Public
  [Organizer Router] as Organizer
  [Admin Router] as Admin
  [Account Router] as Account
  [Export Router] as Export
  [Core Security + Dependencies] as Core
  [SQLAlchemy Models] as ORM
}

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
@enduml
```
