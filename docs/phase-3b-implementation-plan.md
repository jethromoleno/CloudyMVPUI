# Phase 3B Implementation Plan — Employee Management

## Gate and objective

Phase 3A is `APPROVED` and `COMPLETE` (Jethro, 2026-07-27, `APPROVE PHASE`). Phase 3B is explicitly selected and is the only active phase.

Objective: replace the legacy employee-directory mutation path with a typed, development-only employee workflow for approved employee master data, driver extension data, and non-destructive lifecycle actions.

## In scope

- Employee list/detail, search, factual active/employment-state presentation, and approved role filtering.
- Typed employee read/create/update contracts for user link where applicable, identity, canonical employee role, contact, employment state, and active state.
- Driver extension data: licence number, expiry, and general notes.
- SuperAdmin/Admin lifecycle presentation with a required reason; deactivation is blocked when an employee has an unreleased active assignment; inactive employees remain readable and are excluded from new assignment selectors.
- No employee Delete action or hard-delete call.
- Existing centralized permission policy only: SuperAdmin/Admin full management, Dispatcher/Encoder/Viewer read-only.
- Focused unit/browser/accessibility evidence and a plain-language summary.

## Exclusions and boundary

No backend endpoint, migration, durable audit, production authorization/RLS, atomic multi-client locking, employee branch ownership, or manual driver-availability override workflow is implemented. Assignment availability remains Phase 2D-owned. The development adapter resets on refresh and is not a production persistence, authorization, concurrency, or audit guarantee.

## Acceptance and verification

- Canonical employee role, employment, driver-extension, and lifecycle contracts exclude unsupported employee-branch and availability-write fields.
- Employee create/update/lifecycle use the typed service and existing centralized policy presentation.
- Lifecycle reason, active-assignment conflict, driver license requirements for activation, historical readability, inactive-selector exclusion, and no-delete behavior are tested.
- Typecheck, formatter, lint, focused unit tests, browser role/a11y paths, and responsive evidence run before review.

## Affected areas and rollback

`services/contracts.ts`, a Phase 3B employee service, `services/index.ts`, `App.tsx`, `components/EmployeeList.tsx`, focused tests, the compatibility register, and Phase 3B records. Rollback removes the Phase 3B service registration and route composition; development-adapter changes reset on refresh and no production data or migration is affected.

## Compatibility disposition

Legacy employee IDs, role labels, and optional display aliases remain read-only projections while the typed service maps them to canonical employee records. Legacy employee `branch_id` remains a historical projection only: it is not a Phase 3B form input, filter, or typed write field. Manual driver-availability records are not created, edited, or deleted by Phase 3B; authoritative assignment availability remains owned by Phase 2D.
