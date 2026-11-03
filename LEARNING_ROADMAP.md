-# TravelMate — 2-Week Build & Commit Roadmap

A day-by-day plan to commit the project to GitHub in a realistic build order (backend first, then
frontend). Each day: the files to commit, a one-line purpose for each, and the exact git commands.

**How this works:** all the code already exists on disk, so each day you stage only that day's files
with explicit `git add <file>` paths, then commit and push. Do **not** use `git add .` or
`git add <folder>/` — that would stage everything at once and collapse the history into one commit.

> **One honest caveat:** because you're committing finished code incrementally, some early commits
> reference files that arrive on a later day (e.g. `main.py` needs all routers; `App.tsx` needs all
> pages). So the **backend runs after Day 7** and the **frontend builds after Day 14** — intermediate
> commits are snapshots, not necessarily runnable. That's normal and fine for a learning history.

---

## One-time setup (before Day 1)

1. Create an **empty** repo on GitHub named `travelmate` — do **not** let it add a README, license,
   or .gitignore (you already have them locally; this avoids a merge conflict on first push).
2. Set your git identity if you haven't before:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

3. When you push, GitHub will ask you to authenticate. Use either a **Personal Access Token** as the
   password (Settings → Developer settings → Tokens) over HTTPS, or set up an SSH key.

A `.gitignore` is already in the project root — it keeps `.venv/`, `node_modules/`, and `.env` out
of git. Confirm your virtualenv won't be committed by running `git status` after Day 1's `git add`
and checking that nothing under `backend/.venv/` appears.

---

# WEEK 1 — Backend

## Day 1 — Repository & scaffolding
**Goal:** initialise the repo and commit the project skeleton (config + empty Python packages).

Files:
- `.gitignore` — keeps venv, node_modules, secrets out of git
- `README.md` — project overview and quick start
- `backend/requirements.txt` — Python dependencies
- `backend/.env.example` — backend config template
- `backend/app/__init__.py` + the 6 sub-package `__init__.py` files — Python package structure

```bash
cd G:\travelmate\travelmate
git init
git branch -M main
git add .gitignore README.md backend/requirements.txt backend/.env.example backend/app/__init__.py backend/app/api/__init__.py backend/app/api/routes/__init__.py backend/app/core/__init__.py backend/app/db/__init__.py backend/app/schemas/__init__.py backend/app/services/__init__.py
git commit -m "chore: initialize monorepo and backend package scaffolding"
git remote add origin https://github.com/<your-username>/travelmate.git
git push -u origin main
```

## Day 2 — Backend core (config, DB, auth, utils)
**Goal:** the foundation everything else imports.

Files:
- `backend/app/core/config.py` — env-driven settings (Pydantic)
- `backend/app/core/database.py` — Mongo / in-memory mock connection lifecycle
- `backend/app/core/security.py` — bcrypt hashing + JWT encode/decode
- `backend/app/core/utils.py` — shared helpers (ids, timestamps, serialize)

```bash
git add backend/app/core/config.py backend/app/core/database.py backend/app/core/security.py backend/app/core/utils.py
git commit -m "feat(backend): add core config, database and JWT security"
git push
```

## Day 3 — Schemas: foundation
**Goal:** the base Pydantic models used across the API.

Files:
- `backend/app/schemas/common.py` — shared enums and geo/base types
- `backend/app/schemas/token.py` — auth token payloads
- `backend/app/schemas/user.py` — user, profile, verification models

```bash
git add backend/app/schemas/common.py backend/app/schemas/token.py backend/app/schemas/user.py
git commit -m "feat(backend): add core, token and user schemas"
git push
```

## Day 4 — Schemas: domain
**Goal:** request/response models for the remaining domains.

Files:
- `backend/app/schemas/journey.py` — journey create/out models
- `backend/app/schemas/match.py` — match + score breakdown models
- `backend/app/schemas/trip.py` — trip models
- `backend/app/schemas/message.py` — chat conversation/message models
- `backend/app/schemas/review.py` — rating/review models
- `backend/app/schemas/report.py` — safety report models
- `backend/app/schemas/dashboard.py` — dashboard stats model

