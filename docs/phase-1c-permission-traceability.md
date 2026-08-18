# Phase 1C Permission Traceability

## Evidence key

- `V`: visible and enabled when the record state also permits the action.
- `R`: visible read-only presentation.
- `H`: hidden because the role never receives the action.
- `D`: visible but disabled with an accessible reason for an authorized, state-blocked action.
- `C`: record-context conditional. Encoder update is visible only for an owned `DRAFT`; it is disabled with a reason for an owned non-Draft and hidden for another owner's record.
- `N`: routed Permission Denied state; protected route content is not rendered.

The implementation source of truth is `permissions/policy.ts`. Tests named below are in `tests/unit/permissionPolicy.test.ts`, `tests/e2e/permissions.spec.ts`, `tests/e2e/a11y.spec.ts`, and `tests/e2e/visual-phase1c.spec.ts`.

## Role/action matrix

Every approved role/action pair appears as a role cell below. A hidden cell is an explicit denial, not an omitted decision.

| Policy identifier              | Route/component                                         | SuperAdmin | Admin  | Dispatcher | Encoder | Viewer | Test evidence                                                                   |
| ------------------------------ | ------------------------------------------------------- | ---------- | ------ | ---------- | ------- | ------ | ------------------------------------------------------------------------------- |
| `DASHBOARD.READ`               | `/trip-scheduling/dashboard`, Dashboard                 | V          | V      | V          | V       | R      | exact matrix; routed surface matrix; 45-image review                            |
| `TRIP_ADVICE.READ`             | Trip list/schedule/map/detail                           | V          | V      | V          | V       | R      | exact matrix; routed surface matrix; Viewer browser case                        |
| `TRIP_ADVICE.CREATE`           | `/trips/new`, Create Trip navigation/action             | V          | V      | V          | V       | H/N    | exact matrix; navigation model; routed surface matrix                           |
| `TRIP_ADVICE.UPDATE`           | `/trips/:id/edit`, row/detail edit                      | V or D     | V or D | V or D     | C       | H/N    | exact matrix; Encoder own-Draft test; routed surface matrix                     |
| `TRIP_ADVICE.CANCEL`           | Trip row/detail cancellation                            | V or D     | V or D | V or D     | H       | H      | exact matrix; hide-versus-disable test; static terminology scan                 |
| `TRIP_ADVICE.STATUS_CHANGE`    | Trip quick status/editor status                         | V          | V      | V          | H       | H      | exact matrix; Dispatcher browser case; source boundary scan                     |
| `TRIP_ASSIGNMENTS.ASSIGN`      | Trip editor truck/driver/helper fields                  | V          | V      | V          | H       | H      | exact matrix; Encoder constraint test; source boundary scan                     |
| `TRIP_EVENTS.READ`             | Trip detail Events tab                                  | R          | R      | R          | R       | R      | exact matrix; routed detail browser coverage                                    |
| `TRIP_EVENTS.CREATE`           | Existing trip-event mutation presentation, when present | V          | V      | V          | V       | H      | exact matrix; no later workflow added                                           |
| `TRIP_FUEL_LOGS.READ`          | Trip detail Fuel tab                                    | R          | R      | R          | R       | R      | exact matrix; routed detail browser coverage                                    |
| `TRIP_FUEL_LOGS.CREATE`        | Existing fuel-log mutation presentation, when present   | V          | V      | V          | V       | H      | exact matrix; no later workflow added                                           |
| `TRUCKS.READ`                  | `/trucks`, Truck Management navigation                  | V          | V      | V          | R       | R      | exact matrix; navigation and routed surface matrices                            |
| `TRUCKS.CREATE`                | Enlist Transporter                                      | V          | V      | V          | H       | H      | exact matrix; Dispatcher and Viewer browser cases                               |
| `TRUCKS.UPDATE`                | Specifications/maintenance mutations                    | V          | V      | V          | H       | H      | exact matrix; Dispatcher browser case; source boundary scan                     |
| `TRUCKS.STATUS_CHANGE`         | Truck status control                                    | V          | V      | V          | H       | H      | exact matrix; Dispatcher browser case; source boundary scan                     |
| `TRUCKS.DEACTIVATE`            | Deactivate Truck                                        | V or D     | V or D | H          | H       | H      | exact matrix; lifecycle state-block browser test                                |
| `TRUCKS.REACTIVATE`            | Reactivate Unit                                         | V          | V      | H          | H       | H      | exact matrix; navigation/action source boundary scan                            |
| `EMPLOYEES.READ`               | `/employees`, Employee Directory navigation             | V          | V      | R          | R       | R      | exact matrix; navigation and routed surface matrices                            |
| `EMPLOYEES.CREATE`             | Add New Employee                                        | V          | V      | H          | H       | H      | exact matrix; Dispatcher/Viewer browser cases                                   |
| `EMPLOYEES.UPDATE`             | Employee/availability edit controls                     | V          | V      | H          | H       | H      | exact matrix; source boundary scan                                              |
| `EMPLOYEES.DEACTIVATE`         | Deactivate employee                                     | V or D     | V or D | H          | H       | H      | exact matrix; hide-versus-disable test; source boundary scan                    |
| `EMPLOYEES.REACTIVATE`         | Reactivate employee                                     | V          | V      | H          | H       | H      | exact matrix; source boundary scan                                              |
| `REFERENCE_DATA.READ`          | Existing lookup selectors and labels                    | R          | R      | R          | R       | R      | exact matrix                                                                    |
| `REFERENCE_DATA.MANAGE`        | Existing reference mutation presentation, when present  | V          | V      | H          | H       | H      | exact matrix; no later workflow added                                           |
| `SETTINGS.READ`                | `/settings`, Application settings                       | R          | R      | N          | N       | N      | exact matrix; Admin/SuperAdmin browser distinction; operational denial captures |
| `SETTINGS.UPDATE`              | Save settings                                           | V          | H      | H          | H       | H      | exact matrix; Admin/SuperAdmin browser distinction                              |
| `USERS.READ`                   | Settings Users & roles data load                        | R          | H      | H          | H       | H      | exact matrix; administrative workspace load gate                                |
| `USERS.MANAGE`                 | Add/edit development profile                            | V          | H      | H          | H       | H      | exact matrix; Admin/SuperAdmin browser distinction                              |
| `USERS.DEACTIVATE`             | Deactivate user                                         | V or D     | H      | H          | H       | H      | exact matrix; default identity disabled explanation; terminology scan           |
| `USERS.REACTIVATE`             | Reactivate user                                         | V          | H      | H          | H       | H      | exact matrix; administrative source boundary scan                               |
| `USERS_ROLES.MANAGE`           | Fixed permission catalog                                | R          | H      | H          | H       | H      | exact matrix; visual distinction evidence                                       |
| `USERS_ROLES.ASSIGN`           | Single effective role selector                          | V          | H      | H          | H       | H      | exact matrix; Admin/SuperAdmin browser distinction                              |
| `AUDIT_LOGS.READ`              | Settings Audit log                                      | R          | R      | H/N        | H/N     | H/N    | exact matrix; Admin audit visual evidence; operational denial cases             |
| `*.EXPORT` reserved vocabulary | No executable export UI in MVP                          | H          | H      | H          | H       | H      | stable-vocabulary test; PRD 7.8; no grant scan                                  |

