# Phase 3D — Users, Roles, and Permissions Implementation Plan

## Gate

- Selected by: Jethro via `Begin Phase 3D` on 2026-07-27.
- Prerequisite: Phase 3C is `COMPLETED` and `APPROVED`.
- Phase status: `COMPLETED — USER APPROVED` on 2026-07-27 via Jethro’s exact instruction `Approve Phase.`
- Completion gate: Do not mark this phase complete or begin Phase 3E without Jethro's exact `APPROVE PHASE` instruction.

## In-scope outcome

1. SuperAdmin receives a typed user-administration surface that lists platform accounts and their one effective official role.
2. SuperAdmin can create a development-only pending invitation, assign exactly one fixed platform role, update a user role, and deactivate/reactivate an account with a required reason.
3. User deactivation retains the account and role history, removes account eligibility, and invalidates the current in-memory development session when it targets that account.
4. The fixed five-role permission matrix remains immutable. Admin, Dispatcher, Encoder, and Viewer cannot access user/role management.
5. User management uses a typed `UserAdministrationService` over the development adapter. It is explicitly non-production and makes no claim of Supabase invitation delivery, production persistence, authorization, RLS, concurrency, idempotency, or audit guarantees.

## Acceptance traceability

| ID        | Requirement                                                                                                                                     | Planned evidence                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| P3D-AC-01 | Phase 3D begins only after Phase 3C approval and explicit selection.                                                                            | Plan and status tracker.                             |
| P3D-AC-02 | Accounts use one official effective role; invalid/multiple roles fail validation.                                                               | Typed service unit tests.                            |
| P3D-AC-03 | SuperAdmin-only invitation, user administration, role assignment, and lifecycle presentation.                                                   | Central policy, focused browser role tests.          |
| P3D-AC-04 | Pending invitations contain no password and do not create a usable authenticated session before provider acceptance.                            | Service and UI tests.                                |
| P3D-AC-05 | Deactivation/reactivation requires a reason, is non-destructive, retains the role, and invalidates the current development session if targeted. | Service/auth unit tests and browser test.            |
| P3D-AC-06 | No user-facing delete path or mutable role/permission catalog is added.                                                                         | UI/boundary scan and immutable matrix tests.         |
| P3D-AC-07 | Route/dialog behavior is keyboard-accessible and visually reviewed for all roles, themes, and supported viewports.                              | Focused Playwright/axe checks and 30-image evidence. |
| P3D-AC-08 | Phase 3E settings/audit work remains unmodified in behavior; development limitations and successor gate stay explicit.                          | Compatibility register, report, tracker.             |

## Validation result

- `npm run typecheck`: PASS.
- Focused unit/service-boundary tests: PASS (29 tests).
- Focused Phase 3D Playwright + axe tests: PASS; browser test assertion was corrected to scope a single table row.
- Responsive matrix: PASS (30/30 regenerated screenshots; 5 roles × 3 viewports × light/dark). The final run waits for auth and workspace loading to settle before capture.
- Jethro approved the phase on 2026-07-27 via exact instruction `Approve Phase.` Phase 3E remains unselected.

## Explicit exclusions

- Live Supabase invitations, email delivery, password reset, credential management, provider activation, or production session revocation.
- Changes to application settings or audit-log inspection (Phase 3E).
- Editable roles, user-specific permission overrides, branch scopes, or invented role/action identifiers.
- Production persistence, authorization, RLS, concurrency, idempotency, or audit guarantees.
