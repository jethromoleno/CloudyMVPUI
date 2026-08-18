# Cloudy Phase 0 Review and Phase 1A Handoff Prompt

Phase 0 approval is recorded: Jethro supplied the exact instruction `APPROVED: Phase 0` on 2026-07-22. Phase 0 is `COMPLETE`; Phase 1A is eligible but has not started. This file does not authorize any work beyond Phase 1A.

---

You are working on the Cloudy phase-gated UI implementation.

## Authoritative inputs

Review these files completely before changing implementation files:

1. Root `PRD.md`
2. `docs/phase-0-decision-log.md`
3. `docs/phase-0-resolved-decisions-summary.md`
4. `.docs/cloudy_schema.xlsx`
5. `docs/phase-0-schema-change-plan.md`
6. `docs/phase-0-conflict-register.md`
7. `docs/phase-0-readiness-report.md`
8. `docs/ui-implementation-status.md`
9. The user-supplied phase-gated implementation goal for the active task
10. `REPOSITORY_CONTEXT_PACKAGE.md`
11. `.docs/Cloudy Fleet Management UI-UX Design Blueprint.pdf` and current repository source

The sixteen selections in `phase-0-decision-log.md` are stakeholder decisions owned by Jethro and dated 2026-07-22. Treat the Decision Log as higher priority than `PRD.md` wherever it amends, narrows, or clarifies the PRD.

## Immediate objective

Verify the completed Phase 0 source-conformance and readiness package. Root `PRD.md` records P0-AMEND-001 through P0-AMEND-004, and `docs/phase-0-schema-change-plan.md` qualifies the workbook. Do not silently treat the original workbook, mock UI, prompt examples, or superseded Phase 0 findings as authoritative when they conflict with a selected decision.

## Required Phase 0 work

1. Verify that DEC-001 through DEC-016 are complete and internally consistent.
2. Reconcile `PRD.md` against all selected decisions.
   - Amend requirement text, acceptance criteria, scope statements, permission rules, schema expectations, API rules, infrastructure assumptions, testing requirements, and AI scope where necessary.
   - Preserve a clear change record.
3. Reconcile `cloudy_schema.xlsx` against the selected decisions.
   - Use the workbook as the baseline under qualified DEC-009.
   - Do not add excluded UI-only fields merely because the mock has them.
   - Identify and specify all mandatory schema amendments required by DEC-003 through DEC-008 and DEC-010 through DEC-011.
   - Do not implement database migrations unless a separately approved backend/schema phase explicitly permits them; produce the implementation-ready schema change plan and field mapping required by Phase 0.
4. Update:
   - `phase-0-conflict-register.md`
   - `phase-0-readiness-report.md`
   - `ui-implementation-status.md`
   - `phase-0-decision-log.md`
5. Resolve or close superseded conflicts and gaps with traceability to the selected DEC number.
6. Update every Phase 0 acceptance criterion with `PASS`, `PARTIAL`, `FAIL`, `BLOCKED`, or `NOT_TESTED` and evidence.
7. Confirm that Phase 1A prerequisites are implementation-ready:
   - authoritative design/status/permission vocabulary from DEC-008;
   - approved test/accessibility baseline from DEC-015;
   - authoritative PRD and Decision Log;
   - no unresolved Critical blocker affecting Phase 1A.
8. Run all checks available for Phase 0 documentation and the unchanged repository baseline.
9. Issue a revised Phase Completion Report.

## Mandatory gate - satisfied

Do not change production UI behavior during this Phase 0 reconciliation.

The explicit approval record now exists with the exact user instruction:

`APPROVED: Phase 0`

If this approval record is ever absent or invalidated:

- Set Phase 0 to `READY_FOR_REVIEW`.
- Set `Next Approved Phase - May start` to `No`.
- Present the revised completion report.
- Stop and request the exact approval response.

## Eligible Phase 1A start

The `APPROVED: Phase 0` condition is satisfied. When Phase 1A implementation begins:

1. Confirm Phase 0 remains `COMPLETE` and Phase 1A remains eligible.
2. Start only:

```text
Active phase:
Phase 1A - Design Tokens and Shared UI Components

Approved scope:
Establish the approved Cloudy design-token layer, status-token mappings based on DEC-008 immutable codes, foundational reusable UI components, theme/accessibility baselines, and the Phase 1A test harness required by DEC-015.

Explicit exclusions:
No routing migration, no authentication integration, no permission-aware navigation implementation, no production API integration, no trip workflow redesign, no schema migration, no Inventory or Billing implementation, and no AI functionality.

Acceptance criteria:
Derive and improve the Phase 1A criteria from the approved PRD, Blueprint, DEC-008, DEC-015, and the phase-gated goal. Each criterion must name evidence.
```

3. Before implementation, inspect the current UI tokens/components and create a bounded Phase 1A plan.
4. Implement only Phase 1A.
5. Run the required typecheck, lint, tests, accessibility checks, and production build that are available after the Phase 1A tooling setup.
6. Update `docs/ui-implementation-status.md`.
7. Issue the Phase 1A Completion Report with status `READY_FOR_REVIEW`.
8. Stop. Do not begin Phase 1B without explicit Phase 1A approval.

## Non-negotiable selected constraints

At minimum, preserve these decisions:

- One active platform role per user.
- Supabase-owned credentials with memory-only browser sessions.
- `trip_assignments` authoritative.
- Planned half-open assignment intervals in `Asia/Manila`.
- Domain-specific cancel/deactivate/reactivate lifecycle.
- Fixed trip transition graph and transactional side effects.
- Backend-owned immutable lookup and permission codes.
- Workbook-baseline schema with qualified DEC-009 amendments.
- Explicit unassigned Scheduled trips and repeatable helpers.
- Versioned OpenAPI/DRF/JWT/RLS contract, optimistic concurrency, idempotency, and bounded polling.
- Conservative list-first operational policies; no capacity guarantee or MVP exports.
- Render + Supabase production model with Sentry and seven daily restore points.
- Incremental React Router/service-boundary migration.
- Risk-based automated testing and WCAG 2.2 AA.
- AI analysis excluded from MVP; no browser-exposed Gemini/provider secret.

Report any contradiction instead of selecting a new behavior silently.
