# Phase 2B Trip Details Traceability

## Evidence state

- Phase: Phase 2B - Trip Quick Details and Full Details
- Gate: `COMPLETE`
- Implementation status: `PASS`
- Approval status: `APPROVED`
- Required approval instruction: `APPROVED: Phase 2B`
- Approver: Jethro
- Approval date: 2026-07-24
- Successor state: Phase 2C is `NOT_STARTED`, eligible to begin, `May start: Yes`; Phase 2D and later remain blocked

This file was created before implementation and finalized after the named automated and manual evidence passed. Phase 2B was approved by Jethro on 2026-07-24 with the exact instruction `APPROVED: Phase 2B` and is now `COMPLETE`.

## Source classification key

- `C`: canonical approved field or catalog mapping
- `P`: governed development read projection
- `A`: retained legacy compatibility alias, readable only through the projection
- `J`: exact development-adapter reference join
- `D`: derived solely from returned factual records
- `U`: unavailable/unsupported; must not be invented

## Quick Details field traceability

| Requirement           | Typed field                        | Source                                           | Presentation                                          | Missing/empty behavior                                 | Evidence                       |
| --------------------- | ---------------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------ | ------------------------------ |
| Trip advice code      | `TripQuickDetails.tripAdviceCode`  | `C` trip record                                  | Primary identity; never raw UUID                      | `Unavailable` only if the returned record is malformed | service/component/routed tests |
| Canonical status      | `status.code`, `status.label`      | `C` DEC-008 mapping                              | Shared text/icon status token                         | `Unavailable`; no invented status                      | mapping and status-token tests |
| Client                | `client`                           | `J` exact `client_id`                            | Label plus inactive historical cue                    | `Unavailable`; no client-based substitute              | projection tests               |
| Consignee             | `consignee`                        | `J` exact `consignee_id`                         | Label when present                                    | `Unavailable`; no first-client-consignee fallback      | projection tests               |
| Route summary         | `route`                            | `D` first/last ordered returned stops            | Origin to destination text                            | `Route unavailable`; no legacy endpoint guess          | stops/quick tests              |
| Pickup date/window    | `pickupDate`, `pickupWindow`       | `C` trip fields                                  | Factual date/window                                   | Explicit `Unavailable`; no time invention              | component tests                |
| Current truck         | `assignments.truck`                | `P` unreleased assignment row truck association  | Plate or `Unassigned`; inactive cue                   | `Unassigned`                                           | assignment tests               |
| Current driver        | `assignments.driver`               | `P` unreleased Driver assignment row             | Employee label or `Unassigned`; inactive cue          | `Unassigned`                                           | assignment tests               |
| Helpers               | `assignments.helpers`              | `P` unreleased Helper assignment rows            | Count and labels                                      | `No current helpers`                                   | assignment tests               |
| Assignment state      | `assignmentState`                  | `D` current returned assignment projection       | `Assigned`, `Partially assigned`, or `Unassigned`     | Never implies reservation                              | quick tests                    |
| Latest factual update | `updatedAt`, `freshness.fetchedAt` | `C` record timestamp plus `D` request completion | Distinguish record update from development fetch time | `Unavailable`; never “live”                            | freshness tests                |
| Full Details path     | route builder plus carried query   | `D` current URL                                  | Clear primary/secondary action                        | Preserve list query; remove `quick`                    | routed tests                   |

Quick Details intentionally does not request assignment commands, availability, transition actions, event-entry data, fuel-entry data, or audit data.

## Overview field traceability