## Routed surfaces

| Route                                                 | SuperAdmin | Admin     | Dispatcher | Encoder   | Viewer    | Evidence                                              |
| ----------------------------------------------------- | ---------- | --------- | ---------- | --------- | --------- | ----------------------------------------------------- |
| `/hub`                                                | V          | V         | V          | V         | V         | policy route test; Phase 1B smoke                     |
| `/trip-scheduling/dashboard`                          | V          | V         | V          | V         | V         | five-role navigation and routed surface tests         |
| `/trip-scheduling/trips`                              | V          | V         | V          | V         | V         | five-role routed surface tests                        |
| `/trip-scheduling/trips/new`                          | V          | V         | V          | V         | N         | routed surface tests; no create content on denial     |
| `/trip-scheduling/trips/:id`                          | V          | V         | V          | V         | V         | five-role routed detail tests                         |
| `/trip-scheduling/trips/:id/edit`                     | V          | V         | V          | C         | N         | routed surface tests; Encoder state-block distinction |
| `/trip-scheduling/trucks`                             | V          | V         | V          | V         | V         | five-role routed surface tests                        |
| `/trip-scheduling/employees`                          | V          | V         | V          | V         | V         | five-role routed surface tests                        |
| `/trip-scheduling/settings`                           | V          | R         | N          | N         | N         | Admin/SuperAdmin and operational denial tests         |
| unknown route, including `/trip-scheduling/inventory` | Not Found  | Not Found | Not Found  | Not Found | Not Found | path-classification unit test; smoke test             |

Inventory and Billing remain visible only as disabled `Coming Soon` controls in Hub/AppNavbar and have no launchable navigation or route permission. Sidebar/mobile-drawer filtering does not render either as a destination.

## Identity and denial states

| State                           | Expected presentation                                               | Evidence                                                        |
| ------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| Unauthenticated                 | Login; intended route retained only for later permitted restoration | smoke deep-link/reload tests; identity unit test                |
| Inactive                        | Login with inactive error; no protected content                     | inactive development identity browser test                      |
| Authenticated but unauthorized  | Permission Denied; no protected route content rendered or flashed   | operational Settings tests, DOM flash observer, and screenshots |
| State-blocked                   | Authorized control visible, disabled, and explained                 | lifecycle browser test; policy unit test                        |
| Unknown/conflicting role        | Fail closed; no route permission                                    | identity unit test                                              |
| Development service unavailable | Shared safe error state; route/form state retained by local handler | Phase 1B service boundary tests; Phase 1C guarded form handlers |
| Unknown route or record         | Not Found, not Permission Denied                                    | smoke and policy path tests                                     |

## Boundary statements

- This is frontend presentation behavior only and is not a production security boundary.
- Production API authorization, JWT verification, and Supabase RLS remain later backend guarantees.
- The development adapters are non-production and remain in place under the compatibility register.
- Frontend route guards, hidden actions, disabled controls, and the development identity adapter do not authorize production requests or provide RLS/security enforcement.
- Phase 1C was approved by Jethro on 2026-07-22 via `APPROVED: Phase 1C` and is `COMPLETE`; approval changes no role/action cell in this matrix.
- Phase 2A was approved by Jethro on 2026-07-23 via exact instruction `APPROVED: Phase 2A` and is `COMPLETE`; no Phase 2A workflow began in the Phase 1C approval turn, and its later implementation and approval are documented in the Phase 2A report.
- Phase 2B is `NOT_STARTED`, `ELIGIBLE_TO_BEGIN`, and `May start: Yes`; no Phase 2B implementation began in the Phase 2A approval-only reconciliation.
- Phase 2C and every later phase remain `NOT_STARTED`, `BLOCKED_BY_PHASE_SEQUENCE`, and `May start: No`.
