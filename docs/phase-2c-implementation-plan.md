# Phase 2C Implementation Plan — Create and Edit Trip

## Gate and objective

- Phase 2B — Trip Quick Details and Full Details: `APPROVED` and `COMPLETE`.
- Exact approval instruction: `APPROVED: Phase 2B`.
- Approver: Jethro. Approval date: 2026-07-24.
- Phase 2C: `APPROVED`, then `COMPLETE`; exact instruction `APPROVED: Phase 2C`; approver Jethro; approval date 2026-07-24.
- Phase 2D: `NOT_STARTED`, eligible, `May start: Yes`; Phase 2E and later remain `NOT_STARTED`, `BLOCKED_BY_PHASE_SEQUENCE`, `May start: No`.
- Active objective: extract focused routed Create and Edit Trip workflows within the approved Phase 2C scope, then stop at `READY_FOR_REVIEW` pending explicit approval.

## Source classification

| Source                                                        | Classification                                 | Phase 2C use                                                                                                      |
| ------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Current goal objective                                        | Authoritative phase scope and stop condition   | Workstreams, exclusions, P2C-AC-01 through P2C-AC-16, validation, and approval state                              |
| `docs/phase-0-decision-log.md` and resolved summary           | Approved product/technical decisions           | Canonical codes, permissions, routing, typed services, errors, versioning, refresh, and non-production boundary   |
| `PRD.md`                                                      | Approved final requirement baseline            | Trip authoring, Draft/Scheduled rules, stops, transfer lineage, accessibility, and route behavior                 |
| `docs/phase-0-schema-change-plan.md`                          | Approved schema reconciliation                 | Read-only legacy assignment projections, canonical stop field, planned interval, version, and no schema migration |
| Phase 1C traceability                                         | Approved permission presentation baseline      | Central policy and five-role Create/Edit behavior                                                                 |
| Phase 2A/2B completion, traceability, and responsive evidence | Approved prior-phase evidence                  | Preserved operations/details behavior, accepted limitations, responsive conventions, and successor gate           |
| `docs/compatibility-adapters.md`                              | Governed migration boundary                    | Temporary mock, legacy, and read-only assignment projections; adapter ownership/removal rules                     |
| UI/UX Blueprint                                               | Approved design guidance where non-conflicting | Full-page complex form, responsive stacking, focus, action bar, and contextual return behavior                    |
| `REPOSITORY_CONTEXT_PACKAGE.md`                               | Orientation only                               | Legacy architecture and mock boundary; current source supersedes stale snapshots                                  |
| Current source/tests/configuration                            | Observed behavior                              | Inventory and regression constraints only; never treated as a production contract                                 |

## Observed editor inventory

The legacy editor is rendered by `components/TripList.tsx` for `create` and `edit` route modes. It currently displays or initializes trip advice code, branch, client, internal client code, consignee, pickup date/window, status, load type, truck size, assignment fields, loading reference, weight, transfer flag/source, remarks, and stops. It validates a legacy required pickup timestamp, client, code uniqueness, weight, assignments, stop presence, helper collisions, and same-date assignment conflicts. It submits legacy aliases and writes `truck_id`, `driver_id`, `helper1_employee_id`, and `helper2_employee_id`, then saves stops separately.

Current dirty-state and navigation protection use `useBeforeUnload`, `useBlocker`, an in-memory baseline, and a discard dialog. These behaviors must be retained in the extracted pages, with cancellation and stale-write handling added at the typed service boundary.

## Material conflicts and resolutions

| Observed conflict                                                                | Phase 2C resolution                                                                                                                                                                | Authority                               |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Modal editor is mixed into the broad operations/map/detail component             | Add focused routed Create/Edit composition; preserve Trip Operations, map, and Phase 2B detail surfaces                                                                            | Goal, DEC-014, compatibility governance |
| Legacy editor writes driver/truck/fixed helper fields and validates availability | Remove assignment mutation and overlap checks; show existing assignments read-only on Edit only                                                                                    | Goal Workstreams 10–11; DEC-005         |
| Legacy Scheduled path requires driver and truck                                  | Scheduled requires valid header, interval, pickup/drop-off stops; it may be explicitly Unassigned                                                                                  | PRD 7.3; DEC-010                        |
| Legacy status dropdown uses broad transitions and status labels                  | Replace with explicit `DRAFT` or `SCHEDULED` save intent; later transitions remain Phase 2E                                                                                        | Goal Workstream 5; DEC-007              |
| Legacy stop model exposes `city_area` and `notes`                                | Use canonical location plus `specific_address`; preserve unrelated narrative only when an approved field exists                                                                    | Schema plan; DEC-009                    |
| Legacy save mutates trip and stops in two calls without version                  | Typed create/update contract owns one logical mutation, versioned Edit, normalized errors, and no-partial-write expectation; development adapter remains explicitly non-production | DEC-011; goal Workstreams 1 and 9       |
| Edit initializes only from the preloaded workspace array                         | Route parameter is the source of truth; typed Edit initialization must distinguish not found, denied, and unavailable and cancel obsolete requests                                 | DEC-014; goal Workstream 2              |
| Existing legacy aliases are used as if canonical                                 | New form code submits only canonical fields through `services`; aliases are registered as compatibility projections and are not submitted                                          | Schema plan; compatibility governance   |