| Requirement          | Typed field                      | Source                       | Presentation rule                                    | Conflict/limitation                           |
| -------------------- | -------------------------------- | ---------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| Record identity      | `id`, `tripAdviceCode`           | `C`                          | Code is primary; raw ID is never the label           | None                                          |
| Canonical status     | `status`                         | `C` approved mapping         | Shared status token                                  | Legacy labels are adapter inputs only         |
| Branch               | `branch`                         | `J` exact reference          | Label/code and inactive cue                          | No `Manila Port` fallback                     |
| Encoder              | `encoder`                        | `J` exact employee reference | Person label                                         | No `System Auto dispatcher` fallback          |
| Client               | `client`                         | `J` exact reference          | Label and inactive cue                               | No alias as second business field             |
| Internal client code | `internalClientCode`             | `J` exact reference          | Show when present                                    | No client-based fallback                      |
| Consignee            | `consignee`                      | `J` exact reference          | Show when present                                    | No client-based fallback                      |
| Load type            | `loadType`                       | `C` approved mapping         | Canonical label                                      | No default Dry value                          |
| Pickup date/window   | `pickupDate`, `pickupWindow`     | `C`                          | Factual values                                       | Missing values explicit                       |
| Planned interval     | `plannedStartAt`, `plannedEndAt` | `U` in current seed          | Show only when canonical values exist                | `scheduled_start_time` is not promoted        |
| Transfer state       | `transfer.isTransfer`            | `C`                          | Factual transfer state                               | None                                          |
| Source lineage       | `transfer.sourceTrip`            | `J` exact trip reference     | Source code when present                             | Missing reference is unavailable, not guessed |
| Resource summary     | `assignments`                    | `P`                          | Current driver/truck/helpers and explicit Unassigned | Direct trip aliases are not independent truth |
| Created/updated      | `createdAt`, `updatedAt`         | `C` record metadata          | Label as record timestamps                           | Never call them audit logs                    |
| Freshness            | `freshness`                      | `D` request result           | Development snapshot/fetched time                    | No durable/live claim                         |
| Version              | `version`                        | `U` current seed             | Show only if supplied                                | No fabricated version                         |

## Stops and route traceability

| Requirement              | Typed field                        | Source                                            | Rule                                                          | Evidence                       |
| ------------------------ | ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- | ------------------------------ |
| Sequence                 | `sequence`                         | `C` `stop_sequence`                               | Numeric ascending, stable ID tie-breaker                      | order tests                    |
| Stop type                | `type`                             | `C/P` normalized Pickup/Dropoff/Other             | Text plus icon; no color-only meaning                         | mapping/component tests        |
| Facility/location        | `location`                         | `J` exact `location_id`                           | Approved label and inactive cue                               | projection tests               |
| Address/instruction      | `specificAddress`                  | `C` `specific_address`                            | Canonical stop-specific value                                 | schema-boundary test           |
| Reference address        | `location.address/province/region` | `J` exact Location                                | Secondary factual reference                                   | projection tests               |
| Consignee association    | `consignee`                        | `U` unless a returned stop-specific source exists | Omit/unavailable                                              | no fabricated association scan |
| Planned/actual stop time | `scheduledAt`, `actualAt`          | `C` when supplied                                 | Factual timestamp only                                        | missing-value tests            |
| Route summary            | `origin`, `destination`            | `D` first/last ordered supported stop             | No GPS, travel time, distance, optimization, or live tracking | static and component tests     |

The Phase 2B projection does not expose legacy `city_area` or `notes` as independent stop fields.

## Assignment traceability

| Requirement                  | Typed field                   | Source                                                    | Rule                                                      | Limitation/evidence            |
| ---------------------------- | ----------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | ------------------------------ |
| Current driver               | `current.driver`              | `P` unreleased row whose employee role resolves to Driver | One factual projection; inactive cue retained             | direct alias disagreement test |
| Current truck                | `current.truck`               | `P` deduplicated unreleased returned truck association    | Plate or Unassigned; inactive cue                         | legacy combined-row limitation |
| Current helpers              | `current.helpers`             | `P` unreleased Helper rows                                | Repeatable array; no fixed two-helper contract            | projection tests               |
| Explicit Unassigned          | `state`                       | `D` from current projection                               | Text, not color alone                                     | component tests                |
| History role                 | `history[].role`              | `P` employee role mapping                                 | Driver/Helper; truck-only role only if source supports it | projection tests               |
| Assigned timestamp           | `assignedAt`                  | `C` assignment row                                        | Factual timestamp                                         | chronological order tests      |
| Released timestamp           | `releasedAt`                  | `C` when supplied                                         | Factual timestamp/state                                   | released-state tests           |
| Assigned actor               | `assignedBy`                  | `U` current type/seed                                     | Show only when supplied                                   | missing-value test             |
| Release actor/reason         | `releasedBy`, `releaseReason` | `U/C` reason only when supplied                           | Show only factual returned values                         | missing-value test             |
| Historical inactive resource | reference `active`            | `J` employee/truck record                                 | Add explicit inactive historical cue                      | service/component tests        |

