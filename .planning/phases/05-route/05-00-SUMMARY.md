---
phase: 05-route
plan: "00"
subsystem: route
tags: [tdd, test-scaffolds, route-url, route-store, route-service]
dependency_graph:
  requires: []
  provides:
    - tests/route/route-url.test.ts
    - tests/route/route-store.test.ts
    - tests/route/route-service.test.ts
  affects:
    - app/features/route/route-url.ts (Plan 02)
    - app/features/route/route-service.ts (Plan 01)
    - app/features/route/route.store.ts (Plan 01)
tech_stack:
  added: []
  patterns:
    - vitest test harness for Zustand slices via minimal StateCreator wrapper
    - vi.stubGlobal for google.maps mock in test environment
    - RED test scaffolds — imports reference non-existent source files intentionally
key_files:
  created:
    - tests/route/route-url.test.ts
    - tests/route/route-store.test.ts
    - tests/route/route-service.test.ts
  modified: []
decisions:
  - Route store test harness uses minimal StateCreator shim — no full AppStore needed for unit tests
  - route-service tests stub google.maps.importLibrary globally — avoids real API calls in test env
  - route-store tests pass against existing full implementation (main repo had it pre-implemented)
metrics:
  duration: "14 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_created: 3
requirements:
  - ROUT-03
  - ROUT-07
  - ROUT-09
  - ROUT-11
---

# Phase 5 Plan 0: Wave 0 Test Scaffolds Summary

**One-liner:** RED test scaffolds for buildGoogleMapsUrl, RouteSlice addStop/clearRoute, and computeRoute using mocked Route class — locking the module APIs before Plan 01-02 implement them.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create tests/route/route-url.test.ts | 2a16b2d | tests/route/route-url.test.ts |
| 2 | Create tests/route/route-store.test.ts and route-service.test.ts | 7513924 | tests/route/route-store.test.ts, tests/route/route-service.test.ts |

## What Was Built

Three test files covering all Wave 0 test requirements:

**tests/route/route-url.test.ts** (ROUT-07)
- `buildGoogleMapsUrl` with 1 stop → `api=1`, `origin=`, `destination=`, `travelmode=driving`
- `buildGoogleMapsUrl` with 3 stops → `waypoints=` with pipe-separated intermediates
- `buildGoogleMapsUrl` with empty address → lat,lng coordinate fallback
- `buildGoogleMapsUrl` with empty stops → returns `''`

**tests/route/route-store.test.ts** (ROUT-09, ROUT-11)
- `addStop` under cap → returns `true`, stop added
- `addStop` at 25 stops → returns `false`, stop NOT added
- `clearRoute` → resets `routeStops`, `routeResult`, `routeActive`, `shareableUrl`
- `clearRoute` → does NOT reset `startMode` or `customStartAddress`

**tests/route/route-service.test.ts** (ROUT-03)
- `computeRoute` with mocked Route class → returns `RouteResult` with correct `optimizedOrder`
- `computeRoute` when Route throws → returns `null`
- `computeRoute` parses duration string `"3600s"` → `totalDurationSeconds: 3600`

## Test State

| Test File | State | Reason |
|-----------|-------|--------|
| route-url.test.ts | RED | `app/features/route/route-url.ts` does not exist (Plan 02 creates it) |
| route-service.test.ts | RED | `app/features/route/route-service.ts` does not exist (Plan 01 creates it) |
| route-store.test.ts | GREEN | Main repo's `route.store.ts` was pre-implemented in commit `bb9035b` |

The route-store tests passing is not a problem — they validate the existing expanded RouteSlice implementation. The Wave 0 goal is satisfied: test APIs are locked before implementation plans run.

## Deviations from Plan

### Discovery: route.store.ts already fully implemented

**Found during:** Task 2 (route-store test harness)
**Issue:** The main repo's `route.store.ts` (at `/home/wzrd/gwv2/gwv2/app/features/route/route.store.ts`) already has the full implementation including `addStop` returning `boolean`, `routeActive`, `shareableUrl`, `startMode`, `setRouteActive`, `setShareableUrl`, etc. This was committed in `bb9035b map functionality`.
**Impact:** The route-store tests pass immediately (GREEN) rather than being RED. The test file still locks the API contract and validates the existing implementation — this is correct behavior.
**No fix needed:** The implementation being ahead of its plan is acceptable. Plan 01 will still reference and expand the store as needed.

## Known Stubs

None — this plan creates test files only, no production code stubs.

## Self-Check: PASSED

Files exist:
- FOUND: tests/route/route-url.test.ts
- FOUND: tests/route/route-store.test.ts
- FOUND: tests/route/route-service.test.ts

Commits exist:
- FOUND: 2a16b2d (route-url.test.ts)
- FOUND: 7513924 (route-store.test.ts, route-service.test.ts)
