# Phase 1A Manual Visual Review Evidence

## Review Environment

- Review date: 2026-07-22
- Phase 1A approval: APPROVED by Jethro on 2026-07-22 via exact instruction `APPROVED: Phase 1A`
- Phase 1A completion status: COMPLETE
- Browser surface: Codex in-app Chromium browser
- Desktop viewport: 1440 x 900
- Tablet viewport: 834 x 1194
- Mobile viewport: 390 x 844
- Themes: Light and dark
- Application URL: `http://127.0.0.1:3000/`
- Review-only shared-state URL: `http://127.0.0.1:3000/tests/visual/phase1a-review.html`
- Review harness production status: Test-only; not linked from production UI and not a Phase 1B route

## Visual Matrix

The matrix below records 48 manual evaluations. `PARTIAL` and `FAIL` results are retained as evidence and are not reclassified as passes.

| Surface                       | Desktop light | Desktop dark | Tablet light | Tablet dark | Mobile light | Mobile dark | Evidence/result                                                                                                                                                                                       |
| ----------------------------- | ------------- | ------------ | ------------ | ----------- | ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login                         | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Centered form, labels, focus treatment, contrast, and controls remain legible without overlap.                                                                                                        |
| Hub                           | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Cards reflow to one column on mobile; the mobile header clipping found during review was corrected in `components/Hub.tsx` and rechecked.                                                             |
| AppNavbar                     | PASS          | PASS         | PARTIAL      | PARTIAL     | FAIL         | FAIL        | Desktop is legible. Tablet content is compressed and horizontally clipped. Mobile is obscured by the fixed 256 px sidebar. Phase 1B owns the responsive shell correction.                             |
| Dashboard                     | PASS          | PASS         | PARTIAL      | PARTIAL     | FAIL         | FAIL        | Desktop layout is usable. Tablet table/navigation require horizontal handling. Mobile workspace content is reduced to an unusable strip by the current shell.                                         |
| User Management confirmation  | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Dialog remains centered, readable, keyboard-focused, and free of action overlap; mobile actions stack. Underlying User Management remains subject to the shell limitation.                            |
| Permission-denied state       | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Shared state passes in the review harness. The live non-admin branch is not directly reachable because current state navigation hides Settings; direct-route verification is a Phase 1B prerequisite. |
| Coming Soon                   | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Inventory and Billing remain disabled and non-launchable in Hub/AppNavbar; icon, text, and status cue are present. Shared state also passes in the harness.                                           |
| Shared UI states and controls | PASS          | PASS         | PASS         | PASS        | PASS         | PASS        | Loading, empty, no-results, error, permission-denied, Coming Soon, blocked, buttons, fields, filters, statuses, and DataTable evidence is legible and responsive.                                     |

## Screenshot Inventory

There are 37 retained PNG files. The naming convention is `<viewport>-<theme>-<surface>.png`.

| Evidence group                   | Files | Representative evidence                                                                                                                                                  |
| -------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login                            |     6 | [`desktop-dark-login.png`](desktop-dark-login.png), [`mobile-light-login.png`](mobile-light-login.png)                                                                   |
| Hub and Coming Soon              |     6 | [`desktop-light-hub.png`](desktop-light-hub.png), [`mobile-dark-hub-viewport.png`](mobile-dark-hub-viewport.png)                                                         |
| AppNavbar and Dashboard          |     6 | [`desktop-dark-appnavbar-dashboard.png`](desktop-dark-appnavbar-dashboard.png), [`mobile-light-appnavbar-dashboard.png`](mobile-light-appnavbar-dashboard.png)           |
| User Management and confirmation |     7 | [`desktop-light-user-management.png`](desktop-light-user-management.png), [`mobile-dark-user-management-confirmation.png`](mobile-dark-user-management-confirmation.png) |
| Shared states and controls       |    12 | [`tablet-dark-shared-states.png`](tablet-dark-shared-states.png), [`mobile-light-shared-controls.png`](mobile-light-shared-controls.png)                                 |

## Discovered Issues and Accepted Limitations

| ID         | Finding                                                                                                                                                                | Disposition                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1A-VIS-01 | The fixed desktop sidebar leaves only about 134 px for the workspace at 390 px, making AppNavbar/Dashboard unusable.                                                   | Accepted only as a Phase 1A scope limitation; not accepted for production. Phase 1B must implement responsive application-shell behavior before routed mobile workspace acceptance.           |
| P1A-VIS-02 | At 834 px the shell and DataTable remain visible but the workspace/navbar are compressed and require better overflow and navigation behavior.                          | Accepted only as a Phase 1A scope limitation. Phase 1B must define tablet shell behavior and preserve table usability.                                                                        |
| P1A-VIS-03 | The application-level permission-denied branch cannot be reached through current non-admin state navigation because Settings is hidden and URL routing does not exist. | Shared state visually passes. Phase 1B must add direct-route permission/not-found/error states; Phase 1C remains responsible for permission-aware navigation/action enforcement.              |
| P1A-VIS-04 | Existing Hub copy still says `AI analysis`, and existing Settings exposes mock passwords and hard-delete wording.                                                      | Not introduced by Phase 1A and not production-accepted. DEC-016 removal and DEC-002 auth/session isolation are explicit Phase 1B prerequisites; user lifecycle cleanup continues in Phase 3D. |
| P1A-VIS-05 | Manual evidence in this phase used the available Chromium browser only.                                                                                                | Non-blocking for Phase 1A. Firefox, Safari/iOS, screen-reader, and expanded manual browser coverage remain required by DEC-015 before Phase 5 approval.                                       |

## Review Outcome

The Phase 1A shared token/component surfaces pass the requested light/dark and responsive visual review. Jethro approved Phase 1A on 2026-07-22, and Phase 1A is `COMPLETE`. The current routing/application-shell implementation still does not pass tablet/mobile workspace acceptance; that limitation is carried into Phase 1B and is not reclassified as production-ready. Phase 1B is eligible but remained `NOT_STARTED` during this approval-recording turn.
