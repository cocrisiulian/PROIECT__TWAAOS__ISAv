# Checklist livrabile ClickUp - Laboratoare 02, 03, 04

Statusul de mai jos este evaluat pe baza codului din repository.

## Laborator 02

- [x] Design arhitectura aplicatiei (analiza microservicii vs monolit)
  - Material pregatit: docs/lab-02-arhitectura-aplicatiei.md
- [x] Structura modelului de date (diagrama ER)
  - Material pregatit: docs/lab-02-diagrama-er.md
- [ ] Materialele urcate in folderul dedicat pe ClickUp
  - Actiune manuala necesara: upload fisiere

Estimare progres Lab 02 dupa aceasta actualizare: 90%

## Laborator 03

- [x] Elaborarea backend-ului
- [x] Validarea API-ului si a serviciilor
  - Dovezi: backend/EVENT_WORKFLOWS_TESTING.md, backend/tests/
- [x] Mecanisme de autentificare JWT
- [x] Mecanisme de autentificare Google SignIn/OAuth
- [ ] Screenshot-uri de validare API urcate pe ClickUp
  - Actiune manuala necesara: rulare endpoint-uri si capturi ecran

Estimare progres Lab 03: 90%

## Laborator 04

- [x] Finalizare implementare back-end si API
- [x] Unit testing backend (pytest)
- [x] Unit testing frontend (vitest)
- [ ] Raport sumar de testare atasat in ClickUp (recomandat)
  - Actiune manuala recomandata: export rezultate test

Estimare progres Lab 04: 92%

## Pachet recomandat pentru upload in ClickUp

1. docs/lab-02-arhitectura-aplicatiei.md
2. docs/lab-02-diagrama-er.md
3. docs/clickup-checklist-lab-02-03-04.md
4. Capturi ecran Swagger + fluxuri API (Lab 03)
5. Capturi ecran rulare teste backend/frontend (Lab 04)

## Mini-ghid capturi ecran (ca sa inchizi rapid restul)

1. Swagger UI deschis pe /api/v1/docs
2. Login staff reusit (token returnat)
3. Flux Google OAuth callback reusit
4. Workflow organizer: create draft, submit
5. Workflow admin: approve/reject
6. Workflow student: register/unregister
7. Terminal pytest backend cu rezultate
8. Terminal vitest frontend cu rezultate
