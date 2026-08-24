# Sahayak — CPGRAMS Companion

Sahayak is a redesigned, citizen-first public grievance portal inspired by India’s CPGRAMS (Centralised Public Grievance Redress and Monitoring System). Citizens can lodge, track, remind, rate, and appeal grievances in plain English or Hindi — with an optional voice/text AI assistant. Officers work a tiered desk with a 21-day SLA escalation path.

**Important:** Sahayak stores grievances in its own database. Registration IDs look like CPGRAMS (`PMOPG/…`, `PENPG/…`), but **nothing is filed to the live** `pgportal.gov.in` portal. There is no Aadhaar/PAN collection and no live portal automation.

**One-line pitch:** Speak or type your problem; Sahayak suggests the right department with a readable reason, sets honest time expectations, lets neighbours verify and raise location issues (Jan Samarthan), and checks whether a closure actually answered you — drafting an appeal when it did not.

---

## Table of contents

1. [Features at a glance](#features-at-a-glance)
2. [Jan Samarthan (community raise)](#jan-samarthan-community-raise)
3. [Lodge a grievance](#lodge-a-grievance)
4. [Status, resolution check, appeals](#status-resolution-check-appeals)
5. [Citizen desk](#citizen-desk)
6. [Officer / admin desk](#officer--admin-desk)
7. [Escalation map & SLA](#escalation-map--sla)
8. [AI assistant & voice](#ai-assistant--voice)
9. [Transparency & content pages](#transparency--content-pages)
10. [Auth & roles](#auth--roles)
11. [Tech stack](#tech-stack)
12. [Project structure](#project-structure)
13. [API reference](#api-reference)
14. [Database & migrations](#database--migrations)
15. [Environment variables](#environment-variables)
16. [How to run](#how-to-run)
17. [Seeded demo accounts](#seeded-demo-accounts)
18. [Real vs mocked](#real-vs-mocked)
19. [Internationalisation](#internationalisation)
20. [Guardrails](#guardrails)

---

## Features at a glance

| Area | What you get |
|------|----------------|
| **Assisted filing** | File for yourself, or help someone who cannot type (CSC / family / neighbour) with verbal consent |
| **Playbooks** | Guided flows for water, road, waste, cyber, power, and general problems |
| **Smart routing** | Category/ministry suggestion with an explainable reason + expected days / pendency |
| **Location + evidence** | GPS pin, reverse geocode, camera evidence (no Aadhaar/PAN) |
| **Jan Samarthan** | Neighbours raise the same location ticket; priority only after verification |
| **Status coach** | Timeline, SLA desk, resolution-quality check, rating, reminder, appeal draft |
| **Tiered officer desk** | Field → Supervisor → CM office with 21-day hops |
| **Voice AI** | Chat + realtime voice (OpenAI) in English / Hindi |
| **Bilingual UI** | Full EN / HI dictionary and playbook copy |

---

## Jan Samarthan (community raise)

Flagship feature: **anyone affected by a problem at a location can raise an existing grievance** — not only the original filer. Raising **does not** auto-inflate officer priority. Every raise must be **verified** first.

### Two verification paths

| Path | When | How | Result |
|------|------|-----|--------|
| **On-site (strongest)** | User is at the problem pin (~100–150 m) | GPS + mock OTP (+ optional photo) → **Confirm — still a problem** | Immediately `verified` as `onsite_push` |
| **Remote (affected, not there)** | Same village/ward / uses that road | Mock OTP + (village/ward match **or** GPS within ~800 m **or** photo of the spot) | Verified `endorse`, or **pending** until evidence is enough |

Until verified, copy is clear: *“Raise submitted — verify to push this complaint for officers.”*

### Priority thresholds

Only `status=verified` counts:

- **`backer_count`** — distinct verified mobiles
- **`push_count`** — verified on-site confirms
- Crossing **25 verified backers** or **5 on-site pushes** writes a desk event: *Community priority — interim reply due*

### Surfaces

| Route / UI | Purpose |
|------------|---------|
| Home → **Raise a problem near me** | Entry to `/nearby` |
| `/nearby` | GPS / village search → list open nearby tickets → raise |
| `/back/[reg]` | Shareable link, pass-the-phone raise, labelled **IVR simulator** (demo only) |
| Lodge form (after pin) | If a neighbour already reported nearby → **join instead of duplicate** |
| Status `/status/[id]` | Badges: Backed / On-site / Pending / Response required + raise panel |
| Escalation map | Community-backed cluster for officers |

### Core APIs

- `GET /api/grievances/nearby`
- `POST /api/grievances/{registration_id}/raise`
- `POST /api/grievances/{registration_id}/onsite-verify`
- `POST /api/grievances/{registration_id}/verify-raise`
- `GET /api/grievances/{registration_id}/backers`

**Mock OTP for demo:** `123456`

Implementation: `app/services/community.py`, `frontend/src/components/grievance/RaiseVerifyPanel.tsx`

---

## Lodge a grievance

### Entry points

- Home: **File for myself** / **I'm helping someone who can't type** (`/grievance/lodge?helper=1`)
- `/desk/lodge` — terms & exclusions → ministry tiles → form
- `/grievance/lodge` — public grievance
- `/grievance/lodge-pension` — pension / retirement path

### Playbooks

Guided bilingual packs (`app/services/playbooks.py`):

| ID | Topic |
|----|--------|
| `water` | Water supply / dry tap / pipeline |
| `road` | Blocked or broken road |
| `waste` | Garbage, drain, river waste |
| `cyber` | Cyber fraud / online cheat |
| `power` | Electricity outage / wires / bill |
| `general` | Free-text / other |

Each playbook sets suggested ministry/category, clarifying questions, and photo prompts that **forbid Aadhaar, PAN, OTP, PINs**.

### Form steps (public)

1. **Who** — self vs helper; helper name/relation; **verbal consent** (stored as `consent_capture`); citizen name + mobile (tracking owner)
2. **Kind of problem** — pick a playbook
3. **Details** — answer playbook questions (chips / short text)
4. **Place** — Use my location (Nominatim reverse geocode) or type village / ward / district / street; **nearby join** prompt if duplicates exist
5. **Photo** — camera or library (max 3 images, compressed)
6. **Department & expectations** — AI/rules classification with reason, typical days, pendency %; user can override
7. **Done** — registration ID, print ack, link to status; optional “add affected people” for community-scope cases

**Kinds & IDs**

- Public → `PMOPG/YYYYMMDDHHMMSS`
- Pension → `PENPG/YYYYMMDDHHMMSS`

**Impact scope** (`self` | `street` | `village`) is inferred from “who is affected” answers and stored for community flows.

The voice assistant can drive the lodge form hands-free (`lodge` tools: set who, playbook, answers, location, camera, classify, submit).

---

## Status, resolution check, appeals

### Track status

- `/status` — search by registration ID
- `/status/[id]` — full case pack: subject, place, photos, helper info, timeline, desk/SLA banner, Jan Samarthan badges

### Resolution quality check

When a department reply / closure exists, Sahayak compares the original complaint to the reply:

- Flags whether key asks were addressed
- Lists what looks missing
- Drafts an appeal in the citizen’s words when the reply looks like a brush-off

Also available as a standalone tool on `/help` (paste complaint + reply).

Logic: `app/services/review.py`, `GET /api/grievances/review`, `POST /api/ai/resolution-check`

### Rating, reminder, appeal

| Action | Behaviour |
|--------|-----------|
| **Rate 1–5** | Stored on the grievance; low stars open the appeal path on the status page |
| **Reminder** | `/grievance/reminder` or API — increments `reminder_count` + timeline event |
| **Appeal** | Within **30 days** of closure; creates `APPL/…` record; copy text for official use |

Citizen appeals dashboard: `/desk/appeals`

---

## Citizen desk

Authenticated area under `/desk` (`DeskSidebar`):

| Page | Purpose |
|------|---------|
| `/desk` | Counts (total / pending / closed) + searchable grievance list |
| `/desk/lodge` | Lodge public (terms → ministries) |
| `/desk/appeals` | Your appeals |
| `/desk/activity` | Account activity log |
| `/desk/profile` | Edit name / email |
| `/desk/password` | Change password |
| `/desk/delete` | Ends the session (sign-out); does **not** wipe grievances from the DB |

Shortcuts: lodge pension, speak with Sahayak, open transparency / escalation map.

---

## Officer / admin desk

Sign-in: `/admin/signin` (password only — staff **cannot** use mock OTP login).

| Page | Purpose |
|------|---------|
| `/admin` | Overview: registered, open, under process, delayed, resolved, appeals, citizen/officer counts |
| `/admin/grievances` | Role-scoped list; shows Backed / Push / Pending / Priority |
| `/admin/grievances/[id]` | Update status + note; escalate when allowed |
| `/admin/appeals` | Appeals inbox |
| `/admin/nodal-officers` | CRUD nodal PG directory |
| `/admin/escalation` | Desk map + community cluster |
| `/admin/users` | Users & roles (**admin only**) |
| `/admin/config` | Seeded admin config view (**admin only**) |

### Statuses officers can set

`Registered` · `Under Process` · `Forwarded` · `Escalated` · `Resolved` · `Closed` · `Rejected`

### Visibility by role

| Role | Sees / acts on |
|------|----------------|
| **officer** | Assigned or field-officer files; escalate only after 21-day SLA overdue |
| **supervisor** | Level ≥ 2 files + own/field; can escalate |
| **cm** | All grievances |
| **admin** | All grievances + user roles + config |

Assignment on create: least-loaded field officer (`app/services/desk.py`).

---

## Escalation map & SLA

**SLA:** 21 days per desk level (`SLA_DAYS = 21`).

| Level | Role | Label |
|-------|------|--------|
| 1 | `officer` | Field officer |
| 2 | `supervisor` | Supervisor |
| 3 | `cm` | CM office |

- Clock starts at `level_assigned_at`
- Overdue files auto-escalate on status/list reads (`apply_due_escalations`)
- Public explanation: `/escalation-map` and `GET /api/desk-map`
- Status page shows current desk, days on desk, overdue banner

---

## AI assistant & voice

Persistent Sahayak avatar (chat + voice) on most screens.

| Capability | How |
|------------|-----|
| Text chat | `POST /api/ai/chat`, streaming `WS /api/ai/ws` |
| Speech → text | Whisper `POST /api/ai/transcribe` |
| Text → speech | `POST /api/ai/speak` |
| Realtime voice | `WS /api/ai/realtime` (OpenAI Realtime) |
| Classify / route | `POST /api/ai/classify` (+ keyword rules) |
| Resolution check | `POST /api/ai/resolution-check` |
| Health | `GET /api/ai/status` |

Requires `OPENAI_API_KEY`. Without it, the UI shows clear “voice / AI unavailable” fallbacks. Replies follow the citizen’s language (EN / HI / Hinglish).

Lodge guide: the assistant can fill the form via structured `lodge` actions so users do not have to type.

---

## Transparency & content pages

| Route | Content |
|-------|---------|
| `/` + `TransparencyDesk` | Live counts strip on home |
| `/transparency` | Registered / open / resolved / delayed; ministry breakdown; how numbers work |
| `/nodal-officers/central` | Central nodal PG officers |
| `/nodal-officers/state` | State nodal PG officers |
| `/appeal/authority` | Nodal authority for appeals |
| `/redress-process` | How redress works |
| `/about` | About CPGRAMS / Sahayak |
| `/help` | FAQs + paste-in resolution checker |
| `/contact` | Contact |
| `/policies` | Policies (incl. no Aadhaar/PAN) |
| `/disclaimer` | Disclaimer |
| `/mobile-app` | Mobile / UMANG notes |
| `/web-information-manager` | WIM |
| `/sitemap` | Site map |

Data APIs: `GET /api/grievances/transparency`, `/api/news`, `/api/departments`, `/api/nodal-officers`

---

## Auth & roles

| Method | Notes |
|--------|-------|
| Register + password | `/auth/register`, `/auth/signin` |
| Mock OTP | Request/verify — always code **`123456`** (demo only) |
| JWT | Bearer token; `JWT_SECRET`, `JWT_EXPIRE_MINUTES` |
| Profile / password / activity | Desk account pages + `/api/auth/*` |

**Roles:** `citizen` · `officer` · `supervisor` · `cm` · `admin`

Staff must use `/admin/signin` with password. OTP login is for citizens only.

---

## Tech stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide |
| **Backend** | FastAPI, Uvicorn/Gunicorn, SQLAlchemy, Alembic, Pydantic, python-jose, bcrypt, httpx, OpenAI SDK, WebSockets |
| **Database** | PostgreSQL 15 |
| **Infra** | Docker Compose (postgres, backend, frontend), Makefile |
| **AI** | OpenAI Chat / Whisper / TTS / Realtime; local keyword classifier + playbooks |

---

## Project structure

```
shayak/
├── app/                    # FastAPI application
│   ├── routers/            # HTTP + WebSocket routes
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # playbooks, community, desk, classifier, review, AI, …
│   └── core/               # config, database, security
├── alembic/versions/       # DB migrations
├── frontend/src/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # LodgeForm, RaiseVerifyPanel, Assistant, EscalationMap, …
│   ├── context/            # Auth, Language, Assistant
│   ├── hooks/              # realtime voice, etc.
│   └── lib/                # api client, i18n, content, roles
├── scripts/seed.py         # Demo users, officers, sample grievances
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## API reference

Base URL (local): `http://localhost:8001`  
Interactive docs: `/api/docs` · `/api/redoc`

### Health
- `GET /api/health`

### Auth — `/api/auth`
- `POST /register`, `/login`, `/otp/request`, `/otp/verify`
- `GET /me`, `PUT /profile`, `POST /password`, `GET /activity`

### Grievances — `/api/grievances`
- `GET /playbooks`, `/transparency`, `/nearby`, `/geo/reverse`
- `POST /` (create), `GET /` (list), `GET /{registration_id}`, `GET /review`
- `POST /{id}/raise`, `/{id}/onsite-verify`, `/{id}/verify-raise`
- `GET /{id}/backers`
- `POST /reminder`, `/rate`, `/appeal`
- `GET /appeal-record/{appeal_id}`

### Content — `/api`
- `GET /news`, `/nodal-officers`, `/desk-map`, `/departments`

### AI — `/api/ai`
- `GET /status`
- `POST /classify`, `/resolution-check`, `/chat`, `/transcribe`, `/speak`
- `WS /ws`, `WS /realtime`

### Admin — `/api/admin`
- `GET /config`, `/overview`, `/grievances`, `/grievances/{id}`
- `POST /grievances/{id}/action`, `/grievances/{id}/escalate`
- `GET /appeals`, `/users`, `POST /users/{id}/role`, `GET /desk-map`
- `GET|POST /nodal-officers`, `PUT|DELETE /nodal-officers/{id}`

---

## Database & migrations

| Revision | Adds |
|----------|------|
| `001` | users, grievances, events, appeals, news, nodal_officers, department_stats |
| `002` | account_activities |
| `003` | grievances.closed_at |
| `004` | playbook pack: place, GPS, helper fields, answers, evidence |
| `005` | users.role |
| `006` | nodal_officers.address |
| `007` | desk assignment + escalation_level / level_assigned_at |
| `008` | Jan Samarthan: consent, impact_scope, backer/push/pending counts, radii, `grievance_backers` |

Apply: `make migrate-up` (or backend boot runs `alembic upgrade head`).

---

## Environment variables

Copy `.env.example` → `.env`:

| Variable | Purpose |
|----------|---------|
| `APP_ENV`, `LOG_LEVEL`, `FRONTEND_URL` | App runtime |
| `POSTGRES_*`, `DATABASE_URL` | Database |
| `JWT_SECRET`, `JWT_EXPIRE_MINUTES` | Auth tokens |
| `ADMIN_NAME`, `ADMIN_MOBILE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeded nodal admin |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_PATH`, `NODE_ENV`, `FRONTEND_TARGET` | Frontend |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REALTIME_MODEL` | Avatar / voice / chat |
| `GEMINI_API_KEY`, `AI_MODEL` | Present in env; **not wired** into services today |

---

## How to run

```bash
make env          # copy .env.example → .env if missing
# Edit .env — set OPENAI_API_KEY for voice/chat
make up           # postgres + backend + frontend
make migrate-up   # if you need migrations alone
make logs-be      # backend logs
make logs-fe      # frontend logs
make reset-db     # migrate + seed demo data
make down
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| API | http://localhost:8001 |
| API docs | http://localhost:8001/api/docs |
| Postgres | localhost:5432 |

Backend boot (`start.sh`): wait for DB → migrate → seed → uvicorn (dev) / gunicorn (prod).

---

## Seeded demo accounts

From `scripts/seed.py` (passwords/mobiles as seeded — check seed output / admin env):

| Role | Typical mobiles (seed) |
|------|-------------------------|
| Field officers | `9111111111`–`9111111113` |
| Supervisors | `9222222221`–`9222222222` |
| CM desk | `9333333331`–`9333333332` |
| Admin | `ADMIN_MOBILE` from `.env` (default `9999999999`) |
| Demo citizen | `9876543210` (+ sample grievances) |

Officer desk: `/admin/signin`  
Citizen: `/auth/signin` (password or mock OTP `123456`)

---

## Real vs mocked

| Item | Status |
|------|--------|
| Mobile OTP / SMS | **Mocked** — always `123456` |
| Aadhaar / PAN / real KYC | **Never collected** |
| Live CPGRAMS / pgportal filing | **Not integrated** — local DB only |
| Reverse geocode | **Real** (OpenStreetMap Nominatim, best-effort) |
| OpenAI chat / voice / realtime | **Real** when `OPENAI_API_KEY` is set |
| Classification | Keyword / playbook rules (+ AI assist where configured) |
| Missed-call IVR | **Labelled simulator** on `/back/[reg]` only |
| Delete account | Signs out session; does not hard-delete history |
| Gemini | Env only — unused in current app code |

---

## Internationalisation

- Dictionary: `frontend/src/lib/i18n.ts` (`en` / `hi`)
- Toggle in site header; stored as `sahayak_lang` in `localStorage`
- Playbooks, desk map blurbs, and many lookups ship Hindi variants
- AI is instructed to answer in the citizen’s language

---

## Guardrails

Aligned with the product brief:

1. **No** real Aadhaar, PAN, payment, or live SMS OTP gateways  
2. **No** browser automation or field-filling on the live government portal  
3. AI suggestions are **explainable** (visible reason / missing tokens) — not black-box final authority  
4. Sahayak is **not** an official government product and does not misuse government logos  
5. Community raises stay honest: **pending vs verified** is always visible to citizens and officers  

---

## License / contribution

This repository is a companion rebuild for demonstration and product exploration (e.g. Build What Moves India). Treat credentials in `.env` as local secrets; never commit real production keys.

For questions about architecture, start with:

- `app/services/community.py` — Jan Samarthan  
- `app/services/desk.py` — SLA & assignment  
- `app/services/playbooks.py` — lodge packs  
- `frontend/src/components/grievance/LodgeForm.tsx` — citizen lodge UX  
- `frontend/src/components/ai/Assistant.tsx` — avatar  
