# Cloudy Phase 0 - Summarized Decisions for Coding Assistant

## Document status

- Status: APPROVED - PHASE 0 COMPLETE
- Last updated: 2026-07-22
- Decision owner: Jethro
- Repository baseline: commit `9bdc135`
- Current phase: Phase 0 - PRD Readiness and Gap Resolution
- Phase 0 approval: APPROVED on 2026-07-22
- Phase 1A eligibility: Yes - not started

## How the coding assistant must use this file

1. Treat only entries marked **SELECTED** or **APPROVED** as stakeholder decisions.
2. Read this summary together with root `PRD.md`, `docs/phase-0-decision-log.md`, `docs/phase-0-conflict-register.md`, `docs/phase-0-schema-change-plan.md`, `docs/phase-0-readiness-report.md`, `docs/ui-implementation-status.md`, and the user-supplied phase-gated goal.
3. Where a selected Decision Log entry conflicts with `PRD.md`, the selected Decision Log entry takes precedence and acts as an explicit PRD amendment.
4. Do not infer decisions from recommendations, sample values, unchecked options, mock-service comments, or current UI behavior.
5. Phase 0 approval and all Phase 1A prerequisites are now recorded. Any Phase 1A implementation must remain strictly inside the approved Phase 1A scope and stop for its own review gate.

## Selected decisions

### DEC-001 - Authoritative final PRD and approval process

- Status: **SELECTED**
- Selection: **Option A - Approve `PRD.md` as the authoritative final PRD, subject to amendments from the Phase 0 decision interview.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Requirement summary: `PRD.md` is the authoritative Cloudy MVP PRD for repository baseline commit `9bdc135`. The approved Resolved Decision Log takes precedence wherever a later decision explicitly amends, narrows, or clarifies the PRD.
- Coding consequence: Use `PRD.md` as the primary product contract, but apply every selected Decision Log amendment before planning or implementing the affected phase.
- Blocking rule: `PRD.md` approval alone does not authorize Phase 1A. All Phase 1A blockers and remaining Critical Phase 0 decisions must be resolved and Phase 0 must be explicitly approved.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-002 - Credential and session lifecycle

- Status: **SELECTED**
- Selection: **Option A - Memory-only Supabase session.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Requirement summary: Supabase Auth owns invitation, activation, login, silent refresh, password reset, and logout. Cloudy must not store, display, edit, log, or include raw passwords in domain records. Access and refresh session material remain in application memory only, with browser persistence disabled. Reloading, closing, or starting a new browser session requires login again.
- Coding consequence: Configure the Supabase client for non-persistent sessions; use bearer tokens only from the current in-memory session; clear auth state and redirect to Login when refresh fails; remove all password properties, password forms, default-password behavior, mock browser comparison, and password-bearing responses.
- Development-adapter rule: A local auth adapter may exist only behind the auth service interface, must be clearly non-production, must be excluded from production builds, and must not put a password field on the domain user model.
- Required evidence: Reload/new-session tests, silent-refresh and failed-refresh tests, logout test, browser storage inspection, bundle secret scan, provider integration test, and protected-request authorization tests.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-003 - Action-by-module permission matrix

- Status: **SELECTED**
- Selection: **Option A - Fixed PRD permission matrix with one active role per user.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Requirement summary: The official platform roles are `SuperAdmin`, `Admin`, `Dispatcher`, `Encoder`, and `Viewer`. Each user has exactly one current active platform role in the MVP. The action matrix in `PRD.md` is authoritative and must be enforced consistently by the UI, Django/DRF authorization, and Supabase RLS intent.
- Administrative scope: SuperAdmin alone manages user invitations, users, roles, role assignments, and application-setting updates. Admin may read application settings and audit logs but cannot manage users/roles or update settings. Dispatcher, Encoder, and Viewer cannot access Settings.
- Presentation rule: Hide an action when the user's role can never perform it. Keep a state-blocked action visible and disabled only when explaining the operational blocker is useful. Direct URL or API access must never reveal protected data.
- Role-assignment rule: The system may retain role-change history, but only one role may be effective at a time. Any legacy multiple-role records require reconciliation before authorization decisions are calculated.
- Scope rule: Branch-scoped authorization is deferred because multi-hub and multi-tenant operations are outside the MVP.
- Coding consequence: Replace scattered role comparisons and sparse mock permissions with one shared typed permission policy. Map every protected frontend action and backend endpoint to the same module/action code, and create allowed and denied tests for all critical role paths.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-004 - Assignment overlap interval

