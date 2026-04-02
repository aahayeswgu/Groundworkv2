---
phase: 03-supabase-sync
plan: 02
subsystem: pins-sync
tags: [merge, sync, tdd, pure-functions, mappers]
dependency_graph:
  requires: []
  provides: [merge-algorithm, field-mappers, RemotePin-type]
  affects: [app/features/pins/sync/usePinSync.ts]
tech_stack:
  added: [vitest]
  patterns: [last-write-wins, soft-delete, camelCase-snake_case-mapping]
key_files:
  created:
    - app/features/pins/sync/merge.ts
    - tests/pins/merge.test.ts
    - tests/pins/sync-mappers.test.ts
  modified: []
decisions:
  - "merge.ts is a pure module with no use client directive — enables isolated unit testing without browser/React setup"
  - "mergePins uses Map-based seed-then-apply pattern: seed local, apply remote with LWW semantics"
  - "Soft-delete only removes from merged result when remote updated_at is strictly newer than local updatedAt"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-31"
  tasks: 2
  files: 3
---

# Phase 03 Plan 02: Merge Algorithm and Field Mappers Summary

**One-liner:** Pure last-write-wins merge algorithm with camelCase/snake_case field mappers for data-loss-safe Supabase sync.

## What Was Built

`app/features/pins/sync/merge.ts` — a pure TypeScript module with three exports:

- `RemotePin` interface: snake_case fields matching the Supabase pins table schema
- `mergePins(localPins, remotePins)`: Map-based LWW merge; seeds from local, applies remote updates by comparing `updated_at` timestamps; handles soft-deletes by removing only when remote is newer than local
- `localToRemote(pin)`: maps Pin camelCase fields to RemotePin snake_case (followUpDate → follow_up_date, createdAt → created_at, updatedAt → updated_at; sets deleted_at to null)
- `remoteToLocal(remote)`: maps RemotePin snake_case back to Pin camelCase; casts status string to PinStatus

Two test files provide full coverage of all behaviors via TDD (RED then GREEN):

- `tests/pins/merge.test.ts`: 7 cases — local newer wins, remote newer wins, remote-only add, local-only keep, soft-delete newer removes, soft-delete older keeps, soft-delete with no local counterpart omits
- `tests/pins/sync-mappers.test.ts`: 10 cases — individual field mapping, key exclusion checks, round-trip fidelity

## Test Results

17 / 17 assertions pass. Exit code 0.

## Deviations from Plan

None — plan executed exactly as written.

Vitest was already installed from plan 03-01. The vitest.config.ts was already present. No additional setup was needed beyond creating the test directories and files.

## Known Stubs

None. merge.ts is a complete, fully-functional pure module. No placeholder values, no TODO items.

## Self-Check: PASSED

- app/features/pins/sync/merge.ts: FOUND
- tests/pins/merge.test.ts: FOUND
- tests/pins/sync-mappers.test.ts: FOUND
- Commit 52ed1c7 (test RED): FOUND
- Commit 1d6ea7d (feat GREEN): FOUND
