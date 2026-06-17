# Cloudy — Logistics Web App MVP
## PRD Generation Prompt (v2)

## Inputs — Attach These Files Before Running the Prompt

| # | File | Purpose |
|---|------|---------|
| 1 | `EVFTC_Database_Hybrid.xlsx` | Finalized hybrid database schema (tables, columns, FK relationships, enums, seed data) |
| 2 | UI/Frontend codebase from Google AI Studio | Current screen designs, component structure, and user flows already built |
| 3 | `Initial_PRD.txt` | Original PRD draft with feature scope and tech stack decisions |

---

## Prompt

You are a senior full-stack software engineer and product manager with deep experience in logistics and fleet management systems. Your task is to produce a comprehensive Product Requirements Document (PRD) for a logistics web app MVP called **"Cloudy"**.

---

### Context & Inputs

Read and fully reconcile all three input files before writing anything:

1. `EVFTC_Database_Hybrid.xlsx` — The finalized hybrid database schema (tables, columns, FK relationships, enums, seed data).
2. UI/Frontend codebase from Google AI Studio — The current screen designs, component structure, and user flows already built.
3. `Initial_PRD.txt` — The original PRD draft with feature scope and tech stack decisions.

Where these three sources conflict, **do not silently resolve the conflict.** Flag it explicitly in the **"Conflicts & Decisions Required"** section with a description of what the conflict is and what decision is needed.

---

### What to Produce

Write a single, complete PRD document structured with the following sections in order:

---

### Section 1 — Executive Summary

- App name, purpose, and one-paragraph description of the problem it solves.
- Target users and their primary roles (dispatcher, encoder, admin, driver).
- Business value in a logistics/trucking context: what operational pain does this remove?
- Scope boundaries: what is explicitly **in** the MVP and what is explicitly **out**.

---

### Section 2 — Tech Stack & Rationale

Document the full tech stack and justify each choice in the context of this app's scale, team size, and deployment target:

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | React.js | ... |
| Backend | Django + Django REST Framework | ... |
| Database | Supabase (PostgreSQL 15+) | ... |
| Auth | Supabase Auth (JWT) | ... |
| Containerization | Docker + Docker Compose | ... |
| Version Control | GitHub | ... |
| IDE | Visual Studio Code | ... |

Include a note on the deployment target (e.g. Railway, Render, AWS, GCP) and why it suits a containerized Django + Supabase stack.

---

### Section 3 — System Architecture Overview

Describe the high-level architecture in layered terms. Include:

- **Request flow:** Browser → React SPA → Django REST API → Supabase PostgreSQL
- **Auth flow:** Login → Supabase Auth → JWT → Django middleware validation → RLS enforcement at DB layer
- **Where Docker fits:** Local dev (Docker Compose), how services are separated (frontend, backend, Nginx)
- **Where Supabase RLS fits:** Which tables enforce row-level security and at what layer policies are evaluated
- A text-based architecture diagram using ASCII or Markdown code blocks showing the layers and data flow

---

### Section 4 — Module Breakdown

For each module below, provide:

- **Purpose** — one sentence
- **User Stories** — at least one per module in the format: *"As a [role], I want to [action], so that [outcome]."*
- **Acceptance Criteria** — bulleted list of testable conditions that define done
- **API Endpoint Surface** — list of REST endpoints the module requires (`METHOD /api/v1/resource/`)

#### Modules to cover:

1. **Dashboard** — Summary KPIs, recent trips, vehicle availability snapshot
2. **Trip Management** — View, filter, search, and update existing trips
3. **Trip Schedule** — Create new trip advice record, assign driver and vehicle
4. **Truck Management** — CRUD for vehicles, availability tracking
5. **Employee Directory** — CRUD for employees (drivers, helpers, dispatchers, encoders)
6. **Settings / RBAC** — User creation (SuperAdmin only), role assignment, app-level configuration
7. **Inventory** ⚠️ PLACEHOLDER — Do not implement. Document scope boundary only.
8. **Billing** ⚠️ PLACEHOLDER — Do not implement. Document scope boundary only.

---

### Section 5 — Database Layer

Reference the `EVFTC_Database_Hybrid.xlsx` schema. For each table, document:

- **Responsibility** — one sentence describing what it stores
- **Key relationships** — FKs and what they point to
- **Enum constraints** — CHECK constraints and valid values
- **RLS policy intent** — who can SELECT / INSERT / UPDATE / DELETE (e.g. "Dispatchers can SELECT all, INSERT own; Viewers can SELECT only")

