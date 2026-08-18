# Phase 2B Implementation Plan

## Phase gate

- Planned implementation phase: Phase 2B - Trip Quick Details and Full Details
- Phase 2A status: `APPROVED` and `COMPLETE`
- Accepted Phase 2A approval instruction: `APPROVED: Phase 2A`
- Approver: Jethro
- Approval date: 2026-07-23
- Phase 2B status before implementation: `NOT_STARTED`
- Phase 2B eligibility: `ELIGIBLE_TO_BEGIN`
- Phase 2B `May start`: `Yes`
- Phase 2C and every later phase: `NOT_STARTED`, `BLOCKED_BY_PHASE_SEQUENCE`, `May start: No`
- Security and persistence boundary: frontend permissions remain presentation behavior only. All Phase 2B data is an explicit reset-on-refresh development read projection. It provides no production persistence, authentication, authorization, JWT verification, RLS, concurrency, durable audit, push, WebSocket, or real-time guarantee.

The current gate is consistent across `docs/ui-implementation-status.md`, `docs/phase-2a-completion-report.md`, `docs/phase-2a-implementation-plan.md`, `docs/phase-2a-trip-operations-traceability.md`, `docs/evidence/phase-2a-responsive/README.md`, and `docs/compatibility-adapters.md`. No implementation file may be changed until this plan and `docs/phase-2b-trip-details-traceability.md` exist.

## Authority and source classification

| Source                                                                               | Classification                                  | Phase 2B use                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current Phase 2B goal attachment                                                     | `APPROVED_PHASE_SCOPE_AND_STOP_CONDITION`       | Workstreams, P2B-AC-01 through P2B-AC-16, evidence requirements, exclusions, successor gate, and mandatory stop                                                                                                                     |
| `docs/phase-0-decision-log.md`                                                       | `APPROVED_RESOLVED_STAKEHOLDER_DECISIONS`       | DEC-003 permission presentation, DEC-005 assignment authority, DEC-008 canonical catalogs, DEC-009 field truthfulness, DEC-011 typed/error/refresh contracts, DEC-012 conservative UI claims, DEC-014 routing, and DEC-015 evidence |
| Root `PRD.md`                                                                        | `APPROVED_FINAL_REQUIREMENT_BASELINE`           | Routes, read/detail facts, explicit Unassigned behavior, current/historical assignment rules, events/fuel support, manual and bounded refresh, accessibility, and production boundaries                                             |
| `docs/phase-0-schema-change-plan.md`                                                 | `APPROVED_SCHEMA_RECONCILIATION_PLAN`           | Read-only treatment of legacy assignment aliases, stop fields, transfer lineage, version/audit limitations, and no schema migration in Phase 2B                                                                                     |
| `docs/phase-1c-permission-traceability.md`                                           | `APPROVED_PERMISSION_PRESENTATION_BASELINE`     | All five roles may read trip details/events/fuel; existing Edit presentation remains centralized and contextual                                                                                                                     |
| Phase 2A plan, traceability, completion report, responsive ledger, and status ledger | `APPROVED_PRIOR_PHASE_COMPLETION_EVIDENCE`      | Query normalization, row Open behavior, browser history, refresh, responsive shell/table constraints, inherited limitations, and exact Phase 2B eligibility                                                                         |
| `docs/compatibility-adapters.md`                                                     | `GOVERNED_MIGRATION_BOUNDARY`                   | Retain development/mock and later writable aliases; add a bounded Phase 2B read projection; migrate only detail consumers                                                                                                           |
| Approved UI/UX Blueprint PDF                                                         | `APPROVED_DESIGN_GUIDANCE_WHEN_NON_CONFLICTING` | List-plus-contextual-panel pattern, full Trip Details page, Overview/Stops/Assignments/Events/Fuel/Activity hierarchy, 420/560 px panel guidance, focus restoration, responsive collapse, conventional tabs, and explicit states    |
| Current Phase 2B goal text                                                           | `APPROVED_ACTIVE_PHASE_REQUIREMENT`             | The authoritative implementation instruction for this turn                                                                                                                                                                          |
| `REPOSITORY_CONTEXT_PACKAGE.md`                                                      | `ORIENTATION_ONLY`                              | Legacy component and data-store orientation; current source supersedes its pre-Phase-1B routing/test snapshot                                                                                                                       |
| Current source, routes, services, tests, and configuration                           | `OBSERVED_IMPLEMENTATION`                       | Facts about existing behavior only; no mock comment, alias, local join, or UI text becomes a production contract                                                                                                                    |

