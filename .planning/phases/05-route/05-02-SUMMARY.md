---
phase: 05-route
plan: "02"
subsystem: route
tags: [route, utilities, geocoding, google-maps, typescript]
dependency_graph:
  requires:
    - app/types/route.types.ts (Plan 01)
  provides:
    - app/features/route/route-service.ts
    - app/features/route/route-url.ts
    - app/features/route/route-markers.ts
    - app/lib/geocoding.ts (extended)
  affects:
    - app/features/route/RouteLayer.tsx (Plan 03 — uses computeRoute, createNumberedMarkerElement)
    - app/features/route/RouteConfirmPanel.tsx (Plan 04 — uses buildGoogleMapsUrl, forwardGeocode, getCurrentGpsPosition)
tech_stack:
  added: []
  patterns:
    - google.maps.importLibrary('routes') Route class for computeRoutes (not deprecated DirectionsService)
    - URLSearchParams + manual pipe-join for Google Maps api=1 shareable URL format
    - Lazy geocoder singleton reused across reverseGeocode and forwardGeocode
    - vi.fn(function() { return mock; }) for Vitest v4 constructor mocking
key_files:
  created:
    - app/features/route/route-service.ts
    - app/features/route/route-url.ts
    - app/features/route/route-markers.ts
  modified:
    - app/lib/geocoding.ts
    - tests/route/route-service.test.ts
decisions:
  - Route class (routes library) used instead of deprecated DirectionsService — avoids deprecated-API debt from Feb 2026
  - optimizeWaypointOrder (not optimizeWaypoints) — DirectionsService name causes silent failure per research Pitfall 1
  - api=1 URL format overrides D-05 path format — documented, stable, correct encoding via URLSearchParams
  - waypoints appended manually outside URLSearchParams to preserve literal pipe separators without double-encoding
  - Cast to any for Route class import — @types/google.maps@3.58.1 does not yet include Route in RoutesLibrary
  - Vitest v4 requires function() not arrow function for vi.fn() constructor mocks
metrics:
  duration: "8 minutes"
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
requirements:
  - ROUT-03
  - ROUT-04
  - ROUT-07
  - ROUT-08
---

# Phase 5 Plan 02: Route Utility Modules Summary

**One-liner:** Pure TypeScript utilities for route optimization (Route class wrapper), Google Maps URL building (api=1 format), numbered branded markers, and geocoding extensions — with all TDD tests going GREEN.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create route-service.ts — computeRoute() Route class wrapper | 2644db7 | app/features/route/route-service.ts |
| 2 | Create route-url.ts, route-markers.ts, extend geocoding.ts | f9482f0 | app/features/route/route-url.ts, app/features/route/route-markers.ts, app/lib/geocoding.ts, tests/route/route-service.test.ts |

## What Was Built

### route-service.ts

`computeRoute(origin, stops, returnToStart)` async wrapper around the Google Maps Route class:
- Uses `google.maps.importLibrary('routes')` — NOT the deprecated DirectionsService (removed from plan Feb 2026)
- `optimizeWaypointOrder: true` — NOT `optimizeWaypoints` (DirectionsService naming; wrong name causes silent failure)
- Duration parsed with `parseInt(route.duration ?? '0', 10)` — proto3 Duration string format like `"3600s"`
- Returns null on error — callers handle null to show user feedback, no throws
- Return-to-start: when `returnToStart=true`, all stops become intermediates and destination equals origin
- Cast to `any` for `importLibrary` result — `@types/google.maps@3.58.1` does not include `Route` in `RoutesLibrary`

### route-url.ts

`buildGoogleMapsUrl(origin, stops)` builds the official Google Maps directions URL:
- Uses `?api=1` format (documented, stable) — overrides D-05 path format per research recommendation
- Waypoints joined with pipe `|` and appended manually after URLSearchParams to avoid double-encoding
- Address preferred, `${lat},${lng}` fallback when address is empty
- Returns empty string for empty stops array
- Mobile truncation note in JSDoc: 3 waypoint limit on mobile browsers (D-08 warning is caller's responsibility)

### route-markers.ts

`createNumberedMarkerElement(label, color)` factory for numbered stop circles:
- Brand orange `#D4712A` default (matches `--orange` token and marker design)
- White `#fff` text on 28px circle with subtle border and box-shadow
- `pointer-events:none` prevents marker intercepting map clicks
- `user-select:none` prevents text selection on label
- Caller wraps in `new google.maps.marker.AdvancedMarkerElement({ content: ... })`

### geocoding.ts (extended)

Added alongside existing `reverseGeocode()`:
- `forwardGeocode(address)` — resolves address string to `{lat, lng}` or null; reuses lazy geocoder singleton
- `getCurrentGpsPosition()` — Promise-wrapped `navigator.geolocation.getCurrentPosition` with 10s timeout

## Test Results

All 11 route tests GREEN after this plan:

| Test File | Before | After | Notes |
|-----------|--------|-------|-------|
| route-url.test.ts | RED (file missing) | GREEN | 4/4 pass |
| route-service.test.ts | RED (file missing) | GREEN | 3/3 pass |
| route-store.test.ts | GREEN (pre-implemented) | GREEN | 4/4 pass |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed double-encoding of waypoints in buildGoogleMapsUrl**

- **Found during:** Task 2 — route-url.test.ts test `'includes pipe-separated waypoints for 3-stop route'`
- **Issue:** Original implementation used `params.set('waypoints', intermediates.map(s => encodeURIComponent(...)).join('|'))`. URLSearchParams encodes the already-encoded string, producing `Stop%2520A` instead of expected `Stop%20A`.
- **Fix:** Append waypoints manually outside URLSearchParams: `${base}&waypoints=${encodedAddresses.join('|')}`
- **Files modified:** app/features/route/route-url.ts
- **Commit:** f9482f0

**2. [Rule 1 - Bug] Fixed MockRoute arrow function causing Vitest v4 constructor failure**

- **Found during:** Task 2 — route-service tests all returning null
- **Issue:** Vitest v4 requires mock functions used as constructors to be declared with `function` keyword, not arrow functions. `vi.fn(() => mockRoute)` throws `() => mockRoute is not a constructor` at `new MockRoute()`.
- **Fix:** Changed all three MockRoute declarations in route-service.test.ts to `vi.fn(function() { return mockRoute; })`
- **Files modified:** tests/route/route-service.test.ts
- **Commit:** f9482f0

**3. [Rule 2 - Missing cast] Cast importLibrary result to any for Route class**

- **Found during:** Task 1 — TypeScript compile error `Property 'Route' does not exist on type 'RoutesLibrary'`
- **Issue:** `@types/google.maps@3.58.1` does not include the `Route` class in `RoutesLibrary` — types lag behind the runtime API (same pattern as discover Plans 03/04)
- **Fix:** Cast `(await google.maps.importLibrary('routes')) as any` with explanatory comment
- **Files modified:** app/features/route/route-service.ts
- **Commit:** 2644db7

## Known Stubs

None — all four modules are pure TypeScript utilities with no rendering or UI state. No placeholder data flows to any UI.

## Self-Check: PASSED

Files exist:
- FOUND: app/features/route/route-service.ts
- FOUND: app/features/route/route-url.ts
- FOUND: app/features/route/route-markers.ts
- FOUND: app/lib/geocoding.ts (modified)

Commits exist:
- FOUND: 2644db7 (route-service.ts)
- FOUND: f9482f0 (route-url.ts, route-markers.ts, geocoding.ts, test fix)
