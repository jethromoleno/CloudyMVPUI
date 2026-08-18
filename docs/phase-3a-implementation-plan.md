# Phase 3A Implementation Plan - Vehicle Management

## Gate and objective

Phase 2E is `APPROVED` and `COMPLETE` (Jethro, 2026-07-27, `APPROVED: Phase 2E`). The canonical sequence supplied by Jethro makes Phase 3A the next eligible phase.

Objective: replace the legacy truck-management mutation path with a typed, permission-presented development-adapter workflow for vehicle master data, canonical vehicle status, maintenance records, and non-destructive lifecycle actions.

## In scope

- Vehicle list/detail, search, and factual state presentation.
- Typed vehicle read/create/update/status, maintenance, and lifecycle contracts.
- Canonical `AVAILABLE`, `IN_USE`, `MAINTENANCE`, and `INACTIVE` states and history.
- Maintenance type/status/schedule/completion/cost/general notes.
- SuperAdmin/Admin lifecycle presentation with a required reason; block deactivation when an unreleased active assignment exists; retain historical readability and exclude inactive vehicles from new selectors.
- No vehicle Delete action or hard-delete call.
- Focused unit/browser/accessibility evidence and a plain-language summary.

## Exclusions and boundary

No backend endpoint, migration, durable audit, production authorization/RLS, atomic multi-client locking, truck branch field, maintenance odometer, or vendor/mechanic field is implemented. The development adapter resets on refresh and is not a production persistence, authorization, concurrency, or audit guarantee. Every later listed phase is out of scope.

## Acceptance and verification

- Canonical status and maintenance fields have typed contracts; unsupported fields are absent.
- Allowed and denied presentation uses the existing centralized policy only.
- Create/update/status/lifecycle validation, deactivation conflict, historical read, and inactive-selector exclusion are tested.
- Typecheck, formatter, focused unit tests, browser role/a11y paths, and responsive evidence run before review.

## Affected areas and rollback

`services/contracts.ts`, a Phase 3A vehicle service, `services/index.ts`, the truck route/component, focused tests, the compatibility register, and Phase 3A records. Rollback removes the Phase 3A service registration and route composition; development-adapter changes reset on refresh and no production data or migration is affected.

## Compatibility disposition

Legacy vehicle branch, odometer, and vendor/mechanic values remain readable only on historical mock projections. They are removed from Phase 3A create/edit and maintenance submissions, are not represented by the typed vehicle contracts, and are governed by the compatibility register rather than promoted to approved vehicle fields.
