---
phase: 05-route
plan: "01"
subsystem: route
tags: [zustand, types, route, state-management]
dependency_graph:
  requires: []
  provides: [route-types, route-slice]
  affects: [route-layer, route-confirm-panel, route-wiring]
tech_stack:
  added: []
  patterns: [zustand-slice, state-creator, type-union]
key_files:
  created: []
  modified:
    - app/types/route.types.ts
    - app/features/route/route.store.ts
decisions:
  - reorderStops accepts RouteStop[] directly (not index array) — aligns with dnd-kit arrayMove output, avoids index-mapping bug
  - clearRoute does NOT reset startMode/customStartAddress — user's home base preference persists between route sessions
  - addStop returns boolean — callers check the return value to handle 25-stop cap at UI layer
metrics:
  duration: "54s"
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_modified: 2
---

# Phase 5 Plan 01: RouteSlice and Route Types Expansion Summary

RouteSlice expanded with full Phase 5 state: 25-stop cap enforcement, dnd-kit-compatible reorder signature, start mode selection, routeActive flag, and shareable URL storage.

## What Was Built

### Task 1 — Expand route.types.ts with StartMode and updated RouteResult
- Added `StartMode` type alias (`'home' | 'gps' | 'custom'`)
- Added JSDoc to `RouteStop` explaining the id naming convention: `pin.id` for pin-sourced stops, `discover_${placeId}` for discover-sourced stops
- Added JSDoc to `RouteResult` explaining `optimizedOrder` and duration string parsing
- `RouteStop` and `RouteResult` shapes are unchanged — only documentation added

**Commit:** d4dc3e4

### Task 2 — Expand RouteSlice with full Phase 5 state and actions
- `MAX_STOPS = 25` constant enforces Google API waypoint limit (ROUT-09)
- `addStop` returns `boolean` — `false` when cap reached, `true` on success
- `reorderStops(newStops: RouteStop[])` accepts full array (replaces index-array signature) — aligns with `@dnd-kit/sortable` `arrayMove` output
- Added `routeActive: boolean` — signals RouteLayer to draw polyline after successful `computeRoutes`
- Added `startMode: StartMode` (initial: `'home'`) and `customStartAddress: string` (initial: `''`) for start point selection (D-09)
- Added `shareableUrl: string | null` (initial: `null`) — stored after build so RouteConfirmPanel can display without recomputing
- Added setters: `setRouteActive`, `setStartMode`, `setCustomStartAddress`, `setShareableUrl`
- `clearRoute` resets `routeStops`, `routeResult`, `routeActive`, `shareableUrl` — does NOT reset `startMode` or `customStartAddress`
- `app/store/index.ts` untouched — `createRouteSlice` composition was already correct

**Commit:** 7d37972

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan is purely types and store state with no UI rendering. No stubs present.

## Self-Check: PASSED

Files exist:
- app/types/route.types.ts — FOUND
- app/features/route/route.store.ts — FOUND

Commits exist:
- d4dc3e4 — FOUND
- 7d37972 — FOUND
