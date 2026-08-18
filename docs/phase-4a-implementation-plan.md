# Phase 4A — Dispatcher Dashboard Implementation Plan

## Gate

- Phase 3E is `COMPLETED` and `APPROVED`.
- Phase 4A is the next eligible phase and is selected on 2026-07-27.
- Phase status: `COMPLETED`; approved by Jethro on 2026-07-27.
- Completion gate: satisfied by Jethro's exact `APPROVE PHASE` instruction on 2026-07-27. Phase 4B is eligible but has not been selected or started.

## Objective

Deliver a dispatcher-facing operational dashboard backed by a typed, development-only aggregate boundary. It must show factual dispatch counts, active trip context, available-resource summaries, a manual refresh state, and role-appropriate presentation without implying real-time monitoring, capacity safety, analytics, or alert-resolution workflows.

## Scope

1. Replace dashboard-specific direct data-adapter reads and component-side legacy joins with a typed dashboard service and aggregate snapshot.
2. Show factual dispatcher operational totals and active trip rows, with direct detail navigation and useful no-results/error states.
3. Present vehicle and driver availability as counts only; do not claim capacity validation or safety.
4. Add manual refresh feedback and bounded 60-second visible-tab polling that never overwrites local edits because the dashboard has no local edit state.
5. Preserve existing permission policy: every approved role may read the dashboard, while the dispatcher receives the operational presentation. Do not add permissions.
6. Remove/avoid Phase 4C alert-resolution behavior and unsupported language such as real-time, optimal, overdue/escalated risk, or capacity-safe.

## Acceptance traceability

| ID        | Requirement                                                                                      | Planned evidence                                  |
| --------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| P4A-AC-01 | Phase starts only after Phase 3E completion.                                                     | Tracker and plan.                                 |
| P4A-AC-02 | Dashboard uses a typed development-only aggregate boundary.                                      | Contracts, service, unit/static tests.            |
| P4A-AC-03 | Dispatcher can inspect factual active work and drill into authorized trip details.               | Browser tests.                                    |
| P4A-AC-04 | Counts and resource summaries are factual and do not make capacity, real-time, or safety claims. | Unit tests and prohibited-language scan.          |
| P4A-AC-05 | Manual refresh and visible-tab polling have accessible status and safe loading/error states.     | Browser/a11y tests.                               |
| P4A-AC-06 | Five-role, three-viewport, light/dark responsive evidence passes review.                         | 30-image matrix.                                  |
| P4A-AC-07 | Phase 4B/4C work and production limitations remain explicit.                                     | Report, summary, tracker, compatibility register. |

## Exclusions

- Manager/Admin analytics, trends, financial/fuel reporting, exports, and configurable reports (Phase 4B).
- Operational alert resolution, alert lifecycle, stale/risk thresholds, escalation, notifications, and real-time monitoring claims (Phase 4C or separately approved work).
- Production APIs, persistence, authorization, RLS, transactionality, audit integrity, and realtime transport.

## Verification results

- `npm run typecheck`: PASS.
- Focused dashboard/service and permission unit tests: PASS, 24 tests.
- Focused dispatcher browser and accessibility checks: PASS, 3 Chromium desktop tests, including active-trip drill-through.
- `npm run test:visual:phase4a`: PASS, 30 Playwright cases; 30 PNGs were generated for five roles, three viewports, and light/dark themes. Representative desktop, tablet, and mobile dispatcher captures were visually checked.
- Typed-boundary/prohibited-language scan: PASS; no direct dashboard component adapter reads or deferred alert/capacity language found in the Phase 4A dashboard surface.
- `git diff --check`: PASS. `npm run format:check`: PASS WITH INHERITED WARNING limited to the pre-existing Phase 3C plan formatting issue.

## Review gate

Phase 4A is `COMPLETED - USER APPROVED` on 2026-07-27 by Jethro via exact instruction `APPROVE PHASE`. Phase 4B is eligible but remains unstarted.
