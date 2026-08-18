# Cloudy Fleet Management MVP Product Requirements Document

## Document control

| Field | Value |
|---|---|
| Product | Cloudy Fleet Management |
| Release | Operational MVP |
| Repository baseline | `9bdc135` |
| Decision owner | Jethro |
| Decision date | 2026-07-22 |
| Document status | APPROVED FINAL REQUIREMENT BASELINE |
| Phase 0 status | COMPLETE |
| Phase 0 approval | APPROVED |
| Approval date | 2026-07-22 |
| Approval evidence | Exact user instruction `APPROVED: Phase 0` |

This file is the approved authoritative Cloudy MVP PRD selected by DEC-001. The Resolved Decision Log in `docs/phase-0-decision-log.md` takes precedence wherever it amends, narrows, or clarifies this PRD. The user supplied the exact Phase 0 approval instruction on 2026-07-22.

## 1. Authority, sources, and conformance amendments

### 1.1 Source priority

1. The user-supplied phase-gated implementation goal controls phase procedure, approval gates, and locked constraints.
2. Selected records DEC-001 through DEC-016 in `docs/phase-0-decision-log.md` control product and technical decisions.
3. This PRD consolidates the approved requirements for the current repository baseline.
4. The UI/UX Blueprint controls target experience where it does not conflict with a selected decision.
5. `.docs/cloudy_schema.xlsx` is a qualified schema baseline under DEC-009, not the final database contract. `docs/phase-0-schema-change-plan.md` records mandatory amendments.
6. The PRD-generation prompt, AI Studio prompt pack, repository context package, README, and current source are guidance or observed implementation only.

Examples, mock-service comments, hardcoded frontend values, and current UI behavior do not create product authority.

### 1.2 Phase 0 conformance amendments

| Amendment | Source conflict | Reconciled requirement | Rationale and authority | Affected sections/phases |
|---|---|---|---|---|
| P0-AMEND-001 | DEC-008 lists seven trip statuses, while later DEC-010 requires savable Draft trips. | Add immutable canonical code `DRAFT`, label `Draft`, order `5`, lifecycle `Authoring`, before `SCHEDULED`. | DEC-010 is the later selected decision and explicitly requires Draft persistence and state validation. Leaving Draft outside the catalog would violate DEC-008's no-invented-codes rule. | Sections 6 and 9; Phase 1A tokens, Phase 1B lookups, Phase 2C workflow |
| P0-AMEND-002 | Blueprint operational-risk, capacity, alert, and export concepts are broader than DEC-012. | Preserve the Blueprint layout principles, but expose only factual `Planned start passed` information; provide no stale/risk classification, capacity safety conclusion, alert-resolution workflow, or executable export in the MVP. | DEC-012 explicitly narrows the Blueprint concepts. | Sections 4, 7, and 11; Phases 2 and 4 |
| P0-AMEND-003 | Workbook fields and generic delete flags conflict with DEC-003 through DEC-010. | Use the workbook only as the baseline and apply the mandatory schema plan before affected implementation. | Qualified DEC-009 requires decision-driven amendments and forbids silent retention or silent data loss. | Section 9; backend preparation and data-backed phases |
| P0-AMEND-004 | Blueprint Settings scope says Admin may be read-only or scoped. | Admin receives read-only Settings and audit access; only SuperAdmin manages users, roles, invitations, and setting updates. | DEC-003 resolves the Blueprint alternative. | Section 8; Phases 1C and 3D |

P0-AMEND-001 is an explicit source-conformance interpretation, not a production change. The exact Phase 0 approval instruction ratified this amendment with the rest of the reconciled package on 2026-07-22.

## 2. Product objective and success measures

Cloudy is an operational command workspace for logistics dispatch. Its MVP must let authorized office users create and schedule trips, identify unassigned work, assign valid drivers/helpers/trucks, control trip and resource lifecycle, inspect operational history, and understand current operational state without claiming capabilities the system does not possess.

The experience is list-first and desktop-oriented, with a usable tablet/narrow adaptation. Tables are the principal operational component; in-layout details preserve queue context; full pages handle complex editing; status and permission meaning never relies on color alone.

