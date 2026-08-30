# TravelMate — Frontend

Single-page React application for TravelMate: onboarding & verification, journey creation, partner
matching, trips, chat, reviews, safety tools, and the admin dashboard. Built with Vite, TypeScript,
Tailwind, and Leaflet.

---

## Requirements

- Node 18+ and npm

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. With the backend running on port 8000, the Vite dev server proxies all
`/api` requests to it automatically — no extra configuration needed.

### Scripts

| Command             | Description                                       |
|---------------------|---------------------------------------------------|
| `npm run dev`       | Start the Vite dev server (port 5173)             |
| `npm run build`     | Production build to `dist/`                        |
| `npm run preview`   | Preview the production build locally               |
| `npm run typecheck` | Run the TypeScript compiler with no emit           |

## Environment

Configuration is optional for local dev. See `.env.example`:

| Variable        | Default | Purpose                                                                     |
|-----------------|---------|-----------------------------------------------------------------------------|
| `VITE_API_BASE` | *(empty)* | Leave empty to use the dev proxy. Set to the backend origin for a deployed build (e.g. `https://api.travelmate.app`). |

The dev proxy is defined in `vite.config.ts`, which also sets the `@` import alias to `src/`.

---

## Project structure

```
frontend/src/
├── main.tsx                 app bootstrap (router + React Query providers)
├── App.tsx                  route table (public routes + protected /app shell)
├── index.css                Tailwind layers + Wayline component classes
├── pages/                   route-level screens
│   ├── Landing, Login, Register
│   ├── Dashboard, CreateLocal, CreateLong, FindPartners, AssistantPage
│   ├── Matches, MyTrips, TripDetail, Messages
│   ├── Profile, Settings, Verify, SafetyCenter, NotFound
│   └── admin/AdminDashboard
├── components/
│   ├── ui/                  design-system primitives (Button, Card, Modal, Toast, Avatar, …)
│   ├── map/                 provider-agnostic MapView (Leaflet implementation + types)
│   ├── JourneyForm, JourneyCard, PartnerCard, MatchScore, MatchDetail
│   ├── CheckpointPicker, LocationField, RouteLine, VerificationBadges
│   ├── SafetyActions        SOS / share / report / block
│   └── Layout, ProtectedRoute, Logo
└── lib/
    ├── api.ts               typed fetch client (grouped by domain)
    ├── auth.tsx             auth context + token handling
    ├── types.ts             shared TypeScript types
    ├── format.ts            currency / date / distance formatting
    ├── geo.ts               haversine + ETA helpers
    ├── places.ts            demo place lookup for the location field
    └── queryClient.ts       TanStack Query configuration
```

## Routing

Public routes: `/` (landing), `/login`, `/register`. Everything under `/app` is wrapped in
`ProtectedRoute` + `Layout`, with the admin dashboard additionally guarded for admin users. Data
fetching uses **TanStack Query** (`useQuery` / `useQueryClient`) with cache invalidation on writes.

## Design system — "Wayline"

The visual identity is defined once in `tailwind.config.js` and `index.css`:

- **Palette** — ink `#101828`, canvas `#F6F8FB`, teal `#0D9488`, verified-green `#16A34A`,
  signal-amber `#F59E0B`, plus tonal wash variants.
- **Type** — Sora (display), Inter (body), Space Mono (numerics/labels).
- **Signature element** — the route-line-with-checkpoint motif (`RouteLine`) used across cards.

Reusable component classes (`btn-*`, `card`, `chip-*`, `input`, `label`, `section-title`, `tnum`)
live in `index.css` and back the primitives in `components/ui`.

## Map module

Map usage goes exclusively through the `MapView` component in `components/map`, which exposes
`MapMarker` and `MapRoute` types. The default implementation uses **Leaflet + OpenStreetMap**
(`react-leaflet`), but because pages depend only on the interface, the provider can be swapped
without touching page code.

For privacy, approximate start locations render as **circles (zones), not pins** — exact coordinates
are never plotted for other users.

---

## Notes

- Auth tokens are stored in `localStorage` under `travelmate_token` for session persistence.
- The UI follows the product's safety language guidelines: verification is framed as a trust layer
  that reduces (not eliminates) risk, and the SOS flow explicitly states it does not replace
  emergency services.
- `lucide-react` is pinned to `^0.446.0`; icons are chosen to be available in that version.
