# Cloudy Phase 0 Schema Reconciliation and Change Plan

## Plan status

- Phase: Phase 0 - PRD Readiness and Gap Resolution
- Status: APPROVED PHASE 0 REQUIREMENT PLAN
- Date: 2026-07-22
- Repository baseline: `9bdc135`
- Workbook: `.docs/cloudy_schema.xlsx`
- Workbook treatment: Qualified baseline under DEC-009
- Workbook changed: No
- Database migration authorized or created: No
- Implementation authority: `PRD.md` plus `docs/phase-0-decision-log.md`
- Phase 0 approval: APPROVED on 2026-07-22 by exact user instruction `APPROVED: Phase 0`

This plan is the implementation-ready Phase 0 reconciliation required by DEC-009. It specifies the schema delta and legacy/mock field treatment; it does not edit the workbook, define a production migration sequence, or authorize database work.

## 1. Workbook inspection result

All 30 workbook sheets were imported and inspected:

```text
users, roles, permissions, user_roles, role_permissions, app_settings,
audit_logs, app_modules, trip_advises, trip_stops, trip_assignments,
driver_availability, trip_events, trip_fuel_logs, trip_statuses,
load_types, employees, drivers, employee_roles, trucks, truck_statuses,
vehicle_status_logs, maintenance_logs, branches, clients,
internal_client_codes, consignees, locations, inventory, billing
```

The workbook provides useful table/column shapes but no authoritative seed rows, migration history, approval metadata, record-version strategy, idempotency storage, current-role constraint, or complete decision-driven lifecycle/history model. The changes below are mandatory before dependent implementation.

## 2. Schema principles

1. Django models and reviewed migrations become authoritative only after the initial reconciliation is implemented in an approved backend phase.
2. Supabase Auth owns credentials. No application table contains a raw password, refresh token, service-role key, JWT secret, or provider secret.
3. Primary and foreign keys use UUIDs. Timestamps are timezone-aware.
4. Canonical business codes are immutable uppercase `SNAKE_CASE` and are seeded by versioned migrations or an idempotent backend command.
5. Consequential domain mutations are commands, not arbitrary field patches.
6. Mutable records that participate in optimistic concurrency expose a server-managed integer `version`.
7. History records preserve actor, time, reason, old/new state or resource, and request correlation where required.
8. Removed legacy/mock data is inventoried and reconciled; no non-empty value is silently discarded.

## 3. Mandatory workbook amendments

### 3.1 Identity, roles, permissions, and settings

| Sheet              | Required amendment                                                                                                                                                                                                             | Constraint/behavior                                                                                                                                                                                                   | Decision                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `users`            | Treat `id` as the Supabase `auth.users.id` mirror; migrate/drop redundant `auth_user_id` if both identifiers are populated. Retain profile fields. Remove generic `is_deleted` behavior. Add lifecycle metadata and `version`. | No credential fields. Deactivation/reactivation uses command-owned `is_active`, `deactivated_at`, `deactivated_by_user_id`, `deactivation_reason`, `reactivated_at`, and `reactivated_by_user_id`.                    | DEC-002, DEC-006, DEC-011 |
| `roles`            | Add `label` or retain `role_name`, plus `sort_order`, `is_active`, and catalog version metadata. Seed only approved platform roles.                                                                                            | Codes immutable; labels/order/active state migration-controlled.                                                                                                                                                      | DEC-003, DEC-008          |
| `permissions`      | Retain namespaced `permission_code`; add `action_code`, label/description, `sort_order`, `is_active`, and catalog version metadata as useful.                                                                                  | Permission codes map to PRD matrix and endpoints.                                                                                                                                                                     | DEC-003, DEC-008          |
| `user_roles`       | Replace duplicate-only uniqueness with effective-role history: `effective_from`, nullable `effective_to`, `assigned_by_user_id`, nullable `replaced_by_user_id`, and reason.                                                   | Partial unique constraint: at most one row per `user_id` where `effective_to IS NULL`. A transaction closes the old role and opens the new role. Conflicting legacy current rows deny authorization until reconciled. | DEC-003                   |
| `role_permissions` | Retain unique role/permission pairs and seed from the PRD matrix.                                                                                                                                                              | Frontend, DRF, and RLS intent consume the same catalog.                                                                                                                                                               | DEC-003, DEC-008          |
| `app_settings`     | Add `version`; keep last-updater metadata server-owned.                                                                                                                                                                        | SuperAdmin updates; Admin reads; other roles have no Settings access.                                                                                                                                                 | DEC-003, DEC-011          |
| `app_modules`      | Add `sort_order`, `is_active`, and explicit launch state.                                                                                                                                                                      | `TRIP_SCHEDULING` active; `INVENTORY` and `BILLING` Coming Soon/non-launchable.                                                                                                                                       | DEC-008                   |