MVP success requires:

- A dispatcher can find an unassigned trip, inspect availability for its planned interval, encounter a useful conflict, select valid resources, confirm assignment, and see consistent trip/resource/history results.
- An encoder can create or correct permitted trip records without gaining assignment, cancellation, administrative, or Settings authority.
- An authorized manager persona, represented by Admin or SuperAdmin rather than a separate platform role, can inspect operational health and intervene within its permissions.
- A Viewer can inspect permitted records without mutation controls.
- Direct API access, concurrency, and lifecycle rules produce the same outcomes as the interface.
- No raw password, browser-persisted session token, service-role key, AI provider secret, or unsupported production guarantee reaches the browser.

## 3. Scope

### 3.1 In scope

- Supabase-owned invitation, activation, login, in-memory session refresh, reset, logout, and session invalidation behavior.
- A Hub with active Trip Scheduling and disabled, non-launchable Inventory and Billing cards labeled Coming Soon.
- Role-aware application shell, authorized routes, safe not-found/access-denied states, theme behavior, and sign-out.
- Trip Scheduling dashboard, Trip Operations list, trip create/edit/detail, stops, assignments, transitions, events, fuel logs, and activity/history.
- Driver/helper employee records, driver extension data, truck records, vehicle status history, and maintenance records within the qualified schema fields.
- Users, one-current-role administration, application-setting read/update rules, and audit-log inspection.
- Client, consignee, internal client code, location, and other required reference data used by trip workflows.
- Versioned lookup/permission catalogs, typed service boundaries, a versioned API, aggregate endpoints, transactional commands, auditability, and migration compatibility.

### 3.2 Explicitly outside the MVP

- Functional Inventory or Billing workspaces.
- Real-time GPS, live map monitoring, driver mobile app, multi-tenant or branch-scoped authorization, automated billing, external email/SMS/push notifications, report builder, and executable CSV/PDF export.
- Capacity safety validation, capacity warning/block/override, stale/delay risk thresholds, escalation workflows, and claims of real-time monitoring.
- Supabase Realtime/WebSockets unless separately approved later.
- AI trip analysis, AI recommendations, AI endpoints, model-provider integration, browser provider keys, and AI-driven domain changes.
- Employee/truck home-branch ownership, separate trip-stop notes, maintenance odometer tracking, and maintenance vendor/mechanic attribution.

## 4. Experience and information architecture

### 4.1 Approved routes

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

Inventory and Billing have no launchable MVP workspace routes. Authorized deep links, refresh, back, and forward must behave predictably. Unknown routes show a safe not-found state. Unauthorized routes reveal no protected content or data.

Search, supported filters, ordering, page, and limit should use query parameters where practical. Opening and closing trip details preserves list context. URLs never contain credentials, tokens, sensitive values, or unsaved form bodies.

### 4.2 Layout behavior

- Desktop uses a persistent/collapsible navigation area, dense operational workspace, and in-layout details where they preserve list usability.
- Tablet/narrow layouts may collapse navigation and convert details to a drawer, while keeping core inspection and urgent actions usable.
- Long/complex trip edits use full pages with visible labels, grouped sections, a persistent summary/action region, inline validation, and unsaved-change protection.
- Tables distinguish no records, no filter results, unavailable data, permission denial, and Coming Soon states.
- Forms preserve entered values after recoverable validation, permission, stale-record, network, and service errors.

### 4.3 Visual and accessibility foundation

- Use reusable semantic tokens for color, typography, spacing, borders, elevation, focus, status, and motion.
- Support light and dark modes; preserve a path for high-contrast/forced-color support.
- Every status pairs explicit text with a non-color cue where needed.
- Focus is visible, restored after drawers/dialogs, and never removed without an accessible replacement.
- Motion is short, functional, nonessential to comprehension, and respects reduced motion.
- Target WCAG 2.2 AA.

## 5. Authentication and session requirements

Supabase Auth owns credentials. Cloudy domain tables and payloads store no raw password. User administration uses provider-owned invitations and resets; no administrator chooses, views, edits, or receives another user's password.

