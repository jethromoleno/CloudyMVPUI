# Phase 2A Implementation Plan

## Phase gate

- Planned implementation phase: Phase 2A - Trip Operations Table
- Phase 1C approval: `APPROVED` and `COMPLETE` by Jethro on 2026-07-22
- Phase 2A eligibility: confirmed by the approved Phase 2A goal; `May start: Yes`
- Phase 2B authorization at Phase 2A start: not granted; `May start: No`
- Security boundary: frontend permissions remain presentation behavior only. The development adapter provides no production persistence, authorization, RLS, concurrency, or audit guarantee.

### Current approval transition

- Accepted instruction: `APPROVED: Phase 2A`
- Approver: Jethro
- Approval date: 2026-07-23
- Phase 2A: `APPROVED`, then `COMPLETE`
- Phase 2B: `NOT_STARTED`, `ELIGIBLE_TO_BEGIN`, `May start: Yes`
- Phase 2C and later: `NOT_STARTED`, `BLOCKED_BY_PHASE_SEQUENCE`, `May start: No`
- Approval-turn scope: no Phase 2B implementation began.

### Gate-record reconciliation

The repository records were internally inconsistent at Phase 2A start:

- `docs/phase-1c-permission-traceability.md` records exact approval `APPROVED: Phase 1C`, Phase 1C `COMPLETE`, and Phase 2A `May start: Yes`.
- `docs/phase-1c-completion-report.md`, `docs/ui-implementation-status.md`, and `docs/compatibility-adapters.md` still carried the preceding `AWAITING_EXPLICIT_APPROVAL`/`May start: No` state.
- The approved Phase 2A goal explicitly confirms Phase 1C is approved and complete and Phase 2A is eligible.

The exact approval record plus the current goal satisfy P2A-AC-01. Phase 2A will reconcile the stale status/report metadata without changing the accepted Phase 1C permission matrix or evidence.

## Source authority and classification

| Source                                                 | Classification                                  | Phase 2A use                                                                                               |
| ------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Approved Phase 2A goal                                 | `APPROVED_PHASE_SCOPE`                          | Scope, P2A-AC-01 through P2A-AC-16, validation matrix, evidence, and mandatory stop                        |
| `docs/phase-0-decision-log.md` DEC-003/008/011/012/014 | `APPROVED_RESOLVED_DECISIONS`                   | Role presentation, canonical catalogs, typed list contract, active/cancelled policy, routing and URL state |
| `PRD.md` sections 4, 6, 7.2, 7.8, 8, 10, 13            | `APPROVED_FINAL_REQUIREMENT_BASELINE`           | List-first experience, canonical values, fields, refresh, roles, pagination/errors, quality evidence       |
| UI/UX Blueprint PDF                                    | `APPROVED_DESIGN_GUIDANCE_WHEN_NON_CONFLICTING` | Dense toolbar/table, reduced responsive columns, keyboard/native-table behavior, explicit states           |
| Phase 1A/1B/1C completion and evidence                 | `APPROVED_PRIOR_PHASE_BASELINE`                 | Shared UI/tokens, shell/routing/service, permission policy, responsive regression baseline                 |
| `docs/compatibility-adapters.md`                       | `GOVERNED_MIGRATION_BOUNDARY`                   | Retain later-phase route/detail/editor projections and register the Phase 2A list projection               |
| Current source and tests                               | `OBSERVED_IMPLEMENTATION`                       | Preserve routed shell/detail/editor behavior while replacing only the operations-list composition          |
| Repository Context Package                             | `ORIENTATION_ONLY`                              | Legacy component/data boundaries; current source remains authoritative for implementation facts            |

## Pre-implementation conflicts and resolutions

