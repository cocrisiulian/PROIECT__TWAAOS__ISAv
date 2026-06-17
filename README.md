# Sistem de Management al Evenimentelor Universitare - USV

Proiect pentru disciplinele **Inginerie Software Avansată (ISA)** și **Tehnologii Web Avansate și Arhitecturi Orientate pe Servicii (TWAAOS)** — Universitatea Stefan cel Mare din Suceava.

## Stack tehnologic

| Strat      | Tehnologie               |
|------------|--------------------------|
| Backend    | Python 3.12, FastAPI     |
| Frontend   | React 18, Vite 5         |
| Baza de date | PostgreSQL 16           |
| Infrastructură | Docker, docker-compose |

## Structura proiectului

```
.
├── backend/
│   ├── app/
│   │   ├── config.py         # Setari aplicatie
│   │   ├── database.py       # Conexiune SQLAlchemy + sesiune DB
│   │   ├── models/           # Modele ORM
│   │   └── routers/
│   │       └── health.py     # Rute de baza (health check, hello)
│   ├── main.py               # Entry point FastAPI
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Componenta principala (apel API)
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env                      # Variabile de mediu (nu se comite in git)
└── README.md
```

## Cerinte prealabile

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (include Docker Engine si docker-compose)

## Instalare si rulare

Pentru un ghid complet de instalare, vezi [docs/installation-guide.md](docs/installation-guide.md) si versiunea PDF [docs/installation-guide.pdf](docs/installation-guide.pdf).

### 1. Cloneaza/deschide proiectul

```bash
cd PROIECT__TWAAOS__ISAv
```

### 2. Configureaza variabilele de mediu (optional)

Fisierul `.env` este creat cu valori implicite. Modifica-l daca este necesar:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=events_db
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

Pentru autentificarea Google, completeaza variabilele `GOOGLE_CLIENT_ID` si `GOOGLE_CLIENT_SECRET` cu valorile din Google Cloud Console.

### 3. Build si pornire servicii

```bash
docker-compose up --build
```

La prima rulare Docker va descarca imaginile de baza si va instala dependentele. Rulari ulterioare sunt mai rapide:

```bash
docker-compose up
```

### 4. Accesare servicii

| Serviciu         | URL                          |
|------------------|------------------------------|
| Frontend         | http://localhost:5173        |
| Backend API      | http://localhost:8000        |
| Swagger / Docs   | http://localhost:8000/api/v1/docs |
| PostgreSQL       | localhost:5432               |

### Initializare automata la startup (migrari + seed)

Backend-ul ruleaza automat la startup:
- migrarea `event_registrations.status`
- seed idempotent pentru utilizatori demo, lookup-uri si evenimente demo

Seed-ul este gandit sa adauge date doar daca nu exista deja. Daca datele exista, pasul este sarit fara duplicate.

Conturile Google Student sunt salvate in baza locala la fiecare autentificare Google reusita (`/auth/google/callback`).
Astfel, dupa `docker-compose up`, datele raman consistente intre restart-uri cat timp volumul PostgreSQL este pastrat.

Poti controla comportamentul din `.env`:

```env
AUTO_MIGRATE_ON_STARTUP=true
AUTO_SEED_ON_STARTUP=true
```

Pentru a dezactiva unul din pasi, seteaza valoarea pe `false`.

### 5. Oprire servicii

```bash
docker-compose down
```

Pentru a sterge si volumele (inclusiv datele din PostgreSQL):

```bash
docker-compose down -v
```

### 6. Reconstruire Docker doar daca sunt modificari

Dupa ce modifici fisierul `docker-compose.yml`, poti rula:

**Cu npm (cross-platform):**
```bash
npm run docker:rebuild-if-changed
```

**Cu script Bash (Linux/macOS):**
```bash
chmod +x docker-rebuild-if-changed.sh
./docker-rebuild-if-changed.sh
```

**Cu script PowerShell (Windows):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\docker-rebuild-if-changed.ps1
```

Scriptele vor:
- ✅ Verifica daca s-a modificat `docker-compose.yml`
- ✅ Afiseaza modificarile detectate
- ✅ Oprit containerele vechi
- ✅ Reconstituie si pornit containerele noi cu build
- ✅ Afiseaza status final

Daca nu sunt modificari, scriptele termina fara a face nimic.

### Migrare DB fara reset volum (waitlist)

Dupa update-ul de cod care introduce status la inscrieri, ruleaza o singura data:

```bash
docker exec usv_events_backend python -m app.migrate_event_registration_status
```

Comanda adauga coloana `status` in `event_registrations` fara a sterge datele existente.

## Dezvoltare locala (fara Docker)

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> Asigura-te ca ai o instanta PostgreSQL accesibila si seteaza variabila de mediu `DATABASE_URL`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Endpoint-uri API disponibile

| Method | Path                  | Descriere              |
|--------|-----------------------|------------------------|
| GET    | /api/v1/health        | Health check           |
| GET    | /api/v1/hello         | Mesaj de salut         |
| GET    | /api/v1/docs          | Documentatie Swagger   |