Group tables by module: Auth & Users, Trip Scheduling, Truck Management, Employee Directory, Settings & Audit, Placeholders.

---

### Section 6 — Folder Structure

Provide the full recommended folder structure for both the Django backend and React frontend as a monorepo. Use a code block and include a `# comment` on every folder explaining its purpose.

```
cloudy/                          # Monorepo root
├── backend/                     # Django project root
│   ├── config/                  # Django settings, URLs, WSGI/ASGI
│   ├── apps/                    # One Django app per domain module
│   │   ├── trips/               # Trip advice, stops, status log
│   │   ├── vehicles/            # Truck management
│   │   ├── employees/           # Employee directory
│   │   ├── users/               # Auth, roles, permissions
│   │   └── settings_app/        # App settings, audit logs
│   ├── core/                    # Shared base classes, mixins, utilities
│   ├── requirements/            # Separate dev/prod/base requirement files
│   └── Dockerfile
├── frontend/                    # React app root
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route-level page components
│   │   ├── features/            # Feature-sliced modules (trips, vehicles, etc.)
│   │   ├── services/            # API call functions (axios/fetch wrappers)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── store/               # Global state (Context API or Zustand)
│   │   └── utils/               # Shared helper functions
│   └── Dockerfile
├── docs/                        # Project documentation (non-code)
│   └── deployment.md            # End-to-end developer guide: UI codebase → local dev → staging → production
├── docker-compose.yml           # Local dev orchestration
└── .github/                     # CI/CD workflows
```

Expand every folder shown above. Add any additional folders the stack requires. Every single folder must have a `#` comment.

---

#### Section 6a — `docs/deployment.md` Content Specification

When generating the folder structure, also produce the full content of `docs/deployment.md` as a standalone, self-contained developer guide. A developer who has never worked on this project must be able to follow it from zero to a running production deployment without asking anyone for help.

The file must be structured with the following sections in order:

---

**1. Prerequisites**

List every tool that must be installed locally before starting, with the exact minimum version required and a link to the official install page. Include at minimum:

- Node.js (version)
- Python (version)
- Docker Desktop (version)
- Docker Compose (version)
- Git
- Visual Studio Code
- Supabase CLI
- Any cloud CLI tool required by the chosen deployment platform (e.g. Railway CLI, Render CLI, AWS CLI)

---

**2. Project Overview**

A single paragraph explaining what this repo contains (monorepo: React frontend + Django backend + Docker), what each top-level folder does, and how the services talk to each other. Written for a developer reading the repo for the first time.

---

**3. Integrating the Existing Google AI Studio UI Codebase**

This section is critical. The frontend was scaffolded in Google AI Studio, not locally. Provide explicit step-by-step instructions for:

- How to export or download the existing codebase from Google AI Studio (what format it comes in, what files are included)
- Where to place the exported files within the `cloudy/frontend/` folder structure
- Which files from Google AI Studio to keep as-is vs. which to restructure to match the monorepo folder conventions defined in Section 6
- How to reconcile any naming conflicts between the AI Studio output structure and the target folder structure (e.g. if AI Studio outputs a flat `components/` at root vs. the required `src/components/`)
- How to verify the frontend runs correctly after the migration (`npm install` → `npm run dev`)
- Any known issues or incompatibilities between Google AI Studio exports and a standard Vite/CRA React project setup, and how to resolve them

---

**4. Environment Setup**

Provide the exact contents of all required `.env` files with placeholder values. Include one block per environment:

```bash
# .env.dev — Local development
DJANGO_SECRET_KEY=your-local-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db:5432/cloudy
CORS_ALLOWED_ORIGINS=http://localhost:5173

# .env.prod — Production (never commit this file)
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=False
...
```

Also document:
- Which `.env` files must **never** be committed to GitHub (add to `.gitignore`)
- Where to find each value in the Supabase dashboard
- How Django reads these values (python-decouple or django-environ)

---

**5. Local Development Setup (Step-by-Step)**

Number every command. Assume nothing is pre-configured. Cover:

1. Clone the repository
2. Copy `.env.dev` template and fill in values
3. Build and start all Docker services (`docker-compose up --build`)
4. Verify all containers are running (`docker ps`)
5. Run Django database migrations inside the container
6. Load seed data (roles, employee_roles, app_settings, lookup tables)
7. Create the first SuperAdmin user
8. Confirm the backend API is reachable (`http://localhost:8000/api/v1/`)
9. Confirm the frontend is reachable (`http://localhost:5173/`)
10. Confirm Supabase Auth login works end-to-end

Include the exact Docker Compose commands for common dev tasks:
- Stop all services
- Rebuild a single service after code change
- Run Django management commands inside the container
- View logs for a specific service
- Access the Django shell inside the container

---

**6. Database Setup & Migrations**

Explain the migration strategy clearly:

- **Source of truth:** Django manages schema via `python manage.py makemigrations` and `migrate` — Supabase SQL editor is not used for schema changes after initial setup
- How to run the initial SQL migration from `EVFTC_Database_Hybrid.xlsx` into Supabase for the first time
- How to generate a new Django migration after a model change
- How to apply migrations inside Docker
- How to handle migration conflicts in a team (linear history policy)
- How to reset the database in local dev without losing Supabase Auth users

---

**7. Supabase Configuration**

Step-by-step instructions for configuring Supabase for this project:

1. Create a new Supabase project
2. Note the Project URL, anon key, and service role key
3. Enable Email/Password auth provider
4. Apply the initial database schema (reference Section 5 of the PRD)
5. Enable Row Level Security on all tables
6. Apply RLS policies (reference Section 7 of the PRD for policy intent per table)
7. Configure the `auth.users` → `public.users` mirror trigger
8. Set `app_timezone` to `Asia/Manila` in `app_settings`
9. Confirm RLS is working by testing with a Viewer-role JWT

---

**8. Running Tests**

Document the test strategy for both layers:

**Backend (Django):**
```bash
# Run all tests inside the container
docker-compose exec backend python manage.py test

# Run tests for a specific app
docker-compose exec backend python manage.py test apps.trips

# Run with coverage report
docker-compose exec backend coverage run manage.py test && coverage report
```

**Frontend (React):**
```bash
# Run unit tests
docker-compose exec frontend npm run test

# Run with coverage
docker-compose exec frontend npm run test -- --coverage
```

Also specify: what minimum test coverage is required before a PR can be merged (suggest 70% as a starting target for MVP).

---

**9. Staging Environment**

Define what staging is and how to deploy to it:

- Staging mirrors production config but uses a separate Supabase project and separate environment variables
- Document the exact steps to provision a staging environment on the chosen deployment platform
- How to promote a build from local → staging (branch strategy: `develop` → staging auto-deploy)
- How to run smoke tests against staging before promoting to production
- Staging URL convention and how to share access with stakeholders for review

---

**10. Production Deployment (Step-by-Step)**

Cover the full deployment pipeline from a merged PR to a live production update:

1. **Pre-deployment checklist** — items to verify before every deploy (migrations applied, env vars set, tests passing, no DEBUG=True in prod)
2. **GitHub Actions CI/CD pipeline** — describe each workflow step: lint → test → build Docker images → push to container registry → deploy
3. **First-time production setup** — how to provision the production environment, set all env vars, and run the initial deploy
4. **Django backend deployment** — how the containerized Django app is served (Gunicorn + Nginx), how static files are handled
5. **React frontend deployment** — how the built static assets are served (Nginx or CDN), how environment variables are injected at build time
6. **Database migration on deploy** — how Django migrations run automatically as part of the deployment pipeline (init container or entrypoint script pattern)
7. **Rollback procedure** — exact steps to roll back to the previous version if a deployment fails
8. **Zero-downtime deployment** — how to avoid downtime during a rolling update

---

**11. Environment Variable Reference**

A complete table of every environment variable used across the entire project:

| Variable | Used By | Required In | Description | Where to Find It |
|----------|---------|-------------|-------------|-----------------|
| `DJANGO_SECRET_KEY` | Backend | All envs | Django cryptographic signing key | Generate with `python -c "import secrets; print(secrets.token_hex(50))"` |
| `SUPABASE_URL` | Backend, Frontend | All envs | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Frontend | All envs | Public anon key for Supabase JS client | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | All envs | Service role key for server-side Supabase calls | Supabase Dashboard → Settings → API |
| ... | ... | ... | ... | ... |

Mark any variable that must never be exposed to the browser with ⚠️ **SERVER ONLY**.

