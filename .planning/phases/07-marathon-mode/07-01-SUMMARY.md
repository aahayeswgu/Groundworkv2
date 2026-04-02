---
phase: 07-marathon-mode
plan: "01"
subsystem: discover-state
tags: [marathon, state, zustand, types]
dependency_graph:
  requires: []
  provides: [MarathonZone type, marathon state fields, marathon actions on DiscoverSlice]
  affects: [app/features/discover/discover.store.ts, app/types/discover.types.ts]
tech_stack:
  added: []
  patterns: [Zustand slice extension, immutable state updates]
key_files:
  created: []
  modified:
    - app/types/discover.types.ts
    - app/features/discover/discover.store.ts
decisions:
  - "MarathonZone bounds shape reuses existing DrawBounds structure — no conversion needed"
  - "clearMarathonZone decrements marathonSearchCount with floor at 0 via Math.max"
  - "Two imports from discover.types combined as separate named imports for clarity"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-01T20:29:45Z"
  tasks: 2
  files: 2
---

# Phase 07 Plan 01: Marathon State Foundation Summary

**One-liner:** MarathonZone type and DiscoverSlice marathon state (marathonMode, marathonZones, marathonSearchCount) with five actions enabling zone-structured multi-area discover accumulation.

## What Was Built

Added the MarathonZone data model and marathon state to the discover feature slice, preparing the foundation for Plans 02 and 03.

### Task 1: MarathonZone type (app/types/discover.types.ts)

Added `MarathonZone` interface export with:
- `id: string` — uuid unique per draw
- `label: string` — display label (e.g., "Zone 1")
- `bounds: { swLat, swLng, neLat, neLng }` — matches existing DrawBounds shape
- `results: DiscoverResult[]` — zone's search results
- `resultCount: number` — snapshot count for badge display

### Task 2: Marathon state on DiscoverSlice (app/features/discover/discover.store.ts)

Extended DiscoverSlice interface and createDiscoverSlice factory with:

**State fields:**
- `marathonMode: boolean` — initialized false
- `marathonZones: MarathonZone[]` — initialized []
- `marathonSearchCount: number` — initialized 0

**Actions:**
- `toggleMarathonMode()` — flips marathonMode boolean
- `addMarathonZone(zone)` — immutable spread append to marathonZones
- `clearMarathonZone(zoneId)` — filters by id, decrements count (floor 0)
- `resetMarathon()` — clears zones + count, leaves mode unchanged
- `incrementMarathonCount()` — increments marathonSearchCount by 1

**clearDiscover updated** to also reset marathonMode, marathonZones, marathonSearchCount.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 4453530 | feat(07-01): add MarathonZone type to discover.types.ts |
| 2 | 8b8bfa0 | feat(07-01): extend DiscoverSlice with marathon state and actions |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan adds pure state/type definitions with no UI rendering.

## Self-Check: PASSED

- app/types/discover.types.ts — FOUND, MarathonZone exported at line 12
- app/features/discover/discover.store.ts — FOUND, all 8 marathon fields/actions present
- commit 4453530 — FOUND
- commit 8b8bfa0 — FOUND
- TypeScript compiles with no errors
