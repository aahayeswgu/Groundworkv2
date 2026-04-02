---
phase: 06-planner
plan: 01
subsystem: state
tags: [zustand, typescript, store, planner, migration, localStorage]

# Dependency graph
requires:
  - phase: 02-pins
    provides: PinsSlice, AppStore shape, persist middleware pattern

provides:
  - PlannerSlice type with all actions (app/types/planner.types.ts)
  - createPlannerSlice factory with full implementation (app/features/planner/planner.store.ts)
  - AppStore v2 with planner persistence (app/store/index.ts)
  - purgeStaleDays called on startup via StoreHydration

affects: [06-02, 06-03, 06-04, 06-05, all planner UI components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - StateCreator slice composition for planner feature
    - Zustand persist version migration (v1→v2)
    - 30-day purge on hydration for ephemeral day data
    - pinId deduplication in addPlannerStop
    - Notes multi-page pagination with session-only page tracking

key-files:
  created:
    - app/types/planner.types.ts
    - app/features/planner/planner.store.ts
  modified:
    - app/store/index.ts
    - app/components/StoreHydration.tsx

key-decisions:
  - "PlannerSlice uses string dates throughout (addedAt, visitedAt as ISO strings, not Date objects)"
  - "session-only state (activeNotesPage, calendarOpen, monthViewOpen) not persisted — only plannerDays/activePlannerDate/trackingEnabled go into partialize"
  - "version < 2 migration initializes planner key for users with existing v0/v1 data"
  - "store name 'groundwork-pins-v1' kept unchanged to preserve all existing pin data"
  - "purgeStaleDays called in separate useEffect from rehydrate to ensure safe execution order"

patterns-established:
  - "Pattern: getOrCreateDay helper for safe plannerDays access without mutation"
  - "Pattern: addPlannerStop deduplicates by pinId (null pinId allowed multiple times)"
  - "Pattern: addActivityEntry caps at 100 entries per day and respects trackingEnabled flag"

requirements-completed: [FOUN-05, FOUN-06]

# Metrics
duration: 15min
completed: 2026-03-31
---

# Phase 6 Plan 01: Planner Types and Store Migration Summary

**Zustand store migrated v1→v2 with PlannerSlice added, typed planner data structures defined, and 30-day stale-day purge wired on startup**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-31T00:00:00Z
- **Completed:** 2026-03-31T00:00:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Defined all planner types (PlannerStop, DayPlan, ActivityEntry, PlannerSlice) with string dates per project convention
- Implemented createPlannerSlice with pinId deduplication, activity log cap at 100, and 30-day purge
- Migrated store from v1 to v2 with correct migration path covering v0→v2 and v1→v2 upgrades
- Wired purgeStaleDays into StoreHydration.tsx so stale days are cleaned on every app startup

## Task Commits

1. **Task 1: Define planner types** - `1c87550` (feat)
2. **Task 2: Create PlannerSlice with all actions** - `f90069b` (feat)
3. **Task 3: Store migration v1→v2 + StoreHydration purge wiring** - `a2880fa` (feat)

## Files Created/Modified

- `app/types/planner.types.ts` - PlannerStopStatus, PlannerStop, ActivityEntry, DayPlan, PlannerSlice types
- `app/features/planner/planner.store.ts` - createPlannerSlice factory + getOrCreateDay helper
- `app/store/index.ts` - AppStore v2 with PlannerSlice, updated partialize, migration branches
- `app/components/StoreHydration.tsx` - Added purgeStaleDays() useEffect after mount

## Decisions Made

- Used two separate `useEffect` calls in StoreHydration: one for `rehydrate()`, one for `purgeStaleDays()` — cleaner separation of concerns than sequencing inside one effect
- `version < 2` condition covers both v0 and v1 upgrades in a single migration branch, avoiding duplicate logic
- `getOrCreateDay` exported from planner.store.ts so UI components can use it without importing the full slice

## Deviations from Plan

None - plan executed exactly as written.

Note: StoreHydration.tsx was found to NOT have the usePinSync import referenced in the plan's `read_first` context — the actual file called `useStore.persist.rehydrate()` directly. The implementation was adjusted to match the actual file state (already the correct behavior per plan's intent).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PlannerSlice fully defined and accessible via `useStore`
- All planner actions (addPlannerStop, setPlannerStopStatus, purgeStaleDays, notes pagination, etc.) are ready
- Store at version 2 with correct migration — existing pins data safe
- Ready for 06-02: Sidebar planner tab + PlannerPanel scaffold

---
*Phase: 06-planner*
*Completed: 2026-03-31*