```bash
git add backend/app/schemas/journey.py backend/app/schemas/match.py backend/app/schemas/trip.py backend/app/schemas/message.py backend/app/schemas/review.py backend/app/schemas/report.py backend/app/schemas/dashboard.py
git commit -m "feat(backend): add journey, match, trip, message, review, report and dashboard schemas"
git push
```

## Day 5 — Services (business logic)
**Goal:** the engine — distance, cost, checkpoints, matching, assistant.

Files:
- `backend/app/services/geo.py` — haversine distance + ETA
- `backend/app/services/cost.py` — per-person split, monthly savings, CO₂
- `backend/app/services/checkpoint.py` — safe public checkpoint suggestion
- `backend/app/services/matching.py` — weighted route-overlap scoring (route 40 / time 25 / dest 15 / checkpoint 10 / reliability 10)
- `backend/app/services/ai_assistant.py` — natural-language request → structured search

```bash
git add backend/app/services/geo.py backend/app/services/cost.py backend/app/services/checkpoint.py backend/app/services/matching.py backend/app/services/ai_assistant.py
git commit -m "feat(backend): add geo, cost, checkpoint, matching and assistant services"
git push
```

## Day 6 — Data layer + first routes (auth, users, journeys)
**Goal:** repository access, auth guards, and the first working endpoints.

Files:
- `backend/app/db/repo.py` — data-access helpers (public user shaping, lookups)
- `backend/app/api/deps.py` — current-user and admin-guard dependencies
- `backend/app/api/routes/auth.py` — register, login, verification codes
- `backend/app/api/routes/users.py` — profiles, update, block/unblock
- `backend/app/api/routes/journeys.py` — create/list journeys + cost preview

```bash
git add backend/app/db/repo.py backend/app/api/deps.py backend/app/api/routes/auth.py backend/app/api/routes/users.py backend/app/api/routes/journeys.py
git commit -m "feat(backend): add data layer, auth deps and auth/users/journeys routes"
git push
```

## Day 7 — Remaining routes + app entry + seed  *(milestone: backend runs)*
**Goal:** wire every router into the app, seed demo data, and run it.

Files:
- `backend/app/api/routes/matches.py` — search, request, checkpoint, accept/decline
- `backend/app/api/routes/trips.py` — trip lifecycle
- `backend/app/api/routes/messages.py` — conversations + messages
- `backend/app/api/routes/reviews.py` — post-trip reviews
- `backend/app/api/routes/safety.py` — report, SOS, share
- `backend/app/api/routes/dashboard.py` — personalised stats
- `backend/app/api/routes/assistant.py` — AI match assistant endpoint
- `backend/app/api/routes/admin.py` — moderation + analytics
- `backend/app/main.py` — FastAPI app, CORS, router wiring, startup seed
- `backend/app/db/seed.py` — realistic demo users/journeys/trips
- `backend/README.md` — backend setup docs

```bash
git add backend/app/api/routes/matches.py backend/app/api/routes/trips.py backend/app/api/routes/messages.py backend/app/api/routes/reviews.py backend/app/api/routes/safety.py backend/app/api/routes/dashboard.py backend/app/api/routes/assistant.py backend/app/api/routes/admin.py backend/app/main.py backend/app/db/seed.py backend/README.md
git commit -m "feat(backend): wire remaining routes, app entrypoint and demo seed"
git push
```

**Verify (backend now runs):**
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# open http://localhost:8000/docs
```

---

# WEEK 2 — Frontend

## Day 8 — Frontend scaffold + design tokens  *(boots a blank app)*
**Goal:** Vite + React + TypeScript + Tailwind set up, with the Wayline design tokens.

Files:
- `frontend/package.json`, `frontend/package-lock.json` — dependencies and lockfile
- `frontend/vite.config.ts` — `@` alias + `/api` dev proxy
- `frontend/tsconfig.json`, `frontend/tsconfig.node.json` — TypeScript config
- `frontend/tailwind.config.js` — Wayline colour/type tokens
- `frontend/postcss.config.js` — Tailwind/autoprefixer pipeline
- `frontend/index.html` — app HTML entry
- `frontend/.env.example`, `frontend/.gitignore` — env template + node_modules ignore
- `frontend/public/favicon.svg` — app icon
- `frontend/src/vite-env.d.ts` — Vite type shims
- `frontend/src/main.tsx` — bootstraps Router + React Query providers
- `frontend/src/index.css` — Tailwind layers + component classes (btn/card/chip…)

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.node.json frontend/tailwind.config.js frontend/postcss.config.js frontend/index.html frontend/.env.example frontend/.gitignore frontend/public/favicon.svg frontend/src/vite-env.d.ts frontend/src/main.tsx frontend/src/index.css
git commit -m "chore(frontend): scaffold Vite + React + Tailwind with design tokens"
git push
```