| Conflict or omission                                                                                                                             | Resolution for Phase 2A                                                                                                                                                                                                  | Authority                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Phase 1C approval metadata is inconsistent across repository documents.                                                                          | Treat the exact approval record and current goal as authoritative; reconcile stale ledgers in the completion update.                                                                                                     | Phase 1C traceability; approved Phase 2A goal    |
| Blueprint lists Export, saved views, configurable columns, and contextual details as Trip Operations actions.                                    | Do not expose Export under DEC-012. Saved views/configurable columns are not required by the Phase 2A goal. Quick details belong to Phase 2B.                                                                            | DEC-012; explicit Phase 2A exclusions            |
| Legacy operations UI defaults to local filtering/sorting and includes broad row mutations.                                                       | Replace only the `operations` composition with typed server-style list requests. Preserve schedule/detail/editor compatibility paths and do not add assignment/status/cancel behavior.                                   | DEC-011/014; Phase 2A scope                      |
| Legacy mock status/load lookup codes are labels and omit approved catalog members.                                                               | The development Trip Operations lookup adapter publishes the exact DEC-008/P0-AMEND-001 catalog and maps legacy records to immutable canonical codes. Components receive options only through the typed lookup boundary. | DEC-008; PRD section 6                           |
| DEC-011 sets default `limit=25` and maximum `100` but does not enumerate UI page-size choices.                                                   | Present conservative choices `10`, `25`, `50`, `100`; accept and normalize any integer URL limit from `1` through `100`.                                                                                                 | DEC-011 bounds; bounded UI decision              |
| Branch-scoped authorization and employee/truck home-branch ownership are deferred, while Trip Operations includes a branch filter where present. | Filter only the existing trip `branch_id`; make no branch-authorization or resource-ownership claim.                                                                                                                     | DEC-009; current typed Trip field; Phase 2A goal |
| Search needs client, consignee, driver, and plate labels not stored directly on Trip.                                                            | Build a read-only list projection inside the development service adapter using approved lookup/service data. Components do not join mock arrays.                                                                         | DEC-011/014 service boundary                     |

No unresolved source conflict blocks Phase 2A implementation.

## Bounded workstreams

1. Define explicit Trip Operations query, filter, ordering, row, lookup, pagination, freshness, and normalized-error contracts.
2. Implement a development-only list projection behind `services.trips`, including canonical lookup mapping, multi-field search, combinable filters, allowlisted stable ordering, pagination, and cancellation checks.
3. Extract only the routed `operations` composition from the legacy `TripList` wrapper into a focused page component. Keep schedule, details, create/edit, assignment, status, and cancellation workflows unchanged.
4. Parse and canonicalize URL-backed search/filter/order/page/limit state. Preserve valid state across refresh, back/forward, and trip navigation; expose an actionable normalization notice for invalid values.
5. Build the dense table with shared `DataTable`, `SearchInput`, `FilterBar`, `StatusBadge`, `Button`, and shared states. Add active-filter chips, clear-one/clear-all behavior, accessible sorting, pagination, result range, freshness, and manual refresh.
6. Treat initial loading, lookup loading/failure, background refresh, recoverable stale-data warning, auth-required, denied, validation, cancelled, empty, no-results, and unexpected errors distinctly.
7. Apply the Phase 1C policy only through centralized helpers: all roles can read; create is hidden for Viewer; row Edit is shown only when the existing policy permits; Phase 2A adds no mutation behavior.
8. Make the visible Open action and optional row activation keyboard accessible. Carry the full normalized list query to the existing detail route and back.
9. Use deliberate responsive column priority and horizontal overflow: desktop dense table, tablet reduced secondary columns, mobile essential identity/status/pickup/route/action fields and collapsible filters.
10. Add contract, component, routed browser, permission, accessibility, responsive, and static-boundary tests. Retain screenshots and a manual review ledger for all required viewports, themes, and roles.
11. Update traceability, compatibility governance, phase status, completion report, gaps, and acceptance-criteria evidence; set Phase 2A `READY_FOR_REVIEW` and keep Phase 2B `May start: No`.

## Planned file boundary

