# Phase 2A Responsive and Manual Review Ledger

## Evidence state

- Capture suite: `tests/e2e/visual-phase2a.spec.ts`
- Required matrix: five roles x three viewports x light/dark = 30 PNGs
- Historical execution result: `PASS` on 2026-07-23; 15/15 Playwright cases generated all 30 required PNGs
- Approval-reconciliation result before remediation: `PARTIAL`; the aggregate run passed 10/15 before `ERR_CONNECTION_REFUSED`, the independent mobile rerun passed 5/5, and the partially inspected matrix found desktop Driver clipping.
- Post-remediation capture result: `PASS`; 15/15 cases completed in one run and regenerated all 30 required PNGs.
- Post-remediation manual inspection result: `PASS`; all 30 exact PNGs were inspected after regeneration.
- Final approval: Jethro accepted `APPROVED: Phase 2A` on 2026-07-23 after the approval-only reconciliation confirmed no current blocking visual or responsive failure.
- Integrity rule: a cell is marked PASS only because the current Phase 2A implementation rendered successfully and its exact role, viewport, and theme image was inspected.

## Retained capture paths

The automated suite writes each image beneath a viewport project directory using `{role}-01-operations-dark.png` and `{role}-02-operations-light.png`.

| Viewport | Playwright project | Dimensions |
| -------- | ------------------ | ---------- |
| Desktop  | `chromium-desktop` | 1440 x 900 |
| Tablet   | `chromium-tablet`  | 834 x 1194 |
| Mobile   | `chromium-mobile`  | 390 x 844  |

## Post-remediation manual review matrix

| Role       | Desktop dark | Desktop light | Tablet dark | Tablet light | Mobile dark | Mobile light |
| ---------- | ------------ | ------------- | ----------- | ------------ | ----------- | ------------ |
| SuperAdmin | PASS         | PASS          | PASS        | PASS         | PASS        | PASS         |
| Admin      | PASS         | PASS          | PASS        | PASS         | PASS        | PASS         |
| Dispatcher | PASS         | PASS          | PASS        | PASS         | PASS        | PASS         |
| Encoder    | PASS         | PASS          | PASS        | PASS         | PASS        | PASS         |
| Viewer     | PASS         | PASS          | PASS        | PASS         | PASS        | PASS         |

## Approval-reconciliation matrix before remediation

| Role       | Desktop dark | Desktop light | Tablet dark | Tablet light | Mobile dark | Mobile light |
| ---------- | ------------ | ------------- | ----------- | ------------ | ----------- | ------------ |
| SuperAdmin | FAIL         | FAIL          | PASS        | NOT_TESTED   | PASS        | NOT_TESTED   |
| Admin      | FAIL         | NOT_TESTED    | NOT_TESTED  | NOT_TESTED   | PASS        | NOT_TESTED   |
| Dispatcher | FAIL         | NOT_TESTED    | NOT_TESTED  | NOT_TESTED   | NOT_TESTED  | NOT_TESTED   |
| Encoder    | FAIL         | NOT_TESTED    | NOT_TESTED  | NOT_TESTED   | NOT_TESTED  | NOT_TESTED   |
| Viewer     | PASS         | PASS          | NOT_TESTED  | PASS         | NOT_TESTED  | PASS         |

## Review checklist for each cell

- Trip Operations heading, record count, development-only notice, freshness, and manual Refresh are visible.
- Search and approved filters are reachable; mobile filter disclosure has correct expanded state and touch targets.
- Default view excludes Cancelled; status/search can deliberately reveal historical Cancelled rows.
- Trip advice, client/consignee, route, pickup, assignments, load, status, and visible Open action follow the viewport priority.
- Table overflow is contained inside the page surface and does not create document-level horizontal clipping.
- Sort state is visible and available to assistive technology; rows and the Open action are keyboard reachable.
- Viewer has no create/edit action. Other roles expose only the pre-existing create/edit presentation allowed by the centralized policy.
- No assignment, status-change, cancel, delete, export, saved-view, configurable-column, or Phase 2B quick-detail action is present.
- Light/dark contrast and focus visibility remain usable.

## Manual review observations

- Desktop: the full dense table, all approved filters, freshness controls, contained table width, pagination, and permitted row actions remain readable in both themes. Driver names are fully visible beside the fixed-width Actions column for edit-capable roles at 1440 x 900.
- Tablet: the compact shell and two-column filter layout avoid document clipping; secondary columns are deliberately reduced while identity, client, route, pickup, and actions remain available.
- Mobile: filters expand into one touch-friendly column; the page scrolls vertically; table overflow remains inside the labelled table scroller; trip identity, client, route, Open, pagination, and role-permitted action presentation remain reachable.
- Roles: Viewer has no create/edit presentation; Encoder, Dispatcher, Admin, and SuperAdmin follow the centralized Phase 1C presentation policy. No role-specific logic is duplicated in the component.
- Themes: light and dark surfaces preserve legibility, status meaning, borders, focus affordances, and the development-data warning.
- Scope: no assignment, status-change, cancel, delete, export, saved-view, configurable-column, or Phase 2B quick-detail action appears.
- Capture QA: the first mobile full-page capture exposed that the application used an internal scroll region. Phase 2A added the missing vertical page scroller and the capture harness now expands that region only for evidence capture, so the final retained PNGs show the complete workflow instead of a clipped top viewport.
- Remediation history: the earlier partial matrix and clipping failures above are retained as history. The current all-PASS matrix was recorded only after the layout regression passed, the 15/15 suite regenerated the PNGs, and every regenerated image was inspected.

## Phase 1B responsive-regression comparison

The Phase 1B shell baseline remains intact: desktop keeps its sidebar, tablet/mobile use the compact navbar and drawer affordance, and no document-level horizontal clipping reappears. Phase 2A adds only the operations-page internal scroll and contained table scroller required for the denser list. The routed shell, theme toggle, navigation affordances, and viewport widths remain consistent with the passing Phase 1B evidence.

## Repeatable commands

```powershell
npx playwright test tests/e2e/visual-phase2a.spec.ts
npm run test:e2e
npm run test:a11y
```

Historical commands completed successfully in the approved local child-process context. In the earlier 2026-07-23 approval reconciliation, aggregate Playwright runs lost the web server with `ERR_CONNECTION_REFUSED`; an independent mobile visual rerun passed 5/5. After remediation, the complete visual run passed 15/15, the manual matrix passed 30/30, and Playwright left zero listeners on its dedicated strict port after teardown.

Jethro approved Phase 2A on 2026-07-23 with the exact instruction `APPROVED: Phase 2A`; Phase 2A is `COMPLETE`. Phase 2B is `NOT_STARTED`, `ELIGIBLE_TO_BEGIN`, and `May start: Yes`. Phase 2C and later remain blocked. This approval-only reconciliation performed no Phase 2B implementation.
