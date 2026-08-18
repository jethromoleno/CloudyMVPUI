# Phase 2C Trip Form Traceability

## Gate provenance

Phase 2B is `APPROVED` and `COMPLETE`. Phase 2C was approved by Jethro on 2026-07-24 via exact instruction `APPROVED: Phase 2C` and is `COMPLETE`. Phase 2D is eligible but `NOT_STARTED` (`May start: Yes`); Phase 2E+ remain blocked.

## Field traceability

| Form field               | Canonical contract                                     | Lookup/source                                                | Required/validation                                                      | Permission                                 | Compatibility treatment                                             |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------- |
| Trip advice code         | `trip_advise_code`                                     | Typed initialization/create lookup contract                  | Required; unique/valid format per service                                | `TRIP_ADVICE.CREATE`/`UPDATE` presentation | Legacy `trip_code` is read projection only                          |
| Encoder                  | `encoder_employee_id`                                  | Current authenticated identity plus approved employee lookup | Required; active approved encoder                                        | Central Phase 1C policy                    | No guessed fallback                                                 |
| Branch                   | `branch_id`                                            | Active branch lookup                                         | Required where approved; inactive existing value readable only           | Create/Update policy                       | No employee/truck branch extension                                  |
| Client                   | `client_id`                                            | Active client lookup                                         | Required; inactive existing value read-only                              | Create/Update policy                       | `customer_id` is read alias only                                    |
| Internal client code     | `internal_client_code_id`                              | Client-scoped typed lookup                                   | Required only when applicable; must belong to client                     | Create/Update policy                       | No legacy guessed code                                              |
| Consignee                | `consignee_id`                                         | Client-scoped active lookup                                  | Required only when applicable; valid reference                           | Create/Update policy                       | Label rendered, ID submitted canonically                            |
| Load type                | `load_type_id` / canonical code                        | Active load-type catalog                                     | Required; active selection only                                          | Create/Update policy                       | Legacy label/status IDs not submitted                               |
| Save intent              | `DRAFT` or `SCHEDULED`                                 | Explicit form control                                        | No arbitrary status; Scheduled interval and stops required               | Create/Update policy                       | Legacy status dropdown removed                                      |
| Planned interval         | `planned_start_at`, `planned_end_at`                   | Typed date/time controls                                     | Asia/Manila; supplied Draft values valid; Scheduled end later than start | Create/Update policy                       | `scheduled_start_time` is legacy projection only                    |
| Transfer                 | `is_transfer`, `transfer_from_id`                      | Typed transfer-source lookup                                 | Transfer requires valid non-self source                                  | Create/Update policy                       | No assignment release or transition side effects                    |
| Ordered stops            | `stops[]` with sequence/type/location/specific address | Active location lookup                                       | Scheduled needs pickup and drop-off; unique deterministic sequence       | Create/Update policy                       | `city_area`/`notes` not submitted as independent canonical fields   |
| Version                  | server-managed `version`                               | Edit initialization                                          | Required on Edit; stale conflict preserves local input                   | Update policy                              | Never fabricated by client                                          |
| Assignment display       | read-only projection                                   | Phase 2B detail/typed initialization                         | Never writable in Phase 2C                                               | No assignment action                       | `truck_id`, `driver_id`, and helper aliases remain read-only/legacy |
| Created/updated metadata | server-managed timestamps                              | Edit initialization/response                                 | Read-only                                                                | No mutation                                | Not represented as synthetic audit history                          |

## Assignment boundary inventory

Legacy direct reads/writes occur in `TripList.tsx`, `apiService.ts`, Trip Operations projections, and Phase 2B read projections. Phase 2C may display existing assignment projections through typed initialization, but Create/Edit submissions must not contain `truck_id`, `driver_id`, `helper1_employee_id`, or `helper2_employee_id`; no availability, overlap, release, replace, or vehicle-status behavior is added.

## Error and recovery traceability

| Error                        | Required UI behavior                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication/authorization | Resolve before protected values; distinguish denial from not found                                                                                         |
| Not found                    | Route-specific safe state; no protected record values                                                                                                      |
| Lookup failure/unavailable   | Block dependent submission; preserve entered values and offer retry                                                                                        |
| Validation                   | Field-associated errors plus summary/focus; preserve valid input                                                                                           |
| Stale version                | Development token mismatch returns normalized `409`/`STALE_VERSION` before local writes; preserve local edits, no auto-merge, accessible refresh-and-retry |
| Cancellation                 | Treat obsolete requests as cancelled; do not clear current form                                                                                            |
| Successful save              | Clear dirty state and navigate to approved Trip Details/return context                                                                                     |

## Acceptance evidence map

P2C-AC-01 is evidenced by the gate provenance above and the Phase 2B completion/traceability records. P2C-AC-02 through P2C-AC-13 have routed/service/boundary evidence, including the development-only stale-token no-write test. P2C-AC-14 has the 69-image responsive ledger and automated accessibility evidence. P2C-AC-15 has the compatibility register update. P2C-AC-16 is bounded by the completion report's explicit Phase 2D exclusion review.

## Known gaps before implementation

The current source lacks a typed authoring service, canonical form DTOs, route-specific initialization/cancellation, server-managed version behavior, transaction-level no-partial-write behavior, and dedicated responsive Phase 2C evidence. These are implementation/backend-boundary gaps, not permission to invent production behavior.