## Planned files and responsibilities

| Area                | Expected files                                                                                               | Responsibility                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Typed contracts     | `services/contracts.ts`                                                                                      | Form DTOs, lookup DTOs, stop inputs, save intents, versions, errors, cancellation, and responses          |
| Development adapter | `services/apiService.ts` or a bounded `services/tripEditor.ts` adapter                                       | Development-only projection/mutation implementation; no production endpoint invention or guarantee claims |
| Service registry    | `services/index.ts`                                                                                          | Expose `services.tripEditor`; components consume only this boundary                                       |
| Routed pages        | New `components/TripCreatePage.tsx`, `components/TripEditPage.tsx`, shared form component as appropriate     | URL-driven initialization, permissions, form state, validation, save/recovery, return context             |
| Route shell         | `App.tsx`, `routes.ts`                                                                                       | Mount Create/Edit pages without broad Phase 2A/2B rewrite; preserve Not Found vs Permission Denied        |
| Tests               | `tests/unit/*`, `tests/e2e/*`, visual/a11y suite                                                             | Contract, form, route, boundary, accessibility, responsive, and stale-write evidence                      |
| Governance          | `docs/phase-2c-trip-form-traceability.md`, `docs/compatibility-adapters.md`, evidence/status/completion docs | Trace every field, adapter, limitation, result, and gate transition                                       |

## Typed boundary design

Create and Edit consume `services.tripEditor` only. The contract covers initialization, active/inactive canonical lookups, transfer-source lookup, ordered stop inputs, create/update requests and responses, `Asia/Manila` planned interval validation, normalized field/form errors, `version`, stale-write conflict, auth/authorization/not-found/unavailable/cancelled outcomes, and successful Trip Details destination.

Create requests contain only approved trip-content fields and ordered stops. Edit requests include the server-managed version. Neither request contains assignment mutation fields, assignment commands, status-transition commands, cancellation fields, event/fuel fields, export, Inventory/Billing, or AI data. Development writes are reset-on-refresh and non-durable.

## Behavior and evidence strategy

- Direct Create/Edit routes resolve auth and centralized permissions before protected form values render.
- Encoder may edit only an owned `DRAFT`; Viewer has no Create/Edit surface; never-permitted actions are hidden.
- Draft may omit scheduling information where allowed, but supplied timestamps/references/stops remain valid.
- Scheduled requires approved required fields, valid start/end with end later than start, and at least one pickup and drop-off; assignments remain read-only/unassigned.
- Stops have deterministic unique sequence, keyboard reorder, add/remove, canonical location, and `specific_address`; recoverable errors preserve all input.
- Transfer mode requires a valid non-self source and preserves the relationship through the typed request.
- Dirty state protects refresh and route navigation, with accessible Stay/Leave confirmation; successful save clears it and failed save retains it.
- Edit stale-write conflict preserves local edits and offers reload/review recovery without silent overwrite.
- Validate 1440×900, 834×1194, and 390×844 in light/dark themes and all five roles; retain screenshots and a manual evidence ledger under `docs/evidence/phase-2c-responsive/`.

## Backend dependencies and accepted limitations

Production persistence, JWT/RLS authorization, server concurrency, transaction rollback, idempotency, audit history, canonical lookup ownership, and request IDs are backend dependencies. The current development adapter can demonstrate typed UI behavior and reset-on-refresh mutations only; it must not be presented as production persistence, authorization, concurrency, or audit evidence. No schema migration or production endpoint is authorized in Phase 2C.

## Explicit exclusions and stop condition

Do not implement or prepare Phase 2D assignment/availability work or Phase 2E status-transition/cancellation work. Also exclude vehicle-status mutation, events/fuel mutation, Inventory, Billing, export, AI, schema migration, and broad Phase 2A/2B rewrites.

The final reconciliation received `APPROVED: Phase 2C` from Jethro on 2026-07-24. Phase 2C is `APPROVED` and `COMPLETE`; Phase 2D is eligible but remains unstarted, while Phase 2E+ remain blocked.
