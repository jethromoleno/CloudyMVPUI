# Repository Context Package: LogiTrack AI / Cloudy MVP UI

This package reflects the current checkout as inspected on 2026-07-22. It is an observed-code summary, not a backend API specification: the client contains an in-memory mock service and does not call a live server.

1. **Global Architecture & Tech Stack Summary**

LogiTrack AI is a client-only logistics-management MVP. It is a React 19 single-page application (SPA) written in TypeScript, bundled and served by Vite 6. The UI is composed as stateful functional components and is styled with utility classes from the Tailwind CDN configured inline in `index.html`; it does not have a Tailwind build configuration. `lucide-react` supplies icons, `recharts` supports dashboard visualizations, Leaflet and `@vis.gl/react-google-maps` support map-oriented UI, and `@google/genai` is used for optional Gemini trip analysis.

| Concern | Current implementation |
| --- | --- |
| Runtime and package manager | Node.js, npm, Vite dev/build/preview scripts |
| Frontend | React 19 + TypeScript + ReactDOM; no React Router |
| Styling | Tailwind CDN with inline `navy` and `carbon` palettes; global inline CSS and external Leaflet CSS |
| State | `useState` in `App.tsx` plus feature-local component state; passed as props/callbacks |
| Data persistence | None. `services/apiService.ts` exposes asynchronous, delay-simulated CRUD over module-level `MOCK_*` arrays |
| Authentication and access control | Mock username/password lookup plus UI-level role checks; no token, cookie, external identity provider, or server-side enforcement |
| AI | Gemini `generateContent` through `services/geminiService.ts`; API key injected at Vite build/dev time |
| Tests and checks | TypeScript-only check via `npm run lint` (`tsc --noEmit`); no test runner or test files |

The normal application flow is:

```text
Browser -> index.tsx -> App
  -> Login (mock api.login)
  -> Hub (select module)
  -> Sidebar / AppNavbar -> feature screen
  -> services/apiService.ts -> in-memory MOCK_* collections -> React state -> rerender

Optional trip analysis: Trip UI -> geminiService.ts -> GoogleGenAI -> Gemini model
```

The only operational module is `trip_scheduling` (branded “LogiTrack AI”). The Hub also presents `inventory` and `billing`, but they deliberately render placeholder screens and are disabled in the switcher.

2. **Complete Directory Tree & Routing Map**

```text
CloudyMVPUI/
  App.tsx                         root session, module, theme, and loaded-data state
  index.tsx                       ReactDOM bootstrap
  index.html                      HTML shell, Tailwind CDN/theme config, import map, global styles
  types.ts                        domain interfaces, aliases, and role/module unions
  package.json                    npm scripts and dependencies
  vite.config.ts                  Vite/React config and environment-key injection
  README.md                       local setup and manual smoke-test checklist
  metadata.json                   AI Studio project metadata
  components/
    Login.tsx                     mock sign-in form
    Hub.tsx                       post-login product/module launcher
    AppNavbar.tsx                 active-module header/switch control
    Sidebar.tsx                   role-filtered in-app navigation and logout
    Dashboard.tsx                 operational summary and trip drill-in
    TripList.tsx                  trip management, schedule, stops, map, event/fuel details
    TruckList.tsx                 fleet CRUD, maintenance, status-log detail panel
    EmployeeList.tsx              employee CRUD, driver profile/availability detail panel
    UserManagement.tsx            users, roles, module permissions, app settings
  services/
    apiService.ts                 mock data store plus async API-shaped operations
    geminiService.ts              Gemini logistics-analysis request helper
```

There are no filesystem routes or HTTP endpoints implemented by this repository. Navigation is an `App.tsx` `currentView` string, set through `Sidebar.tsx`, rather than URL routing:

| Module/view value | UI surface | Availability |
| --- | --- | --- |
| `hub` | `Hub` | entered immediately after successful login |
| `trip_scheduling` | active operational application | selected from Hub/app switcher |
| `dashboard` | `Dashboard` | all listed roles |
| `trip-management` | `TripList` management mode | all listed roles |
| `trips` | `TripList` scheduling mode | SuperAdmin, Admin, Dispatcher, Encoder |
| `trucks` | `TruckList` | SuperAdmin, Admin, Dispatcher, Viewer |
| `employees` | `EmployeeList` | SuperAdmin, Admin, Dispatcher, Viewer |
| `settings` | `UserManagement` | SuperAdmin and Admin only |
| `inventory`, `billing` | placeholder panel | deliberately disabled / coming soon |

`Dashboard` can set `focusedTripId` and switch to `trip-management`; `App` passes that ID as `initialEditingId` to `TripList` for drill-in. `TripList` itself manages list/calendar/map presentation, editor modal state, selected trip, and overview/stops/events/fuel detail tabs. The events tab reads `api.getTripEvents`; this checkout does not expose event creation or editing in that screen.

The mock service names operations after an intended REST contract (comments such as `GET /api/v1/trips/`), but those are descriptive only. Its API-shaped surface covers login/user CRUD; dashboard summary; trip advises, stops, assignments, and cancellation; driver availability; employee/driver operations; fleet/status/maintenance; fuel; and reference data for roles, branches, clients, consignees, load types, and statuses.

3. **Global Configuration & Bootstrapping**

Install with `npm install`; start locally with `npm run dev` (configured on `0.0.0.0:3000`); validate types with `npm run lint`; build with `npm run build`; and serve the production bundle with `npm run preview` (normally port 4173). The repository has no Docker, compose, CI, IaC, backend service, migration, or test configuration.

`vite.config.ts` loads all environment values using `loadEnv(mode, '.', '')` and replaces these browser-side expressions:

| Environment variable | Injected expression / purpose |
| --- | --- |
| `GEMINI_API_KEY` | `process.env.API_KEY` and `process.env.GEMINI_API_KEY`; required for Gemini analysis |
| `GOOGLE_MAPS_PLATFORM_KEY` | `process.env.GOOGLE_MAPS_PLATFORM_KEY`; optional map integration key, defaults to an empty string |

`README.md` calls for these values in `.env.local`; no environment file or secret value is included in this package. `services/geminiService.ts` currently constructs `GoogleGenAI` with `process.env.API_KEY`, uses model `gemini-2.5-flash`, and catches provider errors to return a user-safe fallback string.

Bootstrapping starts in `index.tsx`: it locates `#root`, throws if absent, and renders `<App />` inside `React.StrictMode`. `App` defaults to dark theme, toggles the root `dark` class, and on first render concurrently hydrates trips, employees, customers, locations, trucks, fuel logs, and system users from `api`. The data requests are asynchronous but only simulate latency, so browser refresh resets mutations to the hard-coded seed data.

`index.html` is also a deployment-sensitive boundary: it loads Tailwind from `https://cdn.tailwindcss.com`, Google Inter via CSS import, and Leaflet CSS from unpkg. It includes an AI Studio-oriented import map, while Vite/npm dependencies provide the normal local bundle path.

4. **Core Data Structures & Shared State**

`types.ts` is the domain contract. Most records use string IDs, soft-delete flags where applicable, and ISO-like `created_at`/`updated_at` fields. Several aliases remain for legacy component compatibility (`Trip = TripAdvise`, `Customer = Client`, `Driver = DriverProfile`, `TripFuel = TripFuelLog`) and several model interfaces carry legacy fields alongside normalized ones.

