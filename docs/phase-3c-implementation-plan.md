# Phase 3C — Customer and Reference Data Implementation Plan

## Gate

- Selected by: Jethro
- Selection date: 2026-07-27
- Prerequisite: Phase 3B is `COMPLETED` and `APPROVED`.
- Phase status: `COMPLETED - USER APPROVED`.
- Approval evidence: Jethro approved `APPROVE PHASE for Phase 3C.` on 2026-07-27.
- Successor gate: Phase 3D is eligible but must not begin until explicitly selected.

## In-scope outcome

Provide a routed, permission-aware Reference Data workspace for the records used by trip workflows:

1. Clients (the existing customer alias), consignees, locations, and internal client codes can be listed, searched, created, and edited by SuperAdmin and Admin.
2. SuperAdmin, Admin, Dispatcher, Encoder, and Viewer can read the same historical reference records according to the existing `REFERENCE_DATA.READ` policy; non-managers receive no create or edit control.
3. Active state can be changed for mutable reference records. Inactive values remain visible in this management/history surface and are not returned from new-trip selector lookups.
4. Load types are shown as the DEC-008 immutable catalog. This phase does not provide a UI to alter their machine codes or labels.
5. New code uses a typed `ReferenceDataService` over the existing development adapter. It is explicitly non-production and makes no persistence, authorization, concurrency, or audit claim.

## Acceptance traceability

| ID        | Requirement                                                                                                                                              | Planned evidence                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| P3C-AC-01 | Phase 3C starts only after the approved Phase 3B gate and explicit selection.                                                                            | This plan and status tracker.                                       |
| P3C-AC-02 | Clients/customers, consignees, locations, internal client codes, and load types are available through a typed service boundary.                          | `ReferenceDataService` unit tests and boundary scan.                |
| P3C-AC-03 | SuperAdmin/Admin can manage mutable reference data; Dispatcher/Encoder/Viewer have read-only presentation.                                               | Central policy route/navigation/action tests and browser role test. |
| P3C-AC-04 | Reference relationships and required fields are validated; duplicate business codes/names are rejected by the development service.                       | Unit tests.                                                         |
| P3C-AC-05 | Inactive historical values remain legible and new-trip selector lookups return only active choices.                                                      | Service tests and lookup behavior.                                  |
| P3C-AC-06 | Load types use the DEC-008 catalog and are read-only in this workspace.                                                                                  | UI and service tests.                                               |
| P3C-AC-07 | The route, dialogs, states, and responsive presentation are keyboard-accessible and visually reviewed across all roles, supported viewports, and themes. | Focused Playwright/axe checks and Phase 3C responsive evidence.     |
| P3C-AC-08 | Adapter limitations and the Phase 3C review gate remain explicit; Phase 3D requires explicit selection before work begins.                                | Compatibility register, verification report, and status tracker.    |

## Explicit exclusions

- Production lookup endpoints, persistence, authorization, RLS, optimistic concurrency, idempotency, and audit correlation.
- Any change to the immutable load-type catalog.
- Trip mutation behavior beyond consuming the existing active lookup behavior.
- Users, roles, permissions, settings, audit-log, dashboards, alerts, exports, Inventory, and Billing work.
