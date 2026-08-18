# Cloudy Phase 0 Decision Log

> Status: APPROVED RESOLVED DECISION LOG - PHASE 0 COMPLETE
>
> All sixteen stakeholder selections have been recorded with owner, date, final requirement text, consequences, acceptance criteria, and conversation approval evidence. Final source conformance is complete, and the user approved Phase 0 with the exact instruction `APPROVED: Phase 0` on 2026-07-22.

## Final conformance note

- Reconciliation date: 2026-07-22
- Authoritative PRD: root `PRD.md`
- Schema reconciliation: `docs/phase-0-schema-change-plan.md`
- Internal amendment: DEC-010 explicitly requires savable Draft trips while DEC-008 omitted `DRAFT` from its catalog. Root `PRD.md` P0-AMEND-001 therefore adds immutable code `DRAFT`, label `Draft`, order `5`, lifecycle `Authoring`. This makes the later selected decision explicit without changing production code.
- Source-conformance result: PASS
- Phase 0 approval: APPROVED on 2026-07-22 by exact user instruction `APPROVED: Phase 0`

## Decision instructions

For every decision:

1. Select exactly one option or write a complete alternative.
2. Record the decision owner and date.
3. Edit the proposed requirement text if needed.
4. Confirm the positive, blocked/negative, error, permission, history, compatibility, implementation-phase, and evidence criteria.
5. Add approval evidence, such as an approved PRD section or signed review record.

## Decision summary

| Decision | Topic                                          | Recommended option                                              | Status   | Decision owner | Decision date | Required before              |
| -------- | ---------------------------------------------- | --------------------------------------------------------------- | -------- | -------------- | ------------- | ---------------------------- |
| DEC-001  | Authoritative final PRD and approval process   | Generate, reconcile, and approve                                | SELECTED | Jethro         | 2026-07-22    | Phase 0 approval             |
| DEC-002  | Credential and session lifecycle               | Supabase-owned invite/reset/auth flow                           | SELECTED | Jethro         | 2026-07-22    | Phase 1B/3D                  |
| DEC-003  | Action-by-module permission matrix             | Fixed MVP matrix with backend/RLS enforcement                   | SELECTED | Jethro         | 2026-07-22    | Phase 1C                     |
| DEC-004  | Assignment overlap interval                    | Explicit planned start/end plus atomic backend validation       | SELECTED | Jethro         | 2026-07-22    | Phase 2C/2D                  |
| DEC-005  | Assignment source of truth                     | `trip_assignments` authoritative                                | SELECTED | Jethro         | 2026-07-22    | Phase 2D                     |
| DEC-006  | Entity lifecycle semantics                     | Cancel trips; deactivate/reactivate trucks, employees, users    | SELECTED | Jethro         | 2026-07-22    | Phase 2E/3A/3B/3D            |
| DEC-007  | Trip transition graph and cancellation effects | Fixed transition graph with transactional side effects          | SELECTED | Jethro         | 2026-07-22    | Phase 2E                     |
| DEC-008  | Lookup and permission seeds                    | Versioned backend-owned seed catalog                            | SELECTED | Jethro         | 2026-07-22    | Phase 1A                     |
| DEC-009  | Schema/UI field mismatches                     | Qualified workbook-baseline alignment                           | SELECTED | Jethro         | 2026-07-22    | Phase 2C/3A/3B               |
| DEC-010  | Unassigned trips and helper cardinality        | Explicit Unassigned workflow; helpers as repeatable assignments | SELECTED | Jethro         | 2026-07-22    | Phase 2C/2D                  |
| DEC-011  | API/RLS/error/pagination/refresh contract      | Approved OpenAPI-style contract                                 | SELECTED | Jethro         | 2026-07-22    | Phase 1B and each data phase |
| DEC-012  | Operational UI policies                        | Conservative MVP operational policies                           | SELECTED | Jethro         | 2026-07-22    | Affected Phase 2/4 work      |
| DEC-013  | Deployment and production operations           | Render + Supabase with explicit operating controls              | SELECTED | Jethro         | 2026-07-22    | Staging/production           |
| DEC-014  | Frontend routing and migration boundary        | Incremental route/service extraction                            | SELECTED | Jethro         | 2026-07-22    | Phase 1B/2A                  |
| DEC-015  | Test and accessibility evidence                | Risk-based automated stack plus manual review                   | SELECTED | Jethro         | 2026-07-22    | Phase 1A approval onward     |
| DEC-016  | AI analysis and secret boundary                | Exclude and disable AI analysis for MVP                         | SELECTED | Jethro         | 2026-07-22    | Production AI use            |

## Resolved decision records and acceptance criteria

### DEC-001 - Authoritative final PRD and approval process

- Selected option: **Option A - Approve `PRD.md` as the authoritative final PRD, subject to amendments produced by the Phase 0 decision interview.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: APPROVED; final Phase 0 approval was recorded on 2026-07-22 after all blocking decisions were resolved and reconciled.
- Final requirement text: `PRD.md` is the authoritative final Cloudy MVP PRD for the current repository baseline at commit `9bdc135`. The approved Resolved Decision Log takes precedence where a later recorded decision amends, narrows, or clarifies `PRD.md`. Every such amendment must identify the affected PRD section, rationale, owner, date, implementation phase, and required evidence.
- Affected entities/pages/roles/endpoints: Entire system
- Positive acceptance criterion: The authoritative PRD path is recorded as `PRD.md`; its decision owner, decision date, repository baseline, and relationship to the Resolved Decision Log are documented; all Critical gaps are resolved or explicitly rejected with rationale before Phase 0 approval.
- Negative or blocked criterion: A generation prompt, example, mock-service comment, unchecked option, or unrecorded conversation assumption cannot supersede `PRD.md` or an approved Decision Log entry. Phase 0 and Phase 1A remain blocked while required Critical decisions are unresolved.
- Error behavior: Any conflict between `PRD.md` and a later selected decision must be recorded as an explicit amendment. An unrecorded conflict keeps the affected requirement and phase BLOCKED.
- Permission behavior: Jethro is the current decision owner. Only the named decision owner or a subsequently recorded authorized approver may approve or supersede this contract.
- Audit/history consequence: Approval and later amendments retain owner, date, previous requirement, revised requirement, rationale, affected PRD sections, affected phases, and evidence.
- Migration/compatibility implication: `PRD.md` and the final Decision Log must identify current mock behavior that is temporarily retained, replaced through a compatibility adapter, or removed.
- Implementation phase: Phase 0
- Approval evidence: User selected Option A in the CloudyMVP project conversation on 2026-07-22.
- Evidence needed for Phase 0 completion: `PRD.md`, the fully resolved and approved Decision Log, the summarized decisions handoff, and an updated source-conformance/readiness record.

### DEC-002 - Credential and session lifecycle

- Selected option: **Option A - Memory-only Supabase session.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated to Phase 1B and Phase 3D.
- Final requirement text: Supabase Auth owns credentials and the provider-managed invitation, activation, login, refresh, password-reset, and logout lifecycle. Cloudy stores no raw password and never renders, edits, transmits in domain payloads, logs, or persists a password value. Supabase access and refresh session material must remain in application memory only; browser persistence must be disabled. Silent token refresh may operate only while the current application instance remains open. Reloading the browser page, closing the application, opening a new browser session, or losing the in-memory session requires the user to authenticate again. Logout clears all in-memory authentication state and the Supabase session.
- Affected entities/pages/roles/endpoints: Users, Login, Settings/Users, application shell, all roles, Supabase Auth integration, and protected API requests.
- Positive acceptance criterion: A SuperAdmin can invite a user without choosing or seeing a password; the invited user completes the provider-owned activation flow; a valid in-memory session silently refreshes while the application remains open; protected Django requests use the approved bearer token; logout immediately removes access.
- Negative or blocked criterion: No domain user model, API payload, table, UI cell, log, browser storage, production fixture, source file, or browser bundle contains a raw password, refresh token persisted across reload, Supabase service-role key, JWT secret, or other server-only credential. A page reload or new browser session must not restore the previous authenticated session.
- Error behavior: Expired, revoked, inactive-user, invalid-invite, failed-refresh, and provider-unavailable states show safe non-sensitive messages. Failed refresh clears authentication state and redirects to Login according to the application-shell flow. Recoverable provider errors preserve only non-sensitive UI state.
- Permission behavior: User invitations, deactivation, and role assignment require the approved administrative actions; frontend presentation checks do not replace Django authorization or RLS enforcement.
- Audit/history consequence: Invite, activation, deactivation, role change, reset request, login, failed refresh, and logout security events are recorded without tokens, passwords, or provider secrets.
- Migration/compatibility implication: Remove `SystemUser.password`, plaintext mock seeds, browser password comparison, default-password behavior, password columns/forms, and password-bearing service responses. Any development-only auth adapter must be isolated behind the auth service interface, clearly labeled non-production, excluded from production builds, and must not expose password fields on domain user records.
- Implementation phase: Phase 1B for session/auth shell and Phase 3D for user invitation and administration.
- Approval evidence: User selected Option A in the CloudyMVP project conversation on 2026-07-22.
- Evidence needed: Auth/session contract, Supabase client persistence configuration test, reload/new-session test, failed-refresh test, logout test, browser storage inspection, browser bundle/secret scan, protected-request integration test, and administrative role tests.