| Area                    | Planned files                                                                                         | Constraint                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Typed contracts         | `services/contracts.ts`                                                                               | Explicit Phase 2A request/response/lookup types; retain Phase 1B contracts            |
| Development service     | `services/tripOperations.ts`, `services/index.ts`                                                     | No production endpoint invention; adapter remains reset-on-refresh and non-production |
| Operations page         | `components/TripOperationsTable.tsx`, bounded `TripList.tsx` delegation                               | No broad `TripList` rewrite; later route modes remain in the wrapper                  |
| Shared UI               | Existing `components/ui/*` with only necessary compatible extensions                                  | Preserve prior consumers and evidence                                                 |
| Unit/component evidence | `tests/unit/tripOperationsService.test.ts`, `tests/unit/tripOperationsTable.test.tsx`, boundary tests | Search/filter/sort/page/error/cancel/URL/policy coverage                              |
| Routed/manual evidence  | `tests/e2e/trip-operations.spec.ts`, `tests/e2e/visual-phase2a.spec.ts`, evidence README/screenshots  | Three viewports, light/dark, five roles, keyboard and context                         |
| Governance              | Phase 2A plan, traceability, manual ledger, completion report, status and compatibility register      | Phase 2B remains blocked                                                              |

## Preserved behavior

- Phase 1B browser routes, deep links, shell, responsive drawer, focus management, theme, auth boundary, and service normalization
- Phase 1C centralized fixed-role presentation policy and safe denied-route behavior
- Existing trip schedule, full detail, create/edit, assignment, status, cancellation, events, fuel, and compatibility projections unless a Phase 2A list link must carry query context
- Inventory and Billing disabled and non-launchable
- No AI functionality, hard-delete presentation, export, production backend claim, or live real-time claim

## Validation plan

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test:coverage`
- focused Trip Operations unit/component suites
- `npm run test:e2e`
- `npm run test:a11y`
- focused Trip Operations routed and visual Playwright suites
- `npm run build`
- `npm audit --audit-level=moderate`
- static scans for direct adapter/mock imports, physical-delete wording, export/AI claims, Inventory/Billing routes, and duplicated role policy
- manual screenshot review at 1440 x 900, 834 x 1194, and 390 x 844 in light/dark themes for Viewer, Encoder, Dispatcher, Admin, and SuperAdmin

## Implementation outcome

- Workstreams 1 through 9 and the source/test definitions in workstream 10 are implemented within the planned boundary.
- Workstream 11 is complete: traceability, adapter governance, the status ledger, completion report, gap analysis, and responsive/manual ledger are updated. Phase 2B remained blocked throughout Phase 2A implementation.
- `npm run typecheck`, Prettier, ESLint, the cached offline dependency audit, production build, and the Phase 2A static boundary scans pass. ESLint reports 43 inherited warnings outside Phase 2A-owned files and no errors; the build retains the inherited non-blocking chunk-size advisory.
- The focused Phase 2A run passes 30/30. The authoritative coverage run passes 67/67 with 88.37% statements, 77.00% branches, 84.48% functions, and 91.25% lines.
- The approval reconciliation history is preserved: aggregate Playwright execution stopped with `ERR_CONNECTION_REFUSED`, and partial manual review found Driver-column clipping at 1440 x 900. The received approval instruction was therefore not accepted.
- Remediation reproduced the overlap with a geometry regression, compacted desktop-only column minimums, and fixed Actions at 160 px. The edit-visible Dispatcher regression now passes at exactly 1440 x 900.
- Playwright now exclusively owns a dedicated Vite server on strict port 4173. The authoritative complete rerun passes routed E2E 78/78, accessibility 18/18, and visual capture 15/15; post-suite teardown leaves 0 listeners.
- All 30 regenerated role/viewport/theme PNGs were manually inspected and pass. Desktop Driver values remain visible beside permitted Edit; tablet/mobile approved priority and contained scrolling remain intact.
- Adapter ownership, consumers, risks, and removal criteria did not change. Phase 2A remains a non-production read-only projection and frontend permission presentation remains non-authorization.
- The approval-only reconciliation found no current blocking criterion. Jethro's exact `APPROVED: Phase 2A` instruction was accepted on 2026-07-23, and Phase 2A transitioned through `APPROVED` to `COMPLETE`.
- Phase 2B is `NOT_STARTED`, `ELIGIBLE_TO_BEGIN`, and `May start: Yes`; Phase 2C and later remain blocked.

## Stop condition

After the approval-only reconciliation, set Phase 2A to `APPROVED`, then `COMPLETE`; set Phase 2B to `NOT_STARTED`, `ELIGIBLE_TO_BEGIN`, and `May start: Yes`; keep Phase 2C and later blocked; and stop. Do not begin or prepare Phase 2B in this turn.