Authority order for conflicts is the approved Decision Log, approved final PRD, approved schema reconciliation, approved prior-phase completion records, non-conflicting Blueprint guidance, and current implementation as observed behavior.

## Inherited Phase 2A evidence and limitations reviewed

- Phase 2A focused evidence passed 30/30; aggregate coverage passed 67/67.
- Routed E2E passed 78/78 across desktop, tablet, and mobile.
- Accessibility passed 18/18 across the required roles and viewports.
- Visual capture passed 15/15 and all 30 role/viewport/theme images were manually inspected.
- The dedicated Playwright server lifecycle and teardown passed.
- The inherited main-bundle size advisory remains non-blocking.
- Firefox, WebKit, and assistive-technology review remain later quality gates.
- Trip Operations is a typed but development-only row projection.
- Frontend permissions remain presentation behavior, not production authorization.
- Auth remains memory-only; refresh requires sign-in and permitted intended-route restoration.
- The legacy detail/editor/map wrapper and writable trip assignment aliases were intentionally retained for their owning later phases.
- No production endpoint, durable audit source, schema migration, or backend implementation exists.

## Current route and interaction baseline

### Full Details route

- `/trip-scheduling/trips/:tripId` is browser-addressable and route-guarded through the centralized Phase 1C policy.
- The current route finds a trip in the already-loaded workspace snapshot, then opens the legacy `TripList` detail composition as a one-third-width panel.
- The route uses `tab=stops|events|fuel`; Overview is the implicit default.
- Reload clears memory-only auth, routes to Login, and restores the intended permitted URL after sign-in.
- An unknown trip currently renders `Trip not found`; a denied route renders Permission Denied before protected content.
- The detail surface is not a full page, uses component-local joins and parallel `selectedTripId` state, and has no independent section error model.

### Phase 2A Open and list context

- The visible Open action and row Enter activation navigate to the canonical detail route and carry normalized search, filters, ordering, page, and limit.
- Browser Back and Forward preserve the carried query.
- Closing legacy details returns to Trip Operations with the carried list query.
- Trip Operations remains mounted only while on the list route; no current Quick Details URL selection exists.
- Phase 2B will change Open on non-mobile layouts to URL-backed Quick Details while retaining a clear Full Details action. Compact mobile treatment will prioritize Full Details and avoid shrinking a desktop side panel.

## Material source conflicts recorded before implementation

