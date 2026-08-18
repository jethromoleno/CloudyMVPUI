# Phase 2D Assignment Traceability

## Gate provenance

Phase 2C is `APPROVED` and `COMPLETE`: exact instruction `APPROVED: Phase 2C`; approver Jethro; date 2026-07-24. Phase 2D is `APPROVED` and `COMPLETE`: exact instruction `APPROVED: Phase 2D`; approver Jethro; date 2026-07-27. Phase 2E is eligible but not started; Phase 2F and later remain blocked.

## Canonical assignment model

| Concern         | Approved contract                              | Phase 2D boundary                                                                                                   |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Source of truth | `trip_assignments`                             | Direct `driver_id`, `truck_id`, `helper1_employee_id`, and `helper2_employee_id` become read-only projections only. |
| Roles           | `DRIVER`, repeatable `HELPER`, `TRUCK`         | Exactly one resource target per record; driver/helper collision and duplicate helpers are rejected.                 |
| Interval        | `Asia/Manila`, `[start, end)`                  | End is later than start; adjacent assignments are allowed; true overlap conflicts.                                  |
| Availability    | authoritative assignments plus eligibility     | `driver_availability` is only an eligibility input, not a ledger.                                                   |
| Permissions     | centralized Phase 1C policy                    | SuperAdmin/Admin/Dispatcher mutation; Encoder/Viewer read-only presentation.                                        |
| Conflicts       | `409 ASSIGNMENT_CONFLICT`                      | Preserve selection, explain factual conflict, refresh affected availability; no override.                           |
| History         | assigned/released fields on assignment records | Deterministic current/history projections; failed operations add no history.                                        |

## Acceptance mapping

| Acceptance criteria | Implementation evidence                                                                                         | Status                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| P2D-AC-03 to AC-04  | `services/contracts.ts`, `services/tripAssignments.ts`, focused interval tests                                  | PASS for development adapter               |
| P2D-AC-05 to AC-06  | availability resources, eligibility state, repeatable helper and driver/helper collision checks                 | PASS for development adapter               |
| P2D-AC-07 to AC-10  | `components/TripAssignmentWorkflow.tsx`, confirmation/release/history, normalized conflict/stale error behavior | PASS for development adapter               |
| P2D-AC-11           | `phase-2d-backend-guarantee-boundary.md`                                                                        | PARTIAL — no authorized production backend |
| P2D-AC-12 to AC-13  | Phase 1C centralized policy presentation; cancellation-safe request contract                                    | PASS for frontend contract                 |
| P2D-AC-14           | `tests/e2e/visual-phase2d.spec.ts`, `docs/evidence/phase-2d-responsive/README.md`                               | PASS for frontend evidence                 |
| P2D-AC-15           | `docs/compatibility-adapters.md`                                                                                | PASS                                       |
| P2D-AC-16           | Phase 2D plan and completion report exclusions                                                                  | PASS                                       |

## Evidence boundary

The development adapter can prove typed frontend behavior only. Production atomicity, durable history, backend authorization, RLS, request correlation, and vehicle-status side effects remain backend-dependent and are tracked in `phase-2d-backend-guarantee-boundary.md`.