- Status: **SELECTED**
- Selection: **Option A - Explicit planned start/end interval with atomic backend enforcement.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Requirement summary: Driver and truck availability is evaluated using timezone-aware `planned_start_at` and `planned_end_at` values interpreted for Cloudy operations in `Asia/Manila`. Both values are required before assigning a driver or truck; an unassigned draft may omit them. Intervals are half-open, `[planned_start_at, planned_end_at)`, so an assignment ending exactly when another begins does not conflict.
- Active-assignment rule: An unreleased driver or truck assignment conflicts when its interval overlaps and its trip is not `Completed` or `Cancelled`. `planned_end_at` must be later than `planned_start_at`.
- Enforcement rule: The Django backend must validate and create or update the assignment within one atomic transaction. No role receives an overlap override in the MVP; frontend checks are advisory only.
- Conflict response: A confirmed or concurrent overlap returns HTTP `409` with code `ASSIGNMENT_CONFLICT`, identifies the affected resource, conflicting trip, and conflicting interval only to the extent permitted, preserves entered form data, and refreshes only affected availability.
- History rule: Successful assignments record actor and assignment time. Rejected conflicts create no partial assignment, trip projection, vehicle-status, or audit mutation that would imply success.
- Coding consequence: Add the approved planned interval fields and backend overlap service/constraint strategy; remove the current same-pickup-date browser rule as an authoritative validator; implement boundary, timezone, concurrency, rollback, and adjacent-interval tests.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-005 - Assignment source of truth

- Status: **SELECTED**
- Selection: **Option A - `trip_assignments` is authoritative.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Requirement summary: Every current or historical driver, helper, and truck assignment is represented by a `trip_assignments` record. Current assignments are derived from unreleased assignment records; trip-response assignment fields are read-only projections.
- Assignment record requirements: Retain trip, assigned resource, assignment role, planned interval, `assigned_at`, `assigned_by`, and—when released—`released_at`, `released_by`, and release reason.
- Transaction rule: Assign, reassign, and release operations are atomic. Reassignment releases the previous assignment and creates the replacement in one transaction. Failures leave projections, availability, vehicle state, assignment history, and audit data unchanged.
- Availability rule: Availability reads authoritative unreleased assignments and applies DEC-004 overlap semantics.
- Lifecycle integration: Cancellation, completion, and other approved release-producing transitions use this authoritative model; DEC-007 will define the exact transition effects.
- Compatibility rule: Existing direct assignment fields are backfilled and retained only as read-only compatibility projections until a named removal phase.
- Helper implication: The model supports repeatable helper assignments; DEC-010 governs the final cardinality and state requirements.
- Required evidence: Backfill reconciliation, projection consistency, atomic transaction and rollback tests, overlap integration, lifecycle-release tests, direct-field mutation denial, and audit/history verification.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-006 - Entity lifecycle semantics

