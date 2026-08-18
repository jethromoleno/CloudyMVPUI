# Phase 1B Implementation Plan

## Phase Gate

- Active phase: Phase 1B - Routing, Application Shell, and Service Boundary
- Phase 1A: APPROVED and COMPLETE
- Phase 1B eligibility: Confirmed; `May start: Yes`
- Blocking requirement conflict: None found
- Phase 1C authorization: Not granted; `May start: No`

## Source Classification

| Source                                                     | Classification                                                                                  | Material Phase 1B requirements used                                                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User-supplied Phase 1B goal attachment                     | APPROVED_PHASE_SCOPE                                                                            | Active scope, P1B-AC-01 through P1B-AC-14, required checks/evidence, exclusions, and mandatory approval stop                                                            |
| Root `PRD.md`                                              | APPROVED_FINAL_REQUIREMENT_BASELINE                                                             | Approved routes, memory-only session boundary, typed API boundary, disabled future modules, compatibility governance, and no-AI MVP boundary                            |
| `docs/phase-0-decision-log.md`                             | APPROVED_RESOLVED_STAKEHOLDER_DECISIONS                                                         | DEC-002 credential/session lifecycle; DEC-011 typed service/error/paging/refresh contract; DEC-014 incremental routing; DEC-016 AI/secret removal                       |
| `docs/phase-0-resolved-decisions-summary.md`               | DERIVED_REQUIREMENT_SUMMARY                                                                     | Concise approved constraints and downstream ownership boundaries                                                                                                        |
| `docs/phase-1a-completion-report.md`                       | APPROVED_PHASE_COMPLETION_EVIDENCE                                                              | Phase 1A approval, retained shell failures, current test baseline, and Phase 1B prerequisites                                                                           |
| `docs/ui-implementation-status.md`                         | CURRENT_PHASE_GATE_RECORD                                                                       | Phase 1A complete, Phase 1B eligible, no blocking gate, and carried-forward limitations                                                                                 |
| `.docs/Cloudy Fleet Management UI-UX Design Blueprint.pdf` | APPROVED_REQUIREMENT for confirmed constraints; PROPOSAL where narrowed by the PRD/Decision Log | Three-part shell, adaptive drawer/rail behavior, table overflow, contextual panels, keyboard/focus behavior, light/dark support, and preservation of existing workflows |
| `REPOSITORY_CONTEXT_PACKAGE.md`                            | OBSERVED_IMPLEMENTATION_BASELINE                                                                | Existing React/Vite architecture, `currentView` navigation, mock-only service, credential/AI conflicts, feature ownership, and compatibility fields                     |
| Current source and tests                                   | OBSERVED_IMPLEMENTATION_BASELINE                                                                | Actual component state, service calls, route absence, shell layout, existing tests, and retained Phase 1A behavior                                                      |

The authority order is the goal attachment, approved Decision Log, approved final PRD, approved phase records, then the Blueprint and observed implementation. Blueprint proposals that imply later feature redesign, permission enforcement, realtime behavior, exports, alerts, or AI are not Phase 1B requirements.

## Bounded Workstreams

1. Add the exact approved route family for Login, Hub, Dashboard, Trips, Trip create/detail/edit, Trucks, Employees, and Settings. Keep Schedule addressable through Trips URL state. Add safe denied, loading, service-error, invalid-record, and unknown-route states.
2. Replace `currentView` navigation with route-derived navigation after route tests pass. Preserve dashboard drill-in and list query context in the URL.
3. Replace the fixed sidebar with an expanded/collapsed desktop shell and focus-managed overlay drawer on tablet/mobile. Prevent top-bar and workspace clipping; retain deliberate table scrolling and responsive right panels.
4. Introduce typed service, error, paging/filter/order/refresh/cancellation, workspace-snapshot, and auth/session contracts. Route components through the boundary and keep the in-memory adapter explicitly development-only.
5. Remove password properties and settings fields from domain users. Isolate transient sign-in credentials in the development auth adapter, keep session material memory-only, and fail closed outside development until live Supabase is separately authorized.
6. Remove Gemini dependency, provider client, Vite key injection, AI analysis copy, and unsupported browser promises without adding an AI replacement.
7. Add unit/component/browser/static tests for route behavior, deep links, URL state, unsaved changes, shell accessibility, adapter contracts, error normalization, auth isolation, and disabled modules.
8. Run the full available quality suite and repeat the 1440 x 900, 834 x 1194, and 390 x 844 light/dark manual matrix against routed shell surfaces.