### DEC-003 - Action-by-module permission matrix

- Selected option: **Option A - Fixed PRD permission matrix with one active role per user.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the relevant approved phase.
- Final requirement text: The official Cloudy MVP platform roles are `SuperAdmin`, `Admin`, `Dispatcher`, `Encoder`, and `Viewer`. Each platform user has exactly one current active role. The action-by-module matrix in `PRD.md` is authoritative unless a later selected Decision Log entry explicitly amends an action. The frontend presents the effective permission, Django/DRF enforces it, and Supabase RLS supplies defense-in-depth table access consistent with the same policy intent.
- Affected entities/pages/roles/endpoints: All modules, navigation, route guards, protected controls, all official roles, role-assignment records, and every protected API endpoint.
- Positive acceptance criterion: For each role/action pair in the PRD matrix, permitted actions succeed through both the UI and direct API access, while navigation, controls, API authorization, and RLS intent produce a consistent result. Exactly one current role is resolved for each user.
- Negative or blocked criterion: A role that can never perform an action does not see the action. A record-state blocker may leave an otherwise authorized action visible but disabled only when the UI explains the blocker. Unauthorized direct routes and requests reveal no protected records or controls. A user with conflicting legacy active-role records is denied effective authorization until the conflict is reconciled rather than receiving the union of permissions.
- Error behavior: Backend authorization denial returns the approved non-sensitive error shape, preserves safe page or form state, and does not disclose protected resource details. Failure to resolve a single effective role is treated as an authorization/configuration error and is auditable.
- Permission behavior: SuperAdmin alone manages invitations, users, roles, role assignments, and application-setting updates. Admin may read application settings and audit logs but cannot update settings or manage users/roles. Dispatcher, Encoder, and Viewer cannot access Settings. Branch-scoped permissions are deferred because multi-hub and multi-tenant operations are outside MVP scope.
- Audit/history consequence: Invitation, role assignment, role replacement, deactivation, and permission-relevant configuration changes record actor, old role, new role, affected user, effective timestamp, and correlation metadata. Historical role records may be retained, but only one role is current and effective.
- Migration/compatibility implication: Replace `ALLOWED_VIEWS_BY_ROLE`, scattered component role checks, and the sparse mock permission catalog with a shared typed effective-permission interface. Reconcile legacy users with multiple active roles and enforce one-current-role behavior through the approved database constraint and backend transaction. Compatibility adapters must not calculate a union of roles.
- Implementation phase: Phase 1C, completed and tested across each subsequent feature phase.
- Evidence needed: Approved PRD permission matrix; role seed/catalog mapping; one-current-role migration evidence; UI route/control tests; direct API allowed/denied tests; RLS tests; Admin versus SuperAdmin Settings tests; and audit-log verification.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-004 - Assignment overlap interval

- Selected option: **Option A - Explicit planned start/end interval with atomic backend enforcement.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated to Phase 2C and Phase 2D.
- Final requirement text: A driver or truck may be assigned only when the trip has timezone-aware `planned_start_at` and `planned_end_at` values. Cloudy interprets operational time in `Asia/Manila`; persisted timestamps must preserve an unambiguous instant and timezone-aware API representation. `planned_end_at` must be later than `planned_start_at`. Overlap uses half-open intervals, `[planned_start_at, planned_end_at)`, so adjacent assignments are valid when the earlier interval ends exactly when the later interval begins. An unassigned draft may omit the planned interval, but no driver or truck assignment may be created without both boundaries. The backend must atomically reject an assignment when the same resource has an unreleased overlapping assignment on a trip whose status is not `Completed` or `Cancelled`. No overlap override is permitted in the MVP.
- Affected entities/pages/roles/endpoints: Trip advice planned timing, driver/truck assignments, Create/Edit Trip, availability selectors and panels, Dispatcher/Admin assignment actions, and create/update/assignment endpoints.
- Positive acceptance criterion: A permitted user can assign a driver or truck to a valid interval when no overlapping unreleased assignment exists. Back-to-back intervals where one ends exactly when the next begins are accepted. The saved trip and assignment expose the approved timestamps and updated availability consistently.
- Negative or blocked criterion: Missing boundaries, an end at or before the start, an overlapping interval, or an attempt to bypass validation through a direct API request is blocked. No role, including SuperAdmin, Admin, or Dispatcher, receives an overlap override in the MVP. Frontend availability filtering cannot be treated as the security or concurrency boundary.
- Error behavior: A confirmed or concurrent overlap returns HTTP `409` using code `ASSIGNMENT_CONFLICT`. The response identifies the resource type and identifier, conflicting trip identifier/code, and conflicting interval only when the caller may read that information; otherwise it returns a non-sensitive conflict description. The UI preserves entered data, associates the error with the affected assignment field, and refreshes only the affected resource availability. Invalid/missing interval values use the approved validation-error shape rather than a conflict response.
- Permission behavior: Only roles granted the Trip Assignments Create/Update action by DEC-003 may attempt assignment mutation. Every caller, including privileged roles, is subject to the same backend overlap validation and transaction rules.
- Audit/history consequence: Successful assignment or reassignment records the actor, assigned time, planned interval, resource, trip, and required assignment history. Rejected conflicts do not create or release assignments and do not create partial vehicle-status, trip-projection, or success audit records. Security/diagnostic logging may record the rejected request correlation without claiming a completed domain mutation.
- Migration/compatibility implication: Add or approve canonical `planned_start_at` and `planned_end_at` fields and map any legacy pickup-date/window values explicitly. Replace the current same-date browser validator with an advisory availability check backed by the authoritative backend rule. Legacy active assignments without usable intervals must be reconciled before they can participate in production availability guarantees; no guessed end time may be silently introduced.
- Implementation phase: Phase 2C adds and validates planned timing in Create/Edit Trip; Phase 2D implements transactional availability and assignment enforcement.
- Evidence needed: Schema/API contract; timezone serialization tests; missing/invalid boundary tests; overlapping, containing, contained, and adjacent interval tests; tests across midnight; Completed/Cancelled exclusion tests; unreleased-assignment tests; direct-API permission tests; concurrent assignment race test; transaction rollback verification; and UI form-state preservation test.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-005 - Assignment source of truth

- Selected option: **Option A - `trip_assignments` is authoritative.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: Every current or historical driver, helper, and truck assignment must be represented by a `trip_assignments` record. Current assignment values exposed on trip responses are derived, read-only projections of unreleased assignment records and must not be independently writable.
- Affected entities/pages/roles/endpoints: `trip_advise`, `trip_assignments`, trucks, driver/helper employees, Trip Create/Edit, Trip Details, availability surfaces, assignment/reassignment/release endpoints, cancellation/completion workflows, and audit/history responses.
- Assignment record contract: Each assignment records the trip, assigned resource, assignment role, planned interval, `assigned_at`, `assigned_by`, and—when released—`released_at`, `released_by`, and release reason.
- Positive acceptance criterion: Assigning a free resource creates one unreleased assignment and updates the derived trip projection atomically. Reassigning releases the previous record and creates the replacement in the same transaction. Releasing closes the current record and removes it from the current projection.
- Negative or blocked criterion: Direct assignment fields cannot be mutated through UI, serializer, API, admin, or compatibility paths in a way that bypasses `trip_assignments`. Duplicate unreleased assignments and assignments violating DEC-004 are blocked.
- Error behavior: Validation, permission, concurrency, or persistence failures roll back the complete operation. Trip projections, assignments, availability, vehicle state, and audit/history remain unchanged, and recoverable UI input is preserved.
- Permission behavior: Create, reassign, and release operations follow DEC-003. Direct API callers receive the same authorization and validation.
- Audit/history consequence: History retains assignment role, resource, planned interval, assigned/released timestamps, actors, release reason, and related trip. Failed attempts do not create records implying success.
- Availability consequence: Driver and truck availability is computed from authoritative unreleased assignments and DEC-004 interval rules.
- Lifecycle consequence: Cancellation, completion, and any approved release-producing transition must call the same authoritative release operation. DEC-007 defines the exact transition graph and side effects.
- Migration/compatibility implication: Backfill assignment records from existing direct trip fields, reconcile discrepancies, and expose those fields only as read-only compatibility projections. Remove them in a named migration phase after all consumers use the assignment service. No historical assignment may be discarded.
- Helper-cardinality implication: The model supports repeatable helper assignments; DEC-010 governs the final allowed count and state-specific requirements.
- Implementation phase: Phase 2D establishes the authoritative assignment service and migration; Phase 2E integrates transition-driven release.
- Evidence needed: Backfill reconciliation; schema/serializer contract; projection consistency; atomic assign/reassign/release and rollback tests; direct-field write-denial; DEC-004 overlap and race tests; role allow/deny tests; lifecycle-release integration; and audit/history verification.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-006 - Entity lifecycle semantics

