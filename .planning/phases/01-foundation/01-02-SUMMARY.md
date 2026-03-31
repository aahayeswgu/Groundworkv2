---
phase: 01-foundation
plan: 02
subsystem: map
tags: [google-maps, react-context, advanced-marker, map-context, strict-mode-safety]
dependency_graph:
  requires:
    - useStore (app/store/index.ts) — from 01-01
    - MapButton (app/components/MapButton.tsx) — from 01-01
  provides:
    - MapContext (app/features/map/MapContext.ts)
    - useMapInstance() (app/features/map/MapContext.ts)
    - AdvancedMarkerElement availability (via importLibrary("marker") in Map.tsx)
  affects:
    - Phase 2 MarkerLayer (consumes useMapInstance() and AdvancedMarkerElement)
    - Phase 4 DiscoverOverlay (consumes useMapInstance())
    - Phase 5 RouteLayer (consumes useMapInstance())
tech_stack:
  added: []
  patterns:
    - React Context for map instance sharing (no prop drilling)
    - mapState useState to avoid accessing refs during render (lint-safe pattern)
    - React Strict Mode safe cleanup via clearInstanceListeners + null ref
key_files:
  created:
    - app/features/map/MapContext.ts
  modified:
    - app/features/map/Map.tsx
decisions:
  - Use mapState (useState) instead of mapInstance.current in Provider value to comply with react-hooks/refs lint rule
  - Map.tsx is the sole MapContext.Provider — page.tsx needs no changes (Map handles context internally)
  - DEMO_MAP_ID as default for NEXT_PUBLIC_GOOGLE_MAP_ID (Google built-in constant for development)
metrics:
  duration: ~5 minutes
  completed: "2026-03-31"
  tasks_completed: 3
  files_created: 1
  files_modified: 1
---

# Phase 01 Plan 02: MapContext and Map Instance Sharing Summary

MapContext created with useMapInstance() hook; Map.tsx updated with mapId (DEMO_MAP_ID fallback), marker library preload, React Strict Mode safe cleanup, and MapContext.Provider wrapping — enabling AdvancedMarkerElement for all downstream phases.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create MapContext and add NEXT_PUBLIC_GOOGLE_MAP_ID to env | 8f3681c | app/features/map/MapContext.ts, .env.local (gitignored) |
| 2 | Update Map.tsx — add mapId, load marker library, cleanup, provide MapContext | 1d9569b | app/features/map/Map.tsx |
| 3 | Wrap app/page.tsx in MapContext.Provider and verify build | — | No file changes needed; Map.tsx is the provider |

## What Was Built

**MapContext (app/features/map/MapContext.ts)**
- `MapContext`: `createContext<google.maps.Map | null>(null)` — the shared context for the live map instance
- `useMapInstance()`: throws a descriptive error if called outside a provider, returns non-nullable `google.maps.Map`
- No "use client" directive — context module, not a component; `.ts` extension (no JSX)

**Updated Map.tsx (app/features/map/Map.tsx)**
- Added `mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID"` as first option in Map constructor (required for AdvancedMarkerElement)
- Added `"marker"` to libraries array in `setOptions`
- Awaits `importLibrary("marker")` after map init — ensures AdvancedMarkerElement is available before downstream phases use it
- Added `mapState` useState tracking — stores the map instance in state (not just a ref) so it can safely be used as the Provider value during render (avoids react-hooks/refs lint violation)
- Added useEffect cleanup return function: `clearInstanceListeners` + `mapInstance.current = null` + `setMapState(null)` — prevents double-map creation in React Strict Mode
- Wraps return JSX in `<MapContext.Provider value={mapState}>...</MapContext.Provider>`

**app/page.tsx**: No changes needed — Map.tsx internally provides MapContext to any future children rendered inside it.

**.env.local**: Added `NEXT_PUBLIC_GOOGLE_MAP_ID=DEMO_MAP_ID` (gitignored, not committed).

## Verification Results

- `npx tsc --noEmit`: passes (0 errors)
- `npm run lint`: passes (0 errors)
- `npm run build`: passes — static pages compiled successfully

End-to-end checks:
- `grep "export const MapContext"` app/features/map/MapContext.ts: FOUND
- `grep "export function useMapInstance"` app/features/map/MapContext.ts: FOUND
- `grep "mapId"` app/features/map/Map.tsx: FOUND
- `grep "importLibrary.*marker"` app/features/map/Map.tsx: FOUND
- `grep "MapContext.Provider"` app/features/map/Map.tsx: FOUND
- `grep "clearInstanceListeners"` app/features/map/Map.tsx: FOUND

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used useState for Provider value instead of ref.current**
- **Found during:** Task 2 lint verification
- **Issue:** `react-hooks/refs` ESLint rule flags accessing `mapInstance.current` during render (in the Provider value prop). The lint rule is correct — refs accessed during render don't trigger re-renders, which would cause the Provider to silently serve a stale null.
- **Fix:** Added `mapState` (`useState<google.maps.Map | null>(null)`). After map init + marker library load, `setMapState(mapInstance.current)` stores the instance in React state. The Provider uses `value={mapState}` — a state variable, not a ref. This also fixes the Strict Mode double-render issue since the Provider value only becomes non-null after the async init completes.
- **Files modified:** app/features/map/Map.tsx
- **Commit:** 1d9569b (included in Task 2 commit)

## Known Stubs

None — MapContext provides the live map instance once initialized. The null initial state is correct behavior (map hasn't loaded yet, not a stub).

## Self-Check: PASSED

Files verified:
- FOUND: app/features/map/MapContext.ts
- FOUND: app/features/map/Map.tsx (modified)

Commits verified:
- 8f3681c: feat(01-02): create MapContext and useMapInstance hook
- 1d9569b: feat(01-02): update Map.tsx with mapId, marker library, cleanup, and MapContext