| Observed legacy behavior or source conflict                                                                              | Phase 2B resolution                                                                                                                                                                                  | Authority                             |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Detail components load broad collections and perform component-local joins.                                              | Add a typed `services.tripDetails` read boundary. New detail components import no `services/apiService`, `MOCK_*`, mutable arrays, or adapter collections.                                           | DEC-011; Phase 2B goal                |
| Route intent is copied into component-local `selectedTripId`, creating parallel selection state.                         | Quick selection is the `quick` URL parameter. Full selection is the route `:tripId`. No hidden selected-record state controls either surface.                                                        | DEC-014; P2B-AC-04/05                 |
| Phase 2A Open navigates directly to Full Details; Quick Details does not exist.                                          | Desktop/tablet Open writes `quick=<tripId>` without resetting normalized list state. Mobile Open prioritizes the canonical Full Details route.                                                       | Phase 2B goal; Blueprint              |
| Legacy detail exposes an unrestricted Quick Status selector.                                                             | Do not migrate it. Status transitions are Phase 2E.                                                                                                                                                  | Explicit Phase 2B exclusion; DEC-007  |
| Legacy detail computes a same-date assignment conflict and animates a warning.                                           | Do not migrate it. Availability and overlap validation are Phase 2D and the legacy rule is not authoritative.                                                                                        | DEC-004/005; explicit exclusion       |
| Legacy detail reads `trip.driver_id`, `trip.truck_id`, and fixed helper fields as current truth.                         | Derive current assignments and history only from the development `trip_assignments` read projection. Direct fields remain later writable compatibility aliases and are not independent detail truth. | DEC-005; schema plan                  |
| Legacy combined assignment rows may contain an employee and truck, contrary to the reconciled future resource-XOR model. | Preserve a governed read projection: employee role/history comes from the row; current truck is a deduplicated association from unreleased returned rows. Do not claim production-model conformance. | Schema plan; compatibility governance |
| Legacy helper aliases can disagree with returned assignment rows.                                                        | Display only helpers backed by assignment rows; record the mismatch as a product/backend compatibility limitation.                                                                                   | DEC-005                               |
| Consignee and internal code fall back to the first record sharing a client.                                              | Resolve only the explicitly referenced identifier. Missing references render `Unavailable`; do not silently substitute another business record.                                                      | DEC-009; field truthfulness           |
| Branch falls back to `Manila Port`.                                                                                      | Render the exact referenced branch or `Unavailable`.                                                                                                                                                 | DEC-009                               |
| Load type falls back to `Dry Cargo`; weight falls back to `0 kg`.                                                        | Render canonical mapped load type or `Unavailable`. Omit/mask absent weight; do not invent zero.                                                                                                     | DEC-008/009/012                       |
| Stop location falls back to `Hub Terminal`; missing times show `TBD`.                                                    | Render factual unavailable labels. Keep `specific_address` as the stop-specific address/instruction and location address/region as reference facts.                                                  | DEC-009                               |
| Detail Overview labels `created_at` and `updated_at` as `System Audit Logs`.                                             | Treat them only as record timestamps. Do not create an Activity/Audit section from those fields.                                                                                                     | DEC-009; P2B-AC-11                    |
| Encoder falls back to `System Auto dispatcher`.                                                                          | Resolve the exact employee or render `Unavailable`.                                                                                                                                                  | DEC-009                               |
| The global development audit collection is not an approved trip-specific source and is currently empty.                  | Activity returns an explicit typed `unsupported` state. No audit entry is synthesized.                                                                                                               | Phase 2B goal; DEC-009/011            |
| Legacy events omit recorder identity and expose raw event values.                                                        | Map the returned event record, exact encoder label when present, safe remarks/document metadata, and stable chronological order.                                                                     | PRD 7.8; Phase 2B goal                |
| Fuel has liters and returned total amount, but no measurement/unit-price field.                                          | Use factual unit `L` for the legacy liters field, preserve returned line amount, set unit price unavailable, and derive totals only from returned rows.                                              | Phase 2B goal; DEC-011                |
| Legacy status values and lookup labels are non-canonical and omit approved codes.                                        | Reuse the approved Phase 2A canonical mapping and shared status token presentation.                                                                                                                  | DEC-008; P0-AMEND-001                 |
| `scheduled_start_time` is a legacy alias, not the approved canonical planned interval.                                   | Do not present it as `planned_start_at`; expose planned start/end as unavailable until canonical values are supplied. Keep pickup date/window factual.                                               | DEC-004/009                           |
| The legacy panel is narrow, nested-scroll-heavy, and is also used for the routed detail page.                            | Add a bounded contextual Quick Details panel plus a separate full routed page with responsive stacked sections.                                                                                      | Blueprint; P2B-AC-04/05/14            |
| Existing `tab` links are already routed behavior.                                                                        | Canonicalize to `section`; accept `tab` only as a temporary inbound URL compatibility alias and replace it without losing list context.                                                              | DEC-014; compatibility preservation   |

No unresolved conflict blocks the bounded Phase 2B implementation.

## Typed Trip Details boundary

`services/contracts.ts` will define:

- canonical detail section identifiers: `overview`, `stops`, `assignments`, `events`, `fuel`, and `activity`
- a `TripDetailReference` with exact label and historical active state
- `TripQuickDetails`
- `TripDetailsOverview`
- ordered `TripDetailStop`
- current `TripDetailAssignmentSummary`
- chronological `TripAssignmentHistoryEntry`
- ordered `TripDetailEvent`
- `TripFuelSection` and factual totals
- `TripActivitySection` with `supported: false` when no approved source exists
- development freshness/source metadata and optional server version
- a `TripDetailsService` with independently cancellable quick, overview, stops, assignments, events, fuel, and activity reads

The development implementation will live in `services/tripDetails.ts` and be exposed only as `services.tripDetails`. It will reuse the approved canonical status/load mapping, make exact reference joins, normalize not-found and cancellation, and remain explicitly `development-mock`.

No production URL or endpoint will be invented.

## Quick Details URL and focus strategy

- Canonical parameter: `quick=<tripId>` on `/trip-scheduling/trips`.
- All normalized Phase 2A parameters remain unchanged.
- Opening Quick Details pushes a history entry. Browser Back closes it; Forward reopens it.
- Closing deletes only `quick` and uses history replacement for an explicit dismiss action.
- Direct navigation and refresh after reauthentication restore `quick` from the URL.
- The table component remains mounted while `quick` changes, preserving live filter/page/order and in-component table scroll context.
- The originating Open control is registered by trip ID. After load, focus moves to the panel heading/close control. Escape closes the dismissible panel. Closing restores focus to the originating control when it still exists; otherwise focus returns to the Trip Operations heading.
- Desktop uses a bounded in-layout right panel while the table remains usable.
- Tablet uses a non-clipping stacked/contextual treatment without nested document scrolling.
- Mobile uses a compact selection summary whose dominant action is Full Details rather than rendering the desktop detail panel at a squeezed width.

