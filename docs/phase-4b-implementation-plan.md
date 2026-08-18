# Phase 4B - Manager/Admin Dashboard and Analytics Implementation Plan

## Gate

- Phase 4A is `COMPLETED` and `APPROVED` by Jethro on 2026-07-27 via `APPROVE PHASE`.
- Phase 4B is the next eligible phase and is selected on 2026-07-27.
- Phase status: `COMPLETED`; approved by Jethro on 2026-07-27.
- Completion gate: satisfied by Jethro's exact `APPROVE PHASE` instruction on 2026-07-27. Phase 4C is eligible but has not been selected or started.

## Objective

Add a manager/admin analytics presentation to the existing dashboard through a typed, development-only aggregate boundary. It provides factual trip-status, completed-window, fuel-total, and client-activity summaries without creating reports, exports, alerts, risk scoring, or production claims.

## Scope

1. Introduce a typed manager analytics aggregate service with an explicitly labeled development-mock source.
2. Render analytics only for Admin and SuperAdmin, preserving the existing operational dashboard for all approved dashboard readers and adding no permission identifiers.
3. Show factual current-window and previous-window completed counts, total returned fuel quantities/costs, factual status counts, and ranked client activity from the aggregate snapshot.
4. Reuse Phase 4A manual refresh and visible-tab polling; show safe loading/error/last-snapshot behavior.
5. Produce unit, browser, accessibility, and five-role/three-viewport/light-dark responsive evidence.

## Acceptance traceability

| ID        | Requirement                                                                                           | Planned evidence                       |
| --------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------- |
| P4B-AC-01 | Phase 4B starts only after Phase 4A approval and explicit selection.                                  | Plan and tracker.                      |
| P4B-AC-02 | Analytics read a typed development-only aggregate boundary, not component-side joins.                 | Contracts, service, unit/static tests. |
| P4B-AC-03 | Admin and SuperAdmin receive factual analytics; Dispatcher, Encoder, and Viewer do not.               | Browser role tests.                    |
| P4B-AC-04 | Completed-window, fuel, status, and client summaries use documented factual values and period labels. | Unit tests and rendered checks.        |
| P4B-AC-05 | Refresh/polling and accessible loading/error status are retained.                                     | Browser/a11y tests.                    |
| P4B-AC-06 | Five-role, three-viewport, light/dark visual evidence is generated and reviewed.                      | 30-image matrix.                       |
| P4B-AC-07 | Exports/reports, Phase 4C alerts, and production guarantees remain excluded.                          | Static scan and records.               |

## Exclusions

- Executable CSV/PDF export, report builder, billing/invoicing, cost allocation, forecasting, or configurable reporting.
- Alert lifecycle, stale/risk thresholds, escalation, notifications, capacity/safety validation, or real-time monitoring claims (Phase 4C or separately approved work).
- Production aggregate endpoints, persistence, authorization/RLS enforcement, audit integrity, concurrency guarantees, and realtime transport.

## Verification results

- TypeScript: PASS.
- Focused unit/policy suite: PASS, 26 tests.
- Focused Admin/Dispatcher browser and Admin accessibility suite: PASS, 3 tests.
- 30-case responsive suite: PASS; 30 captures generated, with representative Admin desktop/tablet/mobile review.
- Static scope scan and `git diff --check`: PASS. Format check has only the inherited Phase 3C plan warning.

## Review gate

Phase 4B is `COMPLETED - USER APPROVED` on 2026-07-27 by Jethro via exact instruction `APPROVE PHASE`. Phase 4C is eligible but remains unstarted.