### 3.2 Trips, assignments, transitions, and commands

| Sheet                     | Required amendment                                                                                                                                                                                                                                      | Constraint/behavior                                                                                                                                                                                                                                      | Decision                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `trip_advises`            | Add canonical `planned_start_at TIMESTAMPTZ`, `planned_end_at TIMESTAMPTZ`, and `version INTEGER NOT NULL DEFAULT 1`. Keep `branch_id`. Replace generic `is_deleted` semantics.                                                                         | `planned_end_at > planned_start_at` when either is required. Scheduled requires both; Draft may omit both.                                                                                                                                               | DEC-004, DEC-010, DEC-011          |
| `trip_advises`            | Keep `truck_id`, `driver_id`, `helper1_employee_id`, and `helper2_employee_id` only during migration as read-only projections.                                                                                                                          | Serializers reject writes. Backfill to assignments, migrate consumers, then remove no later than the approved Phase 2D milestone.                                                                                                                        | DEC-005, DEC-009, DEC-010          |
| `trip_advises`            | Retain transfer lineage; add command-owned cancellation/completion metadata only where not represented by dedicated history.                                                                                                                            | Cancel/complete/transfer effects remain transactional and history-backed.                                                                                                                                                                                | DEC-006, DEC-007                   |
| `trip_statuses`           | Seed the approved catalog, including conformance amendment `DRAFT` order 5 before `SCHEDULED`. Add `is_active` and catalog version metadata.                                                                                                            | Codes immutable; inactive historical labels remain readable.                                                                                                                                                                                             | DEC-008, DEC-010, P0-AMEND-001     |
| `trip_assignments`        | Replace mandatory `employee_id` assumption with nullable `employee_id` and nullable `truck_id`; add stable `assignment_role_code`, `planned_start_at`, `planned_end_at`, `assigned_by_user_id`, `released_by_user_id`, `release_reason`, and `version`. | Exactly one of `employee_id`/`truck_id` is non-null. Employee roles are `DRIVER` or `HELPER`; truck assignment uses a stable assignment role such as `TRUCK`. End is after start.                                                                        | DEC-004, DEC-005, DEC-010, DEC-011 |
| `trip_assignments`        | Add current-assignment and overlap constraints/indexing compatible with PostgreSQL transaction/locking strategy.                                                                                                                                        | One current driver and one current truck per trip; no duplicate current employee on the same trip; active driver cannot also be current helper; no conflicting unreleased resource interval. Exact race-safe enforcement is reviewed with the migration. | DEC-004, DEC-005, DEC-010          |
| New `trip_status_history` | Store trip, old/new status, actor, reason, occurred time, request ID, command/idempotency reference, and related successor/source when applicable.                                                                                                      | Immutable history; no partial write on failed command.                                                                                                                                                                                                   | DEC-007, DEC-011                   |
| New `idempotency_records` | Store actor, command scope, key digest, request payload digest, response reference/status, and retention timestamps.                                                                                                                                    | Same actor/scope/key/payload replays original result; changed payload conflicts. Never store secrets or unrestricted payloads.                                                                                                                           | DEC-007, DEC-011                   |

`trip_assignments.assignment_role_code` is a small command-domain catalog distinct from employee master roles. Initial approved values are `DRIVER`, `HELPER`, and `TRUCK`; it prevents a truck row from requiring a fake employee while keeping one authoritative assignment table.

### 3.3 Stops, employees, trucks, maintenance, and availability

