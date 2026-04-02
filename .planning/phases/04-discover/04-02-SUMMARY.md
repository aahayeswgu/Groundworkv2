---
phase: 04-discover
plan: "02"
subsystem: discover
tags: [google-maps, places-new-api, zustand, typescript]

requires:
  - phase: 04-discover plan 01
    provides: discover-filters.ts filterAndMapPlace(), discover-queries.ts DISCOVER_QUERIES, DiscoverSlice setSearchProgress

provides:
  - discover-search.ts with searchBusinessesInArea() and validateBounds()
  - Sequential 19-query Places New API loop with 200ms delay
  - Bounds validation (200m min, 30000m max diagonal)

affects:
  - 04-discover plan 04 (DiscoverLayer calls searchBusinessesInArea after rectangle draw)

tech-stack:
  added: []
  patterns:
    - "useStore.getState() called at function call-time (not module top level) to avoid SSR issues"
    - "locationRestriction.rectangle cast as any — @types/google.maps lags behind New API"
    - "setSearchProgress accessed via optional-chaining for parallel plan compatibility"

key-files:
  created:
    - app/features/discover/discover-search.ts
    - app/config/discover-queries.ts
    - app/features/discover/discover-filters.ts
  modified: []

key-decisions:
  - "Cast locationRestriction as any — @types/google.maps v3.58.1 types LatLngBounds|LatLngBoundsLiteral for locationRestriction, not the rectangle object shape used by Places New API"
  - "setSearchProgress accessed via optional chaining — method lives in DiscoverSlice after plan 01 adds it; safe fallback no-op for TypeScript in parallel execution"
  - "discover-queries.ts and discover-filters.ts created as part of this plan since plan 01 (parallel Wave 1) had not yet run; plan 01 will overwrite with authoritative implementations"

patterns-established:
  - "Pattern: useStore.getState() inside async function body, not at module top level"
  - "Pattern: sleep helper defined at module bottom as arrow function"

requirements-completed:
  - DISC-03
  - DISC-04

duration: 8min
completed: "2026-03-31"
---

# Phase 04 Plan 02: Discover Search Orchestrator Summary

**Places New API sequential search engine with 19-query loop, 200ms delay, bounds validation, and Zustand progress updates**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-31T21:36:00Z
- **Completed:** 2026-03-31T21:44:00Z
- **Tasks:** 1
- **Files modified:** 3 created

## Accomplishments

- `searchBusinessesInArea()` exported — async orchestrator calling Place.searchByText() for each of 19 DISCOVER_QUERIES
- `validateBounds()` exported — checks diagonal distance is 200m–30000m using geometry.spherical
- Rectangle `locationRestriction` used (not LatLngBounds object) with correct SW/NE mapping
- Sequential loop with `await sleep(200)` between queries, progress updates per query, alphabetical sort on completion

## Task Commits

1. **Task 1: Create discover-search.ts with validateBounds and searchBusinessesInArea** - `336e909` (feat)

## Files Created/Modified

- `app/features/discover/discover-search.ts` - Core search orchestrator (primary deliverable)
- `app/config/discover-queries.ts` - 19 construction/trades query strings (Wave 1 stub, plan 01 authoritative)
- `app/features/discover/discover-filters.ts` - filterAndMapPlace() with bounds check and type exclusion (Wave 1 stub, plan 01 authoritative)

## Decisions Made

- Cast `locationRestriction` as `any` — `@types/google.maps` v3.58.1 types it as `LatLngBounds | LatLngBoundsLiteral` but the New Places API accepts `{ rectangle: { low, high } }`. Runtime behavior is correct; TypeScript types lag behind.
- `setSearchProgress` accessed via optional chaining with no-op fallback — method is added to DiscoverSlice by plan 01 (parallel Wave 1). This ensures TypeScript passes without plan 01's store changes, while the production code works correctly once both plans are merged.
- Created `discover-queries.ts` and `discover-filters.ts` as minimal stubs to satisfy TypeScript imports. Plan 01 is the authoritative owner of these files and will overwrite them with complete implementations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created discover-queries.ts and discover-filters.ts stubs**
- **Found during:** Task 1 (TypeScript check after creating discover-search.ts)
- **Issue:** Plan imports `@/app/config/discover-queries` and `@/app/features/discover/discover-filters` from plan 01, which runs in parallel (Wave 1). Files did not exist, causing `TS2307` errors.
- **Fix:** Created minimal but functionally correct implementations: 19-query array in discover-queries.ts, filterAndMapPlace() with bounds check + type exclusion in discover-filters.ts.
- **Files modified:** app/config/discover-queries.ts (created), app/features/discover/discover-filters.ts (created)
- **Verification:** `npx tsc --noEmit` passes with 0 errors
- **Committed in:** 336e909

**2. [Rule 1 - Bug] Cast locationRestriction as any for New API rectangle shape**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `TS2353` — object literal may only specify known properties, 'rectangle' does not exist in `LatLngBounds | LatLngBoundsLiteral`
- **Fix:** Added `as any` cast with eslint-disable comment; runtime behavior is correct per research
- **Files modified:** app/features/discover/discover-search.ts
- **Verification:** `npx tsc --noEmit` passes, `grep -n "rectangle"` confirms correct shape
- **Committed in:** 336e909

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 type bug)
**Impact on plan:** Both auto-fixes required for TypeScript compilation. No scope creep. Plan 01 will overwrite stub files with authoritative implementations.

## Issues Encountered

- `@types/google.maps` v3.58.1 `locationRestriction` type predates the Places New API `rectangle` form — required `as any` cast. This is a known library limitation, not a code error.

## Known Stubs

- `app/config/discover-queries.ts` — 19 queries written here are correct but plan 01 is the authoritative owner. If plan 01 ran first, this file would already exist with plan 01's content.
- `app/features/discover/discover-filters.ts` — minimal implementation. Plan 01 owns the authoritative version with full exclusion logic.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `searchBusinessesInArea()` and `validateBounds()` ready for DiscoverLayer (plan 04) to call on mouseup/touchend after rectangle draw
- `discover-search.ts` has no React imports — safe to call imperatively from any client component
- Depends on plan 01 providing the authoritative `discover-filters.ts` and `discover-queries.ts`

## Self-Check: PASSED

All files created and commit verified:
- app/features/discover/discover-search.ts — FOUND
- app/config/discover-queries.ts — FOUND
- app/features/discover/discover-filters.ts — FOUND
- Commit 336e909 — FOUND

---
*Phase: 04-discover*
*Completed: 2026-03-31*