No assignment, replacement, release, override, availability, overlap validation, truck-state mutation, or history write is exposed.

## Events traceability

| Requirement         | Typed field      | Source                     | Rule                       | Evidence               |
| ------------------- | ---------------- | -------------------------- | -------------------------- | ---------------------- |
| Event type          | `eventType`      | `C` event record           | Safe text label            | projection tests       |
| Occurred time       | `occurredAt`     | `C` `event_timestamp`      | Stable chronological order | order tests            |
| Recorded by         | `recordedBy`     | `J` exact encoder employee | Label when supplied        | projection tests       |
| Notes               | `notes`          | `C` remarks                | Safe returned text only    | component tests        |
| Safe metadata       | `documentNumber` | `C`                        | Render only when supplied  | component tests        |
| Empty/loading/error | section state    | `D` request lifecycle      | Independent from Overview  | component/routed tests |

No event create, edit, or delete behavior is included.

## Fuel traceability

| Requirement         | Typed field       | Source                                | Rule                                   | Evidence               |
| ------------------- | ----------------- | ------------------------------------- | -------------------------------------- | ---------------------- |
| Date/time           | `occurredAt`      | `C` `logged_at`                       | Factual timestamp                      | projection tests       |
| Quantity            | `quantity`        | `C` liters                            | Numeric value                          | projection tests       |
| Unit                | `unit`            | `P` exact semantic of legacy `liters` | `L`; explicitly development projection | contract test          |
| Unit price          | `unitPrice`       | `U`                                   | Unavailable; never derived             | missing-price test     |
| Line cost           | `lineCost`        | `C` returned `total_amount`           | Factual returned amount                | projection test        |
| Recorder            | `recordedBy`      | `J` encoder employee                  | Label when supplied                    | projection test        |
| Total quantity      | `totals.quantity` | `D` sum of returned section records   | Same returned unit only                | total test             |
| Total cost          | `totals.cost`     | `D` sum of returned line costs        | No billing/invoice meaning             | total test             |
| Empty/loading/error | section state     | `D` request lifecycle                 | Independent from Overview              | component/routed tests |

No fuel create, edit, delete, billing, export, or unsupported analytics behavior is included.

## Activity/audit truthfulness

| Current source                                                   | Classification                                     | Phase 2B behavior                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| Trip `created_at`/`updated_at`                                   | record metadata, not audit history                 | Overview timestamps only                                             |
| React state, renders, request timing, or list/detail differences | unsupported synthetic source                       | never converted into activity                                        |
| Global development audit array                                   | not approved trip-specific source; currently empty | not consumed                                                         |
| Assignment rows                                                  | assignment history only                            | rendered only under Assignments                                      |
| Trip events                                                      | operational events only                            | rendered only under Events                                           |
| Approved trip-specific audit endpoint                            | absent                                             | Activity returns `supported: false` and documents backend dependency |

P2B-AC-11 cannot be satisfied by inventing data. Its truthful Phase 2B result is an explicit unsupported source state plus tests and documentation.

## Permission traceability

| Role       | Read Overview/Stops/Assignments/Events/Fuel | Existing Edit link                      | Mutations added by Phase 2B |
| ---------- | ------------------------------------------- | --------------------------------------- | --------------------------- |
| SuperAdmin | Read                                        | Central policy, record state            | None                        |
| Admin      | Read                                        | Central policy, record state            | None                        |
| Dispatcher | Read                                        | Central policy, record state            | None                        |
| Encoder    | Read                                        | Only owned Draft through central policy | None                        |
| Viewer     | Read                                        | Hidden                                  | None                        |

Detail components receive `usePermissions()` results and call the centralized policy. They do not compare role names or define a local matrix. Frontend behavior is not production authorization.

## URL, navigation, and focus traceability

