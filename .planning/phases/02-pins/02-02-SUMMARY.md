---
phase: 02-pins
plan: 02
subsystem: map-markers
tags: [google-maps, advanced-marker-element, info-window, zustand, svg, typescript]

# Dependency graph
requires:
  - phase: 02-pins
    plan: 01
    provides: activeStatusFilter Set<PinStatus> on PinsSlice, Pin.notes as NoteEntry[]
  - phase: 01-foundation
    provides: MapContext, useMapInstance, AdvancedMarkerElement map support, Zustand store

provides:
  - createPinMarkerElement(status) returning compact 3D SVG HTMLElement
  - STATUS_COLORS record mapping PinStatus to hex color
  - MarkerLayer component syncing imperative marker pool to Zustand pins + activeStatusFilter
  - Native InfoWindow with DOM-built content and Edit/Delete/Route buttons
  - Toggle info window behavior (D-10) and single-window reuse across all markers

affects: [02-03, 02-04, 02-05, 02-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Imperative marker pool via useRef<Map<string, AdvancedMarkerElement>>
    - DOM-built InfoWindow content (not string HTML) to enable event listeners
    - Status-keyed gradient IDs in SVG defs to prevent conflicts across multiple markers
    - Null-safe useContext(MapContext) instead of throwing useMapInstance() for optional render

key-files:
  created:
    - app/features/pins/pin-marker.ts
    - app/features/map/MarkerLayer.tsx
  modified: []

key-decisions:
  - "Used useContext(MapContext) directly in MarkerLayer (not useMapInstance) — avoids throw when map is initializing, allowing early return"
  - "Gradient IDs scoped by status name (hg-prospect, shaft-active, etc.) to prevent SVG defs conflicts at high pin density"
  - "buildInfoWindowContent uses DOM element (not string) — required for click event listeners on Edit/Delete buttons (Pitfall 2)"
  - "handleMarkerClick captured in useCallback with map+buildInfoWindowContent deps, passed to sync effect — prevents stale closure on pin data"

# Metrics
duration: 8min
completed: 2026-03-31
---

# Phase 02 Plan 02: Pin Markers and InfoWindow Summary

**Compact 3D SVG pin marker generator and imperative AdvancedMarkerElement pool with native InfoWindow showing status badge, contact info, and Edit/Delete action buttons**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-31T20:07:00Z
- **Completed:** 2026-03-31T20:15:35Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `pin-marker.ts` with STATUS_COLORS record and `createPinMarkerElement(status)` returning a 24x36px compact 3D pin SVG using per-status gradient IDs and pure hex math color helpers
- Created `MarkerLayer.tsx` as a "use client" component with an imperative marker pool that syncs to Zustand pins + activeStatusFilter
- Implemented single shared InfoWindow that reuses across all markers with toggle behavior (D-10)
- DOM-built info window content enables proper click event delegation for Edit/Delete buttons
- Full cleanup on unmount (`marker.map = null` for each entry) prevents Strict Mode duplicates

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pin-marker.ts** - `2592a4d` (feat)
2. **Task 2: Create MarkerLayer.tsx** - `9fb2593` (feat)

## Files Created/Modified

- `app/features/pins/pin-marker.ts` - STATUS_COLORS + createPinMarkerElement + lightenColor/darkenColor helpers
- `app/features/map/MarkerLayer.tsx` - Imperative marker pool, InfoWindow, Edit/Delete button handlers, cleanup effect

## Decisions Made

- Used `useContext(MapContext)` directly instead of `useMapInstance()` — the throwing hook is correct for components that require a map, but MarkerLayer should silently no-op while the map initializes rather than crash
- Gradient IDs scoped per status name to prevent SVG `<defs>` conflicts when multiple markers render simultaneously
- InfoWindow content built as DOM element tree (not innerHTML string) — required so `addEventListener` can capture `deletePin` and `onEditPin` closures without stale ref issues
- `handleMarkerClick` wrapped in `useCallback` so the sync effect can include it as a dep without triggering unnecessary marker pool rebuilds

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality] Used useContext instead of useMapInstance**
- **Found during:** Task 2 implementation
- **Issue:** `useMapInstance()` throws an error if called outside a MapContext.Provider or before the map initializes. Since MarkerLayer must handle null map gracefully during the initial render cycle, using the throwing hook would cause a crash.
- **Fix:** Used `useContext(MapContext)` directly with a null check and early return in the sync effect.
- **Files modified:** `app/features/map/MarkerLayer.tsx`
- **Commit:** 9fb2593

## Issues Encountered

None.

## Known Stubs

- Route button (`+ Route`) in the InfoWindow is a visual placeholder — clicking it has no effect. Will be wired in Phase 5 (Route).

## User Setup Required

None - MarkerLayer must be rendered as a child of `MapContext.Provider` in `Map.tsx` (to be done in Plan 06 when full page composition wires all components together).

## Next Phase Readiness

- `createPinMarkerElement` and `STATUS_COLORS` are available for any other component needing status color references
- `MarkerLayer` requires `onEditPin` prop — Plan 06 will provide this from PinModal open handler
- TypeScript compiles clean with zero errors
- Plans 02-03 through 02-06 can proceed — no blocking dependencies from this plan

---
*Phase: 02-pins*
*Completed: 2026-03-31*
