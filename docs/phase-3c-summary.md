# Phase 3C — Customer and Reference Data Summary

Phase 3C adds the routed **Customer & Reference Data** workspace at `/trip-scheduling/reference-data`.

- Clients/customers, consignees, locations, and internal client codes can be searched and managed by SuperAdmin/Admin.
- Dispatcher, Encoder, and Viewer retain read-only reference-data presentation using the existing policy matrix.
- Clients, consignees, and locations can be activated/deactivated; inactive records remain readable in this workspace and active trip-selector lookups continue to omit inactive clients.
- Load types are visible but immutable in this phase, preserving the canonical catalog boundary.
- The service and UI are explicitly development-adapter only.

Review evidence is in `docs/phase-3c-verification-report.md` and `docs/evidence/phase-3c-responsive/`.