## Expected Files

| Path                                                                                                 | Planned treatment                                                                                       |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `index.tsx`, `App.tsx`                                                                               | Router bootstrap, route tree, auth-aware data loading, redirects, route states, dashboard drill-in      |
| `components/ApplicationShell.tsx`                                                                    | New responsive shell and drawer focus management                                                        |
| `components/Sidebar.tsx`, `components/AppNavbar.tsx`                                                 | Route links, active state, collapsed/drawer patterns, responsive utility controls                       |
| `components/TripList.tsx`                                                                            | Route-mode compatibility wrapper, URL query state, deep-linked details/editor, unsaved-change reporting |
| `components/Login.tsx`, `components/Hub.tsx`, `components/UserManagement.tsx`                        | Auth status, AI-copy removal, password-field removal, truthful development boundary copy                |
| `components/Dashboard.tsx`, feature components                                                       | Typed service imports and truthful refresh/snapshot wording                                             |
| `services/contracts.ts`, `services/authService.ts`, `services/index.ts`                              | New stable service/auth contracts and normalized errors                                                 |
| `services/apiService.ts`                                                                             | Explicit development adapter, credential-free domain records, typed compatibility export                |
| `services/geminiService.ts`                                                                          | Delete excluded browser provider client                                                                 |
| `types.ts`                                                                                           | Remove domain password property; add route/auth-safe types only where required                          |
| `vite.config.ts`, `package*.json`, `README.md`, `index.html`                                         | Router dependency, AI SDK/key removal, truthful setup/product copy                                      |
| `tests/` and Playwright/Vitest configuration                                                         | Phase 1B unit, component, route, browser, accessibility, and absence tests                              |
| `docs/compatibility-adapters.md`                                                                     | Adapter purpose, owner, consumers, risk, removal criteria, and phase                                    |
| `docs/evidence/phase-1b-*`, `docs/phase-1b-completion-report.md`, `docs/ui-implementation-status.md` | Automated/manual evidence, acceptance results, gaps, and review gate                                    |

## Preserved Behavior

- Hub remains the post-login module selector.
- Inventory and Billing remain visible, disabled, and non-launchable.
- Dashboard trip drill-in remains available.
- Trip list, calendar, map, multi-stop editor, detail tabs, fuel/event reads, truck history, and employee detail behavior remain in place.
- Existing role-based presentation behavior is preserved as a compatibility behavior only; it is not claimed as a security boundary and is not expanded into Phase 1C.
- Existing development mock mutations remain reset-on-refresh and make no persistence, authorization, RLS, concurrency, or audit guarantee.

## Risks and Controls

| Risk                                                                     | Control                                                                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Route extraction loses selected trip or list context                     | Carry list query parameters into detail/edit URLs and test close/back/refresh behavior                                       |
| Mobile drawer traps or loses focus                                       | Escape close, tab loop, initial focus, focus restoration, overlay click, and browser/axe checks                              |
| Auth cleanup breaks local review                                         | Development-only adapter implements the same interface and keeps current demo identities without passwords in domain records |
| Production bundle accidentally includes unsafe credentials/provider code | Fail-closed production auth, remove Gemini SDK/config, and run source/bundle scans                                           |
| Large feature refactor causes behavior loss                              | Wrap existing screens through route-mode props and defer Phase 2/3 decomposition                                             |
| Unsaved trip input is discarded                                          | Dirty-state tracking, before-unload protection, routed blocker with stay/leave choices, and tests                            |
| Existing Phase 1A changes are overwritten                                | Treat the current dirty worktree as the approved baseline and modify only Phase 1B-owned surfaces                            |

## Stop Condition

After implementation, validation, evidence, and the Phase 1B Completion Report, set Phase 1B to `READY_FOR_REVIEW`, keep Phase 1C `May start: No`, and wait for the exact instruction `APPROVED: Phase 1B`.
