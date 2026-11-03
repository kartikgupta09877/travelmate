# TravelMate

**A verified travel-partner & cost-sharing platform — not a taxi service.**

TravelMate helps people who are *already making a journey* find compatible, identity-verified
companions to share the ride and split the running cost. It matches travellers whose routes
**overlap** (they never need the same start point), suggests **safe public checkpoints** instead of
exposing home addresses, and layers a multi-channel **verification** system on top so the community
is trust-based rather than anonymous.

It covers two modes:

- **Local travel** — everyday commutes of roughly 20–30 km (home → office, campus → home).
- **Long trips** — intercity or group journeys over ~30 km (weekend trips, holidays, road trips).

> TravelMate connects private individuals sharing their own journeys and costs. It is **not** a
> commercial taxi, cab, or ride-hailing service, and no one is paid to drive.

---

## Table of contents

- [Feature overview](#feature-overview)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [How matching works](#how-matching-works)
- [Safety & privacy principles](#safety--privacy-principles)
- [Project structure](#project-structure)
- [Extending the platform](#extending-the-platform)

---

## Feature overview

**Accounts & verification**
- Email + password auth with JWT sessions and role-based access (User / Admin).
- Five independent verification channels — email, phone (OTP), identity, college/company, and
  vehicle — each earning its own badge. The platform stores only a **verified/unverified status**,
  never the underlying documents.

**Journeys & matching**
- Create local or long-trip journeys with origin, destination, time, recurrence, seats, and vehicle.
- Route-overlap matching that surfaces partners even when start points differ, shown as a
  **"NN% Match"** with plain-language reasons.
- Modular **AI Match Assistant** that turns a natural-language request ("I need a ride to CP around
  9am tomorrow") into a structured search and ranked results.

**Cost sharing**
- Transparent per-person split, projected **monthly savings**, and estimated **CO₂ reduction** —
  previewed live while a journey is being created.

**Trips, chat & reviews**
- End-to-end trip lifecycle (request → confirm → in-progress → completed), in-app messaging,
  and post-trip ratings with tags.

**Safety**
- Safe checkpoint suggestions, report/block, trip sharing, and an **SOS** action that alerts
  trusted contacts and surfaces local emergency numbers — while clearly stating it **does not
  replace emergency services**.
- **Trust Lab** — an interactive, privacy-first route-policy simulator. Before publishing a
  journey, a traveller can see how location precision, time flexibility, and verification signals
  affect discoverability, information exposure, and match quality. It makes the product's
  safety–convenience trade-offs explicit instead of burying them in settings.

**Admin**
- Moderation dashboard for verification management, report handling, and community analytics.

---

## Architecture

TravelMate is a monorepo with a decoupled backend API and single-page frontend:

```
travelmate/
├── backend/     FastAPI + MongoDB (or in-memory mock) REST API
└── frontend/    Vite + React + TypeScript SPA (Tailwind, Leaflet)
```

The frontend talks to the backend over a JSON REST API under `/api`. In local development the Vite
dev server proxies `/api` to the backend on port 8000, so no CORS or base-URL configuration is
needed to get started.

---

## Tech stack

| Layer      | Choices                                                                       |
|------------|-------------------------------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 6, TanStack Query 5 |
| Maps       | Leaflet + OpenStreetMap via `react-leaflet` (provider-agnostic wrapper)        |
| Backend    | FastAPI, Pydantic v2, JWT (PyJWT), bcrypt password hashing                      |
| Database   | MongoDB via Motor — or `mongomock-motor` for a zero-setup in-memory run         |

---

## Quick start

You need **Python 3.10+** and **Node 18+**. Two terminals is the simplest setup.

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # defaults work out of the box
uvicorn app.main:app --reload --port 8000
```

By default `USE_MOCK_DB=true`, so the API runs entirely **in-memory with no MongoDB required** and
seeds itself with realistic demo data on startup. Interactive API docs are then available at
<http://localhost:8000/docs>.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The dev server proxies API calls to the backend automatically.

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for
deeper configuration (real MongoDB, deployed builds, environment variables).

---

## Demo accounts

The seed data creates a ready-to-explore community. All demo users share the same password.

| Role  | Email                   | Password      | Notes                                    |
|-------|-------------------------|---------------|------------------------------------------|
| User  | `demo@travelmate.app`   | `password123` | Fully verified commuter with a car        |
| Admin | `admin@travelmate.app`  | `password123` | Access to the admin moderation dashboard  |

Additional seeded members (Rahul, Sneha, Ananya, Ishita, and others) provide overlapping routes so
matching, checkpoints, and cost sharing are populated from the first login.

> These are demo credentials for local development only. Do not reuse them in any real deployment.

---

## How matching works

Matching prioritises, in order: **Safety → Route overlap → Time → Reliability → Cost.** Candidates
must clear safety/verification gates first; the remaining fit is a weighted score.

For **local** commutes the weights are:

| Factor                        | Weight |
|-------------------------------|--------|
| Route overlap                 | 40%    |
| Departure-time proximity      | 25%    |
| Destination closeness         | 15%    |
| Checkpoint / detour distance  | 10%    |
| Reliability (rating & history)| 10%    |

The score is presented as a **"NN% Match"** alongside human-readable reasons (e.g. *"85% of your
route overlaps"*, *"leaves within 10 minutes of you"*) so the recommendation is explainable rather
than a black box. Long trips use the same factors with weighting tuned for intercity distance and
group fit. The scoring lives in `backend/app/services/matching.py` and is intentionally isolated so
the weights can be tuned in one place.

---

## Safety & privacy principles

These are core product constraints, not afterthoughts:

- **Home addresses are never exposed.** The map shows only an *approximate* start zone (a circle,
  not a pin). Partners meet at **safe public checkpoints**, and the exact meeting point is revealed
  only after **both** travellers accept.
- **Minimal identity data.** Verification stores only a status flag per channel — raw identity or
  vehicle documents are never persisted.
- **Honest safety language.** Verification is described as a **trust layer that reduces risk**, and
  the product deliberately avoids claims like "100% safe", "zero fraud", or "zero crime".
  Verification does not guarantee the absence of crime or fraud.
- **SOS is not emergency dispatch.** The SOS feature notifies trusted contacts and shows local
  emergency numbers, while clearly stating that **it does not contact or replace emergency
  services** — users should call those directly in a real emergency.

---

## Project structure

```
travelmate/
├── README.md                  ← you are here
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py            FastAPI app, CORS, router wiring, startup seed
│       ├── core/              config, database, security (JWT/bcrypt), utils
│       ├── schemas/           Pydantic request/response models
│       ├── services/          matching, checkpoint, cost, geo, ai_assistant
│       ├── db/                repository layer + demo seed data
│       └── api/routes/        auth, users, journeys, matches, trips, messages,
│                              reviews, safety, admin, dashboard, assistant
└── frontend/
    ├── package.json
    ├── vite.config.ts         @ alias + /api dev proxy
    ├── tailwind.config.js      Wayline design tokens
    └── src/
        ├── pages/             route-level screens (+ admin/)
        ├── components/        UI primitives, map module, journey/match widgets
        └── lib/               api client, auth, types, formatting, geo helpers
```

---

## Extending the platform

- **Swap the map provider.** UI code depends only on the `MapView` interface in
  `frontend/src/components/map` (with `MapMarker` / `MapRoute` types). Leaflet is the default
  implementation and can be replaced without touching page code. Until a routing provider is
  connected, the dashed route is an estimated travel corridor and the backend applies a
  transparent road-distance factor for duration and cost estimates.
- **Replace the AI assistant.** `backend/app/services/ai_assistant.py` parses free-text requests
  behind a single function, so a rule-based parser can be swapped for an LLM call without changing
  the API contract or the frontend.
- **Use a real database.** Set `USE_MOCK_DB=false` and point `MONGODB_URI` at a MongoDB instance;
  no application code changes are required.

---

Built as a full-stack reference implementation: React/TypeScript frontend, FastAPI/Python backend,
MongoDB-compatible persistence, JWT auth, and role-based access.