## Day 9 — Frontend lib (API client, types, auth, helpers)
**Goal:** the data layer the whole UI depends on.

Files:
- `frontend/src/lib/types.ts` — shared TypeScript types (mirrors backend shapes)
- `frontend/src/lib/format.ts` — currency / date / distance formatting
- `frontend/src/lib/geo.ts` — haversine + ETA helpers
- `frontend/src/lib/places.ts` — curated demo coordinates (no geocoder needed)
- `frontend/src/lib/queryClient.ts` — TanStack Query configuration
- `frontend/src/lib/api.ts` — typed fetch client grouped by domain
- `frontend/src/lib/auth.tsx` — auth context + token handling

```bash
git add frontend/src/lib/types.ts frontend/src/lib/format.ts frontend/src/lib/geo.ts frontend/src/lib/places.ts frontend/src/lib/queryClient.ts frontend/src/lib/api.ts frontend/src/lib/auth.tsx
git commit -m "feat(frontend): add types, API client, auth context and helpers"
git push
```

## Day 10 — UI primitives (design system)
**Goal:** the reusable building blocks every page uses.

Files:
- `frontend/src/components/ui/index.tsx` — Button, Card, Field, Chip, Segmented, Stat, etc.
- `frontend/src/components/ui/Avatar.tsx` — user avatar with verified ring
- `frontend/src/components/ui/Modal.tsx` — accessible modal
- `frontend/src/components/ui/Toast.tsx` — toast notifications
- `frontend/src/components/Logo.tsx` — brand mark

```bash
git add frontend/src/components/ui/index.tsx frontend/src/components/ui/Avatar.tsx frontend/src/components/ui/Modal.tsx frontend/src/components/ui/Toast.tsx frontend/src/components/Logo.tsx
git commit -m "feat(frontend): add UI primitives and brand logo"
git push
```

## Day 11 — Map module + routing shell
**Goal:** the provider-agnostic map and the protected app layout.

Files:
- `frontend/src/components/map/types.ts` — MapMarker / MapRoute interfaces
- `frontend/src/components/map/LeafletMap.tsx` — Leaflet + OSM implementation
- `frontend/src/components/map/MapPicker.tsx` — tap-to-pin picker
- `frontend/src/components/map/index.tsx` — public MapView / MapPicker exports
- `frontend/src/components/ProtectedRoute.tsx` — auth + admin route guard
- `frontend/src/components/Layout.tsx` — nav shell for the `/app` area

```bash
git add frontend/src/components/map/types.ts frontend/src/components/map/LeafletMap.tsx frontend/src/components/map/MapPicker.tsx frontend/src/components/map/index.tsx frontend/src/components/ProtectedRoute.tsx frontend/src/components/Layout.tsx
git commit -m "feat(frontend): add Leaflet map module and protected routing shell"
git push
```

## Day 12 — Feature components
**Goal:** the shared widgets that pages compose together.

Files:
- `frontend/src/components/RouteLine.tsx` — signature route-with-checkpoint visual
- `frontend/src/components/VerificationBadges.tsx` — badges, trust level, star rating
- `frontend/src/components/MatchScore.tsx` — "NN% Match" score + breakdown bars
- `frontend/src/components/JourneyCard.tsx` — journey summary card
- `frontend/src/components/PartnerCard.tsx` — partner result card
- `frontend/src/components/CheckpointPicker.tsx` — safe checkpoint chooser
- `frontend/src/components/LocationField.tsx` — location dropdown + map pin
- `frontend/src/components/SafetyActions.tsx` — SOS / share / report / block
- `frontend/src/components/JourneyForm.tsx` — create-journey form + live cost preview
- `frontend/src/components/MatchDetail.tsx` — full match view with map + request-to-join