| Domain area | Primary types and essential relationships |
| --- | --- |
| Identity/authorization | `SystemUser { id, username, password?, role, roles?, permissions, is_active? }`; normalized `Role`, `Permission`, `UserRole`, and `RolePermission` support role/module assignment. `UserRoleType` is `SuperAdmin | Admin | Dispatcher | Encoder | Viewer`. |
| Trip planning | `TripAdvise` is the central trip model: code, branch, encoder, status, client, optional code/consignee, pickup date/window, truck/load type, assignments, transfer state, completion, draft/deletion, and legacy trip/customer/origin/destination/scheduling fields. `TripStop`, `TripAssignment`, `TripEvent`, and `TripFuelLog` join through `trip_advise_id`. |
| People | `Employee` belongs to an employee role and optional branch; `DriverProfile` extends an employee relationship with licence and availability data; `DriverAvailability` is keyed to driver/date. |
| Fleet | `Truck` belongs to a truck status, optional load type and branch; `VehicleStatusLog` and `MaintenanceLog` join by `truck_id`. |
| Reference data | `Branch`, `Client`, `InternalClientCode`, `Consignee`, `Location`, `LoadType`, `TripStatus`, `TruckStatus`, and `EmployeeRole` are lookup collections used by forms and detail views. |
| Placeholder modules | `Inventory` and `Billing` contain only placeholder status/notes fields; they have no feature workflow. |

At runtime, `App.tsx` owns the session user; active module/view; dark/light theme; loading/error state; and top-level arrays for users, trips, employees, customers, locations, trucks, and fuel. Feature components receive the relevant array(s), user role, theme, and mutation callbacks. They then retain screen-local selection, filters, form values, modal visibility, confirmations, tabs, and auxiliary reference data. There is no Context, Redux, query cache, URL state, local/session storage, or cross-refresh persistence.

`services/apiService.ts` is the only shared data source. It exports seeded `MOCK_*` arrays and `api`, whose methods clone returns with JSON serialization and mutate module-level collections for create/update/delete/status actions. Deletes are usually logical (`is_deleted`), while some relation operations splice data. This is an MVP data adapter; it is not safe to treat it as a durable or concurrent backend.

Authentication is mock-only: `api.login` compares input against seeded users and `App` retains the resulting object in memory. Role filtering occurs in `Sidebar` through `ALLOWED_VIEWS_BY_ROLE`; settings additionally checks `SuperAdmin`/`Admin` in `App`; feature components conditionally hide or disable actions based on `userRole`. Because these checks run only in the browser and the mock API itself is importable JavaScript, they are presentation controls, not a security boundary.

5. **Established Coding Paradigms & Guardrails**

- Use React functional components with typed props and hooks. Components are feature-oriented under `components/`; shared domain types live only in `types.ts`; external/data behavior is isolated under `services/`.
- Keep the root responsible for application-wide state and supply feature mutations as callbacks. For example, `App` creates, updates, and removes trucks/employees, then replaces the associated top-level state array; `TripList` is allowed its `trips` setter directly for its richer workflow.
- Treat `api` as asynchronous even though it is local. Existing code awaits calls, uses artificial delay, clones read results, throws `ApiError` for selected missing records, and uses component-level loading/error/alert states.
- Preserve compatibility fields and aliases when changing models unless every consumer has been migrated. `types.ts` and `apiService.ts` deliberately map normalized records to legacy UI field names such as `trip_id`, `truck_id`, `license_plate`, and `location_id`.
- Respect the role matrix before exposing a navigation item or destructive/editor action. Current checks are UI-only; any real backend replacement must repeat authorization server-side and must not trust the current client role object.
- Keep theme support in mind: `App` toggles `.dark`, while components consistently use paired `dark:` utility classes and the `navy`/`carbon` palette defined in `index.html`.
- Preserve the intentional MVP boundary: data resets on reload, inventory/billing remain placeholders, and the timeline event panel is read-only. Adding persistence, a real API, or timeline-event writes requires a new explicit contract rather than assuming the mock comments create those endpoints.
- Use `npm run lint` before handoff. It is a TypeScript compile check, not ESLint; no formatter, lint configuration, automated tests, or security scanning configuration was found.

Files modified: this package only (`REPOSITORY_CONTEXT_PACKAGE.md`).
