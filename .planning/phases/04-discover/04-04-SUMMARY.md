---
phase: 04-discover
plan: "04"
subsystem: discover
tags: [google-maps, advanced-marker, infowindow, rectangle-draw, touch, typescript]

requires:
  - phase: 04-discover plan 01
    provides: DiscoverSlice with discoverMode, discoverResults, selectedDiscoverIds
  - phase: 04-discover plan 02
    provides: searchBusinessesInArea(), validateBounds(), DrawBounds type
  - phase: 04-discover plan 03
    provides: createDiscoverMarkerElement(), buildDiscoverInfoContent(), buildQuickSavePin(), MARKER_Z_INDEX

provides:
  - DiscoverLayer.tsx — imperative marker pool with 3 SVG states and shared InfoWindow
  - Map.tsx — rectangle draw mode (desktop + mobile) with Discover button wired
  - hoveredDiscoverId/setHoveredDiscoverId in DiscoverSlice for cross-component hover sync

affects:
  - 04-05 (DiscoverPanel — can now call setHoveredDiscoverId to drive marker hover states)

tech-stack:
  added: []
  patterns:
    - "Imperative marker pool pattern (Map<placeId, AdvancedMarkerElement>) with in-place state update — same as MarkerLayer.tsx"
    - "Rectangle draw via native mousedown/mousemove/mouseup events — no deprecated DrawingManager"
    - "300ms hold-to-draw touch pattern for mobile rectangle selection"
    - "Marker click = focus only (pan + InfoWindow) — selection only via checkbox, never from marker click"
    - "hoveredDiscoverId in Zustand drives separate hover useEffect without re-triggering main sync"

key-files:
  created:
    - app/features/discover/DiscoverLayer.tsx
  modified:
    - app/features/map/Map.tsx
    - app/features/discover/discover.store.ts

key-decisions:
  - "hoveredDiscoverId added to DiscoverSlice in plan 04 (not plan 01) — allows DiscoverResultItem in plan 05 to call setHoveredDiscoverId without cross-plan coupling"
  - "Hover useEffect is separate from main sync useEffect — avoids re-running full marker pool sync on every hover event"
  - "exitDiscoverMode calls setDiscoverMode(false) directly — keeps discoverMode Zustand state in sync with visual map state"
  - "areaRect stays visible after draw completes — removed only when clearDiscover() is called (panel close), preserves visual context during result review"

requirements-completed:
  - DISC-02
  - DISC-03
  - DISC-09
  - DISC-10
  - DISC-13

duration: ~3min
completed: "2026-04-01"
---

# Phase 4 Plan 4: DiscoverLayer and Map Draw Mode Summary

**Imperative AdvancedMarkerElement pool with 3 SVG states and shared InfoWindow, plus rectangle draw mode (desktop mousedown + mobile 300ms hold) wired to Discover button in Map.tsx**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-01T02:00:00Z
- **Completed:** 2026-04-01T02:03:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `hoveredDiscoverId: string | null` and `setHoveredDiscoverId` to DiscoverSlice (required for DiscoverResultItem hover sync in plan 05)
- Created `app/features/discover/DiscoverLayer.tsx`: imperative marker pool using the same Map<string, AdvancedMarkerElement> pattern as MarkerLayer. Main sync useEffect adds/removes/updates markers as discoverResults and selectedDiscoverIds change. Separate hover useEffect reacts to hoveredDiscoverId without triggering full pool sync. Marker click pans map + shows InfoWindow (never toggles selection). Quick-save dedup checks name and coordinates before calling addPin.
- Updated `app/features/map/Map.tsx`: added enterDiscoverMode/exitDiscoverMode callbacks (mirrors enterDropMode/exitDropMode pattern), desktop rectangle draw via native mousedown/mousemove/mouseup Google Maps events, mobile 300ms hold-to-draw via touch event listeners. Discover MapButton wired with active/toggle behavior. DiscoverLayer mounted alongside MarkerLayer.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DiscoverLayer.tsx** - `82e5fbe` (feat)
2. **Task 2: Update Map.tsx** - `0a6a5a9` (feat)

## Files Created/Modified

- `app/features/discover/DiscoverLayer.tsx` — New: imperative marker pool + shared InfoWindow for discover results
- `app/features/map/Map.tsx` — Updated: Discover button wired, rectangle draw mode (desktop + mobile), DiscoverLayer mounted
- `app/features/discover/discover.store.ts` — Updated: hoveredDiscoverId + setHoveredDiscoverId added to DiscoverSlice

## Decisions Made

- `hoveredDiscoverId` added to DiscoverSlice in this plan (not plan 01) — enables plan 05 DiscoverResultItem to drive map marker hover without cross-plan dependency or circular imports
- Hover useEffect is separate from the main sync useEffect — prevents full marker pool re-sync on each hover event (performance correctness)
- `exitDiscoverMode` calls `setDiscoverMode(false)` to keep Zustand in sync — discoverMode state drives the button active state and should reflect actual map mode
- areaRect kept visible after draw triggers search — cleared only when user closes the results panel via `clearDiscover()`, preserving visual context while reviewing results

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all marker, InfoWindow, and draw functionality is fully wired. The "Add to Route" button in the InfoWindow (built by discover-info.ts) is disabled with `cursor:not-allowed` — intentional per D-07, wired in Phase 5.

## User Setup Required

None.

## Next Phase Readiness

- Plan 05 (DiscoverPanel) can now import `setHoveredDiscoverId` from the store to sync hover state from the list to map markers
- Plan 05 can also call `toggleDiscoverSelected` for checkbox behavior — marker state will update via the existing sync useEffect in DiscoverLayer
- DiscoverLayer is a null-render component — no JSX output, purely imperative Google Maps DOM management

## Self-Check: PASSED

- app/features/discover/DiscoverLayer.tsx — FOUND
- app/features/discover/discover.store.ts (hoveredDiscoverId) — FOUND
- app/features/map/Map.tsx (DiscoverLayer mount) — FOUND
- Commit 82e5fbe — FOUND (feat(04-04): create DiscoverLayer)
- Commit 0a6a5a9 — FOUND (feat(04-04): wire Discover button)
- `npx tsc --noEmit` — PASSED, 0 errors

---
*Phase: 04-discover*
*Completed: 2026-04-01*
