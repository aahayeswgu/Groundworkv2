---
phase: 05-route
plan: "03"
subsystem: route
tags: [route, map-overlay, google-maps, polyline, markers, imperative]
dependency_graph:
  requires:
    - app/types/route.types.ts (Plan 01 — RouteStop, RouteResult)
    - app/features/route/route.store.ts (Plan 01 — routeActive, routeResult, routeStops)
    - app/features/route/route-markers.ts (Plan 02 — createNumberedMarkerElement)
    - app/features/map/MapContext.tsx (existing — map instance)
  provides:
    - app/features/route/RouteLayer.tsx
  affects:
    - Route drawing on map (polyline + numbered stop markers)
    - Map viewport (fitBounds after route draw)
tech_stack:
  added: []
  patterns:
    - Imperative pool pattern (useRef array for bulk cleanup, like MarkerLayer.tsx Map pool)
    - Two-layer polyline (dark border + branded orange fill)
    - AdvancedMarkerElement with createNumberedMarkerElement content
    - useContext(MapContext) for map instance access (null-safe)
key_files:
  created:
    - app/features/route/RouteLayer.tsx
    - app/features/route/route-markers.ts (brought from Plan 02 for worktree)
  modified:
    - app/types/route.types.ts (brought from Plan 01 for worktree — added StartMode)
    - app/features/route/route.store.ts (brought from Plan 01 for worktree — full Phase 5 state)
decisions:
  - clearOverlays defined inside component (not useCallback) — only accesses stable refs, no closure dependencies
  - routeMarkerPoolRef is useRef<AdvancedMarkerElement[]> array (not Map) — numbered markers need only bulk cleanup, not keyed lookup
  - Two-layer polyline matches old app pattern (border weight 10 + fill weight 5) per research Pitfall 4
  - eslint-disable react-hooks/exhaustive-deps on main effect — clearOverlays is stable (refs only), no need to list
metrics:
  duration: "4 minutes"
  completed_date: "2026-04-01"
  tasks_completed: 1
  files_modified: 4
requirements:
  - ROUT-04
---

# Phase 5 Plan 03: RouteLayer.tsx Summary

**One-liner:** Imperative React component drawing two-layer orange polyline (#D4712A border + fill) and numbered AdvancedMarkerElement stop circles on the map, subscribing to routeResult/routeActive from Zustand store with full pool cleanup before redraw.

## What Was Built

### Task 1 — Create RouteLayer.tsx — polyline + numbered marker pool

Created `app/features/route/RouteLayer.tsx` — a React component that returns `null` and imperatively manages map overlays via `useEffect`.

**Two-layer polyline:**
- Border layer: `strokeColor: '#1A1A1A'`, `strokeWeight: 10`, `strokeOpacity: 0.5`, `zIndex: 1`
- Fill layer: `strokeColor: '#D4712A'`, `strokeWeight: 5`, `strokeOpacity: 0.9`, `zIndex: 2`
- Matches old app pattern from lines 6928-6930 per research documentation

**Numbered markers:**
- Uses `routeResult.optimizedOrder` to determine stop sequence
- Falls back to array order when `optimizedOrder.length === 0` (straight-line fallback)
- Each stop gets `createNumberedMarkerElement(String(i + 1))` — orange circle with white number
- Pool stored as `useRef<AdvancedMarkerElement[]>` — array is sufficient since cleanup is always bulk

**Cleanup:**
- `clearOverlays()` nulls both polyline refs and iterates/nulls all marker pool entries
- Called at start of every effect run (before redraw) and in the effect cleanup return
- Called immediately on `routeActive=false` or empty `routeStops` — no ghost markers

**Viewport:**
- After drawing, `LatLngBounds.extend` over all `polylinePath` points
- `map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })` frames the full route

**Commit:** b035c89

### Dependency files brought into worktree

The worktree was based on the pins phase branch (02), which predates the route phase commits. The following files were brought in to enable Plan 03 to compile:

- `app/types/route.types.ts` — added `StartMode` type alias (from Plan 01)
- `app/features/route/route.store.ts` — expanded with `routeActive`, `startMode`, `customStartAddress`, `shareableUrl`, `setRouteActive`, `setStartMode`, `setCustomStartAddress`, `setShareableUrl`, `MAX_STOPS`, `addStop` returning `boolean`, `reorderStops` accepting full array (from Plan 01)
- `app/features/route/route-markers.ts` — `createNumberedMarkerElement()` factory (from Plan 02)

All brought in as part of the same commit alongside RouteLayer.tsx.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Brought Plan 01 + Plan 02 dependency files into worktree**
- **Found during:** Task 1 — TypeScript would fail without `StartMode`, updated `RouteSlice`, and `createNumberedMarkerElement`
- **Issue:** Worktree branched from pins phase (02); route phase commits (05-01, 05-02) only existed on main. Files `route-markers.ts`, updated `route.store.ts`, and updated `route.types.ts` were absent.
- **Fix:** Copied the canonical versions of the three dependency files into the worktree before creating RouteLayer.tsx
- **Files modified:** `app/types/route.types.ts`, `app/features/route/route.store.ts`, `app/features/route/route-markers.ts`
- **Commit:** b035c89 (same commit as RouteLayer.tsx)

## Known Stubs

None — RouteLayer is imperative-only with no UI rendering. All data flows from the Zustand store (routeResult/routeActive/routeStops). No placeholder values or hardcoded display content.

## Self-Check: PASSED

Files exist:
- FOUND: app/features/route/RouteLayer.tsx
- FOUND: app/features/route/route-markers.ts
- FOUND: app/types/route.types.ts
- FOUND: app/features/route/route.store.ts

Commits exist:
- FOUND: b035c89