---

**12. Common Errors & Troubleshooting**

A reference table of the most common issues a developer will hit, with exact fix steps:

| Error / Symptom | Likely Cause | Fix |
|-----------------|-------------|-----|
| `django.db.utils.OperationalError: could not connect to server` | DB container not ready when backend starts | Add `depends_on` with healthcheck in docker-compose.yml, or retry logic in entrypoint |
| `CORS policy blocked` on API calls from frontend | `CORS_ALLOWED_ORIGINS` missing frontend origin | Add `http://localhost:5173` to `.env.dev` |
| `JWT verification failed` on Django middleware | Supabase JWT secret mismatch | Confirm `SUPABASE_JWT_SECRET` in `.env` matches Supabase Dashboard → Settings → API → JWT Secret |
| RLS blocking all queries even for authenticated users | RLS policy missing or misconfigured | Check Supabase Dashboard → Auth → Policies for the affected table |
| `Module not found` after migrating Google AI Studio files | Import paths use flat structure, not `src/` | Update all import paths to reflect the new `src/components/`, `src/pages/` structure |
| ... | ... | ... |

---

**13. Useful Commands Reference**

A quick-reference cheat sheet of the most-used commands during development, organized by task:

```bash
# ── Docker ──────────────────────────────────────────────
docker-compose up --build          # Build and start all services
docker-compose up -d               # Start in detached mode
docker-compose down                # Stop all services
docker-compose logs -f backend     # Stream backend logs
docker-compose exec backend bash   # Shell into backend container

# ── Django ──────────────────────────────────────────────
python manage.py makemigrations    # Generate new migration
python manage.py migrate           # Apply migrations
python manage.py createsuperuser   # Create admin user
python manage.py shell             # Django interactive shell
python manage.py test              # Run all tests

# ── Frontend ────────────────────────────────────────────
npm install                        # Install dependencies
npm run dev                        # Start Vite dev server
npm run build                      # Production build
npm run lint                       # Run ESLint
npm run test                       # Run Jest tests

# ── Git / GitHub ────────────────────────────────────────
git checkout -b feature/trip-management   # New feature branch
git push origin feature/trip-management   # Push branch
# Open PR → CI runs → merge to develop → auto-deploy to staging
```

---

### Section 7 — Authentication & Authorization

Document the full auth and permissions layer:

**JWT Flow:**
1. User submits credentials → Supabase Auth validates → returns JWT
2. React stores JWT in memory (not localStorage)
3. Every API request sends `Authorization: Bearer <token>` header
4. Django middleware validates JWT signature against Supabase public key
5. Django attaches user + roles to `request.user` for use in views and serializers
6. Supabase RLS uses the same JWT to enforce row-level policies at DB layer

**Role Hierarchy:**

| Role | Scope |
|------|-------|
| SuperAdmin | Full access — user management, all modules, settings |
| Admin | All operational modules, no user creation |
| Dispatcher | Trip scheduling, truck management, employee directory (read) |
| Encoder | Trip entry only |
| Viewer | Read-only across all modules |

**Permission Matrix:** Produce a table mapping each role to each module action (Create / Read / Update / Delete) using ✅ / ❌ / 👁️ (view-only).

**Session Management:**
- Define JWT expiry duration
- Define token refresh strategy
- Define behavior on expiry (redirect to login, silent refresh, or manual re-auth)

---

### Section 8 — API Design Standards

Define the API conventions all endpoints must follow:

- **Base URL:** `/api/v1/`
- **Versioning strategy:** How future versions (`v2`) are introduced without breaking `v1`
- **Naming convention:** plural nouns, kebab-case (`/trip-advice/`, `/trip-advice/{id}/stops/`)
- **Standard error response format** — provide a JSON example with `status`, `code`, `message`, `errors` fields
- **Pagination pattern** — cursor-based or page/limit; provide example request and response
- **Filtering and sorting convention** — query param format (e.g. `?status=IN_PROGRESS&ordering=-date_of_pickup`)
- **Authentication header** — `Authorization: Bearer <token>` on all protected endpoints
- **CORS policy** — which origins are allowed in dev vs. prod

---

### Section 9 — Non-Functional Requirements

Address each requirement with a concrete, measurable target. No vague statements like "use best practices" — specify the pattern, tool, or configuration.