- Selected option: **Option A - Domain-specific lifecycle with controlled reactivation.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: Trips are cancelled rather than deleted. Trucks, employees, and users are deactivated/reactivated rather than deleted. Historical records remain readable, and inactive resources are unavailable for new assignments or selections.
- Affected entities/pages/roles/endpoints: Trips, trucks, employees, platform users, lifecycle dialogs, selectors, historical detail views, authentication/session flows, and cancel/deactivate/reactivate endpoints.
- Trip lifecycle: Cancellation requires a reason. `Cancelled` is terminal in the MVP and cannot be directly reactivated. A replacement operation creates a new trip and preserves appropriate lineage or reference to the cancelled trip. DEC-007 defines cancellation transaction effects.
- Truck lifecycle: SuperAdmin and Admin may deactivate/reactivate trucks. Each action requires a reason. A truck with any unreleased active assignment is blocked from deactivation. Inactive trucks remain visible in historical records and status logs but are excluded from new assignments. Reactivation validates required master data and operational eligibility, and returns the truck to the approved default active status subject to DEC-008.
- Employee lifecycle: SuperAdmin and Admin may deactivate/reactivate employees. Each action requires a reason. An employee with any unreleased active assignment is blocked from deactivation. Inactive employees remain visible on historical records but are excluded from new assignment and operational selectors. Reactivation validates role-specific requirements, including approved driver-license requirements.
- User lifecycle: Only SuperAdmin may deactivate/reactivate platform users. Deactivation requires a reason and immediately prevents new authenticated access. Existing sessions must be rejected or invalidated through the DEC-002 auth flow. Historical, audit, and linked employee records remain intact. Reactivation restores account eligibility without changing role assignment or credentials.
- Positive acceptance criterion: A permitted lifecycle action confirms consequences, requires the approved reason, preserves the record, updates the lifecycle state, removes the resource from new-selection paths where applicable, and leaves historical labels readable.
- Negative or blocked criterion: No user-facing `Delete` action or hard-delete endpoint exists for trips, trucks, employees, or users. Active unreleased assignments block unsafe truck/employee deactivation. Cancelled trips cannot be directly reactivated.
- Error behavior: Blocked, validation-failed, permission-denied, session-invalidation-failed, or persistence-failed actions preserve the prior state and create no partial lifecycle, assignment, status, or audit changes.
- Permission behavior: Trip cancellation follows DEC-003 and DEC-007. Truck and employee deactivate/reactivate actions are limited to SuperAdmin and Admin. User deactivate/reactivate actions are limited to SuperAdmin.
- Audit/history consequence: Every lifecycle action records actor, timestamp, reason, old state, new state, and affected dependencies. Failed attempts must not create records implying success.
- Historical visibility rule: Inactive resources remain readable in historical trips, assignments, logs, and audits using their preserved labels. New-selection controls exclude inactive resources; existing-record displays may show them as inactive/disabled historical values.
- Migration/compatibility implication: Remove or rename user-facing delete controls, `deleteUser`, trip delete paths, and ambiguous `onDelete` handlers after compatibility adapters are introduced. Preserve historical references during migration.
- Implementation phase: Trip cancellation in Phase 2E; truck lifecycle in Phase 3A; employee lifecycle in Phase 3B; user lifecycle and session invalidation in Phase 3D.
- Evidence needed: UI/API permission tests; active-dependency blocking; session invalidation; historical-reference rendering; selector exclusion; reactivation validation; no-hard-delete contract checks; audit/history verification; and transactional rollback tests.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-007 - Trip transition graph and cancellation effects

- Selected option: **Option A - Fixed transition graph with controlled exceptional states.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: Trips follow one fixed authoritative transition graph. Completion, cancellation, and transfer are transactional commands with explicit assignment, vehicle-state, lineage, history, authorization, error, concurrency, and idempotency effects.
- Affected entities/pages/roles/endpoints: Trip status menu, Trip Details, assignment and vehicle availability, transfer workflow, trip-status history, audit history, transition endpoint, cancellation endpoint, transfer endpoint, and any successor-trip creation endpoint.

#### Approved transition graph

```text
Scheduled
├── In Progress
├── Cancelled
└── Transferred

In Progress
├── Completed
├── Cancelled
├── Rescue
├── Backload
└── Transferred

Rescue
├── Completed
├── Cancelled
└── Transferred

Backload
├── Completed
├── Cancelled
└── Transferred
```

Terminal statuses:

```text
Completed
Cancelled
Transferred
```

- Transition preconditions: `Scheduled -> In Progress` requires all approved dispatch-ready fields and assignments under DEC-010. `Cancelled`, `Rescue`, `Backload`, and `Transferred` require a non-empty reason. `Transferred` requires a successor trip whose `transfer_from_id` references the source trip.
- Permission behavior: Standard transitions follow DEC-003. Exceptional transitions are limited to SuperAdmin, Admin, and Dispatcher. Encoder and Viewer cannot perform exceptional transitions. Direct API requests receive the same authorization.
- Completion transaction: Release all current assignments through DEC-005. Return the affected truck to `Available` only when it is operationally eligible and has no other active assignment. Persist trip-status, assignment-release, vehicle-status, and audit history atomically.
- Cancellation transaction: Require confirmation and reason. Release all current assignments. Return affected trucks to `Available` when operationally eligible and not otherwise assigned. Persist status, assignment, vehicle-status, and audit history atomically. The trip remains readable as `Cancelled`.
- Transfer transaction: Require or atomically create/identify a successor trip with source lineage. Set the source trip to `Transferred`, release source-trip assignments, and preserve the source/successor relationship. Do not automatically copy active assignments to the successor; successor assignment follows DEC-004 and DEC-005.
- Rescue/Backload behavior: These statuses remain active. They do not automatically release assignments. Any resource change uses the authoritative DEC-005 reassignment operation. The transition records reason and actor.
- Positive acceptance criterion: Every permitted edge succeeds only when its preconditions and permission requirements are met, produces exactly the approved visible state, and persists all defined history and side effects.
- Negative or blocked criterion: Unlisted edges, mutation of terminal trips, missing dispatch-ready data, missing reason, missing transfer lineage, unauthorized exceptional transitions, and assignment/vehicle conflicts are blocked without partial side effects.
- Error behavior: Invalid transitions return HTTP `409` with code `INVALID_TRIP_TRANSITION`. Missing reason or lineage returns the approved structured validation error. A stale or concurrent transition returns the approved conflict response, preserves UI context, and refreshes only the affected trip and resources.
- Transaction and rollback rule: Any failure in status, assignment release, vehicle-state change, successor lineage, or audit/history persistence rolls back the entire command.
- Idempotency rule: Repeating an already-successful command with the same idempotency identity must not duplicate status, assignment, vehicle, lineage, or audit records. Repeating a command after the trip has advanced returns the current state or approved conflict response without reapplying effects.
- Audit/history consequence: Persist old/new status, actor, reason, timestamp, released resources, vehicle-status changes, source/successor lineage, and request correlation where applicable.
- Migration/compatibility implication: Replace unrestricted or local status dropdown mutation with server-provided permitted actions and controlled commands. Map legacy status values to the DEC-008 canonical seed catalog without discarding historical records.
- Implementation phase: Phase 2E, with transfer form dependencies prepared in Phase 2C and authoritative assignment integration from Phase 2D.
- Evidence needed: Complete transition-matrix unit tests; role allow/deny tests; terminal-state tests; dispatch-readiness validation; completion/cancellation/transfer transaction tests; rescue/backload assignment-retention tests; idempotency tests; concurrent/stale-transition tests; rollback tests; lineage verification; and trip, assignment, vehicle-status, and audit-history assertions.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-008 - Lookup and permission seeds

