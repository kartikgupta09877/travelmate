# TravelMate — Backend

FastAPI service powering TravelMate's verified travel-partner matching, cost sharing, trips, chat,
reviews, safety, and admin features. It runs against MongoDB, or entirely in-memory with no database
to install.

---

## Requirements

- Python 3.10+
- (Optional) MongoDB 5+ if you want real persistence instead of the in-memory mock

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

On startup the app connects to the database, seeds demo data if the database is empty, and serves:

- **API** under `http://localhost:8000/api`
- **Interactive docs** (Swagger UI) at `http://localhost:8000/docs`
- **Health check** at `http://localhost:8000/health`

## Configuration

All settings load from environment variables (or a `.env` file). Defaults are safe for local dev.

| Variable                      | Default                          | Purpose                                                        |
|-------------------------------|----------------------------------|----------------------------------------------------------------|
| `USE_MOCK_DB`                 | `true`                           | `true` = in-memory `mongomock` (no MongoDB). `false` = real DB. |
| `MONGODB_URI`                 | `mongodb://localhost:27017`      | Connection string when `USE_MOCK_DB=false`.                     |
| `MONGODB_DB`                  | `travelmate`                     | Database name.                                                  |
| `SEED_ON_STARTUP`             | `true`                           | Seed realistic demo data if the DB is empty.                    |
| `JWT_SECRET`                  | *(dev placeholder)*              | **Change this in production** to a long random string.          |
| `JWT_ALGORITHM`               | `HS256`                          | JWT signing algorithm.                                          |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days)                 | Access-token lifetime.                                          |
| `CORS_ORIGINS`                | `http://localhost:5173,...`      | Comma-separated allowed origins for the frontend.               |

### In-memory vs. real MongoDB

The default `USE_MOCK_DB=true` uses `mongomock-motor`, giving you the full API — auth, matching,
trips, everything — with **zero database setup**. Data lives only for the life of the process, which
is ideal for demos and evaluation.

To persist data, install/run MongoDB, then set:

```env
USE_MOCK_DB=false
MONGODB_URI=mongodb://localhost:27017
```

No application code changes are needed; the repository layer targets the same async Motor interface
either way.

## Demo accounts

Seeded on first startup (all share the password `password123`):

- **User** — `demo@travelmate.app` (fully verified commuter with a vehicle)
- **Admin** — `admin@travelmate.app` (moderation dashboard access)

Several other members are seeded with overlapping routes so matching and checkpoints are populated
immediately.

---

## Project layout

```
backend/app/
├── main.py                 FastAPI app, CORS, router registration, lifespan seed
├── core/
│   ├── config.py           Pydantic settings (env-driven)
│   ├── database.py         Motor / mongomock connection lifecycle
│   ├── security.py         bcrypt hashing + JWT encode/decode
│   └── utils.py            shared helpers
├── schemas/                Pydantic models per domain (user, journey, match, trip, …)
├── services/
│   ├── matching.py         weighted route-overlap scoring engine
│   ├── checkpoint.py       safe public-checkpoint suggestion
│   ├── cost.py             per-person split, monthly savings, CO₂
│   ├── geo.py              haversine distance / ETA estimation
│   └── ai_assistant.py     natural-language request → structured search
├── db/
│   ├── repo.py             repository/data-access layer
│   └── seed.py             demo users, journeys, trips, reviews
└── api/
    ├── deps.py             auth dependencies (current user, admin guard)
    └── routes/             one router per domain (see below)
```

## API surface

All routes are mounted under the `/api` prefix.

| Router       | Responsibility                                                        |
|--------------|-----------------------------------------------------------------------|
| `auth`       | Register, login, current user, send/confirm verification codes         |
| `users`      | Public profiles, update own profile, block / unblock                   |
| `journeys`   | Create journeys, list, get, live cost preview                          |
| `matches`    | Search partners, request to join, set checkpoint, accept / decline     |
| `trips`      | List/get trips, advance status through the trip lifecycle              |
| `messages`   | Conversations and messages (in-app chat)                               |
| `reviews`    | Post-trip ratings and reviews                                          |
| `safety`     | Report, block, SOS, share-trip                                         |
| `dashboard`  | Personalised savings / CO₂ / partner stats                             |
| `assistant`  | AI Match Assistant natural-language endpoint                           |
| `admin`      | Stats, user management, verification toggles, report handling          |

## Authentication & roles

- Passwords are hashed with **bcrypt**; sessions use **JWT** bearer tokens.
- Two roles: **User** and **Admin**. Admin-only routes are guarded by a dependency in `api/deps.py`.
- Send the token as `Authorization: Bearer <token>` on protected endpoints.

## Data privacy in the backend

- Verification endpoints record only a **status per channel** — no identity or vehicle documents are
  stored.
- Exact home coordinates are never returned to other users; responses expose only approximate
  zones, and precise meeting points are shared only once both travellers accept a match.
- The SOS endpoint returns local emergency numbers and logs the incident but does **not** contact
  emergency services — this is stated explicitly in the response and UI.

---

## Notes

- The seed runs only when the database is empty, so restarting won't duplicate data (in-memory mode
  reseeds each run because storage is fresh).
- The matching weights (route 40% / time 25% / destination 15% / checkpoint 10% / reliability 10%
  for local trips) live in `services/matching.py` and are the single place to tune ranking.