| Behavior           | Canonical representation                  | Required outcome                        | Evidence                      |
| ------------------ | ----------------------------------------- | --------------------------------------- | ----------------------------- |
| Quick selection    | list route `quick=<tripId>`               | Back/Forward/direct/reload predictable  | unit and routed tests         |
| Full selection     | `/trips/:tripId`                          | direct/reload intended record           | smoke and detail routed tests |
| Selected section   | `section=<id>`                            | Back/Forward and retry preserve section | component/routed tests        |
| Legacy tab inbound | `tab=<legacy>`                            | normalize to `section`, remove `tab`    | route test                    |
| Return context     | carried Phase 2A query keys               | Back to Trip Operations preserves query | routed tests                  |
| Quick open focus   | URL-selected panel heading/close          | predictable focus movement              | component/Playwright test     |
| Quick close focus  | origin Open control or operations heading | focus restoration                       | component/Playwright test     |
| Escape             | removes only `quick`                      | dismissible panel closes                | component/Playwright test     |
| Record change      | route ID change                           | scroll reset and obsolete reads ignored | component test                |

## State model traceability

| State                       | Quick              | Full/section                    | Truthful behavior            |
| --------------------------- | ------------------ | ------------------------------- | ---------------------------- |
| Initial loading             | yes                | yes                             | skeleton/status announcement |
| Section loading             | not applicable     | yes                             | Overview remains visible     |
| Background refresh          | yes                | yes                             | safe data retained           |
| Not found                   | panel-specific     | full-page specific              | distinct from denial         |
| Authentication required     | service-normalized | service-normalized/route reauth | no protected content         |
| Authorization denied        | service-normalized | route/service specific          | no protected flash           |
| Service unavailable/network | retryable          | page/section specific           | safe context retained        |
| Cancelled obsolete request  | hidden from user   | hidden from user                | never generic error          |
| Stale/recoverable warning   | retain quick facts | retain Overview/section         | never label stale as fresh   |
| No stops                    | not loaded         | explicit empty                  | factual                      |
| No active assignments       | summary Unassigned | explicit empty/current state    | factual                      |
| No assignment history       | not loaded         | explicit empty                  | factual                      |
| No events                   | not loaded         | explicit empty                  | factual                      |
| No fuel                     | not loaded         | explicit empty                  | factual                      |
| Unsupported activity        | not loaded         | explicit unsupported            | backend dependency named     |

## Acceptance-criteria mapping

| ID        | Result | Executed evidence                                                     |
| --------- | ------ | --------------------------------------------------------------------- |
| P2B-AC-01 | `PASS` | prerequisite record, implementation plan, and status-ledger scan      |
| P2B-AC-02 | `PASS` | implementation plan and finalized field/interaction traceability      |
| P2B-AC-03 | `PASS` | contracts, source scans, service/component tests, and coverage        |
| P2B-AC-04 | `PASS` | Quick unit/routed/history/focus and responsive visual evidence        |
| P2B-AC-05 | `PASS` | direct/reload/Back/Forward/return/section routed evidence             |
| P2B-AC-06 | `PASS` | Overview projection, component, routed, and visual evidence           |
| P2B-AC-07 | `PASS` | stop service/order/component and responsive evidence                  |
| P2B-AC-08 | `PASS` | assignment projection/history/permission/static evidence              |
| P2B-AC-09 | `PASS` | independent event service/component/static evidence                   |
| P2B-AC-10 | `PASS` | fuel totals/component/static evidence                                 |
| P2B-AC-11 | `PASS` | typed unsupported Activity result and source-boundary review          |
| P2B-AC-12 | `PASS` | five-role policy, routed, and no-flash evidence                       |
| P2B-AC-13 | `PASS` | state/error/cancellation/race/retained-data tests                     |
| P2B-AC-14 | `PASS` | keyboard/axe checks and manually inspected 60-image responsive matrix |
| P2B-AC-15 | `PASS` | compatibility register and source regression scans                    |
| P2B-AC-16 | `PASS` | later-mutation static scans, scope review, and completion report      |

Phase 2B is `APPROVED` and `COMPLETE`. Phase 2C is `NOT_STARTED`, eligible to begin, and `May start: Yes`; Phase 2D and every later phase remain blocked. This approval turn does not begin Phase 2C.
