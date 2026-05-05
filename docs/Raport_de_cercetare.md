# Raport de cercetare: Integrarea IA în ingineria software (aplicare TWAAOS)

## Rezumat

Acest raport prezintă modalități practice de integrare a inteligenței artificiale (IA/IAG) în procesele de inginerie software, aplicate ca studiu de caz asupra proiectului TWAAOS. Include metodologie, scenarii de utilizare, 3-5 prompt-uri concrete folosite în proiect, răspunsurile agenților LLM și analiza corectitudinii și utilității acestora.

## 1. Introducere

Se trece în revistă motivația folosirii IA în dezvoltarea software: automatizare, asistență pentru design, generare cod, testare, documentare și optimizarea fluxurilor de muncă.

## 2. Context: proiectul TWAAOS

Descriere scurtă a proiectului (scop, arhitectură backend/frontend, cerințe cheie) și punctele din workflow unde IA poate aduce valoare (elicitation, design, implementare, testare, documentare, localizare, CI/CD).

## 3. Domenii de aplicare IA în ingineria software

- Elicitarea și rafinirea cerințelor
- Generare și revizuire de cod (ex.: generare endpoint, helper functions)
- Generare de teste automatizate și scenarii de test
- Analiză statică a designului și sugestii de îmbunătățire
- Documentare automată și generare changelog
- Localizare și i18n
- Asistență la configurarea pipeline-urilor CI/CD

## 4. Metodologie pentru integrare

- Definirea scopului pentru fiecare etapă (ce vrei de la IA)
- Alegerea modelului/agentului (capacitate, confidențialitate, cost)
- Formulare de prompturi (pattern: context → instrucțiune → constrângeri → format răspuns)
- Verificare: testare automată a ieșirilor și revizuire manuală
- Audit și managementul riscurilor (bias, securitate, date sensibile)

## 5. Studiu de caz: Prompturi şi rezultate (3 exemple)

### Prompt 1 — Elicitare cerinţe (exemplu)

- Prompt: "Având aplicația TWAAOS cu backend FastAPI și modele pentru `Event` și `Student`, propune 5 câmpuri noi utile pentru `Event` care permit sponsorizare și afișare prioritară, explicând fiecare câmp și eventuale modificări DB și API. Răspunde în română, format listă cu `nume_camp: tip — descriere` și un fragment SQL Alembic pentru migrare."
- Răspuns (rezumat): modelul a propus: `sponsorship_level: string`, `sponsor_name: string`, `is_featured: boolean`, `featured_until: datetime`, `priority_rank: integer`. A oferit explicații scurte și un exemplu Alembic (opțiuni `add_column` pentru fiecare câmp).
- Analiză: Răspunsul a fost coerent și imediat util; fragmentul Alembic a necesitat mici corecții (ex.: folosirea `sa.Boolean()` vs `Boolean`) și adaptare la convențiile proiectului (nume tabel, importuri). A fost nevoie de un follow-up prompt pentru a genera migrarea completă compatibilă cu codebase-ul (`Tables`/numele reale). Concluzie: util pentru brainstorming și accelerarea scrierii migrărilor, dar necesită verificare și adaptare manuală.

### Prompt 2 — Generare test unitare pentru API

- Prompt: "Generează 3 teste Pytest pentru endpoint-ul `POST /api/events` care validează crearea corectă, eroarea pentru fișier lipsă `title` și validarea `date` în trecut. Folosește clientul FastAPI/TestClient și factory pentru Event."
- Răspuns (rezumat): modelul a produs trei funcții de test cu fixture `client` și exemple de payload; a inclus assert-uri pentru coduri 201 și 422.
- Analiză: Testele erau funcționale ca schemă, dar necesitau adaptare la fixtures din proiect (`client` vs `api_client`, serializare datelor, autentificare). Un follow-up prompt a cerut integrarea cu `conftest.py` din repo și a generat variante adaptate. Concluzie: util pentru prototipare rapidă a testelor; adaptare la convențiile repo necesară.

### Prompt 3 — Refactorizare/optimizare de cod

- Prompt: "Analizează această funcție Python (inserați fragment) și propune o versiune refactorizată care minimizează duplicarea și folosește tipare pythonesc: returnează doar codul refactorizat și scurtă justificare."
- Răspuns (rezumat): modelul a returnat o versiune mai compactă, a introdus helper, și a adăugat tipuri.
- Analiză: De regulă răspunsul conține soluții bune; însă trebuie verificat pentru cazuri limită și performanță. Un caz concret a evidențiat o alegere neoptimă (folosirea list comprehension cu side-effects), corectată după review uman. Concluzie: IA oferă un bun punct de plecare, dar nu ar trebui acceptată fără code review.

## 6. Analiză a erorilor și limitărilor observate

- Răspunsuri overconfident (hallucinații) la întrebări de design foarte specifice
- Probleme de format/compatibilitate cu convențiile repo
- Necesitatea follow-up prompts pentru precizare
- Securitate: nu expune date sensibile în prompturi (API keys, PII)

## 7. Etapă de lucru semestrială și livrabile

- Săptămânile 1–3: Literatură și definire scopuri
- Săptămânile 4–6: Integrare prompturi în workflowul de dezvoltare; pregătire previzualizare (laboratorul 5) — include demo cu 2 prompturi aplicate pe repo
- Săptămânile 7–12: Studii de caz detaliate, testare, iterare
- Săptămâna finală: Redactare finală + fișiere anexă (raw prompts + outputs)

## 8. Etică, confidențialitate și bune practici

- Evitarea includerii datelor sensibile în prompturi
- Control versiuni pentru rezultatele IA
- Validare umană obligatorie pentru cod/proiectări critice

## 9. Concluzii și recomandări practice

- Folosiți IA ca asistent de productivitate, nu ca înlocuitor de verificare umană
- Încorporați teste care validează sugestiile generate (ex.: testele propuse de IA)
- Documentați prompturi și versiuni de model folosite