#### Scalability
- Target concurrent user count for MVP
- DB connection pooling strategy (Supabase connection pooler — Transaction mode vs. Session mode)
- Use Django's `select_related()` and `prefetch_related()` to avoid N+1 queries on list endpoints — document which endpoints are at risk
- Pagination required on all list endpoints returning more than 50 rows

#### Reusability
- Django: shared base serializer with `created_at`, `updated_at`, `is_active` handling
- Django: shared `IsRolePermitted` permission class used across all views
- React: define the shared component library (Button, Modal, DataTable, StatusBadge, FormField) — document props contract for each
- React: custom hooks for common patterns (`useTripList`, `useVehicleAvailability`)

#### Deployability
- Docker Compose services: `backend`, `frontend`, `nginx`
- Environment files: `.env.dev`, `.env.prod` — list all required environment variables
- CI/CD pipeline outline: GitHub Actions → lint → test → build → deploy
- Zero-downtime deployment strategy

#### Readability
- Python: PEP8 enforced via `flake8`, formatted via `black`
- JavaScript: ESLint + Prettier config committed to repo
- Commit message convention: Conventional Commits (`feat:`, `fix:`, `chore:`)
- Mandatory docstrings on all Django views and serializers

#### Security
- Supabase RLS enabled on all tables — no table left without a policy
- Django `SECRET_KEY` and Supabase keys stored in environment variables only — never in source code
- HTTPS enforced in production via Nginx or platform-level TLS
- Input validation: Django REST Framework serializer validators as the primary layer
- CORS: restrict to known frontend origins in production
- Rate limiting: define threshold for login and trip creation endpoints

---

### Section 10 — Future Features Roadmap

Tier all features into three phases:

| Phase | Label | Description |
|-------|-------|-------------|
| Phase 1 | MVP | Features in scope for this document |
| Phase 2 | Post-MVP | Next 3–6 months after stable MVP |
| Phase 3 | Scale | 6–18 months, significant new capability |

Anchors to include and place appropriately:
- Inventory Management module (Phase 2)
- Billing System module (Phase 2)
- Real-time trip tracking / GPS integration (Phase 3)
- Mobile app (React Native or PWA) (Phase 3)
- Automated driver license expiry alerts (Phase 2)
- Reporting & export (trip history PDF/CSV) (Phase 2)
- Multi-hub / multi-tenant support (Phase 3)

---

### Section 11 — Design Gap Analysis

This section is critical. Cross-examine all three input files against each other and against standard logistics software engineering practices. For every gap found, produce a structured entry using this exact format:

```
GAP-[NNN]
Category:      [UX Flow | Data Model | Auth & Permissions | API | Business Logic | Infrastructure]
Severity:      [Critical | High | Medium | Low]
Location:      [Which file(s) or module(s) the gap appears in]
Gap:           One sentence describing what is missing, ambiguous, or broken.
Impact:        What breaks or becomes harder if this is not resolved before development starts.
Suggestion A:  [Preferred approach — describe it concisely]
Suggestion B:  [Alternative approach if A has tradeoffs]
Your Decision: [ ] A   [ ] B   [ ] Other: _______________
```

Cover all of the following gap categories exhaustively:

#### UX Flow Gaps

- Screens present in the UI but with no corresponding database table or API endpoint defined
- Screens implied by the database (e.g. a status enum with 5 values) but not designed in the UI
- Dead-end flows — a user can reach a state with no clear next action (e.g. trip created but no assign-driver button visible)
- Missing empty states, error states, and loading states on key screens
- No confirmation or undo flow for destructive actions (cancel trip, deactivate employee, delete vehicle)

#### Data Model Gaps

- Fields present in the UI forms but absent from the database schema
- Fields present in the database but not surfaced anywhere in the UI
- Enum values defined in the DB that have no corresponding UI representation
- Missing soft-delete patterns on tables that will need archive/restore functionality
- Tables that have no `created_by` or `updated_by` audit column despite being user-editable
- Many-to-many relationships implied by the UI that are modeled as a single FK in the DB

#### Auth & Permissions Gaps

- Modules or actions visible in the UI that have no role restriction defined in the PRD
- Actions that only SuperAdmin should perform but are not gated in the current permission matrix
- Missing RLS policy coverage — tables with no documented policy intent
- Session expiry and token refresh behavior not defined anywhere

#### API Gaps

