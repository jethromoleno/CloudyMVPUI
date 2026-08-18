# Phase 1B Responsive Routed-Shell Evidence

## Review Environment

- Review date: 2026-07-22
- Browser: Playwright Chromium, followed by manual screenshot inspection
- Desktop: 1440 x 900
- Tablet regression viewport: 834 x 1194
- Mobile regression viewport: 390 x 844
- Themes: Light and dark
- Routed surfaces: Dashboard, Trip Operations, and Trip Detail
- Supporting shell states: Desktop collapsed sidebar plus tablet/mobile overlay drawer

The evidence generator is `tests/e2e/visual-phase1b.spec.ts`. It authenticates through the isolated development adapter, follows browser routes, and captures the final rendered UI. All 21 PNGs were manually inspected after generation.

## Manual Matrix

| Routed surface                              | Desktop light | Desktop dark | Tablet light | Tablet dark | Mobile light | Mobile dark | Result                                                                                                                                    |
| ------------------------------------------- | ------------- | ------------ | ------------ | ----------- | ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard and AppNavbar                     | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Navbar controls remain visible; content receives the full compact viewport instead of being compressed by a fixed sidebar.                |
| Trip Operations list and URL-backed filters | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Filter controls reflow, list/table content remains reachable, and compact view defaults to the supported list presentation.               |
| Routed Trip Detail                          | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Desktop retains the in-layout list/detail panel; tablet/mobile prioritize the full-width detail card and reset to its top on route entry. |

## Navigation Pattern Evidence

| Viewport | Pattern                                                                 | Evidence                                                                                  | Result |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------ |
| Desktop  | Expanded sidebar with user-controlled collapsed rail                    | [`02a-dashboard-collapsed-light.png`](chromium-desktop/02a-dashboard-collapsed-light.png) | PASS   |
| Tablet   | Focus-managed overlay drawer over a full-width workspace                | [`02a-navigation-drawer-light.png`](chromium-tablet/02a-navigation-drawer-light.png)      | PASS   |
| Mobile   | 88vw overlay drawer with visible backdrop and unobstructed close region | [`02a-navigation-drawer-light.png`](chromium-mobile/02a-navigation-drawer-light.png)      | PASS   |

Automated keyboard evidence supplements the screenshots: the drawer focuses its first action, traps forward/reverse tab movement, closes on Escape, and restores focus to the menu trigger. The desktop collapse/expand control is also exercised.

## Screenshot Inventory

Each viewport directory contains six theme/surface captures. Desktop also contains a collapsed-sidebar capture; tablet and mobile each contain a drawer capture.

- `chromium-desktop/`: 7 PNGs
- `chromium-tablet/`: 7 PNGs
- `chromium-mobile/`: 7 PNGs
- Total: 21 PNGs

Representative files:

- Dashboard: [`chromium-desktop/01-dashboard-dark.png`](chromium-desktop/01-dashboard-dark.png), [`chromium-tablet/02-dashboard-light.png`](chromium-tablet/02-dashboard-light.png), [`chromium-mobile/01-dashboard-dark.png`](chromium-mobile/01-dashboard-dark.png)
- Trip Operations: [`chromium-desktop/03-trips-light.png`](chromium-desktop/03-trips-light.png), [`chromium-tablet/04-trips-dark.png`](chromium-tablet/04-trips-dark.png), [`chromium-mobile/03-trips-light.png`](chromium-mobile/03-trips-light.png)
- Trip Detail: [`chromium-desktop/05-trip-detail-dark.png`](chromium-desktop/05-trip-detail-dark.png), [`chromium-tablet/06-trip-detail-light.png`](chromium-tablet/06-trip-detail-light.png), [`chromium-mobile/05-trip-detail-dark.png`](chromium-mobile/05-trip-detail-dark.png)

## Comparison with Retained Phase 1A Evidence

| Retained Phase 1A finding                                                             | Phase 1B comparison                                                                                                                                     | Outcome                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| P1A-VIS-01: fixed 256 px sidebar left roughly 134 px for the 390 px mobile workspace. | The sidebar is absent from the normal mobile layout and opens as an overlay drawer. AppNavbar and dashboard cards use the viewport width.               | RESOLVED                               |
| P1A-VIS-02: 834 px tablet shell compressed AppNavbar and operational content.         | Tablet uses the overlay drawer; the top bar remains within 834 px and operational content/table overflow remains reachable.                             | RESOLVED                               |
| P1A-VIS-03: application permission-denied UI was not directly reachable.              | `/trip-scheduling/settings` presents a safe denied state to the development Viewer role after direct-link authentication; browser smoke tests cover it. | RESOLVED_FOR_PHASE_1B_PRESENTATION     |
| P1A-VIS-04: retained AI copy, mock-password UI, and hard-delete wording.              | AI copy/provider wiring and password domain/settings fields are removed; settings describe provider-owned credentials and development-only behavior.    | RESOLVED_WITH_LATER_BACKEND_AUTH_GATED |

## Findings Corrected During Review

| ID          | Finding                                                                               | Correction                                                                                       | Final result |
| ----------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------ |
| P1B-VIS-01  | Routed mobile detail inherited the list's internal scroll position.                   | Reset the trip workspace scroll container when route mode or record id changes.                  | PASS         |
| P1B-VIS-02  | Compact detail routes placed the complete filter panel before the selected record.    | Hide list filters below `xl` on routed detail views while retaining desktop list/detail context. | PASS         |
| P1B-A11Y-01 | The shared dark muted-text token missed WCAG AA contrast on dashboard/table surfaces. | Raised the ordered Carbon 300-600 values and reran axe at all three viewports.                   | PASS         |

## Outcome

All required viewport/theme/surface cells pass manual inspection. The Phase 1A tablet/mobile shell failures are resolved for the routed Phase 1B surfaces. This evidence does not claim Firefox, Safari/iOS, screen-reader, production authorization, or backend persistence validation; those remain later quality/backend gates.
