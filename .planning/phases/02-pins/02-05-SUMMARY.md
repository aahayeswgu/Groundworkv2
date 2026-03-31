---
phase: 02-pins
plan: 05
subsystem: ui
tags: [react, zustand, tailwind, sidebar, pinlist, search, filter, fly-to-pin]

# Dependency graph
requires:
  - phase: 02-pins
    plan: 01
    provides: PinsSlice with activeStatusFilter Set and setActiveStatusFilter action, Pin type with NoteEntry[]
  - phase: 02-pins
    plan: 02
    provides: MarkerLayer sets data-pin-id on marker elements for bounce targeting
  - phase: 01-foundation
    provides: MapContext with useMapInstance hook for map.panTo/setZoom

provides:
  - PinList component with live search (title/address/contact), 4 status filter chips synced to store, stats footer
  - PinListItem component with fly-to-pin click (panTo+setZoom 15) and .marker-bounce CSS animation
  - Sidebar renders PinList replacing all static placeholder content
  - markerBounce keyframe animation in globals.css
affects: [02-06, 03-discover, 04-route]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern: useContext(MapContext) directly in leaf components to safely handle null map without throwing"
    - "Pattern: STATUS_CHIPS array as module-level constant to keep JSX DRY across chip render"
    - "Pattern: EmptyState as inline component in same file — conditionally shows 'no pins' or 'no results' depending on searchText"
    - "Pattern: markerBounce via DOM query on data-pin-id attribute — decoupled from marker pool ref"

key-files:
  created:
    - app/features/pins/PinListItem.tsx
    - app/features/pins/PinList.tsx
  modified:
    - app/components/Sidebar.tsx
    - app/globals.css

key-decisions:
  - "Used useContext(MapContext) directly instead of useMapInstance() in PinListItem — useMapInstance throws on null which breaks SSR/render before map init"
  - "onEditPin optional on Sidebar with no-op default — avoids TypeScript error at page.tsx call site until Plan 06 wires it"
  - "STATUS_CHIPS defined as module-level constant — DRY, prevents re-creation on every render"
  - "EmptyState as private component in PinList.tsx file — avoids a separate file for a small internal helper"

patterns-established:
  - "Pattern: Sidebar is now a client component — all interactive sidebar children inherit client context automatically"

requirements-completed: [PINS-09, PINS-10, PINS-11]

# Metrics
duration: 10min
completed: 2026-03-31
---

# Phase 02 Plan 05: PinList + Sidebar Wiring Summary

**Live sidebar pin list with client-side search/filter, status chip sync to MarkerLayer, and fly-to-pin with bounce animation**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-31T20:30:00Z
- **Completed:** 2026-03-31T20:40:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Built PinListItem with map.panTo+setZoom(15) on click and .marker-bounce CSS applied to the data-pin-id DOM element
- Built PinList with controlled search input filtering by title/address/contact, 4 toggleable status chips that call setActiveStatusFilter (syncing MarkerLayer), live stats footer (total/active/this-week/overdue), and EmptyState variants
- Wired PinList into Sidebar replacing all 5 static placeholder sections (search, count, filters, list, stats); Sidebar converted to "use client"

## Task Commits

Each task was committed atomically:

1. **Task 1: Build PinListItem.tsx and PinList.tsx** - `2945a1f` (feat)
2. **Task 2: Wire PinList into Sidebar.tsx** - `451a1c1` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `app/features/pins/PinListItem.tsx` - Single pin row with status dot, title, address, fly-to-pin click handler, edit button
- `app/features/pins/PinList.tsx` - Search input, 4 status filter chips, scrollable filtered pin list, EmptyState, live stats footer
- `app/components/Sidebar.tsx` - Added "use client", optional onEditPin prop, replaced static sections with PinList
- `app/globals.css` - Added @keyframes markerBounce and .marker-bounce utility class

## Decisions Made
- Used `useContext(MapContext)` directly instead of `useMapInstance()` in PinListItem — the hook throws on null which would break rendering before the map initializes; MarkerLayer uses the same pattern
- Made `onEditPin` optional on Sidebar with a no-op default (`() => {}`) to keep page.tsx compiling cleanly until Plan 06 wires the prop
- STATUS_CHIPS defined as a module-level constant to avoid recreation on every render and keep JSX DRY

## Deviations from Plan

None - plan executed exactly as written. One minor pragmatic adjustment: used `useContext(MapContext)` directly instead of `useMapInstance()` to safely handle null map (the hook version throws), consistent with the same approach already used in MarkerLayer.

## Issues Encountered

None.

## Known Stubs

None — PinList reads live data from Zustand store; no hardcoded placeholder values in rendered output.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PinList and PinListItem are complete; Plan 06 can wire onEditPin to open the edit panel
- setActiveStatusFilter integration is live — MarkerLayer will hide/show markers in sync with sidebar chip toggles
- TypeScript compiles clean

## Self-Check: PASSED

- PinListItem.tsx: FOUND
- PinList.tsx: FOUND
- Sidebar.tsx: FOUND
- SUMMARY.md: FOUND
- Commit 2945a1f: FOUND
- Commit 451a1c1: FOUND
- TypeScript: CLEAN

---
*Phase: 02-pins*
*Completed: 2026-03-31*