## Full Details route and section strategy

- Canonical route remains `/trip-scheduling/trips/:tripId`.
- Canonical section parameter is `section=<sectionId>`; Overview omits the parameter.
- A legacy inbound `tab` parameter is normalized to `section`, then removed.
- All list-return query keys remain carried on the detail URL.
- `quick` is removed when navigating to Full Details so list-only selection state does not leak into the detail route.
- Overview loads first and remains visible while a secondary section loads or fails.
- Secondary reads are independent and abort when the record changes, the section changes, the component unmounts, or a newer request supersedes them.
- The page resets its own scroll position when `tripId` changes.
- Not Found, Authentication Required, Permission Denied, service unavailable, cancellation, and unexpected errors remain distinct.
- Manual and visible-page 60-second refresh preserve safe data, do not overlap, pause while hidden, and report factual fetched/updated times without a real-time claim.
- Retry retains the exact route, selected section, and list-return context.

## Planned information architecture

1. Overview
2. Route / Stops
3. Assignments
4. Events
5. Fuel
6. Activity

Activity is present only as an explicit unsupported/backend-dependency state until an approved trip-specific source exists. No fabricated history is shown.

## Planned file boundary

| Area                   | Expected file changes                                                                                 | Constraint                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Typed contracts        | `services/contracts.ts`                                                                               | Add read-only Phase 2B types; preserve Phase 1B/2A contracts                  |
| Development projection | new `services/tripDetails.ts`, `services/index.ts`                                                    | No production endpoint invention; no persistence/security claim               |
| Quick Details          | new `components/TripQuickDetailsPanel.tsx`, bounded `components/TripOperationsTable.tsx` changes      | URL-backed selection; preserve Phase 2A table behavior                        |
| Full Details           | new `components/TripDetailsPage.tsx`, bounded `App.tsx` and optional `routes.ts` changes              | Replace only legacy detail composition; retain editor/schedule/map/mutations  |
| Shared UI              | existing `components/ui/*` only if a compatible primitive is required                                 | No unrelated redesign                                                         |
| Service tests          | new `tests/unit/tripDetailsService.test.ts`                                                           | Projection, order, totals, missing values, unsupported activity, cancellation |
| Component tests        | new Quick/Full detail test files and bounded existing test updates                                    | URL, focus, Escape, errors, permissions, sections, stale retention            |
| Routed evidence        | new `tests/e2e/trip-details.spec.ts`, updates to smoke/permissions/a11y, new `visual-phase2b.spec.ts` | Five roles, three viewports, themes, route history, no flash                  |
| Test configuration     | `package.json`, `vitest.config.ts` as needed                                                          | Include Phase 2B checks without weakening prior suites                        |
| Governance/evidence    | Phase 2B plan, traceability, responsive ledger/screenshots, completion report, status, adapters       | Stop at `READY_FOR_REVIEW`                                                    |

## Behavior that must be preserved

- Phase 1B browser routes, intended-route reauthentication, shell, responsive navigation, theme, no-protected-content flash, and safe not-found behavior
- Phase 1C centralized policy and exact five-role presentation
- Phase 2A query normalization, search/filter/order/page/limit behavior, row keyboard activation, table accessibility, polling, error states, responsive column priority, and development notice
- Existing full create/edit routes and their unsaved-change behavior
- Existing schedule and map compatibility paths
- Existing assignment, status, cancellation, event-entry, and fuel-entry legacy ownership without migration or redesign
- Disabled/non-launchable Inventory and Billing
- No AI, export, production backend, schema migration, or real-time claim

## Compatibility adapters affected

- Add `Phase 2B Trip Details read projection` as `RETAINED_NON_PRODUCTION`.
- Update the Trip route-mode wrapper consumers: the routed Full Details consumer is migrated out; create/edit/schedule/map consumers remain.
- Record that the legacy detail consumer is removed while legacy writable assignment aliases remain for Phase 2D.
- Retain the Phase 2A list projection unchanged except for its contextual Quick Details consumer.
- Retain the development data/auth adapters and all explicit non-production limitations.

## Backend dependencies

