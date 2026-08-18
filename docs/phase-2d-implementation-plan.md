# Phase 2D Implementation Plan — Driver and Vehicle Availability and Assignment

## Gate and backend preflight

- Phase 2C: `APPROVED` / `COMPLETE`; Jethro; 2026-07-24; exact instruction `APPROVED: Phase 2C`.
- Phase 2D: `NOT_STARTED`, eligible, `May start: Yes`.
- Phase 2E and later: `NOT_STARTED`, `BLOCKED_BY_PHASE_SEQUENCE`, `May start: No`.
- Current implementation has a development adapter only. See `phase-2d-backend-guarantee-boundary.md`; production atomic-assignment guarantees are not claimed.

## Source classification

| Source                            | Classification               | Use                                                                                      |
| --------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| DEC-004/005/010/011 and final PRD | Approved requirements        | Interval, assignment ledger, repeatable helpers, conflicts, authority, and exclusions.   |
| Phase 0 schema plan               | Approved reconciliation      | Canonical fields, read-only legacy aliases, migration/backfill boundary.                 |
| Phase 1C policy                   | Approved presentation policy | Centralized role behavior only.                                                          |
| Phase 2A–2C records               | Approved prior evidence      | Preserve routing, detail context, Create/Edit ownership, and non-production limitations. |
| Current source/legacy TripList    | Observed behavior            | Inventory/refactor target, never production truth.                                       |

## Planned change areas

- `services/contracts.ts`, a new bounded assignment service, and service registry: typed availability, assignment/reassignment/release, normalized errors, cancellation, and development-only history projection.
- Focused assignment panel/components in approved Trip Operations, Quick/Full Details, and read-only Edit assignment context; no new top-level route.
- Phase 1C central permission policy extensions only where approved action identifiers exist.
- Unit, browser, accessibility, visual, static-boundary, traceability, compatibility, and completion evidence.

## Safety decisions

- Use the half-open `Asia/Manila` planned interval; never revive the legacy same-date rule.
- `trip_assignments` is the only writable assignment source. Direct trip aliases are read-only projections.
- Development conflict simulation is advisory frontend evidence only; production concurrent enforcement remains `PARTIAL` until an authorized backend exists.
- Preserve current data and selections on recoverable conflict/error. Do not add an override.
- Do not implement Phase 2E transitions, cancellation, completion, cancellation-driven release, truck-status controls, schema migrations, or backend endpoints.

## Validation and review strategy

Test interval boundaries, eligibility, repeatable helpers, conflicts, stale versions, history/no-partial mutation, centralized permissions, cancellation, responsive states, and accessibility. Retain visual/manual evidence under `docs/evidence/phase-2d-responsive/`. End Phase 2D at `READY_FOR_REVIEW` / `AWAITING_EXPLICIT_APPROVAL`; do not start Phase 2E.
