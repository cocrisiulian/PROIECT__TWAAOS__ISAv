# Livrabil 2 - Documentare automata cod Python 3 (demonstrativ)

## 1. Scop
Acest livrabil descrie un proces demonstrativ de documentare automata pentru o parte din backend-ul Python 3, conform cerintei proiectului TWAAOS/ISA.

Nu se documenteaza intregul cod, ci un set reprezentativ de module:
- `backend/app/models/event.py`
- `backend/app/models/event_registration.py`
- `backend/app/routers/public.py`
- `backend/app/core/security.py`

## 2. Unealta aleasa
Unealta recomandata: **pdoc** (generator automat de documentatie pentru module Python).

De ce pdoc:
- este simplu de instalat;
- functioneaza direct pe module Python;
- exporta documentatie HTML usor de prezentat in screenshoturi;
- potrivit pentru demo rapid in context academic.

## 3. Preconditii
- Python 3.12 (sau 3.x compatibil)
- mediu virtual activ in folderul `backend`
- dependente backend instalate

## 4. Pasii procesului
### 4.1. Activare mediu virtual si instalare dependente
Windows (PowerShell):
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install pdoc
```

Alternativ CMD:
```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pdoc
```

### 4.2. Generare documentatie pentru modulele selectate
Din folderul `backend`:
```bash
pdoc app.models.event app.models.event_registration app.routers.public app.core.security --output-dir docs-auto
```

Rezultat asteptat:
- se creeaza folderul `backend/docs-auto`
- se genereaza pagini HTML pentru fiecare modul documentat

### 4.3. Deschidere locala a documentatiei
Se poate deschide in browser:
- `backend/docs-auto/app/models/event.html`
- `backend/docs-auto/app/models/event_registration.html`
- `backend/docs-auto/app/routers/public.html`
- `backend/docs-auto/app/core/security.html`

## 5. Ce se observa in documentatia generata
### 5.1. Modulul `app.models.event`
- clase: `Event`, `EventStatus`, `ParticipationMode`
- campurile modelului ORM
- relatiile principale catre `User`, `Faculty`, `Department`, `Category`, `EventRegistration`, `EventMaterial`, `Feedback`

### 5.2. Modulul `app.models.event_registration`
- clasa `EventRegistration`
- enum `RegistrationStatus`
- campuri cheie: `status`, `checked_in`, `registered_at`
- relatii: `event`, `student`

### 5.3. Modulul `app.routers.public`
- endpoint-uri publice: lista evenimente, detalii, lookup-uri
- endpoint-uri student: inscriere, retragere, feedback
- tipuri de filtre si parametri pentru cautare

### 5.4. Modulul `app.core.security`
- functii pentru parole: `hash_password`, `verify_password`
- functii JWT: `create_access_token`, `decode_access_token`
- tokenuri de actiune: `create_action_token`, `decode_action_token`

## 6. Sectiune pentru screenshoturi (2-3 imagini cerute)
Adauga in ClickUp minimum 2-3 screenshoturi cu urmatorul continut:

1. **Screenshot 1 - Comanda de generare**
   - terminalul in care ruleaza comanda pdoc
   - evidenta folderului de output `docs-auto`

2. **Screenshot 2 - Pagina documentatie model Event**
   - deschiderea fisierului `event.html`
   - evidentierea claselor/enumurilor si campurilor

3. **Screenshot 3 - Pagina documentatie router Public sau Security**
   - deschiderea `public.html` sau `security.html`
   - evidentierea functiilor/endpoint-urilor documentate

## 7. Text scurt pentru upload in ClickUp
"Documentatia automata a fost generata demonstrativ pentru 4 module Python 3 din backend (modele, routere, securitate), folosind unealta pdoc. Procesul a inclus instalarea utilitarului, generarea HTML si validarea vizuala prin screenshoturi ale comenzilor si ale paginilor rezultate."

## 8. Observatii finale
- Pentru un nivel mai avansat, procesul poate fi extins cu docstring-uri detaliate in fiecare modul.
- In varianta finala de proiect, documentatia poate fi integrata intr-un pipeline CI pentru regenerare automata la fiecare versiune.