Access and refresh material remains in application memory only. Browser persistence is disabled. Silent refresh is permitted only while the current application instance remains open. Reload, application close, a new browser session, lost in-memory state, failed refresh, revoked token, inactive user, or invalid session requires authentication again. Logout clears application auth state and the Supabase session.

Protected Django requests send `Authorization: Bearer <supabase-access-token>`. Django validates the Supabase JWT, resolves the active user and exactly one effective platform role, and enforces the action permission. Missing/invalid/revoked/expired authentication returns `401`; an authenticated but unauthorized request returns `403` without exposing protected details.

Security events such as invite, activation, login, failed refresh, reset request, logout, role change, and deactivation are auditable without recording passwords, tokens, or provider secrets.

## 6. Canonical catalogs

Machine codes are immutable uppercase `SNAKE_CASE`, backend-owned, versioned, and used by storage, APIs, permissions, UI tokens, filters, and tests. Labels, order, and active state change only through reviewed migrations or idempotent seed commands. Inactive values remain readable historically but are not selectable for new records.

### 6.1 Platform roles

| Code | Label | Order |
|---|---|---:|
| `SUPERADMIN` | SuperAdmin | 10 |
| `ADMIN` | Admin | 20 |
| `DISPATCHER` | Dispatcher | 30 |
| `ENCODER` | Encoder | 40 |
| `VIEWER` | Viewer | 50 |

### 6.2 Trip statuses

| Code | Label | Order | Lifecycle |
|---|---|---:|---|
| `DRAFT` | Draft | 5 | Authoring |
| `SCHEDULED` | Scheduled | 10 | Active |
| `IN_PROGRESS` | In Progress | 20 | Active |
| `RESCUE` | Rescue | 30 | Active exception |
| `BACKLOAD` | Backload | 40 | Active exception |
| `COMPLETED` | Completed | 50 | Terminal |
| `CANCELLED` | Cancelled | 60 | Terminal |
| `TRANSFERRED` | Transferred | 70 | Terminal |

### 6.3 Other catalogs

