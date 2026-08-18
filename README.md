# Cloudy Logistics MVP UI

Cloudy is a React 19 and Vite logistics-operations interface. Phase 2B adds URL-backed Trip Quick Details and routed Full Details through a typed read-only service while preserving the Phase 1B shell and Phase 1C centralized permission presentation.

## Local development

Prerequisite: Node.js.

```text
npm install
npm run dev
```

Open `http://localhost:3000`.

Local review uses an explicitly development-only, memory-backed auth and data adapter. It is not production authentication or persistence. The adapter keeps credential verification outside domain user records, stores no session in browser storage, and resets the session on reload. Live Supabase Auth and production APIs are not configured or claimed.

## Routes

```text
/login
/hub
/trip-scheduling/dashboard
/trip-scheduling/trips
/trip-scheduling/trips/new
/trip-scheduling/trips/:tripId
/trip-scheduling/trips/:tripId/edit
/trip-scheduling/trucks
/trip-scheduling/employees
/trip-scheduling/settings
```

The Trip Schedule view is addressable through `/trip-scheduling/trips?view=schedule`. Inventory and Billing remain disabled Coming Soon cards and have no operational routes.

Trip Operations Quick Details uses `quick=<tripId>` on desktop/tablet. Mobile prioritizes the canonical Full Details route. Full Details sections use `section=stops|assignments|events|fuel|activity`; Overview omits the parameter. The legacy `tab=` parameter is accepted only as an inbound compatibility alias and is normalized to `section=`.

## Permission presentation

The fixed development roles are SuperAdmin, Admin, Dispatcher, Encoder, and Viewer. Route, navigation, and action presentation consume one typed policy in `permissions/policy.ts`; components do not define their own role matrices. Admin has read-only Settings and audit access, while SuperAdmin alone manages users/roles and updates settings. Encoder updates are limited to an owned Draft trip.

These checks control frontend presentation only. They do not authorize a production request and do not replace production API authorization or RLS.

## Checks

```text
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:coverage
npm run test:e2e
npm run test:a11y
npm run build
npm audit
```

## Manual review

Verify Login, Hub, Dashboard, Trip Operations/Schedule/create/detail/edit, Trucks, Employees, Settings, denied/not-found/error states, and drawer/sidebar focus behavior in light and dark themes at:

- Desktop: 1440 x 900
- Tablet: 834 x 1194
- Mobile: 390 x 844

For each official role, verify filtered navigation, direct permitted/denied routes, action visibility, Settings distinctions, state-blocked explanations, direct links, refresh, browser back/forward, list query-state restoration, invalid trip identifiers, unsaved-change warnings, and disabled Inventory/Billing controls.

Phase 2B responsive evidence is retained in `docs/evidence/phase-2b-responsive/`. Activity intentionally renders an unsupported-source state because the current approved development contract has no trip-specific audit source.

## Scope boundary

- The current data adapter is development-only and reset-on-refresh.
- No production backend, persistence, Supabase integration, JWT verification, RLS, concurrency, or audit guarantee is implemented.
- Frontend permission and route checks control presentation only; they are not a production security boundary.
- AI analysis and browser provider-key injection are excluded from the MVP.