- Selected option: **Option A - Versioned, backend-owned immutable-code catalog.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: A versioned backend-owned catalog defines canonical platform roles, permissions, modules, trip statuses, truck statuses, load types, and employee roles. Machine codes use uppercase `SNAKE_CASE`, are immutable after release, and are the stable keys used by persistence, APIs, permission checks, UI status tokens, filters, and tests.
- Affected entities/pages/roles/endpoints: All lookup-backed entities, status badges, forms, filters, role/permission evaluation, Hub module cards, Settings read surfaces, lookup endpoints, seed migrations/commands, and legacy-data migration.

#### Canonical catalog

**Platform roles**

| Code         | Label      | Order |
| ------------ | ---------- | ----: |
| `SUPERADMIN` | SuperAdmin |    10 |
| `ADMIN`      | Admin      |    20 |
| `DISPATCHER` | Dispatcher |    30 |
| `ENCODER`    | Encoder    |    40 |
| `VIEWER`     | Viewer     |    50 |

**Trip statuses**

| Code          | Label       | Order | Lifecycle        |
| ------------- | ----------- | ----: | ---------------- |
| `SCHEDULED`   | Scheduled   |    10 | Active           |
| `IN_PROGRESS` | In Progress |    20 | Active           |
| `RESCUE`      | Rescue      |    30 | Active exception |
| `BACKLOAD`    | Backload    |    40 | Active exception |
| `COMPLETED`   | Completed   |    50 | Terminal         |
| `CANCELLED`   | Cancelled   |    60 | Terminal         |
| `TRANSFERRED` | Transferred |    70 | Terminal         |

**Truck statuses**

| Code          | Label       | Order |
| ------------- | ----------- | ----: |
| `AVAILABLE`   | Available   |    10 |
| `IN_USE`      | In Use      |    20 |
| `MAINTENANCE` | Maintenance |    30 |
| `INACTIVE`    | Inactive    |    40 |

**Load types**

| Code      | Label   | Order |
| --------- | ------- | ----: |
| `DRY`     | Dry     |    10 |
| `CHILLED` | Chilled |    20 |
| `REF`     | Ref     |    30 |
| `COMBI`   | Combi   |    40 |
| `MIXED`   | Mixed   |    50 |

**Employee roles**

| Code         | Label      | Order |
| ------------ | ---------- | ----: |
| `DRIVER`     | Driver     |    10 |
| `HELPER`     | Helper     |    20 |
| `ENCODER`    | Encoder    |    30 |
| `DISPATCHER` | Dispatcher |    40 |
| `MANAGER`    | Manager    |    50 |

**Application modules**

| Code              | Label           | MVP state                   |
| ----------------- | --------------- | --------------------------- |
| `TRIP_SCHEDULING` | Trip Scheduling | Active                      |
| `INVENTORY`       | Inventory       | Coming Soon; non-launchable |
| `BILLING`         | Billing         | Coming Soon; non-launchable |

**Permission action vocabulary**

```text
READ
CREATE
UPDATE
CANCEL
DEACTIVATE
REACTIVATE
ASSIGN
STATUS_CHANGE
EXPORT
MANAGE
```

- Permission naming rule: Permissions use stable namespaced codes such as `TRIP_ADVICE.READ`, `TRIP_ADVICE.CREATE`, `TRIP_ADVICE.UPDATE`, `TRIP_ADVICE.CANCEL`, `TRIP_ASSIGNMENTS.ASSIGN`, `TRIP_EVENTS.CREATE`, `TRIP_FUEL_LOGS.CREATE`, `TRUCKS.STATUS_CHANGE`, `TRUCKS.DEACTIVATE`, `EMPLOYEES.DEACTIVATE`, `SETTINGS.UPDATE`, `USERS_ROLES.MANAGE`, and `AUDIT_LOGS.READ`.
- Permission ownership: DEC-003 determines which role receives each permission. The UI, API authorization layer, and RLS intent must evaluate the same canonical codes.
- Seed ownership: Django migrations or an idempotent, versioned backend seed command own the catalog. Core codes are not created, renamed, or deleted through the frontend.
- Mutability rule: Labels, display order, and active state may change only through reviewed migration/seed changes. Core codes remain immutable. No Settings UI for arbitrary lookup mutation is included in the MVP.
- Positive acceptance criterion: The backend returns the approved catalog with stable codes, labels, order, and active state; the frontend renders forms, filters, badges, navigation, and permissions from those values.
- Negative or blocked criterion: Components must not invent, silently translate, or fall back to unapproved business codes. Disabled Inventory and Billing modules remain non-launchable regardless of role grants.
- Error behavior: Lookup failure blocks dependent submission or control activation and shows the approved loading/error state. The application must not submit guessed or stale values.
- Historical-value behavior: Inactive values remain readable on historical records and may be displayed as inactive/disabled labels, but are excluded from new selection.
- Visual-system implication: Status colors, icons, and design tokens map to immutable codes rather than mutable labels.
- Audit/history consequence: Catalog changes record version, actor or migration identity, old/new label/order/active state, and deployment/migration reference.
- Migration/compatibility implication: Create an explicit mapping from current mock IDs, labels, TypeScript unions, and permission constants to canonical codes. Preserve historical meaning during backfill and remove hardcoded frontend catalogs in a named phase.
- Implementation phase: The approved catalog and token mapping are required for Phase 1A. Lookup APIs and persistence integrate in Phase 1B and subsequent data phases.
- Evidence needed: Approved seed file/migration or idempotent seed command; seed idempotency and code-immutability tests; lookup endpoint contract tests; role-permission mapping tests; inactive historical-rendering and selector-exclusion tests; frontend status-token mapping tests; placeholder-module gating tests; and legacy mapping reconciliation.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-009 - Schema/UI field reconciliation

- Selected option: **Qualified Option B - Use the workbook as the baseline and remove unsupported UI fields, while amending the schema wherever an approved decision requires it.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: `cloudy_schema.xlsx` is the MVP schema baseline. Mock-UI fields absent from the workbook are removed or mapped unless a locked requirement or selected Decision Log item requires persistence. The workbook must be revised where necessary to conform to DEC-003 through DEC-008; schema-first does not mean preserving known conflicts.
- Affected entities/pages/roles/endpoints: Employee forms/lists, Truck forms/lists, Trip Stop editor/details, Maintenance detail surfaces, trip and assignment schema, user-role schema, lifecycle fields, lookup seeds, serializers, API responses, and migration adapters.

#### Approved field treatment

- Employees: Do not add `branch_id` in the MVP. Employee operational branch ownership/filtering is deferred.
- Trucks: Do not add `branch_id` in the MVP. Truck home-branch ownership/filtering is deferred.
- Trip stops: Do not persist a duplicate `city_area`. Display province, region, and address information from the referenced `locations` record.
- Trip-stop instructions: Do not add a separate `notes` field in the MVP. Use nullable `trip_stops.specific_address` as the canonical stop-specific address or facility-instruction field. UI copy must make this dual purpose explicit and must not imply a separate notes value is stored.
- Maintenance: Do not add `odometer` or `vendor_mechanic` in the MVP. Existing maintenance scope remains type, status, schedule/completion, cost, and general notes.
- Audit metadata: Retain server-generated `created_at` and `updated_at`. Actor attribution for consequential operations is supplied through the specific history/audit contracts required by selected decisions; clients cannot author protected audit values.

#### Mandatory critical schema amendments

The workbook baseline must be revised before affected implementation phases to support:

1. DEC-003: Enforce exactly one active platform role per user, rather than allowing unrestricted multiple role rows.
2. DEC-004: Add approved planned start/end interval data and constraints needed for half-open overlap validation.
3. DEC-005: Make `trip_assignments` authoritative for both employee and truck assignments; remove the current structural assumption that every truck assignment must also have a non-null employee. Add assigned/released actor fields, release metadata, and database constraints supporting one authoritative assignment model.
4. DEC-005: Treat `trip_advises.truck_id`, `driver_id`, `helper1_employee_id`, and `helper2_employee_id` only as temporary read-only compatibility projections, with backfill and removal milestones.
5. DEC-006: Replace generic `is_deleted` semantics for trips, trucks, employees, and users with the approved cancellation/deactivation/reactivation lifecycle representation and history.
6. DEC-007: Support terminal/active status transitions, cancellation/completion/transfer timestamps and lineage, transactional side effects, idempotency, and concurrency controls.
7. DEC-008: Add the approved canonical lookup and permission rows through versioned migrations or idempotent seed commands.
8. Selected audit rules: Ensure actor, reason, old/new state, request correlation where required, and atomic history writes are representable.

