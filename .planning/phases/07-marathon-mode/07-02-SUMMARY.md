---
phase: 07-marathon-mode
plan: "02"
subsystem: discover-search, map
tags: [marathon, accumulation, zones, rectangles, map-drawing]
dependency_graph:
  requires: [07-01]
  provides: [marathon accumulation logic, zone rectangle persistence, marathon re-entry draw]
  affects:
    - app/features/discover/discover-search.ts
    - app/features/map/Map.tsx
tech_stack:
  added: []
  patterns: [conditional state accumulation, Google Maps Rectangle pool, globalThis.Map disambiguation]
key_files:
  created: []
  modified:
    - app/features/discover/discover-search.ts
    - app/features/map/Map.tsx
decisions:
  - "Used globalThis.Map<K,V> for the zone rect pool ref to avoid TypeScript ambiguity with google.maps.Map"
  - "Zone promotion reads useStore.getState().marathonMode inside the event handler (not closure) to always get current value"
  - "enterDiscoverMode() called after promotion — re-registers fresh draw listeners for the next marathon zone"
  - "resetMarathon() called inside exitDiscoverMode only when marathonMode is false at exit time — marathon zones survive across draws"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-01T20:34:42Z"
  tasks: 2
  files: 2
---

# Phase 07 Plan 02: Marathon Accumulation + Zone Rectangles Summary

**One-liner:** Conditional result accumulation in discover-search.ts (dedup pre-seeding, per-zone registration) and zone rectangle pool in Map.tsx (promote-to-pool on draw complete, re-enter mode, cleanup on unmount and normal-mode exit).

## What Was Built

Connected marathon state (from Plan 01) to the actual search and drawing flows so that marathon mode produces visually persisted zone rectangles and a deduplicated combined result pool.

### Task 1: discover-search.ts — marathon accumulation

Modified `searchBusinessesInArea`:

- **Conditional clear:** `if (!marathonMode) setDiscoverResults([])` — normal mode clears, marathon mode keeps the existing pool.
- **Dedup pre-seeding:** `existingResults.forEach((r) => seen.add(r.placeId))` — cross-zone duplicates are excluded from new search results.
- **Separate newResults array:** Only results unique to this draw are stored in `newResults` for zone attribution.
- **Combined sort + set:** `[...existingResults, ...newResults].sort(...)` pushed to store in marathon mode; `newResults.sort(...)` in normal mode.
- **Zone registration:** After each marathon search, `addMarathonZone({ id, label, bounds, results: newResults, resultCount })` + `incrementMarathonCount()` called before clearing progress.

### Task 2: Map.tsx — zone rectangle management

- **marathonZoneRectsRef:** `useRef<globalThis.Map<string, google.maps.Rectangle>>(new globalThis.Map())` — stores persisted zone rects keyed by timestamp.
- **resetMarathon** read from store alongside existing `marathonMode`.
- **exitDiscoverMode updated:** Always clears `areaRectRef`. In normal mode also clears zone rect pool (`forEach setMap(null)`) and calls `resetMarathon()`. In marathon mode zone rects remain on the map.
- **Post-draw promotion (touch + desktop):** After `searchBusinessesInArea(bounds)`, if `marathonMode` is true and `areaRectRef.current` exists, the rectangle is restyled to a lighter zone overlay, moved to `marathonZoneRectsRef` pool, `areaRectRef` nulled, and `enterDiscoverMode()` called to ready the next draw.
- **Map unmount cleanup:** `marathonZoneRectsRef.current.forEach(r => r.setMap(null))` in the `useEffect` return function.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 786c559 | feat(07-02): marathon accumulation in discover-search.ts |
| 2 | 7722c79 | feat(07-02): zone rectangle pool and marathon re-entry in Map.tsx |

## Deviations from Plan

**1. [Rule 1 - Bug] Resolved TypeScript Map type ambiguity**
- **Found during:** Task 2
- **Issue:** `useRef<Map<string, google.maps.Rectangle>>(new Map())` caused TS errors "Expected 1 arguments, but got 0" and "new expression, whose target lacks a construct signature" because TypeScript resolved `Map` to `google.maps.Map` in this scope.
- **Fix:** Used `globalThis.Map<string, google.maps.Rectangle>` and `new globalThis.Map()` to explicitly target the built-in ES Map.
- **Files modified:** app/features/map/Map.tsx line 42
- **Commit:** 7722c79

## Known Stubs

None — this plan wires core search and drawing logic. No UI rendering stubs.

## Self-Check: PASSED

- app/features/discover/discover-search.ts — FOUND, marathon logic at lines 38–123
- app/features/map/Map.tsx — FOUND, zone rect pool at lines 42, 88–95, 193–204, 266–277, 328–329
- commit 786c559 — FOUND
- commit 7722c79 — FOUND
- TypeScript compiles with no new errors (pre-existing errors in Sidebar.tsx, DiscoverPanel.tsx, DiscoverLayer.tsx, route-store.test.ts are unrelated to this plan)