- Status: **SELECTED**
- Selection: **Option A - Domain-specific lifecycle with controlled reactivation.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Trips: Trips are cancelled, never deleted. Cancellation requires a reason. `Cancelled` is terminal in the MVP; replacement work requires a new trip with appropriate lineage or reference. DEC-007 defines the transactional cancellation effects.
- Trucks: SuperAdmin and Admin may deactivate/reactivate trucks with a reason. Trucks with unreleased active assignments cannot be deactivated. Inactive trucks remain visible historically but are excluded from new assignments. Reactivation validates master data and returns the truck to the approved default active status, subject to DEC-008.
- Employees: SuperAdmin and Admin may deactivate/reactivate employees with a reason. Employees with unreleased active assignments cannot be deactivated. Inactive employees remain visible historically but are excluded from new assignments and selectors. Reactivation validates role-specific requirements.
- Users: Only SuperAdmin may deactivate/reactivate platform users. Deactivation immediately prevents new authenticated access and existing sessions must be rejected or invalidated through the approved auth flow. Reactivation restores eligibility without changing role assignment or credentials.
- Shared rules: No user-facing Delete action or hard-delete endpoint exists. Each lifecycle change records actor, timestamp, reason, old/new state, and affected dependencies. Blocked or failed actions make no partial changes. Historical records continue to render inactive resources by label while new-selection paths exclude them.
- Required evidence: Lifecycle permission tests, active-dependency blocking tests, session invalidation tests, historical rendering tests, selector exclusion tests, reactivation validation tests, audit/history verification, and rollback tests.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-007 - Trip transition graph and cancellation effects

- Status: **SELECTED**
- Selection: **Option A - Fixed transition graph with controlled exceptional states.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Permitted graph:
  - `Scheduled -> In Progress | Cancelled | Transferred`
  - `In Progress -> Completed | Cancelled | Rescue | Backload | Transferred`
  - `Rescue -> Completed | Cancelled | Transferred`
  - `Backload -> Completed | Cancelled | Transferred`
  - Terminal: `Completed`, `Cancelled`, `Transferred`
- Required conditions: `Scheduled -> In Progress` requires dispatch-ready data and assignments under DEC-010. `Cancelled`, `Rescue`, `Backload`, and `Transferred` require a reason. `Transferred` requires a successor trip linked through `transfer_from_id`.
- Permissions: Standard transitions follow DEC-003. Exceptional transitions are limited to SuperAdmin, Admin, and Dispatcher; Encoder and Viewer cannot perform them.
- Completion effects: Release current assignments, return an operationally eligible truck to `Available` only when no other active assignment exists, and write trip-status, assignment-release, vehicle-status, and audit history.
- Cancellation effects: Require confirmation and reason; release current assignments; return eligible trucks to `Available`; write all required history; roll back the whole command on failure.
- Transfer effects: Require a successor trip and lineage; set the source to `Transferred`; release source assignments; do not automatically copy assignments to the successor.
- Rescue/Backload effects: Keep the trip active. Do not automatically release assignments; resource changes use DEC-005 reassignment. Record reason and actor.
- Error/idempotency: Invalid transitions return `409 INVALID_TRIP_TRANSITION`; missing reasons or lineage return structured validation errors; repeated successful commands do not duplicate side effects; concurrent transitions use locking or stale-version validation.
- Required evidence: Transition-matrix tests, role allow/deny tests, idempotency tests, concurrent transition tests, transactional completion/cancellation/transfer tests, assignment and vehicle-state history verification, and rollback tests.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-008 - Lookup and permission seeds