| Sheet                                            | Required amendment or confirmed treatment                                                                                           | Constraint/behavior                                                                                                                                                                                                        | Decision                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `trip_stops`                                     | Retain workbook fields unchanged for MVP scope.                                                                                     | No duplicate stop `city_area` or `notes`. `specific_address` is the stop-specific address/facility-instruction value; province/region/address derive from `locations`.                                                     | DEC-009                   |
| `employees`                                      | Do not add `branch_id`. Remove generic `is_deleted` behavior; add deactivation/reactivation metadata and `version`.                 | Inactive employees remain historically readable and cannot be newly assigned. Active assignments block deactivation.                                                                                                       | DEC-006, DEC-009, DEC-011 |
| `drivers`                                        | Retain driver extension fields; remove generic `is_deleted` behavior or derive active state from employee lifecycle.                | Driver eligibility includes active employee and approved licence requirements.                                                                                                                                             | DEC-006, DEC-009          |
| `trucks`                                         | Do not add `branch_id`. Remove generic `is_deleted` behavior; add deactivation/reactivation metadata and `version`.                 | Inactive trucks remain historically readable and cannot be newly assigned. Active assignments block deactivation.                                                                                                          | DEC-006, DEC-009, DEC-011 |
| `maintenance_logs`                               | Retain type, status, scheduled date, completion time, cost, and notes. Add `version` if records are mutable through generic update. | Do not add odometer or vendor/mechanic in MVP.                                                                                                                                                                             | DEC-009, DEC-011          |
| `vehicle_status_logs`                            | Retain old/new status, actor, time, and reason; add request correlation.                                                            | Immutable history written atomically with lifecycle/transition commands.                                                                                                                                                   | DEC-006, DEC-007, DEC-011 |
| `driver_availability`                            | Treat as explicit availability/eligibility input only, never as the authoritative assignment ledger.                                | Assignment availability always derives from `trip_assignments` plus approved eligibility inputs. Any leave/suspension interval policy must be defined in the affected implementation phase before it can block assignment. | DEC-004, DEC-005          |
| `employee_roles`, `truck_statuses`, `load_types` | Add `sort_order`, `is_active`, and catalog version metadata; seed canonical values.                                                 | Immutable codes and historical inactive rendering.                                                                                                                                                                         | DEC-008                   |

### 3.4 Audit and lifecycle history

| Sheet                                                                  | Required amendment                                                                                                                                                      | Constraint/behavior                                                                                                     | Decision                           |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `audit_logs`                                                           | Replace generic free-form action dependence with canonical action/event code; add `request_id`, command/idempotency reference, safe metadata, and immutable event time. | Protected values are server-authored; logs exclude passwords, tokens, provider keys, and unapproved sensitive payloads. | DEC-002, DEC-006, DEC-007, DEC-011 |
| New `entity_lifecycle_history` or equivalent entity-specific histories | Store entity type/id, old/new active state, actor, reason, occurred time, dependency summary, and request correlation.                                                  | Truck/employee/user deactivate/reactivate history remains durable.                                                      | DEC-006                            |

The implementation may use entity-specific history tables instead of the shared table only if the OpenAPI response and audit evidence remain equivalent and the choice is reviewed in the approved backend phase.

### 3.5 Existing sheets retained without Phase 0 structural expansion

`trip_events`, `trip_fuel_logs`, `branches`, `clients`, `internal_client_codes`, `consignees`, and `locations` remain workbook-baseline tables, subject to common concurrency/audit fields only when their approved implementation exposes mutation. `inventory` and `billing` remain placeholder-only and non-launchable; no functional schema is added in the MVP.

## 4. Legacy/mock-to-canonical field map

