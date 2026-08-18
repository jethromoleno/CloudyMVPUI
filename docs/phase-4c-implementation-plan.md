# Phase 4C - Operational Alerts Implementation Plan

## Gate and decision boundary

- Phase 4B is `COMPLETED` and `APPROVED` by Jethro on 2026-07-27 via `APPROVE PHASE`.
- Phase 4C is selected on 2026-07-27 as the next eligible phase.
- Phase status: `COMPLETED`; approved by Jethro on 2026-07-27.
- DEC-012 prohibits stale thresholds, capacity/safety claims, generic risk scoring, alert resolution, escalation, notifications, and real-time monitoring claims.
- Completion gate: satisfied by Jethro's exact `APPROVE PHASE` instruction on 2026-07-27. Phase 5A is eligible but has not been selected or started.

## Objective

Provide a read-only, factual operational-attention feed through a typed development-only aggregate. It may identify active `RESCUE`/`BACKLOAD` status records and Scheduled trips whose planned start is already past the fixed snapshot time, with direct detail navigation. It must not present automated risk judgement or a workflow to resolve alerts.

## Scope

1. Add a typed development-only attention aggregate service and snapshot contracts.
2. Render a factual attention section on the dashboard for approved dashboard readers, with direct Trip Details drill-through and empty/error states.
3. Retain manual refresh and visible-tab polling without local-edit overwrite.
4. Add unit, browser, a11y, and five-role/viewport/theme evidence.

## Acceptance traceability

| ID        | Requirement                                                                                                         | Planned evidence                       |
| --------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| P4C-AC-01 | Starts only after Phase 4B approval and explicit selection.                                                         | Tracker and plan.                      |
| P4C-AC-02 | Attention feed uses a typed development-only aggregate boundary.                                                    | Contracts, service, unit/static tests. |
| P4C-AC-03 | Items are only factual active exception status or planned-start-passed Scheduled conditions and drill into details. | Unit/browser tests.                    |
| P4C-AC-04 | No thresholds, capacity/safety, risk scoring, resolution, escalation, notification, or real-time claim/action.      | Static scan and browser checks.        |
| P4C-AC-05 | Refresh and accessible empty/error state remain safe.                                                               | Browser/a11y tests.                    |
| P4C-AC-06 | Five roles, three viewports, and themes have responsive evidence.                                                   | 30-image matrix.                       |

## Exclusions

- Alert lifecycle, acknowledgement/dismissal/resolution, reason capture, notifications, escalation, subscriptions, thresholds, SLA or risk score.
- Capacity, safety, driver-hours, weight, route, or compliance conclusions.
- Production alert service, persistence, authorization/RLS enforcement, audit integrity, realtime transport, reporting, and exports.

## Verification results

- TypeScript: PASS.
- Focused unit suite: PASS, 4 tests.
- Focused dispatcher drill-through browser test and dashboard accessibility check: PASS.
- 30-case responsive suite: PASS; 30 captures generated with representative desktop/tablet/mobile review.
- Static scan and `git diff --check`: PASS. Format check has only the inherited Phase 3C plan warning.

## Review gate

Phase 4C is `COMPLETED - USER APPROVED` on 2026-07-27 by Jethro via exact instruction `APPROVE PHASE`. Phase 5A is eligible but remains unstarted.