- Positive acceptance criterion: Every retained field round-trips through the approved API and schema. Removed fields are absent from editable UI or are clearly derived. The revised schema satisfies all previously selected decisions.
- Negative or blocked criterion: The coding assistant must not copy every workbook column unchanged when it conflicts with an approved decision, and must not add UI-only fields without a selected requirement.
- Error behavior: Unknown, removed, protected, or invalid fields return the approved structured validation behavior and preserve valid user input. Lookup or mapping failures do not silently coerce values.
- Permission behavior: Sensitive or lifecycle fields are mutated only through approved commands and permissions; compatibility projections are read-only.
- Audit/history consequence: Schema migrations, field removals, mappings, and lifecycle/assignment transformations retain a reconciliation record. Consequential domain changes preserve the histories required by DEC-005 through DEC-007.
- Data-loss safeguard: Inventory all current mock/legacy values for removed fields. Map recoverable data to canonical fields. Record every unmappable non-empty value in a migration exception register with record identity, source field, value classification, and disposition. No value is silently discarded.
- Compatibility implication: Maintain a field mapping table containing legacy name, canonical destination or removal decision, transformation, default, owner, and adapter-removal phase. The UI must not claim durable storage for adapter-only data.
- Accepted limitations: MVP does not provide employee/truck home-branch ownership, separate stop notes, maintenance odometer tracking, or maintenance vendor/mechanic attribution. These are non-critical scope reductions and require a later approved migration if reintroduced.
- Implementation phase: Schema corrections must precede each dependent implementation phase. UI removal/relabelling occurs in Phase 2C, Phase 3A, and Phase 3B; foundational role/seed schema corrections may occur in the approved backend preparation supporting Phase 1A/1B.
- Evidence needed: Revised schema diff; approved field mapping table; migration/backfill plan; migration exception report; assignment-model constraint tests; single-role constraint test; lifecycle conformance tests; canonical seed verification; retained-field round-trip tests; removed-field UI tests; derived-location rendering tests; and no-silent-data-loss verification.
- Approval evidence: Jethro selected qualified Option B in the CloudyMVP project conversation on 2026-07-22.

### DEC-010 - Unassigned trips and helper cardinality

- Selected option: **Option A - Allow explicitly unassigned scheduled trips; helpers are repeatable assignments.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: Cloudy supports scheduled trips without an assigned truck or driver. Trip-state validation is explicit, and helpers are represented through repeatable authoritative assignment records rather than fixed helper columns.
- Affected entities/pages/roles/endpoints: Trip Create/Edit, Trip Operations queue, assignment UI, availability services, transition endpoint, `trip_advise`, `trip_assignments`, helper selectors, and dashboard/queue filters.
- Draft rule: A Draft may omit driver, truck, helpers, `planned_start_at`, and `planned_end_at`, provided all other draft-minimum requirements are met.
- Scheduled rule: A Scheduled trip requires the approved trip header fields, at least one pickup and one drop-off stop, and valid `planned_start_at`/`planned_end_at`. It may remain without a truck or driver.
- In Progress rule: A trip may enter `In Progress` only when one active driver assignment, one active truck assignment, and every other approved dispatch-ready requirement are present.
- Unassigned visibility: Scheduled trips lacking a driver or truck are visibly labeled `Unassigned` and are filterable in the operational queue. Their presentation must not imply that any resource is reserved.
- Resource reservation rule: Creating or updating an unassigned Scheduled trip creates no driver, helper, or truck assignment and consumes no resource availability.
- Helper model: Helpers are repeatable `trip_assignments` records with assignment role `HELPER`. The database and API impose no hard helper maximum in the MVP.
- Initial UI boundary: The first MVP UI may support entering up to two helpers in one interaction, but the service and response contract must support more than two without changing the schema. Existing assignments above the UI entry limit remain readable and manageable through the approved assignment interface.
- Duplicate-role rules: The same employee cannot be assigned more than once to the same trip for overlapping/current assignment records. The active driver cannot also be an active helper on the same trip.
- Availability rule: Helper assignments use DEC-004 planned interval overlap checks and DEC-005 authoritative assignment writes.
- Positive acceptance criterion: Drafts and unassigned Scheduled trips save when their state-specific requirements are met. Later driver, truck, and helper assignments create the approved assignment history. A fully assigned Scheduled trip can transition to `In Progress`.
- Negative or blocked criterion: Missing planned interval or required stops blocks Scheduled status. Missing driver/truck assignments blocks `In Progress`. Duplicate employee/helper assignments, driver-helper role collision, inactive resources, and overlap conflicts are blocked.
- Error behavior: Field/state errors preserve the draft. The UI distinguishes not-yet-selected, unavailable, inactive, overlapping, duplicate, and permission-denied cases.
- Permission behavior: Trip creation/scheduling and later assignment remain separate actions governed by DEC-003. Users without `ASSIGN` permission may create or edit an eligible unassigned trip only where their trip permissions allow.
- Audit/history consequence: Initial unassigned scheduling creates no assignment record. Every later assignment/reassignment/release uses DEC-005 and records actor, interval, role, timestamps, and release history.
- Alert implication: No stale-unassigned threshold is approved by this decision. Any escalation or alert requires DEC-012.
- Migration/compatibility implication: Remove fixed helper ownership from writable `helper1_employee_id` and `helper2_employee_id` fields. Backfill any existing helper values into `trip_assignments` and retain temporary read-only projections only as defined by DEC-005 and DEC-009.
- Implementation phase: State-driven validation and UI in Phase 2C; authoritative assignment and availability integration in Phase 2D; transition enforcement in Phase 2E.
- Evidence needed: Draft/Scheduled/In Progress state validation tests; unassigned label/filter and no-reservation tests; role allow/deny tests; helper duplicate and driver-helper collision tests; inactive and overlap tests; more-than-two-helper backend contract tests; compatibility backfill reconciliation; assignment-history assertions; and transition-blocking tests.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-011 - API, RLS, pagination, errors, and refresh