- Exact production Trip Details and independently retrievable section contracts
- Canonical `planned_start_at` and `planned_end_at`
- Resource-XOR authoritative assignment records with assigned/released actors/reasons and server versions
- Trip-specific audit/activity endpoint and permission mapping
- Production JWT validation, API authorization, RLS, persistence, concurrency, and durable audit
- Exact measurement/unit-price contract for fuel if the product later requires it
- Server-defined section failure/retry and freshness semantics

None is implemented in Phase 2B.

## Test strategy

### Service and contracts

- exact trip identity/reference/status/load projection
- factual missing-value behavior
- deterministic stops and route summary
- transfer source lineage
- current driver/truck/helpers from assignment rows only
- chronological assignment history and inactive labels
- stable events order, recorder mapping, empty state
- fuel row projection and totals from returned records only
- activity unsupported state
- not-found and cancellation
- retained safe data under component-level recoverable refresh failures

### Components and routes

- Quick Details open/close, URL state, Back/Forward, direct URL, refresh restoration, focus movement/restoration, Escape, and list/scroll context
- mobile Full Details priority
- Full Details direct route, section URL state, legacy `tab` normalization, record scroll reset, rapid navigation cancellation, retry context, Not Found versus Permission Denied, and no protected-content flash
- Overview retained during section failure
- all loading, empty, stale, unavailable, cancelled, and unexpected states
- centralized permission presentation for Viewer, Encoder own Draft, Dispatcher, Admin, and SuperAdmin
- no direct role-name comparison in detail components

### Static boundary

- no new detail component imports `services/apiService`, `MOCK_*`, mutable seed arrays, or adapter internals
- no assignment/availability/status/cancellation/event/fuel/export/Inventory/Billing/AI mutation or route
- no direct platform-role comparisons
- no fabricated audit content or unsupported real-time/persistence language

## Accessibility strategy

- semantic page and section headings
- conventional `tablist`/`tab`/`tabpanel` behavior with arrow-key support
- visible focus indicators and large-enough controls
- panel focus movement, Escape dismissal, and origin focus restoration
- status text/icon cues in addition to color
- `aria-live` loading/refresh announcements
- accessible section errors and Retry controls
- reduced-motion-compatible panel styling
- no keyboard trap or inaccessible nested scrolling
- axe coverage for all five roles wherever action presentation differs

## Responsive evidence strategy

Automated capture and manual inspection will cover:

- 1440 x 900
- 834 x 1194
- 390 x 844
- light and dark themes
- Viewer, Encoder, Dispatcher, Admin, and SuperAdmin

The ledger will inspect shell clipping, Quick Details width, table usability, mobile hierarchy, tab overflow, long labels, actions, focus, touch size, scroll containment, event/fuel density, empty/error states, and inactive historical cues. A screenshot alone does not earn PASS.

## Known risks

- The root workspace still preloads a broad development snapshot before the routed page, so Phase 2B can isolate component reads but cannot provide production request minimization.
- Legacy assignment rows do not conform to the reconciled future resource-XOR model.
- Current seeds use runtime-generated timestamps, so freshness is factual only for the loaded development process and not durable record history.
- The mock has no section-specific failure injection; component tests must use typed service doubles.
- The Phase 2A table is already dense; the in-layout panel must not reintroduce desktop clipping or document-level horizontal overflow.
- Existing E2E assertions name the legacy `Close trip details` control and must be updated to the new bounded surface without reducing role or viewport coverage.
- The inherited bundle-size warning may grow; record the exact result without treating it as a Phase 2B functional failure unless a new regression is material.

## Explicit Phase 2C-2E exclusions

- no Create/Edit redesign or implementation
- no driver/helper/truck assignment, replacement, release, or override command
- no availability or overlap validation
- no truck status mutation
- no trip status transition or cancellation command
- no event or fuel creation, editing, or deletion
- no export, Billing, Inventory, AI, backend, schema, or migration work

## Stop condition

After implementation and truthful validation:

1. Set Phase 2B to `READY_FOR_REVIEW`.
2. Set approval status to `AWAITING_EXPLICIT_APPROVAL`.
3. Keep Phase 2C and every later phase `NOT_STARTED`, `BLOCKED_BY_PHASE_SEQUENCE`, `May start: No`.
4. Issue the Phase 2B Completion Report.
5. Stop without implementing, preparing, scaffolding, or partially beginning Phase 2C.

Do not mark Phase 2B `COMPLETE` without the exact user instruction `APPROVED: Phase 2B`.