- UI interactions that require data from multiple tables but no aggregation endpoint is defined
- Filter and sort parameters needed by the UI list screens that are not in the API design
- Bulk action endpoints implied by the UI (e.g. bulk cancel, bulk assign) with no API equivalent
- No defined strategy for real-time updates (polling vs. Supabase Realtime vs. WebSocket)

#### Business Logic Gaps

- Trip scheduling rules not codified: what prevents double-booking a driver or truck on the same date?
- No defined behavior when a trip is cancelled mid-progress — does it free the truck and driver automatically?
- Transfer trip logic — what fields carry over from the source trip to the new one?
- No SLA or escalation rule defined for trips that remain in `PENDING` beyond a threshold period
- Net weight and pickup/drop count — are these validated against actual stop records or free-entry only?

#### Infrastructure Gaps

- No defined environment strategy (local dev, staging, production) in the current PRD draft
- No secrets management plan for Supabase keys, Django `SECRET_KEY`, and third-party API keys
- No defined database migration strategy (Django migrations vs. Supabase migrations — which is the source of truth?)
- No backup and recovery plan referenced anywhere
- No error monitoring or logging service defined (e.g. Sentry, CloudWatch, Papertrail)

#### Gap Summary Table

After listing all individual gap entries, produce a summary table sorted by Severity (Critical first), then Category:

| Gap ID | Category | Severity | One-line description | Resolved? |
|--------|----------|----------|----------------------|-----------|
| GAP-001 | Business Logic | Critical | No double-booking prevention for drivers/trucks on same date | [ ] |
| ... | ... | ... | ... | [ ] |

---

### Section 12 — Conflicts & Decisions Required

List every inconsistency found across the three input files that requires a stakeholder decision before development starts. Use this format for each conflict:

```
CONFLICT-[NNN]
Files Involved:  [e.g. Database schema vs. UI design]
Conflict:        One sentence describing the contradiction.
Option A:        [First resolution path]
Option B:        [Second resolution path]
Your Decision:   [ ] A   [ ] B   [ ] Other: _______________
```

---

### Section 13 — Open Questions for Stakeholder

After writing the full PRD, list all clarifying questions needed to finalize it. Group by category:

**Business Rules**
- e.g. Can a single trip have more than two helpers assigned?
- e.g. Is a truck size mandatory at trip creation or can it be set later?

**UX / Workflow**
- e.g. Should the dispatcher see a calendar view or list view as the default for Trip Schedule?
- e.g. What is the expected behavior when a driver is marked inactive mid-trip?

**Infrastructure**
- e.g. What is the target deployment platform (Railway, Render, AWS, GCP)?
- e.g. Is a staging environment required before go-live?

**Integrations**
- e.g. Are there any third-party logistics platforms (TMS, ERP, GPS providers) that must integrate at MVP?
- e.g. Is SMS or email notification required for trip assignment?

**Data & Reporting**
- e.g. What is the minimum data retention period for completed trips?
- e.g. Are PDF or CSV exports of trip history required in the MVP or Phase 2?

---

### Quality Standards — Apply Throughout Every Section

- Write every section as if a mid-level developer who has never seen this project will onboard using this document alone.
- Be specific — no vague statements. Instead of "handle errors properly," write: "All API errors return `{ status, code, message, errors }` with an appropriate HTTP status code. 4xx for client errors, 5xx for server errors."
- Every module section must have at least one user story in the format: *"As a [role], I want to [action], so that [outcome]."*
- Flag Inventory and Billing modules clearly as `⚠️ PLACEHOLDER — NOT IN MVP SCOPE` so developers do not implement them accidentally.
- All folder structure entries must have a `#` comment.
- In the Design Gap Analysis, **never silently pick a resolution.** Always present it as a decision for the stakeholder with at least two options and a checkbox.
- All decision points in Sections 11, 12, and 13 must use Markdown checkboxes (`[ ]`) so the document is immediately actionable in GitHub, Notion, or Confluence.

---

### Output Format

- Return the PRD as a single, well-structured **Markdown document**.
- Use `##` for major sections, `###` for subsections.
- Use fenced code blocks (` ``` `) for folder structures, API payloads, and SQL/config examples.
- Use Markdown tables for permission matrices, feature tiers, and the Gap Summary Table.
- Use checkboxes (`- [ ]`) for all decision points.
- Do **not** generate any implementation code, SQL migration files, or React components.
- This is a **planning document only.**