- Selected option: **Option A - Complete versioned OpenAPI contract with conservative MVP refresh.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: Cloudy uses a versioned Django REST Framework API under `/api/v1/`, documented by a checked-in OpenAPI contract. The contract defines request/response schemas, authentication, authorization, RLS intent, errors, pagination, filtering, sorting, concurrency, idempotency, refresh behavior, and aggregate endpoints for every implemented MVP workflow.
- Affected entities/pages/roles/endpoints: Entire frontend service layer, all protected routes, all list/detail/mutation endpoints, auth/session handling, dashboards, availability surfaces, lifecycle commands, assignments, trip transitions, and audit-sensitive actions.
- Frontend service boundary: The frontend accesses data only through typed service interfaces. Development mock and production HTTP adapters may implement the same interface, but the mock must be clearly labeled non-production and cannot satisfy persistence, authorization, RLS, concurrency, or audit guarantees.
- Authentication contract: Protected requests send `Authorization: Bearer <supabase-access-token>`. Django validates the Supabase JWT, resolves the user profile and exactly one active platform role, and enforces the approved action permission.
- Authorization/RLS contract: DRF permissions enforce DEC-003. Supabase RLS implements matching defense-in-depth intent. Frontend checks only control presentation and cannot authorize a request.
- Authentication status behavior: Missing, invalid, revoked, or expired authentication returns `401` and follows DEC-002 refresh/logout behavior. Authenticated requests lacking permission return `403`.
- Standard error contract: Errors contain `status`, stable `code`, safe `message`, structured `errors`, and `request_id`. Field/action errors may include safe conflict metadata. Details the caller is not authorized to view are omitted.
- Pagination contract: Operational lists use `page` and `limit`. Default `limit` is 25 and maximum is 100. Responses return `count`, `page`, `limit`, `next`, `previous`, and `results`.
- Filtering and sorting: Each list endpoint documents supported search, filter, and ordering fields. Filters may be combined. Sorting uses `ordering`, with `-` for descending order. Unsupported filter/order fields return a structured `400` error rather than being silently ignored.
- Optimistic concurrency: Mutable records expose a server-managed integer `version`. Update requests submit the last-read version. A stale version returns HTTP `409` with code `STALE_RECORD`, includes safe current-version metadata where permitted, and does not overwrite the newer record.
- Critical-command concurrency: Assignment, reassignment, release, trip transition, cancellation, transfer, and other integrity-sensitive commands additionally use database transactions and appropriate locking/constraints. They return their specific conflict codes such as `ASSIGNMENT_CONFLICT` or `INVALID_TRIP_TRANSITION`.
- Idempotency contract: Trip creation; assignment/reassignment/release; trip transition/cancellation/transfer; truck status changes; entity deactivate/reactivate; and user invitation accept an `Idempotency-Key` header. Reusing the same key for the same actor/command/payload returns the original result and creates no duplicate domain or audit history. Reusing a key with a different payload returns an approved idempotency-conflict error.
- Refresh strategy: Manual refresh is available on operational lists and dashboards. The active Trip Operations queue and operational dashboards poll every 60 seconds while visible. Polling pauses while the browser tab is hidden and resumes with an immediate refresh. Successful mutations invalidate and re-fetch only affected records and summaries.
- Local-edit protection: Forms and detail editors do not automatically replace locally edited values during polling or background revalidation. Stale/conflict responses preserve input and support review, refresh, or retry.
- Realtime scope: Supabase Realtime/WebSockets are not part of the MVP unless separately approved later.
- Aggregation rule: Authoritative dashboard totals, fleet availability summaries, exception counts, and fuel totals come from approved aggregate endpoints. The frontend must not compute authoritative totals by joining or summing partial paginated lists.
- Positive acceptance criterion: Typed requests return contract-conformant data and metadata; combined filters/sorts/pages are stable; authorized operations succeed; direct unauthorized requests fail; stale writes and duplicate retries do not corrupt or duplicate data.
- Negative or blocked criterion: No production UI action is exposed without an approved endpoint and permission mapping. Undocumented client-side joins, last-write-wins mutation, guessed filters, unbounded list fetches, and mock-only guarantees cannot be marked complete.
- Error behavior: `400`, `401`, `403`, `404`, `409`, `429`, `5xx`, timeout, and network cases map to approved recoverable or terminal UI states. Recoverable failures preserve entered data. Security-sensitive errors do not leak protected details.
- Permission behavior: Every endpoint/action maps to a DEC-008 namespaced permission and DEC-003 role grant. Direct API access cannot bypass UI restrictions.
- Audit/history consequence: Consequential mutations retain actor and request correlation. Idempotent replays do not duplicate audit/history. Failed transactions do not create records implying success.
- Migration/compatibility implication: Replace direct mock-array reads with the typed service boundary. Keep mock adapters only for local development and explicitly mark all unsupported guarantees as blocked. Introduce record versions and idempotency storage/retention through reviewed migrations.
- Implementation phase: Define/refine the service and OpenAPI boundary in Phase 1B; integrate and test endpoint contracts in each data-backed phase; complete cross-cutting evidence in Phase 5B.
- Evidence needed: Reviewed OpenAPI document; generated or validated typed-client interfaces; auth/refresh tests; DRF/RLS allow-deny tests; standard error-shape tests; page/limit/filter/order tests; unsupported-parameter tests; stale-record tests; command locking/conflict tests; idempotency success and mismatched-payload tests; polling/tab-visibility tests; local-edit preservation tests; aggregate-endpoint tests; and request/audit correlation verification.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-012 - Operational UI policies

- Selected option: **Option A - Conservative MVP operational policies.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: Cloudy uses a list-first operational workflow, keeps cancelled trips accessible but outside the default active queue, shows only factual timestamp-derived past-due information, performs no capacity-safety validation in the MVP, and exposes no functional export capability.
- Affected entities/pages/roles/endpoints: Trip Operations, trip filters and detail routes, dashboard and exception surfaces, capacity/weight displays, export controls, aggregate endpoints, URL-state routing, and future reporting/alert features.
- Default Trip Operations view: Open in a server-paginated list/table view. Calendar, board, and day-agenda views may be introduced later but are not the default MVP workflow.
- URL-state rule: Search, supported filters, ordering, page, and limit should be represented in browser URL state where practical under DEC-014 so refresh, deep linking, and back/forward preserve context.
- Default active-query rule: The default Trip Operations query excludes `CANCELLED` records from active results. Other terminal-state handling may be explicitly filtered according to the approved screen design and endpoint contract.
- Cancelled visibility: Authorized users can include Cancelled trips through the Status filter, locate them through search where supported, and open them through authorized direct detail links. Cancellation reason and history remain visible. They must not be presented as deleted or archived.
- Stale-trip rule: No configurable or fixed stale threshold, escalation workflow, or operational alert is approved for the MVP. A factual label such as `Planned start passed` may be derived directly when the current time is later than `planned_start_at` and the trip remains in an applicable nonterminal state.
- Prohibited stale language: The UI must not label a trip `Stale`, `Delayed`, `Escalated`, `At Risk`, or equivalent unless a later approved decision defines the threshold, source data, owner, and resolution workflow.
- Capacity rule: The MVP does not block, warn, or allow override based on truck capacity or trip weight. Capacity and weight values may be displayed if present, but the UI/API must not claim the assignment is capacity-safe or validated.
- Capacity future dependency: Any future capacity behavior requires approved canonical units, capacity source, truck body/trailer implications, load-combination rules, missing-data behavior, override permission, reason, and audit requirements.
- Export rule: No functional PDF or CSV export is included in the MVP. Export buttons, menu items, and route capabilities remain hidden. The DEC-008 `EXPORT` action vocabulary is reserved for future use and grants no executable MVP permission.
- Dashboard/alert truthfulness: Dashboard values and factual counts come from DEC-011 aggregate endpoints. The interface must not imply real-time monitoring, stale escalation, capacity validation, or report availability where those capabilities are deferred.
- Positive acceptance criterion: Users land on a paginated operational table, can deliberately include Cancelled trips, can inspect historical cancellation details, and may see a factual past-planned-start indicator without unsupported risk claims.
- Negative or blocked criterion: No stale threshold, capacity warning/block/override, generic CSV/PDF action, or real-time monitoring claim is exposed. Cancelled records do not disappear from authorized historical access.
- Error behavior: Failed filters, aggregate calls, or timestamp data show approved loading/error/unavailable states. Missing or unreliable capacity data does not produce a safety conclusion.
- Permission behavior: Cancelled-detail access continues to follow DEC-003. Export permission remains non-executable in the MVP. No role receives an implicit capacity override or alert-resolution action.
- Audit/history consequence: Passive factual labels require no new domain audit record. Future overrides, export execution, or alert resolution would require separately approved actor/reason/history rules.
- Migration/compatibility implication: Remove or hide current UI elements that imply calendar-first default, generic export, hardcoded stale thresholds, or capacity validation. Centralize factual past-due calculation and default filters behind approved policies.
- Implementation phase: Default queue/filter behavior in Phase 2A; detail visibility in Phase 2B; capacity non-claims in Phase 2C/2D; dashboard truthfulness in Phase 4A/4B; deferred alert/export scope remains outside MVP.
- Evidence needed: Default-query and pagination tests; Cancelled filter/search/direct-route tests; cancellation-history visibility; planned-start boundary/timezone tests; prohibited-language checks; no-capacity-claim and no-override tests; hidden-export tests; aggregate-source tests; and URL-state behavior tests under DEC-014.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-013 - Deployment and production operations

- Selected option: **Option A - Render + Supabase with explicit environment and recovery controls.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; production approval remains gated by implementation evidence and named operational owners.
- Final requirement text: Cloudy deploys using Render + Supabase with separate local, staging, and production boundaries; environment-specific configuration; reviewed CI/CD; controlled migrations; structured monitoring; seven daily production restore points; tested restore and rollback procedures; and named operational ownership.
- Affected entities/pages/roles/endpoints: Frontend/backend build and runtime configuration, Supabase projects, Auth callbacks, CORS, deployment pipelines, migrations, monitoring/error reporting, backup/recovery, release management, and production approval.

#### Environment separation

- Local, staging, and production use separate configuration.
- Staging and production use separate Supabase projects, databases, Auth users, secrets, and Render services.
- Production data, credentials, service-role keys, JWT secrets, and domains must not be reused in staging.
- Environment-specific configuration must not require source-code edits.

#### Deployment topology

- React frontend: Render Static Site or an explicitly approved Render frontend service.
- Django REST API: Render Web Service.
- PostgreSQL and Auth: Supabase.
- Source control and CI/CD trigger: GitHub.
- Local development standard: Docker Compose.

#### Domains, HTTPS, CORS, and Auth callbacks

- Temporary Render-provided domains are approved for staging and initial production launch.
- Custom frontend and API domains may be introduced later without blocking MVP implementation.
- Production frontend and API origins use HTTPS.
- CORS and Supabase Auth redirect allowlists contain only exact approved environment origins.
- Unknown or cross-environment origins are rejected.

#### Render plan rule