| Catalog | Codes in order |
|---|---|
| Truck statuses | `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `INACTIVE` |
| Load types | `DRY`, `CHILLED`, `REF`, `COMBI`, `MIXED` |
| Employee roles | `DRIVER`, `HELPER`, `ENCODER`, `DISPATCHER`, `MANAGER` |
| Application modules | `TRIP_SCHEDULING` active; `INVENTORY` and `BILLING` Coming Soon/non-launchable |
| Permission actions | `READ`, `CREATE`, `UPDATE`, `CANCEL`, `DEACTIVATE`, `REACTIVATE`, `ASSIGN`, `STATUS_CHANGE`, `EXPORT`, `MANAGE` |

Permissions use stable namespaced codes, including `TRIP_ADVICE.READ`, `TRIP_ADVICE.CREATE`, `TRIP_ADVICE.UPDATE`, `TRIP_ADVICE.CANCEL`, `TRIP_ASSIGNMENTS.ASSIGN`, `TRIP_EVENTS.CREATE`, `TRIP_FUEL_LOGS.CREATE`, `TRUCKS.STATUS_CHANGE`, `TRUCKS.DEACTIVATE`, `EMPLOYEES.DEACTIVATE`, `SETTINGS.UPDATE`, `USERS_ROLES.MANAGE`, and `AUDIT_LOGS.READ`.

Lookup failure blocks dependent form submission or action activation. Components must not invent values or submit guessed/stale codes.

## 7. Functional requirements

### 7.1 Hub and application shell

- Authenticated users see Trip Scheduling when allowed by their effective role.
- Inventory and Billing remain visible as Coming Soon but cannot launch, regardless of role grants.
- The shell shows the current user/role, allowed navigation, theme controls, and sign-out.
- Actions a role can never perform are hidden. State-blocked actions may remain visible and disabled only when the reason helps the user.

### 7.2 Trip Operations

- The default workspace is a server-paginated list/table, not a calendar-first workflow.
- The default active query excludes `CANCELLED`. Authorized users can include Cancelled via status filter/search and open Cancelled details directly.
- Search, filters, ordering, page, and limit are stable, combinable, and reflected in URL state where practical.
- Unassigned Scheduled trips are clearly labeled and filterable; the UI does not imply resources are reserved.
- The only approved derived overdue wording is factual `Planned start passed`, based on current time later than `planned_start_at` for an applicable nonterminal record.
- The UI must not label trips Stale, Delayed, Escalated, At Risk, or equivalent without a later approved policy.

### 7.3 Trip authoring and state requirements

- Draft may omit driver, truck, helpers, `planned_start_at`, and `planned_end_at` when draft-minimum identity requirements are met.
- Scheduled requires approved header data, at least one pickup and one drop-off stop, and a valid planned interval. Driver and truck may remain unassigned.
- In Progress requires exactly one current driver assignment, exactly one current truck assignment, and all dispatch-ready requirements.
- Helpers are repeatable authoritative assignments. The database/API has no hard MVP maximum; the first UI may enter up to two per interaction while reading/managing larger existing sets.
- The same employee cannot hold duplicate current assignments on the same trip, and the active driver cannot also be an active helper.
- Stop province/region/address comes from the referenced location. `trip_stops.specific_address` is the single stop-specific address/facility-instruction field; no duplicate stop `city_area` or `notes` field is added.

### 7.4 Assignment and availability

Every assigned driver or truck requires timezone-aware `planned_start_at` and `planned_end_at`, interpreted operationally in `Asia/Manila`; the end must be later than the start. Intervals are half-open `[start, end)`, so adjacent assignments are valid.

The backend atomically rejects an unreleased overlapping driver or truck assignment on a non-completed/non-cancelled trip. No role receives an overlap override. A conflict returns `409 ASSIGNMENT_CONFLICT`, shares only permitted conflict details, preserves input, and refreshes affected availability.

`trip_assignments` is authoritative for current and historical driver, helper, and truck assignments. Current trip assignment fields are derived read-only projections. Assign/reassign/release commands are transactional; reassign releases the prior record and creates the replacement atomically. Current availability derives from unreleased assignments and the planned interval.

### 7.5 Trip transition graph

```text
SCHEDULED -> IN_PROGRESS | CANCELLED | TRANSFERRED
IN_PROGRESS -> COMPLETED | CANCELLED | RESCUE | BACKLOAD | TRANSFERRED
RESCUE -> COMPLETED | CANCELLED | TRANSFERRED
BACKLOAD -> COMPLETED | CANCELLED | TRANSFERRED
```

`COMPLETED`, `CANCELLED`, and `TRANSFERRED` are terminal. `CANCELLED`, `RESCUE`, `BACKLOAD`, and `TRANSFERRED` require a reason. Transfer requires a successor whose `transfer_from_id` identifies the source.

Completion and cancellation release current assignments and return an eligible, otherwise-unassigned truck to Available. Transfer preserves source/successor lineage and releases source assignments without silently copying them. Rescue and Backload retain assignments unless the authoritative assignment operation changes them.

Transition, assignment release, vehicle status, lineage, and history effects are atomic and idempotent. Invalid transitions return `409 INVALID_TRIP_TRANSITION`. Repeated successful commands do not duplicate effects.

### 7.6 Entity lifecycle

- Trips are cancelled, never deleted. Cancellation requires reason and history. Cancelled trips are readable and cannot be directly reactivated; replacement creates a new linked record.
- SuperAdmin and Admin may deactivate/reactivate trucks and employees with a reason. An unreleased active assignment blocks deactivation. Historical references remain readable; inactive resources disappear from new selectors.
- Only SuperAdmin may deactivate/reactivate platform users. Deactivation requires reason, blocks new access, and invalidates/rejects existing sessions without deleting history or role records.
- No user-facing Delete action or hard-delete endpoint exists for trips, trucks, employees, or users.

### 7.7 Trucks, employees, maintenance, and reference data

- Truck management includes approved master data, active state, canonical status, status history, and maintenance type/status/schedule/completion/cost/general notes.
- The MVP excludes truck branch, maintenance odometer, and vendor/mechanic fields.
- Employee management includes user link where applicable, employee identity, canonical employee role, contact, employment/active state, and driver extension data.
- The MVP excludes employee branch ownership.
- Reference-data selectors use authorized backend lookups. Inactive historical values remain legible but are not selectable.

### 7.8 Events, fuel, dashboard, and reporting

- Trip events and fuel logs are supported within Trip Details and do not require separate management modules.
- Dashboard totals, fleet summaries, exception counts, and fuel totals come from approved aggregate endpoints, not partial paginated client-side joins.
- Manual refresh is available. The visible Trip Operations queue and operational dashboards poll every 60 seconds, pause while the browser tab is hidden, and refresh immediately when visible again.
- Polling and mutation revalidation do not overwrite local edits.
- Capacity/weight may be displayed when present but creates no validation, warning, override, or safety claim.
- No executable CSV/PDF export or report builder is included. The reserved `EXPORT` vocabulary grants no MVP capability.

### 7.9 AI boundary

Production UI and backend expose no AI analysis action, endpoint, permission, recommendation, or domain mutation. Browser code must not construct a Gemini/provider client or inject provider keys. Retained experimental code, if any, is excluded from production imports, builds, tests, and deployment artifacts and receives no real credentials.

## 8. Role and permission matrix

Each user has exactly one current effective platform role. Historical role records may be retained, but conflicting current-role records deny authorization until reconciled. Frontend presentation, DRF permissions, and Supabase RLS intent evaluate the same canonical permissions; frontend checks are never the security boundary.

| Area/action | SuperAdmin | Admin | Dispatcher | Encoder | Viewer |
|---|---|---|---|---|---|
| Dashboard | Full | Full | Operational | Entry-focused | Read-only |
| Trip creation | Yes | Yes | Yes | Yes | Hidden |
| Trip assignment | Yes | Yes | Yes | Hidden | Hidden |
| Trip updates | Yes | Yes | Yes | Own pending only | Hidden |
| Trip cancellation | Yes | Yes | Yes | Hidden | Hidden |
| Exceptional transitions | Yes | Yes | Yes | Hidden | Hidden |
| Vehicle management | Full | Full | Create/update/status | Read-only | Read-only |
| Vehicle deactivate/reactivate | Yes | Yes | Hidden | Hidden | Hidden |
| Employee management | Full | Full | Read-only | Read-only | Read-only |
| Employee deactivate/reactivate | Yes | Yes | Hidden | Hidden | Hidden |
| Reference data | Manage | Manage | Read for operations | Read for entry | Read-only where permitted |
| Trip events and fuel | Full | Full | Create/read | Create/read | Read-only |
| User/role/invitation management | Full | Hidden | Hidden | Hidden | Hidden |
| Application settings | Full/read/update | Read-only | Hidden | Hidden | Hidden |
| Audit logs | Full/read | Read-only | Hidden | Hidden | Hidden |

`Own pending only` means an Encoder may update a record it created only while the record is `DRAFT`. Any additional correction state requires a later approved decision. The backend determines ownership and state. Encoder cannot assign resources, cancel, or perform exceptional transitions.

Branch-scoped permissions and user-specific permission overrides are outside the MVP.

## 9. Data and schema requirements

The 30-sheet workbook `.docs/cloudy_schema.xlsx` is the structural baseline. It is not migration-ready unchanged. The implementation-ready reconciliation is `docs/phase-0-schema-change-plan.md`.

Mandatory data rules include:

- Exactly one current effective platform role per user.
- Canonical, versioned lookup and permission seeds including P0-AMEND-001 `DRAFT`.
- Timezone-aware planned trip interval and constraints.
- `trip_assignments` supporting exactly one employee or truck resource per assignment, authoritative history, actor/reason metadata, and overlap enforcement.
- Current trip assignment columns converted to read-only compatibility projections and removed after backfill/consumer migration.
- Domain-specific cancel/deactivate/reactivate representation instead of generic `is_deleted` behavior.
- Trip status, assignment, vehicle status, role, lifecycle, and audit histories with actor, reason, time, old/new values, and request correlation where required.
- Integer record versions for optimistic concurrency and transactional/idempotent command support.
- No client-authored protected audit metadata.
- No silent loss of removed mock/legacy values; every non-empty unmappable value enters a migration exception register.

Django models and reviewed migrations become authoritative after initial schema reconciliation. No database migration is authorized by this Phase 0 PRD.

## 10. API and service contract

Production data flows only through typed frontend service interfaces and a checked-in OpenAPI-described Django REST Framework API under `/api/v1/`. A development mock adapter may implement the interface only when labeled non-production and excluded from production guarantees. Components must not directly inspect or mutate mock arrays.

### 10.1 Standard behavior

- Operational lists use `page` and `limit`; default 25, maximum 100.
- List responses return `count`, `page`, `limit`, `next`, `previous`, and `results`.
- Supported search/filter/order fields are documented per endpoint. `ordering` uses `-` for descending. Unsupported parameters return structured `400` rather than being ignored.
- Errors contain `status`, stable `code`, safe `message`, structured `errors`, and `request_id`.
- `400`, `401`, `403`, `404`, `409`, `429`, timeout, network, and `5xx` cases map to truthful, recoverable or terminal UI states.
- Mutable records expose a server-managed integer `version`. Stale mutation returns `409 STALE_RECORD` and does not overwrite newer data.
- Trip creation; assignment/reassignment/release; transitions/cancellation/transfer; truck status; deactivate/reactivate; and user invitation accept `Idempotency-Key`.
- Reusing the same key for the same actor/command/payload returns the original result without duplicate history. Reusing it for a different payload returns an idempotency conflict.
- Consequential operations use transactions and appropriate locks/constraints. Failed commands create no partial success record.

### 10.2 Minimum resource/command coverage

The OpenAPI contract must cover authentication integration state; lookups; users/roles/permissions/settings/audit; trips/stops; assignment availability and commands; transition/cancel/transfer commands; trucks/status/history/maintenance; employees/drivers; clients/consignees/locations; events; fuel; and approved aggregates.

No production UI action may be exposed without an approved endpoint, permission mapping, request/response/error schema, and required tests.

## 11. Architecture and migration approach

### 11.1 Approved stack

- Frontend: React + TypeScript, incrementally routed with React Router and typed services.
- API: Django + Django REST Framework with checked-in OpenAPI contract.
- Data/Auth: Supabase PostgreSQL and Supabase Auth.
- Local standard: Docker Compose.
- Deployment: Render frontend/static service and Django web service; separate staging/production Supabase projects and Render services.
- Observability: structured/redacted logs, health endpoint, request IDs, provider logs, and Sentry for frontend/backend.

### 11.2 Incremental frontend boundary

Existing screens may be route-wrapped before decomposition. The migration must not simultaneously replace routing, state management, folder structure, service contracts, and feature components outside the active phase.

Temporary adapters record purpose, owner, consumers, compatibility behavior, removal criterion, and removal phase. Remove `currentView` navigation after Phase 1B route verification; direct mock-array reads before production-backed Phase 2 workflows; writable legacy assignment fields during Phase 2D; and remaining migration adapters by Phase 5B unless an accepted limitation says otherwise.

## 12. Deployment and operations

Local, staging, and production use environment-specific configuration without source edits. Staging and production have separate Supabase projects/databases/Auth users/secrets and Render services. Production credentials/data are never reused in staging. HTTPS, CORS, and Auth redirect allowlists use exact approved origins.

Render free tier is limited to demonstrations or non-critical staging. Live production requires paid services plus recorded account, billing, secret, migration, monitoring, backup/restore, release approval, and rollback owners.

Pull request/promotion checks include applicable frontend typecheck/lint/format/tests/accessibility/build; backend format/lint/tests; migration consistency; OpenAPI validation; Docker build; and secret scan. `develop` promotes to staging only after checks pass; `main` promotes to production only after review and explicit release approval.

Production requires at least seven daily Supabase-supported restore points, backup verification before high-risk migration, a successful staging restore exercise, backward-compatible migrations or tested forward-fix/recovery, health/smoke evidence, and traceable rollback/release records.

## 13. Quality and evidence requirements

### 13.1 Tooling baseline

Frontend: Vitest, React Testing Library, MSW, Playwright, axe-core, ESLint, Prettier, and separate `tsc --noEmit` typecheck. Backend: Django/pytest-django, DRF client tests, PostgreSQL-backed transaction/constraint/RLS-intent tests, coverage.py, ruff, black, migration consistency, and OpenAPI validation.

### 13.2 Evidence policy

- Consequential permission, assignment, transition, lifecycle, concurrency, idempotency, rollback, and audit rules require explicit allowed, denied, error/conflict, and rollback tests.
- New/materially changed business-logic modules target at least 80% branch coverage.
- Overall frontend/backend line coverage targets at least 70% by Phase 5B.
- Missing targets require an accepted limitation naming code, risk, owner, and resolution phase.
- Automated browser baseline includes stable Chromium desktop, tablet viewport, and narrow viewport.
- Before Phase 5A/5B approval, manually review Chrome/Edge, Firefox, Safari when available, keyboard-only critical workflows, light/dark mode, reduced motion, and screen-reader spot checks.
- No unaccepted serious/critical axe violation is allowed in active scope. An accessibility defect that blocks a core workflow blocks phase approval.
- Failed, skipped, flaky, unavailable, blocked, or not-run checks are reported accurately and never counted as PASS.

## 14. MVP acceptance outcomes

The MVP cannot be approved until evidence demonstrates:

1. Secure provider-owned authentication with no prohibited credential/session/secret persistence.
2. Consistent single-role UI/API/RLS-intent authorization for every protected action.
3. Stable lookup codes, token mapping, and no invented fallback values.
4. State-valid trip authoring, explicit Unassigned behavior, and controlled transitions.
5. Atomic, concurrency-safe assignment and lifecycle commands with complete history and rollback.
6. Searchable/paginated/filterable operational lists and contextual details with preserved URL/form context.
7. Truthful dashboard aggregates and UI language without deferred capability claims.
8. Qualified schema migration/backfill with no silent data loss.
9. Required automated/manual functional, responsive, accessibility, security, deployment, restore, and rollback evidence.
10. No functional Inventory/Billing, export, capacity-safety, real-time, or AI behavior outside approved scope.

## 15. Phase gate

This PRD and the reconciled Phase 0 package were approved on 2026-07-22 by the exact user instruction `APPROVED: Phase 0`. Phase 0 is `COMPLETE`. Phase 1A is eligible but has not started; `Next Approved Phase - May start` is `Yes`. This approval authorizes no phase beyond Phase 1A and authorizes no schema migration or out-of-scope implementation.

## 16. Change record

| Date | Owner | Change | Rationale | Evidence |
|---|---|---|---|---|
| 2026-07-22 | Jethro | Selected `PRD.md` as the authoritative final PRD for baseline `9bdc135`. | DEC-001 | `docs/phase-0-decision-log.md` |
| 2026-07-22 | Jethro | Incorporated DEC-002 through DEC-016 into product, permissions, data, API, operations, testing, deployment, and AI requirements. | Stakeholder decision interview | `docs/phase-0-decision-log.md` |
| 2026-07-22 | Phase 0 conformance review | Added P0-AMEND-001 through P0-AMEND-004, including explicit `DRAFT` catalog reconciliation. | Remove contradictions and make decision precedence auditable | `docs/phase-0-conflict-register.md` |
| 2026-07-22 | Phase 0 conformance review | Qualified the original workbook through an implementation-ready schema plan without changing the workbook or creating migrations. | DEC-009 and phase scope | `docs/phase-0-schema-change-plan.md` |
| 2026-07-22 | Jethro | Approved the reconciled PRD, Decision Log, amendments, and Phase 0 completion. | Exact phase-gate approval | User instruction `APPROVED: Phase 0` |