- Status: **SELECTED**
- Selection: **Option A - Versioned, backend-owned immutable-code catalog.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Canonical code rule: Machine codes use uppercase `SNAKE_CASE` and are immutable after release. Labels, display order, and active state may change only through reviewed migrations or an idempotent versioned seed command.
- Platform roles: `SUPERADMIN`, `ADMIN`, `DISPATCHER`, `ENCODER`, `VIEWER`.
- Trip statuses: `DRAFT` (P0-AMEND-001), `SCHEDULED`, `IN_PROGRESS`, `RESCUE`, `BACKLOAD`, `COMPLETED`, `CANCELLED`, `TRANSFERRED`.
- Truck statuses: `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `INACTIVE`.
- Load types: `DRY`, `CHILLED`, `REF`, `COMBI`, `MIXED`.
- Employee roles: `DRIVER`, `HELPER`, `ENCODER`, `DISPATCHER`, `MANAGER`.
- Application modules: `TRIP_SCHEDULING` is active; `INVENTORY` and `BILLING` remain visible, disabled `Coming Soon`, and non-launchable.
- Permission actions: `READ`, `CREATE`, `UPDATE`, `CANCEL`, `DEACTIVATE`, `REACTIVATE`, `ASSIGN`, `STATUS_CHANGE`, `EXPORT`, `MANAGE`.
- Permission naming: Stable namespaced codes such as `TRIP_ADVICE.READ`, `TRIP_ASSIGNMENTS.ASSIGN`, `TRUCKS.STATUS_CHANGE`, `SETTINGS.UPDATE`, `USERS_ROLES.MANAGE`, and `AUDIT_LOGS.READ`.
- Ownership and UI rules: DEC-003 determines role grants. Backend migrations/seed commands own the catalog. Frontend components load approved lookup APIs and must not invent fallback business codes.
- Historical/inactive handling: Inactive values remain renderable on historical records but are excluded from new selection. Core codes cannot be renamed or deleted through Settings.
- Visual-system rule: Status colors and tokens map to immutable codes, never labels.
- Failure rule: Lookup failure blocks dependent form submission or filtering behavior rather than using guessed values.
- Migration rule: Legacy mock IDs, labels, unions, and permission constants require an explicit mapping to canonical codes.
- Required evidence: Seed migration/command, idempotency tests, lookup endpoint tests, code immutability tests, inactive-value historical rendering and selector exclusion tests, role-permission mapping tests, frontend token mapping tests, and legacy migration reconciliation.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-009 - Schema/UI field reconciliation

- Status: **SELECTED**
- Selection: **Qualified Option B - Use the workbook as the baseline and remove unsupported UI fields, while amending the schema wherever an approved decision requires it.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Baseline rule: `cloudy_schema.xlsx` is the starting data model for MVP implementation. UI-only fields are not added merely because they exist in the mock application.
- Approved scope reductions:
  - Do not add `employees.branch_id` in the MVP.
  - Do not add `trucks.branch_id` in the MVP.
  - Do not add maintenance `odometer` or `vendor_mechanic` fields in the MVP.
  - Do not persist a duplicate `trip_stops.city_area`; derive region/province/address display from `locations`.
  - Do not add a separate stop `notes` field in the MVP. Use `trip_stops.specific_address` as the canonical optional stop-specific address/facility-instruction field and label it clearly in the UI.
- Critical qualification: The workbook is not immutable. It must be revised where required by DEC-003 through DEC-008, including single-active-role enforcement, planned assignment intervals, authoritative assignment history, lifecycle semantics, transition effects, audit actors, and canonical seed values.
- Data-loss safeguard: Existing mock/legacy values from removed fields must be inventoried. Recoverable values are mapped to canonical fields; unmappable values are reported in a migration exception register and are not silently discarded.
- UI truthfulness rule: A field must not be presented as durably saved unless it round-trips through the approved production API/schema.
- Future-scope implication: Employee/truck home-branch ownership and richer maintenance details require a later approved schema migration if operations need them.
- Required evidence: Revised schema diff, field mapping table, migration exception report, round-trip contract tests, no-silent-loss checks, UI removal/relabelling verification, and conformance tests for DEC-003 through DEC-008.
- Approval evidence: Jethro selected qualified Option B in the CloudyMVP project conversation on 2026-07-22.

### DEC-010 - Unassigned trips and helper cardinality

- Status: **SELECTED**
- Selection: **Option A - Allow explicitly unassigned scheduled trips; helpers are repeatable assignments.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- State rules:
  - `Draft` may omit truck, driver, helpers, and planned assignment interval.
  - `Scheduled` requires approved trip header data, required pickup/drop-off stops, and `planned_start_at`/`planned_end_at`, but may have no truck or driver.
  - `In Progress` requires one active truck assignment, one active driver assignment, and all other dispatch-ready requirements.
  - A trip cannot transition to `In Progress` while required assignments are missing.
- Unassigned workflow: Unassigned scheduled trips are clearly labeled `Unassigned`, remain filterable in the operations queue, and do not reserve any resource.
- Helper model:
  - Helpers are repeatable `trip_assignments` records with role `HELPER`.
  - Minimum helper count is zero.
  - No hard database maximum is imposed in the MVP.
  - The initial UI supports entering up to two helpers, while the backend contract supports more without schema redesign.
  - The same employee cannot be assigned twice to the same trip, and a driver cannot also be a helper on the same trip.
  - Helper availability uses the same planned interval and overlap rules as other employee assignments.
- Error states: The UI distinguishes missing assignment, assignment conflict, inactive resource, and resource not yet selected.
- History rule: Assigning resources later to an unassigned scheduled trip creates normal DEC-005 assignment history.
- Alert rule: No stale-unassigned threshold is implied here; DEC-012 governs any alert threshold.
- Required evidence: Draft/scheduled/in-progress validation tests, unassigned queue/filter tests, no-reservation tests, helper duplication tests, role collision tests, overlap tests, backend-more-than-two-helper contract tests, and transition-blocking tests.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-011 - API, RLS, pagination, errors, concurrency, idempotency, and refresh

- Status: **SELECTED**
- Selection: **Option A - Complete versioned OpenAPI contract with conservative MVP refresh.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- API baseline: Production routes live under `/api/v1/`, are implemented with Django REST Framework, and are documented in a checked-in OpenAPI contract. Frontend data access goes through typed service interfaces; mock and production adapters share the interface, but the mock is explicitly non-production.
- Authentication/authorization: Protected requests use `Authorization: Bearer <supabase-access-token>`. Django validates Supabase JWTs, resolves the single active role, enforces DEC-003 through DRF permissions, and uses Supabase RLS as defense in depth. Frontend permission checks are presentation only.
- Status handling: `401` for unauthenticated/expired sessions, `403` for authenticated but unauthorized requests.
- Error contract: Errors use a standard body containing `status`, stable `code`, safe `message`, field/action `errors`, and `request_id`. Security-sensitive responses omit unauthorized identifiers/details.
- Pagination: Default `limit=25`, maximum `limit=100`, using `page` and `limit`, and returning `count`, `page`, `limit`, `next`, `previous`, and `results`.
- Filtering/sorting: Operational lists use server-side filters and `ordering`; filters may be combined. Unknown filter or ordering fields return structured `400` errors rather than being silently ignored.
- Optimistic concurrency: Mutable records include a server-managed integer `version`. Updates submit the last-read version; stale writes return `409 STALE_RECORD`. Critical assignment and transition commands still use transaction-level locking and specific conflict codes.
- Idempotency: Trip creation, assignment/reassignment/release, trip transition/cancellation/transfer, truck status changes, deactivate/reactivate commands, and user invitations accept `Idempotency-Key`. Reuse for the same command returns the original result without duplicate side effects.
- Refresh: Operational lists and dashboards support manual refresh and poll every 60 seconds while visible. Polling pauses when the tab is hidden and resumes with an immediate refresh. Successful mutations revalidate affected records and summaries. Forms/details never overwrite local edits automatically. Realtime/WebSockets are deferred.
- Aggregation: Dashboard totals, availability, and fuel summaries come from approved aggregate endpoints, not undocumented client joins over paginated data.
- UI recovery: Stale/conflict/network errors preserve entered data and offer refresh/review rather than silently overwriting.
- Required evidence: OpenAPI review, typed-client contract tests, auth/DRF/RLS allow-deny tests, error-shape tests, paging/filter/order tests, stale-write tests, idempotency tests, transaction-conflict tests, polling visibility tests, local-edit preservation tests, and aggregate-endpoint verification.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-012 - Operational UI policies

- Status: **SELECTED**
- Selection: **Option A - Conservative MVP operational policies.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Default workspace: Trip Operations opens in a server-paginated list/table view. Calendar and board views are not the default MVP workflow.
- URL-state expectation: Search, filters, ordering, and pagination should be represented in URL state where practical under DEC-014.
- Cancelled visibility: Cancelled trips are excluded from the default active-operations result set but remain available through the Status filter, search, and authorized direct detail access. They remain labeled `Cancelled`, not deleted or archived.
- Stale-trip policy: No automatic stale-warning or escalation threshold is implemented in the MVP. A factual `Planned start passed` label may be shown when `planned_start_at` is in the past. The UI must not label a trip stale, delayed, or escalated without a later approved rule.
- Capacity policy: No hard block, warning, override, or capacity-safety claim is implemented in the MVP. Capacity/weight values may be displayed when present, but no authoritative comparison is made until units, source, vehicle configuration, mixed-load rules, and override behavior are approved.
- Export policy: No functional PDF or CSV export is included in the MVP. Export controls remain hidden. The `EXPORT` permission code is reserved for future use and grants no current executable capability.
- Dashboard truthfulness: Dashboard and alert surfaces may show factual counts and timestamps from DEC-011 aggregate endpoints but must not imply real-time monitoring, stale escalation, capacity safety, or export availability.
- Required evidence: Default-query tests, cancelled filter/search/direct-detail tests, factual past-due boundary tests, no-stale-language checks, no-capacity-guarantee checks, hidden-export tests, aggregate-source tests, and URL-state tests where DEC-014 applies.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-013 - Deployment and production operations

- Status: **SELECTED**
- Selection: **Option A - Render + Supabase with explicit environment and recovery controls.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Environment separation: Local, staging, and production use separate configuration. Staging and production use separate Supabase projects, databases, Auth users, secrets, and Render services. Production data and credentials are never reused in staging.
- Deployment topology: React frontend on Render Static Site or approved frontend service; Django API on Render Web Service; PostgreSQL/Auth on Supabase; GitHub for source and CI/CD; Docker Compose for local development.
- Domains: Temporary Render domains are approved for staging and initial production. Custom domains are optional later. Exact CORS and Supabase Auth redirect allowlists are environment-specific, and production uses HTTPS.
- Production plan rule: Render free tier is acceptable only for demos or non-critical staging. Live production operations require a paid Render service and recorded billing ownership.
- CI/CD baseline: Frontend typecheck, lint, tests, accessibility checks, production build; backend lint/format, tests, migration consistency, OpenAPI validation; Docker build; and secret scan. `develop` deploys to staging, while `main` deploys to production only after approval.
- Migration ownership: Django models/migrations are authoritative after initial reconciliation. Named owners review and apply migrations. Manual production schema changes through Supabase SQL editor are prohibited except documented emergency recovery.
- Monitoring: Structured Django logs, Render logs, Supabase logs, health checks, DEC-011 request IDs, and Sentry for frontend/backend. Sensitive data is redacted.
- Backups/recovery: Production must provide seven daily restore points. High-risk migrations require a verified additional backup. A staging restore exercise must pass before production approval.
- Rollback: Use Render previous-deploy rollback for application code. Prefer backward-compatible migrations; unsafe reversals require a tested forward-fix or recovery procedure. Release records track commit, migration set, environment, approver, outcome, and rollback status.
- Ownership required before production: Render/billing, Supabase/billing, secrets, migrations, monitoring/incidents, backup/restore, deployment approval, and rollback.
- Required evidence: Environment matrix, CI/CD logs, staging deployment, paid-production confirmation, CORS/Auth callback tests, migration runbook, Sentry sample event, health check, backup/restore exercise, rollback test, secret scan, and ownership register.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-014 - Frontend routing and migration boundary

- Status: **SELECTED**
- Selection: **Option A - Incremental route and service extraction with temporary compatibility adapters.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Routing: Introduce React Router in Phase 1B with browser-addressable routes for login, hub, dashboard, trip operations, trip creation, trip detail/edit, trucks, employees, and settings. Inventory and Billing remain non-launchable.
- Route behavior: Authorized deep links, refresh, back, and forward must work. Unauthorized routes render a safe access-denied state without protected data. Unknown routes render a safe not-found state.
- URL state: Trip search, filters, ordering, page, and limit use query parameters where practical. Opening/closing details preserves list context. Sensitive or large form content is not stored in URLs. Unsaved forms warn before destructive navigation.
- Service boundary: Components use stable typed service interfaces aligned with DEC-011. Existing mock behavior moves behind a development-only adapter. Components must not directly import or mutate mock arrays.
- Incremental extraction: Existing screens may initially be preserved through route wrappers. Large feature components are split only when their approved phase requires it, avoiding a broad rewrite.
- Planned trip-workspace extraction: Trip Operations, Trip Details, Trip Editor, Assignment/Availability, and Transition Actions become distinct bounded surfaces.
- Compatibility governance: Every adapter records purpose, owner, consumers, removal criteria, and removal phase.
- Removal milestones:
  - Remove `currentView` navigation after Phase 1B route verification.
  - Remove direct mock-array reads before production-backed Phase 2 workflows.
  - Remove writable legacy assignment fields during Phase 2D.
  - Remove remaining migration adapters by Phase 5B unless an explicit limitation is approved.
- Required evidence: Route integration tests, deep-link/refresh/back-forward tests, unauthorized/not-found tests, URL-state tests, unsaved-navigation tests, typed-adapter contract tests, direct-mock-import checks, and adapter-removal tracking.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-015 - Test and accessibility evidence

- Status: **SELECTED**
- Selection: **Option A - Risk-based automated stack plus manual review.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Frontend tooling: Vitest, React Testing Library, MSW, Playwright, axe-core, ESLint, Prettier, and a separate `typecheck` command using `tsc --noEmit`.
- Backend tooling: Django tests or `pytest-django`, DRF API tests, PostgreSQL-backed integration tests, `coverage.py`, `ruff`, `black --check`, migration consistency checks, and OpenAPI validation.
- Required behavior coverage: Allowed/denied role paths, direct-route/API denial, validation and retained input, lookup failure, pagination/filtering/ordering, stale conflicts, idempotency, assignment overlap/rollback, transitions/cancellation, lifecycle blockers, keyboard operation, accessible names/errors/dialogs/tables/focus, and responsive states.
- Coverage policy:
  - No single global percentage alone determines approval.
  - Critical permission, lifecycle, assignment, transition, and concurrency logic requires direct positive, negative, and error-path tests.
  - New or materially changed business-logic modules target at least 80% branch coverage.
  - Overall frontend and backend line coverage targets at least 70% by Phase 5B.
  - Lower results require an explicit accepted limitation naming the uncovered risk.
- Browser/device evidence: Automated stable Chromium desktop, tablet viewport, and narrow responsive viewport. Manual review includes Chrome/Edge, Firefox, Safari when available, keyboard-only workflows, light/dark mode, reduced motion, and screen-reader spot checks.
- Accessibility standard: Target WCAG 2.2 AA. No unaccepted serious or critical axe violations in the active phase. Accessibility defects blocking completion of a core workflow block phase approval.
- CI/evidence rule: Required checks run on pull requests. Reports and coverage artifacts are retained. Each acceptance criterion links to evidence. Flaky, skipped, blocked, or unavailable checks are reported accurately and cannot count as PASS.
- Required evidence: Tooling configuration, scripts, CI logs, unit/component/API/integration/E2E results, coverage reports, axe results, keyboard/responsive/manual checklists, browser matrix results, and acceptance-criterion traceability.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-016 - AI analysis and secret boundary

- Status: **SELECTED**
- Selection: **Option A - Exclude and disable AI analysis for the MVP.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Scope rule: AI trip analysis is not part of the approved Cloudy MVP.
- Production UI: Remove or hide AI analysis actions and any copy implying AI scheduling, routing, risk, assignment, or safety recommendations.
- Secret boundary: Remove browser-side Gemini SDK construction and all Vite injection of `GEMINI_API_KEY` or equivalent provider secrets.
- Code treatment: Delete the existing AI client code or isolate it in an explicitly non-production experimental location excluded from production imports and builds.
- Production contract: Do not implement an AI endpoint, permission, quota, prompt flow, model call, or AI-derived operational mutation in the MVP.
- Verification: Browser bundles, source maps, runtime configuration, logs, and test fixtures must contain no provider key or server-only AI secret.
- Reintroduction rule: Any later AI feature requires a separately approved product decision covering workflow, role permission, allowed data, provider/model, authenticated server endpoint, quotas/cost owner, logging/redaction, retention, human review, and failure behavior.
- Required evidence: UI absence tests, production-import checks, browser-bundle secret scan, Vite environment review, dependency/import cleanup, and documentation conformance.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

## Decision progress

| Decision | Topic                                          | Status   | Required before          |
| -------- | ---------------------------------------------- | -------- | ------------------------ |
| DEC-001  | Authoritative final PRD and approval process   | SELECTED | Phase 0 approval         |
| DEC-002  | Credential and session lifecycle               | SELECTED | Phase 1B/3D              |
| DEC-003  | Action-by-module permission matrix             | SELECTED | Phase 1C                 |
| DEC-004  | Assignment overlap interval                    | SELECTED | Phase 2C/2D              |
| DEC-005  | Assignment source of truth                     | SELECTED | Phase 2D                 |
| DEC-006  | Entity lifecycle semantics                     | SELECTED | Phase 2E/3A/3B/3D        |
| DEC-007  | Trip transition graph and cancellation effects | SELECTED | Phase 2E                 |
| DEC-008  | Lookup and permission seeds                    | SELECTED | Phase 1A                 |
| DEC-009  | Schema/UI field mismatches                     | SELECTED | Phase 2C/3A/3B           |
| DEC-010  | Unassigned trips and helper cardinality        | SELECTED | Phase 2C/2D              |
| DEC-011  | API/RLS/error/pagination/refresh contract      | SELECTED | Phase 1B and data phases |
| DEC-012  | Operational UI policies                        | SELECTED | Affected Phase 2/4 work  |
| DEC-013  | Deployment and production operations           | SELECTED | Staging/production       |
| DEC-014  | Frontend routing and migration boundary        | SELECTED | Phase 1B/2A              |
| DEC-015  | Test and accessibility evidence                | SELECTED | Phase 1A onward          |
| DEC-016  | AI analysis and secret boundary                | SELECTED | Production AI use        |

## Current gate

All sixteen decisions are selected, final source conformance is complete, and Jethro approved Phase 0 with the exact instruction `APPROVED: Phase 0` on 2026-07-22. Root `PRD.md`, the schema change plan, conflict register, readiness report, and implementation status describe the same approved baseline. Phase 0 is `COMPLETE`; Phase 1A is eligible but has not started.

The reconciliation records one explicit internal amendment: DEC-010 requires a savable Draft state, so `PRD.md` P0-AMEND-001 adds canonical trip status `DRAFT` (order 5) to DEC-008's catalog. The Phase 0 approval instruction ratifies this transparent interpretation; it is not a production-code change.

## Decision-resolution status

- Decisions selected: **16 of 16**
- Decision owner: Jethro
- Selection period completed: 2026-07-22
- Decision Log status: **APPROVED RESOLVED DECISION LOG - PHASE 0 COMPLETE**
- Phase 0 implementation gate: **Satisfied**
- Approval evidence: Exact user instruction `APPROVED: Phase 0`, received 2026-07-22
- Required next action: Phase 1A may begin in a scoped implementation turn; it was not started while recording this approval.