- Render free tier may be used only for demonstrations or non-critical staging evaluation.
- Production use with live operational data requires a paid Render service.
- Production approval is blocked until account owner, billing owner, and paid-plan confirmation are recorded.

#### CI/CD and promotion

Pull requests and deployment pipelines run, as applicable:

```text
Frontend typecheck
Frontend lint
Frontend tests
Frontend accessibility checks
Frontend production build
Backend lint/format checks
Backend tests
Migration consistency check
OpenAPI contract validation
Docker build
Secret scan
```

- `develop` deploys to staging only after required checks pass.
- `main` deploys to production only after review and explicit release approval.
- Failed checks, failed migrations, failed health verification, or failed smoke tests stop promotion.

#### Migration ownership and schema controls

- Django models and migrations are authoritative after initial schema reconciliation.
- A named backend/release owner reviews and applies production migrations.
- Production migrations run only through the approved release process.
- Manual production schema changes in Supabase SQL editor are prohibited except documented emergency recovery.
- Destructive or backward-incompatible migrations require a separate reviewed release, backup verification, compatibility plan, and rollback/forward-fix procedure.

#### Monitoring and observability

MVP baseline:

- Structured Django application logs
- Render service and deployment logs
- Supabase database and Auth logs
- Health-check endpoint
- DEC-011 request-correlation IDs
- Sentry error reporting for frontend and backend

- Tokens, credentials, server-only secrets, raw passwords, and unapproved sensitive payload values must be redacted.
- Monitoring access and incident-response responsibility require named owners.

#### Backup and recovery

- Production uses Supabase-supported backups on the selected paid plan.
- Minimum MVP retention is seven daily restore points.
- Before a high-risk migration, create or verify an additional recoverable backup.
- A documented restore exercise must succeed in staging before production approval.
- Audit-log retention is governed separately by the approved data-retention policy.

#### Rollback

- Application rollback uses Render's previous successful deployment where applicable.
- Migrations should be backward-compatible.
- A migration with unsafe reverse behavior requires a tested forward-fix or explicit recovery procedure.
- Deployment health failure stops promotion or triggers rollback.
- Release records retain commit, migration set, environment, approver, result, health/smoke evidence, and rollback status.

#### Operational ownership required before production

Named owners must be recorded for:

- Render account and billing
- Supabase project and billing
- Production secrets
- Database migrations
- Monitoring and incident response
- Backup and restore
- Deployment approval
- Rollback execution

- Positive acceptance criterion: A reviewed commit deploys to staging without source edits, uses only staging configuration, passes health and smoke checks, emits structured/redacted diagnostics, and can be rolled back and restored using the documented procedures.
- Negative or blocked criterion: Production cannot launch on free-tier services, with shared staging data/secrets, without named owners, without seven daily restore points, without a successful staging restore exercise, or with server secrets in frontend bundles.
- Error behavior: Failed checks, build, migration, deployment, health verification, smoke test, backup verification, or restore exercise stops promotion and follows the escalation/rollback runbook.
- Permission behavior: Deployment, secrets, provider billing, migrations, monitoring, backup, restore, and rollback access is limited to named owners.
- Audit/history consequence: Releases, migrations, configuration changes, incidents, restores, rollbacks, and approvals remain traceable.
- Migration/compatibility implication: Replace AI Studio-specific environment assumptions, direct browser secrets, and ad hoc deployment behavior with approved local/staging/production boundaries.
- Implementation phase: Foundational environment and deployment preparation in Phase 1B and backend setup; staging evidence during integration; production-readiness completion in Phase 5B/deployment.
- Evidence needed: Environment/configuration matrix; `.env.example`; Render/Supabase service inventory; CI/CD logs; staging deployment and smoke results; paid-production plan confirmation; CORS/Auth callback tests; migration runbook and consistency checks; structured logging sample; Sentry frontend/backend sample events; secret scan; health check; backup retention proof; staging restore exercise; application rollback test; release record; and operational-owner register.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-014 - Frontend routing and migration boundary

- Selected option: **Option A - Incremental route and service extraction with temporary compatibility adapters.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: Cloudy incrementally introduces browser-addressable routing and stable typed service boundaries while preserving current behavior through temporary, documented compatibility adapters. Broad rewrites are prohibited unless separately approved.
- Affected entities/pages/roles/endpoints: App shell, login, hub, dashboard, trip operations, trip create/detail/edit, trucks, employees, settings, URL-state handling, route guards, mock/HTTP service adapters, and phased feature extraction.

#### Approved route structure

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

- Placeholder-module rule: Inventory and Billing have no launchable workspace routes in the MVP.
- Route authorization: Unauthorized routes render the approved access-denied state and expose no protected content or data. Backend authorization still controls every data request.
- Unknown-route behavior: Unknown routes render a safe not-found state with a valid next action.
- Browser navigation: Authorized deep links, browser refresh, back, and forward navigation must work predictably.
- URL-state rule: Trip list search, supported filters, ordering, page, and limit are represented in query parameters where practical. Opening and closing trip details preserves prior list context.
- URL data restrictions: Sensitive values, credentials, tokens, and large or unsaved form bodies are never encoded into URLs.
- Unsaved-change behavior: Forms warn before navigation that would discard unsaved changes and provide approved stay/leave choices.
- Service-boundary rule: Components access data only through stable typed service interfaces aligned with DEC-011. Existing mock operations are isolated behind a development-only adapter.
- Mock-adapter restriction: Components must not directly import, inspect, or mutate mock arrays. The mock adapter cannot satisfy production persistence, permission, RLS, concurrency, or audit criteria.
- Incremental extraction rule: Existing screens may be wrapped by routes initially. Large components are split only when their approved phase requires it.
- Planned trip-workspace decomposition:
  - Trip Operations
  - Trip Details
  - Trip Editor
  - Assignment and Availability
  - Transition Actions
- Broad-rewrite prohibition: Do not simultaneously replace routing, state management, folder structure, service contracts, and feature components outside the active phase.
- Compatibility-adapter governance: Every adapter records its purpose, owner, dependent consumers, compatibility behavior, removal criterion, and removal phase.
- Removal milestones:
  - Remove `currentView` state navigation after Phase 1B route verification.
  - Remove direct mock-array reads before production-backed Phase 2 workflows.
  - Remove writable legacy assignment fields during Phase 2D.
  - Remove remaining migration adapters by Phase 5B unless an explicit accepted limitation records a later phase.
- Positive acceptance criterion: Authorized users can deep-link, refresh, navigate back/forward, retain approved list context, and use routed screens without behavior loss outside the active phase.
- Negative or blocked criterion: Unauthorized routes reveal no protected UI/data; unknown routes do not crash; route changes do not silently discard recoverable form state; components do not bypass the service boundary.
- Error behavior: Route-loading, permission, not-found, service, and stale-state failures render approved recoverable states and preserve safe context.
- Permission behavior: Route guards use DEC-003 effective permissions for presentation. All protected data/actions remain subject to DEC-011 backend enforcement.
- Audit/history consequence: Navigation does not create domain audit records. Route/service diagnostics must not log tokens, credentials, sensitive query values, or protected payloads.
- Migration/compatibility implication: Map existing `currentView` values to approved routes, retain temporary wrappers where necessary, and remove adapters according to the recorded milestones.
- Implementation phase: Routing and core service boundaries in Phase 1B; URL-state integration in Phase 2A; feature extraction across Phase 2C-2E and Phase 3; adapter cleanup by Phase 5B.
- Evidence needed: Route integration tests; deep-link/refresh/back-forward tests; unauthorized/not-found tests; URL-state persistence and clearing tests; unsaved-navigation tests; typed service contract tests; mock/HTTP adapter parity tests; direct-mock-import static checks; context-preservation checks; and adapter-removal status evidence.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-015 - Test and accessibility evidence

- Selected option: **Option A - Risk-based automated stack plus manual review.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; phase approval still depends on the evidence produced by each implementation phase.
- Final requirement text: Every implementation phase must provide risk-proportionate automated and manual evidence for functional behavior, permissions, data integrity, concurrency, accessibility, responsiveness, and regressions. Build success alone cannot mark consequential criteria PASS.
- Affected entities/pages/roles/endpoints: Entire frontend and backend, CI/CD, route and API authorization, critical workflows, component states, responsive layouts, and accessibility behavior.

#### Frontend tooling

- Vitest for unit and service tests.
- React Testing Library for components and user interactions.
- MSW for API contract, loading, error, stale, permission, and conflict simulations.
- Playwright for critical browser workflows and route behavior.
- axe-core through component and Playwright checks.
- ESLint and Prettier.
- A separate `typecheck` command using `tsc --noEmit`.