```bash
git add frontend/src/components/RouteLine.tsx frontend/src/components/VerificationBadges.tsx frontend/src/components/MatchScore.tsx frontend/src/components/JourneyCard.tsx frontend/src/components/PartnerCard.tsx frontend/src/components/CheckpointPicker.tsx frontend/src/components/LocationField.tsx frontend/src/components/SafetyActions.tsx frontend/src/components/JourneyForm.tsx frontend/src/components/MatchDetail.tsx
git commit -m "feat(frontend): add journey, match, safety and checkpoint components"
git push
```

## Day 13 — Pages: auth, onboarding & core flow
**Goal:** landing, auth, dashboard, journey creation, find/assistant.

Files:
- `frontend/src/pages/Landing.tsx` — public landing page
- `frontend/src/pages/auth/AuthShell.tsx` — shared login/register layout
- `frontend/src/pages/Login.tsx` — sign in
- `frontend/src/pages/Register.tsx` — sign up
- `frontend/src/pages/Dashboard.tsx` — savings / CO₂ / next match overview
- `frontend/src/pages/CreateLocal.tsx` — create a local journey
- `frontend/src/pages/CreateLong.tsx` — create a long trip
- `frontend/src/pages/FindPartners.tsx` — search + results + match detail
- `frontend/src/pages/AssistantPage.tsx` — AI match assistant

```bash
git add frontend/src/pages/Landing.tsx frontend/src/pages/auth/AuthShell.tsx frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx frontend/src/pages/Dashboard.tsx frontend/src/pages/CreateLocal.tsx frontend/src/pages/CreateLong.tsx frontend/src/pages/FindPartners.tsx frontend/src/pages/AssistantPage.tsx
git commit -m "feat(frontend): add landing, auth, dashboard and journey-creation pages"
git push
```

## Day 14 — Remaining pages + wire the router + release  *(milestone: app builds)*
**Goal:** trips, chat, profile, safety, admin — then connect everything in `App.tsx` and tag v1.0.0.

Files:
- `frontend/src/pages/Matches.tsx` — incoming/outgoing match requests
- `frontend/src/pages/MyTrips.tsx` — trip buckets
- `frontend/src/pages/TripDetail.tsx` — trip view, status flow, ratings
- `frontend/src/pages/Messages.tsx` — chat
- `frontend/src/pages/Profile.tsx` — public/own profile
- `frontend/src/pages/Settings.tsx` — edit profile + vehicle
- `frontend/src/pages/Verify.tsx` — 5-channel verification
- `frontend/src/pages/SafetyCenter.tsx` — safety hub
- `frontend/src/pages/NotFound.tsx` — 404
- `frontend/src/pages/admin/AdminDashboard.tsx` — admin moderation + analytics
- `frontend/src/App.tsx` — route table tying every page together (committed last so imports resolve)
- `frontend/README.md` — frontend setup docs

```bash
git add frontend/src/pages/Matches.tsx frontend/src/pages/MyTrips.tsx frontend/src/pages/TripDetail.tsx frontend/src/pages/Messages.tsx frontend/src/pages/Profile.tsx frontend/src/pages/Settings.tsx frontend/src/pages/Verify.tsx frontend/src/pages/SafetyCenter.tsx frontend/src/pages/NotFound.tsx frontend/src/pages/admin/AdminDashboard.tsx frontend/src/App.tsx frontend/README.md
git commit -m "feat(frontend): add trips, chat, profile, safety, admin pages and wire router"
git push
git tag -a v1.0.0 -m "TravelMate v1.0.0 — full-stack MVP"
git push origin v1.0.0
```

**Verify (frontend now builds):**
```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173 — log in with demo@travelmate.app / password123
# (keep the backend from Day 7 running in another terminal)
```

---

## Daily rhythm & tips

- **Each day:** open the repo, run the day's `git add …`, then `git status` to confirm only the
  intended files are staged, then `git commit` and `git push`.
- **Commit messages** follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Keep the
  summary under ~72 characters.
- **Falling behind?** The days are independent chunks — do two in one sitting, or split a heavy day
  (like Day 7 or Day 12) across two commits by staging half the files each time.
- **If a file changes later** (e.g. you tweak `cost.py`), just `git add` it again and commit with a
  `fix:` or `refactor:` message — that's exactly what real history looks like.
- **Never commit** `backend/.venv/`, `frontend/node_modules/`, or `.env` — the root `.gitignore`
  already prevents this, but a quick `git status` check each day is good insurance.
