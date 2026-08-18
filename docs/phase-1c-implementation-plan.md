# Phase 1C Implementation Plan

## Phase Gate

- Active phase: Phase 1C - Permission-Aware Navigation and Action Enforcement
- Phase 1B: `APPROVED` and `COMPLETE` by Jethro on 2026-07-22
- Phase 1C eligibility: Confirmed; `May start: Yes`
- Phase 2A authorization: Not granted; `May start: No`
- Security boundary: Frontend permission checks are presentation behavior only. Production API authorization and RLS remain separate backend guarantees.

## Source Authority

| Source                                 | Classification                                                 | Phase 1C use                                                                                                               |
| -------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Attached Phase 1C goal                 | APPROVED_PHASE_SCOPE                                           | Scope, P1C-AC-01 through P1C-AC-16, validation, evidence, and stop condition                                               |
| `docs/phase-0-decision-log.md` DEC-003 | APPROVED_RESOLVED_DECISION                                     | Five fixed roles, one effective role, administrative distinctions, hide-versus-disable rule, and shared policy requirement |
| `PRD.md` section 8                     | APPROVED_FINAL_REQUIREMENT_BASELINE                            | Exact action-by-role matrix and own-draft qualification                                                                    |
| Phase 1B completion/status records     | APPROVED_PHASE_COMPLETION_EVIDENCE                             | Eligibility and routing/auth/service/adapter behavior that must be preserved                                               |
| Approved UI/UX Blueprint               | APPROVED_REQUIREMENT where consistent; PROPOSAL where narrowed | Navigation hierarchy, hide-versus-disable presentation, responsive shell, and accessibility behavior                       |
| Current source and tests               | OBSERVED_IMPLEMENTATION_BASELINE                               | Existing route, navigation, action, identity, service, and compatibility behavior                                          |

The attached goal and DEC-003 take precedence over the PRD only where they explicitly clarify it. The Decision Log and PRD take precedence over the Blueprint and current implementation.

## Reconciled Conflicts Before Implementation

| Conflict                                                                                                                          | Approved resolution                                                                                                                                                                                                              | Affected surfaces                                   |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Sidebar denies Dispatcher trip creation and omits Encoder read-only truck/employee access.                                        | Use the PRD matrix through one shared navigation policy. Dispatcher sees Create Trip; all roles can read trucks and employees.                                                                                                   | `Sidebar`, direct routes                            |
| Sidebar grants schedule/create destinations through hard-coded role arrays that disagree with route actions.                      | Replace arrays with stable route/navigation permission identifiers. Viewer retains read-only trip access; create is hidden only for Viewer.                                                                                      | `Sidebar`, trip routes                              |
| Trip screen treats only SuperAdmin/Admin as fully writable, gives Encoder broad edit access, and uses a direct Viewer comparison. | Gate create, update, cancel, assignment, status, event, and fuel actions independently. Encoder update is limited to own Draft records; Dispatcher receives approved operational actions.                                        | `TripList`, trip create/edit/detail                 |
| Truck screen restricts all writes to SuperAdmin/Admin.                                                                            | Dispatcher receives create/update/status actions; only SuperAdmin/Admin receive deactivate/reactivate. Encoder/Viewer remain read-only.                                                                                          | `TruckList`                                         |
| Employee screen uses one SuperAdmin/Admin writable flag for all mutations.                                                        | SuperAdmin/Admin receive create/update/deactivate/reactivate; Dispatcher/Encoder/Viewer remain read-only.                                                                                                                        | `EmployeeList`                                      |
| Legacy Settings shows users, multi-role assignment, module toggles, and settings controls to Admin.                               | Admin sees only read-only application settings and audit information. SuperAdmin alone sees user management, single-role assignment, user lifecycle, and settings update. Configurable permission/module editing is not exposed. | `UserManagement`, settings route, workspace loading |
| Legacy user records permit multiple roles and calculate a precedence result.                                                      | Retain the legacy `roles` projection only as a compatibility field; the effective policy fails closed on multiple, mismatched, inactive, or unknown roles. Development review identities each carry one official role.           | `types`, development adapters, permission policy    |
| Blueprint says Admin Settings may be read-only or scoped.                                                                         | Apply the later approved DEC-003/PRD amendment: Admin has read-only Settings and audit access, with no user/role management or update action.                                                                                    | Settings presentation                               |

No unresolved requirement conflict blocks implementation.

## Bounded Workstreams

1. Add a typed permission boundary with stable role, action, resource, permission, route, navigation, identity-state, and presentation-decision identifiers.
2. Encode the exact fixed matrix once. Model Encoder own-Draft updates through explicit record context; grant no export capability and no future-module routes.
3. Resolve unauthenticated, inactive, unknown-role, conflicting-role, and development-only identities explicitly. Production auth remains fail-closed.
4. Apply route helpers before rendering protected surfaces, retain Not Found separately, and restore intended routes only after authentication and permission checks.
5. Filter desktop and drawer navigation through the shared policy while preserving active route, Hub, theme, logout, and disabled Inventory/Billing behavior.
6. Replace Phase 1C-owned role comparisons in Trip, Truck, Employee, and Settings action presentation. Hide never-permitted actions; keep authorized state-blocked actions disabled with an accessible explanation.
7. Preserve form/query/selection/route state when a recoverable development service denial occurs. Do not add later business workflows or backend authorization claims.
8. Add policy matrix, identity-state, route, navigation, action, keyboard/focus, responsive, no-content-flash, and static no-scattered-role-check tests.
9. Produce permission traceability, responsive/manual-review evidence, the Phase 1C completion report, updated UI status, and compatibility register changes.

## Planned Shared Interface

The shared interface will expose:

- `can(action, resource, context?)`
- `canAccessRoute(route, context?)`
- `canShowNavigation(destination)`
- `present(action, resource, context?)`, returning visible/disabled/reason state
- an explicit identity decision for authenticated, unauthenticated, inactive, denied, unknown, conflicting, and development-only identities

Components may use role labels for non-policy display styling, but may not derive access or action behavior from role-name comparisons.

## Preserved Phase 1B Behavior

- Browser-addressable Login, Hub, Dashboard, Trip, Truck, Employee, Settings, and Not Found routes
- URL-backed trip query/detail/edit context and unsaved-change protection
- Responsive desktop rail and tablet/mobile focus-managed drawer
- Typed service contracts and normalized error states
- Development mock/data and in-memory auth adapters, reset-on-refresh behavior, and fail-closed production auth
- Disabled, non-launchable Inventory and Billing modules
- No AI functionality and no production persistence/auth/JWT/RLS/concurrency/audit claims

## Stop Condition

After implementation, validation, evidence, and the Phase 1C Completion Report, set Phase 1C to `READY_FOR_REVIEW`, keep Phase 2A `May start: No`, and wait for the exact instruction `APPROVED: Phase 1C`.