Expected commands:

```text
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:coverage
npm run test:e2e
npm run test:a11y
npm run build
```

#### Backend tooling

- Django test framework or `pytest-django`.
- DRF API client tests.
- PostgreSQL-backed integration tests for transactions, locks, constraints, RLS intent, and migrations.
- `coverage.py`.
- `ruff`.
- `black --check`.
- Migration consistency and OpenAPI contract validation.

Expected commands:

```text
python manage.py makemigrations --check --dry-run
pytest
coverage run -m pytest
coverage report
ruff check .
black --check .
```

- Required automated behavior coverage:
  - Allowed and denied role/action paths.
  - Direct-route and direct-API denial.
  - Form validation and retained recoverable input.
  - Lookup loading and failure.
  - Pagination, combined filters, ordering, and URL state.
  - `STALE_RECORD`, idempotency, and command-conflict behavior.
  - Assignment overlap, concurrency, atomic rollback, and history.
  - Transition, cancellation, transfer, completion, and lifecycle dependency blockers.
  - Keyboard interaction, focus management/restoration, accessible names, labels, errors, dialogs, tabs, tables, and status communication.
  - Responsive and theme behavior for the active scope.
- Coverage policy:
  - No single global percentage alone determines approval.
  - Critical permission, lifecycle, assignment, transition, audit, and concurrency rules require explicit positive, negative, permission-denied, conflict/error, and rollback tests.
  - New or materially changed business-logic modules target at least 80% branch coverage.
  - Overall frontend and backend line coverage targets at least 70% by Phase 5B.
  - Falling below a target requires an explicit accepted limitation naming the uncovered code, workflow risk, owner, and planned resolution phase.
- Automated browser/device baseline:
  - Current stable Chromium desktop.
  - One tablet viewport.
  - One narrow responsive viewport.
- Manual browser/device evidence before Phase 5A/5B approval:
  - Current stable Chrome or Edge.
  - Current stable Firefox.
  - Safari on macOS or iOS when available.
  - Keyboard-only completion of critical workflows.
  - Light and dark mode review.
  - Reduced-motion review.
  - Screen-reader spot checks for Login, Trip Operations, Trip Editor, and lifecycle/confirmation dialogs.
- Accessibility standard:
  - Target WCAG 2.2 AA.
  - No unaccepted serious or critical axe violations in the active phase.
  - Automated results do not replace keyboard, focus, screen-reader, responsive, and reduced-motion review.
  - Any accessibility defect preventing completion of a core workflow blocks phase approval.
- CI and evidence:
  - Required checks run on pull requests and applicable deployment branches.
  - Test reports and coverage artifacts are retained by CI for the approved period.
  - Each acceptance criterion links to its relevant automated or manual evidence.
  - Flaky, skipped, blocked, unavailable, or not-run checks are reported accurately and cannot be counted as PASS.
- Positive acceptance criterion: The active phase's consequential behavior has repeatable automated evidence plus required manual checks; allowed and denied paths behave consistently; critical workflows are keyboard-completable and free of unaccepted serious/critical automated accessibility findings.
- Negative or blocked criterion: Typecheck/build alone cannot prove permissions, workflows, integrity, concurrency, history, or accessibility. Missing critical-path tests, inaccessible workflow completion, or misreported failed/skipped checks blocks approval.
- Error behavior: Test infrastructure failures, flakes, unavailable browsers, blocked environments, or missing evidence are reported as `FAIL`, `BLOCKED`, or `NOT_TESTED` according to fact, with no silent reclassification.
- Permission behavior: Critical permission tests include UI presentation, direct route, direct API, and backend/RLS enforcement for both authorized and unauthorized actors.
- Audit/history consequence: CI retains evidence and links it to acceptance criteria. Tests verify required domain histories without logging credentials, tokens, or sensitive fixtures.
- Migration/compatibility implication: Preserve the current `npm run lint` behavior only temporarily or rename it transparently to `typecheck`; add the approved tooling incrementally and ensure compatibility adapters receive regression coverage until removal.
- Implementation phase: Establish the baseline test/accessibility tooling in Phase 1A; expand evidence with every feature phase; complete cross-browser, coverage, adapter-removal, and final regression evidence in Phase 5A/5B.
- Evidence needed: Tooling configuration; package/backend dependency changes; documented scripts; CI workflow logs; unit/component/service/API/integration/E2E results; coverage reports; role/action matrices linked to tests; axe reports; keyboard/focus/responsive/theme/reduced-motion checklists; browser-matrix results; accessibility limitation records if any; and acceptance-criterion traceability.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

### DEC-016 - AI analysis and secret boundary

- Selected option: **Option A - Exclude and disable AI analysis for the MVP.**
- Decision owner: Jethro
- Decision date: 2026-07-22
- Decision status: SELECTED; implementation remains gated by the applicable phase approvals.
- Final requirement text: AI trip analysis is excluded from the Cloudy MVP. No production frontend or backend capability may call Gemini or another model provider, expose an AI-analysis action, inject a provider key into browser code, or present AI-derived operational recommendations.
- Affected entities/pages/roles/endpoints: Vite environment configuration, `geminiService`, trip analysis controls, frontend dependencies/imports, production bundles/source maps, environment templates, documentation, and any proposed AI endpoint or permission.
- Production UI rule: Remove or hide AI analysis actions and any copy implying AI scheduling, route analysis, risk evaluation, assignment guidance, capacity/safety conclusions, or operational recommendations.
- Secret-boundary rule: Remove browser-side Gemini SDK construction and all Vite replacement/injection of `GEMINI_API_KEY`, `API_KEY`, or equivalent provider secrets. Provider secrets must not appear in browser bundles, source maps, runtime configuration, logs, fixtures, or client-visible responses.
- Code-treatment rule: Delete the existing AI client code or move it to an explicitly non-production experimental location excluded from production imports, builds, tests, and deployment artifacts. Retained experimental code must not receive real credentials.
- Production-contract rule: Do not implement an AI API endpoint, AI permission, prompt-processing workflow, quota, provider integration, model call, AI audit stream, or AI-driven domain mutation in the MVP.
- Positive acceptance criterion: Production UI contains no AI-analysis control; production builds contain no AI provider SDK path or secret; ordinary trip workflows continue to function without AI dependencies.
- Negative or blocked criterion: No role can invoke AI analysis through UI, direct route, API, hidden import, or browser console. AI output cannot be used to change trip status, assignments, availability, routing, safety, or capacity.
- Error behavior: Removing the feature must not leave broken imports, dead navigation, unhandled missing-key errors, or user-facing placeholders that imply imminent functionality.
- Permission behavior: No DEC-008 AI permission code is seeded for the MVP.
- Audit/history consequence: No AI-specific domain history is required because the capability is absent. Removal changes remain traceable through source control and Phase 1B/quality evidence.
- Migration/compatibility implication: Remove Vite secret injection, direct `@google/genai` production usage, and trip-analysis UI wiring. Preserve unrelated trip behavior. Remove unused dependencies when safe.
- Reintroduction requirement: A later AI phase requires a separately approved decision covering user workflow, role/action permission, permitted data, provider/model, authenticated server endpoint, rate limits/quotas, cost ownership, payload minimization, logging/redaction, retention, human-review boundaries, and timeout/failure behavior.
- Implementation phase: Remove the unsafe production boundary during Phase 1B application-shell/service cleanup or the earliest approved phase touching the affected configuration. Final secret-scan evidence is required in Phase 5B.
- Evidence needed: Production UI absence tests; source/import review; Vite configuration review; browser bundle and source-map secret scan; dependency cleanup verification; no-AI-endpoint OpenAPI check; environment-template review; and regression tests for unaffected trip workflows.
- Approval evidence: Jethro selected Option A in the CloudyMVP project conversation on 2026-07-22.

## Approval record

- Authoritative final PRD selected: `PRD.md`, subject to the amendments recorded in DEC-001 through DEC-016
- Decision selections complete: Yes - 16 of 16
- Decision owner/approver for selections: Jethro
- Decision completion date: 2026-07-22
- Selection evidence: CloudyMVP project conversation and this Decision Log
- Final source-conformance review: PASS - reconciled on 2026-07-22
- Resolved Decision Log identified: Yes - this file; all selections include owner/date/evidence
- Conformance amendment identified: Yes - root `PRD.md` P0-AMEND-001 (`DRAFT`)
- Phase 0 approval: APPROVED on 2026-07-22 by Jethro via exact user instruction `APPROVED: Phase 0`
- Phase 0 completion status: COMPLETE
- Phase 1A eligibility: Yes - not started in this approval-recording turn
