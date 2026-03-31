---
phase: 03-supabase-sync
plan: 03
subsystem: pins-sync
tags: [supabase, sync, zustand, client, hooks]

# Dependency graph
requires:
  - "03-01 (@supabase/supabase-js installed, vitest configured)"
  - "03-02 (merge.ts, localToRemote, RemotePin type)"
provides:
  - "app/lib/supabase.ts singleton Supabase client"
  - "app/features/pins/sync/usePinSync.ts pull-on-load + debounced push hook"
  - "StoreHydration.tsx delegating to usePinSync"
affects:
  - "app/components/StoreHydration.tsx"

# Tech tracking
tech_stack:
  added: []
  patterns:
    - "Zustand plain subscribe (no subscribeWithSelector needed) — fires on all store changes, filters by pin ID set delta"
    - "Immediate soft-delete upsert on deletion detection (not debounced) to minimize cross-device window"
    - "Module-level pushPins/softDeleteFromSupabase (outside hook) to avoid closure issues in flushOnUnload"

key_files:
  created:
    - app/lib/supabase.ts
    - app/features/pins/sync/usePinSync.ts
  modified:
    - app/components/StoreHydration.tsx

decisions:
  - "Used plain useStore.subscribe (1-arg form) instead of selector form — Zustand v5 requires subscribeWithSelector middleware for 2-arg subscribe; adding it was architectural overhead; plain subscribe with manual pin tracking works correctly"
  - "prevPinIdsRef tracks Set<string> of current pin IDs to detect deletions — simpler than augmenting deletePin action"

metrics:
  duration: "~5 minutes"
  completed: "2026-03-31"
  tasks: 2
  files: 3
---

# Phase 03 Plan 03: Supabase Sync Wire-Up Summary

**One-liner:** Supabase singleton client + usePinSync hook wiring pull-on-load merge, debounced push, immediate soft-delete, and beforeunload flush into StoreHydration.

## What Was Built

`app/lib/supabase.ts` — singleton Supabase client with env var guard (throws on missing credentials).

`app/features/pins/sync/usePinSync.ts` — client hook with full sync lifecycle:
1. `useStore.persist.rehydrate()` — restores localStorage pins synchronously on mount
2. `pullAndMerge()` — fetches all Supabase pins, calls `mergePins` (LWW semantics), sets store state; initializes `prevPinIdsRef` after first merge
3. `useStore.subscribe` — detects pin set changes; soft-deletes removed IDs immediately via `softDeleteFromSupabase`; debounces full upsert via `pushPins` at 2000ms
4. `beforeunload` — flushes pending debounce to prevent data loss on tab close

`app/components/StoreHydration.tsx` — replaced direct `useStore.persist.rehydrate()` call with `usePinSync()`.

## Deviation from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zustand v5 subscribe API mismatch**
- **Found during:** Task 1 TypeScript check
- **Issue:** Plan specified `useStore.subscribe(selector, listener)` (2-arg form) which requires `subscribeWithSelector` middleware. The store uses only `persist` middleware — TypeScript error TS2554 "Expected 1 arguments, but got 2"
- **Fix:** Rewrote subscribe callback to use plain 1-arg `useStore.subscribe((state) => { ... })` — reads `state.pins` directly, maintains `prevPinIdsRef` for deletion detection
- **Files modified:** `app/features/pins/sync/usePinSync.ts`
- **Commit:** d146a68

## SQL Migration (Pending Human Action)

The following SQL must be run in Supabase Dashboard → SQL Editor → New Query:

```sql
create table pins (
  id             text primary key,
  title          text not null default '',
  address        text not null default '',
  status         text not null default 'prospect',
  lat            double precision not null,
  lng            double precision not null,
  contact        text not null default '',
  phone          text not null default '',
  follow_up_date text not null default '',
  notes          jsonb not null default '[]',
  created_at     timestamptz not null,
  updated_at     timestamptz not null,
  deleted_at     timestamptz
);

alter table pins enable row level security;

create policy "anon_select" on pins for select to anon using (true);
create policy "anon_insert" on pins for insert to anon with check (true);
create policy "anon_update" on pins for update to anon using (true) with check (true);
```

## Task Commits

1. **Task 1: Create supabase singleton and usePinSync hook** — `d146a68`
2. **Task 2: Update StoreHydration and SQL migration** — `657fb69`

## Test Results

- TypeScript: 0 errors (`npx tsc --noEmit`)
- Vitest: 17/17 tests pass (merge.test.ts + sync-mappers.test.ts)

## Task 3: Smoke Test (Checkpoint — Awaiting Human)

Human verification required:
- Run dev server: `npm run dev`
- Test cross-tab sync (add pin in Tab A → appears in fresh incognito Tab B after page load)
- Confirm soft-delete (deleted pin has `deleted_at` in Supabase Dashboard, not hard-deleted)
- Check no console errors on load

## Known Stubs

None. All sync behaviors are fully wired.

## Self-Check: PASSED

- app/lib/supabase.ts: FOUND
- app/features/pins/sync/usePinSync.ts: FOUND
- app/components/StoreHydration.tsx: FOUND (updated)
- Commit d146a68 (Task 1): FOUND
- Commit 657fb69 (Task 2): FOUND
