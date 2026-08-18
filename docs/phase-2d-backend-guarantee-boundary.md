# Phase 2D Backend-Guarantee Boundary

## Preflight determination

Current source exposes only typed frontend services backed by reset-on-refresh development data. No authorized production assignment API, database transaction, schema migration, RLS policy, request-correlation store, or persistent audit/history endpoint is present in this checkout.

Phase 2D may therefore implement a typed development-adapter workflow for local UI review. It must not claim durable assignment persistence, atomic concurrent overlap prevention, production authorization, RLS, transactional rollback, idempotency storage, audit correlation, or vehicle-status side effects.

## Authoritative production contract

DEC-004 and DEC-005 require an `Asia/Manila` half-open planned interval `[planned_start_at, planned_end_at)`, authoritative `trip_assignments`, and atomic rejection of overlapping unreleased assignments. Adjacent intervals are permitted; confirmed/concurrent overlaps return normalized `409` `ASSIGNMENT_CONFLICT`. Reassignment releases the prior row and creates the replacement in one transaction; a rejected command creates no assignment, projection, vehicle, or history mutation.

Those guarantees require a separately authorized production backend/schema implementation and direct integration evidence. They are `PARTIAL` for Phase 2D development-adapter evidence, not passed production criteria.

## Development-adapter evidence boundary

The local adapter may simulate typed availability, eligibility, conflict, stale-version, reassignment, release, history, and cancellation behavior. Every UI surface must identify it as development-only and reset-on-refresh. The simulation is evidence of frontend contract/presentation only.

## Approved Phase 2D scope and exclusions

Phase 2D owns availability and assignment. It does not implement Phase 2E trip transitions, completion, cancellation, cancellation-driven release, or vehicle-status transition side effects. No production endpoint, migration, Inventory, Billing, export, AI, or management redesign is authorized.
