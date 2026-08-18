# Phase 2B Responsive and Manual Review Ledger

## Evidence state

- Capture suite: `tests/e2e/visual-phase2b.spec.ts`
- Matrix: five roles x three viewports x two themes x two key detail states = 60 PNGs
- Automated capture: `PASS`; 15/15 Playwright cases
- Manual inspection: `PASS`; all 60 exact regenerated PNGs inspected
- Phase state: `APPROVED`, `COMPLETE`
- Approver: Jethro
- Approval date: 2026-07-24

Each role has four retained images per viewport:

- `01-quick-action-dark`
- `02-full-stops-dark`
- `03-full-activity-light`
- `04-quick-action-light`

On mobile, the Quick action intentionally resolves to Full Details. The `quick-action` mobile images therefore prove the approved mobile priority and absence of a squeezed side panel.

## Viewports

| Project            | Dimensions | Expected Quick behavior                            |
| ------------------ | ---------- | -------------------------------------------------- |
| `chromium-desktop` | 1440 x 900 | bounded in-layout right panel, list usable         |
| `chromium-tablet`  | 834 x 1194 | bounded in-layout right panel, compact list usable |
| `chromium-mobile`  | 390 x 844  | canonical Full Details route                       |

## Manual result matrix

| Role       | Desktop dark/light | Tablet dark/light | Mobile dark/light | Result |
| ---------- | ------------------ | ----------------- | ----------------- | ------ |
| SuperAdmin | PASS               | PASS              | PASS              | PASS   |
| Admin      | PASS               | PASS              | PASS              | PASS   |
| Dispatcher | PASS               | PASS              | PASS              | PASS   |
| Encoder    | PASS               | PASS              | PASS              | PASS   |
| Viewer     | PASS               | PASS              | PASS              | PASS   |

## Inspected criteria

- Quick panel never creates document-level horizontal overflow and remains at or below 420 px.
- Desktop/tablet list identity, filters, rows, pagination, and permitted actions remain usable beside the panel.
- Mobile uses the full routed hierarchy with no squeezed panel or clipped document width.
- Full Details headings, status, development limitation, section controls, and refresh action remain readable.
- Section navigation is horizontally reachable on mobile and provides conventional tab keyboard behavior.
- Selected Stops and unsupported Activity content are brought into the detail scroll context.
- Overview stays mounted while secondary data loads or fails.
- Light/dark surfaces, text, borders, status icons/text, and focus presentation remain legible.
- Viewer exposes no create/edit mutation; the other roles retain only their previously approved presentation.
- No assignment, status, cancellation, event, fuel, export, Inventory, Billing, or AI mutation appears.
- Activity truthfully states the missing approved trip-specific audit source.

## Observations

- Desktop: the panel leaves more than 300 px for the list in the tested shell and has its own labelled keyboard-accessible content scroller.
- Tablet: the panel and list share the compact workspace without document clipping; secondary list columns intentionally reduce by breakpoint.
- Mobile: the header, tabs, stacked Overview cards, and selected section remain touch reachable. The tabs use contained horizontal overflow rather than compressing labels.
- Role differences are limited to the centralized Phase 1C create/edit policy. Detail reads remain consistent across all five roles.
- Current timestamps differ between captures because the development adapter creates runtime freshness; the ledger treats them only as development request facts.

## Repeatable commands

```powershell
npx playwright test tests/e2e/visual-phase2b.spec.ts
npm run test:e2e
npm run test:a11y
```

Phase 2B was approved by Jethro on 2026-07-24 with the exact instruction `APPROVED: Phase 2B` and is `COMPLETE`. Phase 2C is `NOT_STARTED`, eligible to begin, and `May start: Yes`; Phase 2D and every later phase remain blocked. This approval turn does not begin Phase 2C.
