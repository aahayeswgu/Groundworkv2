---
phase: 02-pins
plan: 03
subsystem: map
tags: [geocoding, pin-drop, google-maps, typescript, reverse-geocode]

# Dependency graph
requires:
  - phase: 02-pins
    plan: 01
    provides: PinsSlice store foundation
  - phase: 01-foundation
    provides: Map.tsx with MapContext, MapButton, mapInstance ref

provides:
  - reverseGeocode(latLng) async utility in app/lib/geocoding.ts — lazy singleton Geocoder with coordinate fallback
  - Map.tsx drop mode: dropMode boolean state, enterDropMode/exitDropMode useCallback functions
  - pendingPin state in Map.tsx (PendingPin interface with lat/lng/address)
  - "Drop a pin" MapButton wired with active state and toggle behavior

affects: [02-04, 02-06]

# Tech tracking
tech-stack:
  added: [google.maps.Geocoder, google.maps.importLibrary("geocoding"), google.maps.MapsEventListener]
  patterns:
    - "Lazy singleton Geocoder: module-level variable initialized on first reverseGeocode call"
    - "One-shot map click listener: attached in enterDropMode, removed in exitDropMode after first click"
    - "draggableCursor option for crosshair cursor in drop mode"

key-files:
  created:
    - app/lib/geocoding.ts
  modified:
    - app/features/map/Map.tsx

key-decisions:
  - "exitDropMode and enterDropMode defined before map init useEffect to avoid block-scoped variable usage before declaration TypeScript error"
  - "coordinateFallback in geocoding.ts provides lat/lng string when geocoding fails or returns no results"
  - "pendingPin logged to console for now — Plan 06 will render PinModal using this state"

# Metrics
duration: 8min
completed: 2026-03-31
---

# Phase 02 Plan 03: Pin-Drop Mode and Reverse Geocoding Summary

**Reverse geocoding utility with lazy Geocoder singleton, and Map.tsx drop mode wired to the pin-drop button with one-shot map click handler that sets pendingPin state**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-31T20:09:43Z
- **Completed:** 2026-03-31T20:18:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `app/lib/geocoding.ts` with lazy-initialized `google.maps.Geocoder` singleton
- `reverseGeocode(latLng)` returns `formatted_address` or falls back to coordinate string on failure
- Added `dropMode` boolean state and `dropListener` ref to Map.tsx
- `enterDropMode` sets crosshair cursor and attaches a one-shot map click listener
- Map click in drop mode: extracts LatLng, calls `reverseGeocode`, sets `pendingPin` state
- `exitDropMode` removes listener, resets cursor — called after click and in map cleanup
- "Drop a pin" MapButton wired with `active={dropMode}` and toggle `onClick`

## Task Commits

1. **Task 1: Create app/lib/geocoding.ts — lazy reverse geocode utility** - `708c4a3` (feat)
2. **Task 2: Wire pin-drop mode into Map.tsx** - `698d33b` (feat)

## Files Created/Modified

- `app/lib/geocoding.ts` — New utility: lazy singleton Geocoder, reverseGeocode export, coordinateFallback
- `app/features/map/Map.tsx` — Added drop mode state/callbacks, reverseGeocode import, PendingPin interface, MapButton wiring

## Decisions Made

- `exitDropMode` and `enterDropMode` must be defined before the map init `useEffect` to satisfy TypeScript's block-scoped variable rules
- `google.maps.importLibrary("geocoding")` is separate from the `maps` and `marker` libraries — called lazily on first geocode request
- `pendingPin` state held in Map.tsx; Plan 06 will render PinModal driven by this state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed exitDropMode declaration order**
- **Found during:** Task 2 TypeScript check
- **Issue:** TypeScript error TS2448/TS2454 — `exitDropMode` used in map init `useEffect` cleanup before its `useCallback` declaration
- **Fix:** Moved `exitDropMode` and `enterDropMode` useCallback declarations above the map init `useEffect` in the component body
- **Files modified:** `app/features/map/Map.tsx`
- **Commit:** `698d33b`

## Known Stubs

- `pendingPin` useEffect logs to console only — Plan 06 will wire PinModal rendering. This is intentional; the pendingPin state contract is established and ready for Plan 04/06 to consume.

## Self-Check: PASSED

- `app/lib/geocoding.ts` — FOUND
- `app/features/map/Map.tsx` — modified with drop mode
- Commit `708c4a3` — FOUND
- Commit `698d33b` — FOUND
- `npx tsc --noEmit` — exits 0

---
*Phase: 02-pins*
*Completed: 2026-03-31*