| Legacy/mock field or behavior                                             | Canonical destination/treatment                                                                              | Transformation/default                                                                            | Data-loss handling                                                                                    | Adapter removal                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `SystemUser.password`; plaintext mock passwords; password forms/responses | Remove. Supabase Auth owns credentials.                                                                      | No migration of raw passwords. Provision/invite users through provider flow.                      | Record affected mock fixtures as non-production; never copy values.                                   | Phase 1B auth boundary / Phase 3D user UI |
| `SystemUser.username` login                                               | Supabase Auth email/identity UI                                                                              | Map only if a verified email/account mapping exists; otherwise invite/reconcile.                  | Unmapped username enters exception register without password.                                         | Phase 1B                                  |
| `SystemUser.roles[]` plus `role`                                          | Current `user_roles` history row                                                                             | Resolve exactly one approved role per user; do not union roles.                                   | Multiple/unknown roles block authorization and enter exception register.                              | Phase 1C                                  |
| Mock module strings such as `trip_scheduling`                             | `TRIP_SCHEDULING` catalog code                                                                               | Explicit mapping table, never label guessing at runtime.                                          | Unknown value enters exception register.                                                              | Phase 1A/1B                               |
| Mixed status labels/unions                                                | Canonical uppercase codes                                                                                    | Explicit lookup mapping, including `DRAFT`.                                                       | Unknown history remains visible as unmapped migration exception until resolved.                       | Phase 1A tokens / later data phase        |
| `Employee.branch_id`                                                      | Remove from MVP employee contract                                                                            | No default or silent copy.                                                                        | Inventory non-empty values in exception register; branch ownership is deferred.                       | Phase 3B                                  |
| `Truck.branch_id`                                                         | Remove from MVP truck contract                                                                               | No default or silent copy.                                                                        | Inventory non-empty values in exception register; home branch is deferred.                            | Phase 3A                                  |
| Trip `branch_id`                                                          | Retain `trip_advises.branch_id`                                                                              | Preserve valid reference.                                                                         | Invalid reference enters exception register.                                                          | Not applicable                            |
| `TripStop.city_area`                                                      | Derived `locations.province`/`region`/address                                                                | Resolve through `location_id`; do not duplicate.                                                  | Unmapped non-empty values enter exception register.                                                   | Phase 2C                                  |
| `TripStop.notes`                                                          | `trip_stops.specific_address` only where the value is genuinely a stop-specific facility/address instruction | Do not merge unrelated narrative silently.                                                        | Ambiguous/non-address notes enter exception register for disposition.                                 | Phase 2C                                  |
| `MaintenanceLog.odometer`                                                 | Remove from MVP                                                                                              | No canonical destination.                                                                         | Every non-empty value enters exception register; do not drop silently.                                | Phase 3A                                  |
| `MaintenanceLog.vendor_mechanic`                                          | Remove from MVP                                                                                              | No canonical destination.                                                                         | Every non-empty value enters exception register; do not drop silently.                                | Phase 3A                                  |
| `trip_advises.truck_id`                                                   | Backfill truck `trip_assignments` row                                                                        | Preserve trip/resource and known assignment timing; missing interval blocks production guarantee. | Discrepancy enters exception register.                                                                | Phase 2D                                  |
| `trip_advises.driver_id`                                                  | Backfill driver employee assignment via `drivers.employee_id`                                                | Resolve driver extension to employee; reject ambiguity.                                           | Missing/ambiguous driver mapping enters exception register.                                           | Phase 2D                                  |
| `helper1_employee_id`, `helper2_employee_id`                              | Backfill repeatable `HELPER` assignment rows                                                                 | Preserve distinct valid employee IDs.                                                             | Duplicate/invalid/colliding rows enter exception register.                                            | Phase 2D                                  |
| `pickup_date`, `pickup_time_window`                                       | Canonical `planned_start_at`, `planned_end_at`                                                               | Convert only with unambiguous approved timezone/boundaries. Never guess end time.                 | Records without deterministic interval remain unassigned/non-guaranteed and enter exception register. | Phase 2C/2D                               |
| Generic `is_deleted` on trips                                             | Canonical status `CANCELLED` only with valid reason/history                                                  | No automatic conversion without evidence.                                                         | Deleted-but-unexplained rows enter exception register.                                                | Phase 2E                                  |
| Generic `is_deleted` on users/employees/trucks                            | Domain `is_active` plus lifecycle metadata/history                                                           | Map only with defensible actor/time/reason or mark legacy origin.                                 | Missing provenance recorded explicitly.                                                               | Phase 3A/3B/3D                            |

## 5. Migration exception register contract

Before a destructive/field-removal migration, export a reviewable exception register with:

```text
entity_type
record_id
source_field
source_value_classification
proposed_destination_or_removal
transformation_result
exception_reason
disposition
owner
reviewed_at
approved_migration
```

The register must contain every non-empty unmappable value. A migration cannot be marked successful while unexplained exceptions are omitted.

## 6. Required implementation sequence (future approved phases only)

1. Convert this plan into reviewed Django model/migration diffs and seed fixtures/commands.
2. Produce a pre-migration inventory and exception register from actual source data.
3. Add canonical catalogs, versions, role-history constraint, lifecycle metadata/history, planned intervals, assignment shape, transition history, and idempotency support.
4. Backfill roles, codes, intervals where deterministic, and authoritative assignment rows.
5. Reconcile every exception; validate row counts, references, histories, and current projections.
6. Expose compatibility projections read-only; deny direct writes.
7. Migrate typed API/frontend consumers in their approved feature phase.
8. Remove projections/adapters at their recorded milestones only after evidence passes.

No step above may begin merely because this Phase 0 plan exists; it requires the applicable phase approval.

## 7. Required evidence for schema implementation approval

- Reviewed model and migration diff against this plan and the workbook.
- Approved seed catalog including PRD P0-AMEND-001.
- Seed idempotency and immutable-code tests.
- Single-current-role constraint and role-change transaction tests.
- Planned-interval validation, timezone, boundary, and concurrency tests.
- Assignment resource-XOR, current-role, duplicate, collision, overlap, and rollback tests.
- Projection write-denial and backfill reconciliation.
- Lifecycle no-hard-delete, dependency blocking, historical visibility, and rollback tests.
- Transition/idempotency/status/vehicle/assignment/audit atomicity tests.
- Retained-field round-trip tests and removed-field UI/API rejection tests.
- Migration exception register with disposition and no silent data loss.
- Migration consistency check, PostgreSQL integration tests, and OpenAPI validation.

## 8. Phase 0 conclusion

The workbook is reconciled as a qualified baseline and no longer blocks Phase 1A requirement readiness. Actual schema changes remain gated to later approved phases. Phase 0 is `COMPLETE`, and `Next Approved Phase - May start` is `Yes`; no schema work was started by this approval update.
