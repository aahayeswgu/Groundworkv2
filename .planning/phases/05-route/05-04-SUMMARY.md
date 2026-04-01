---
phase: 05-route
plan: "04"
subsystem: route
tags: [route, dnd-kit, sortable, panel, ui, google-maps]
dependency_graph:
  requires:
    - app/types/route.types.ts (Plan 01 — StartMode, RouteStop, RouteResult)
    - app/features/route/route.store.ts (Plan 01 — RouteSlice state + actions)
    - app/features/route/route-service.ts (Plan 02 — computeRoute)
    - app/features/route/route-url.ts (Plan 02 — buildGoogleMapsUrl)
    - app/lib/geocoding.ts (Plan 02 — forwardGeocode, getCurrentGpsPosition)
  provides:
    - app/features/route/RouteConfirmPanel.tsx
  affects:
    - app/features/map/Map.tsx (Plan 05 — wires open/onClose props)
tech_stack:
  added:
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - "@dnd-kit/utilities (peer dep)"
  patterns:
    - DndContext + SortableContext + useSortable for drag-to-reorder
    - PointerSensor handles both mouse and touch (no extra mobile code)
    - arrayMove from @dnd-kit/sortable for index-safe reordering
    - resolveOrigin helper abstracts start mode resolution (home/gps/custom)
    - Inline SortableStopRow sub-component (not exported) per CLAUDE.md patterns
key_files:
  created:
    - app/features/route/RouteConfirmPanel.tsx
  modified:
    - package.json (added @dnd-kit/core and @dnd-kit/sortable)
    - package-lock.json
decisions:
  - resolveOrigin defined before handleDragEnd to satisfy useCallback dependency ordering
  - Home mode uses customStartAddress as home base proxy (v1 has no profile system)
  - originStop for Maps URL uses address field only (lat/lng are 0 — address is preferred per route-url.ts)
  - onPointerDown stopPropagation on remove button prevents drag from stealing click
metrics:
  duration: "8 minutes"
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
requirements:
  - ROUT-02
  - ROUT-05
  - ROUT-06
  - ROUT-07
  - ROUT-08
---

# Phase 5 Plan 04: RouteConfirmPanel Summary

**One-liner:** Slide-in route confirm panel with @dnd-kit sortable stop list, start mode selector (home/GPS/custom), distance+time summary, mobile waypoint warning, Build Route button, and Google Maps launch — fully wired to RouteSlice and route utilities.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Install @dnd-kit/core and @dnd-kit/sortable | a5c1513 | package.json, package-lock.json |
| 2 | Create RouteConfirmPanel.tsx | dcec351 | app/features/route/RouteConfirmPanel.tsx |

## What Was Built

### @dnd-kit Installation (Task 1)

Installed `@dnd-kit/core@6.3.1` and `@dnd-kit/sortable@10.0.0`. The `@dnd-kit/utilities` package is installed as a peer dependency and provides `CSS.Transform.toString()`. `PointerSensor` handles both mouse and touch drag without extra mobile configuration.

### RouteConfirmPanel.tsx (Task 2)

Slide-in panel anchored `right-0 top-0 h-full` within the map container (`absolute`), max-width `max-w-sm`, z-index `z-30`. Rendered as overlay above the map.

**Panel sections:**
- **Header:** "Route Planner" title + stop count / distance (mi) / time (min) from `routeResult`, close button
- **Start point selector:** Three tabs (Home / GPS / Custom) wired to `setStartMode`. Address input visible for home and custom modes. GPS mode shows informational text.
- **Mobile warning:** Amber notice when `routeStops.length > 3` — D-08 compliance for Google Maps mobile truncation
- **Stop list:** `DndContext` + `SortableContext` with `verticalListSortingStrategy`. `SortableStopRow` shows numbered badge (position-based, not stored), stop label, address, remove button.
- **Error display:** Red notice box for build errors (GPS permission, geocoding failure, no stops)
- **Action bar:** Clear, Build Route, Open Maps buttons

**Key flows:**
- `handleBuildRoute`: resolves origin → `computeRoute()` → `setRouteResult()` + `setRouteActive(true)`
- `handleDragEnd`: `arrayMove` → `reorderStops(newOrder)` → `resolveOrigin()` → `computeRoute()` → update result (ROUT-06)
- `handleOpenMaps`: `buildGoogleMapsUrl(originStop, routeStops)` → `setShareableUrl(url)` → `window.open()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed function ordering to satisfy useCallback dependency**
- **Found during:** Task 2 — The plan's code snippet defined `handleDragEnd` before `resolveOrigin`, causing a "used before defined" issue that would fail TypeScript block-scoping rules.
- **Fix:** Moved `resolveOrigin` definition before `handleDragEnd` so it can be listed in the dependency array without reference errors.
- **Files modified:** app/features/route/RouteConfirmPanel.tsx
- **Commit:** dcec351

## Known Stubs

None — all data is wired to live Zustand store state. Distance and time display from `routeResult` (null initially, populated after Build Route). No placeholder values flow to UI rendering.

## Self-Check: PASSED

Files exist:
- FOUND: app/features/route/RouteConfirmPanel.tsx
- FOUND: package.json (contains @dnd-kit entries)

Commits exist:
- FOUND: a5c1513 (chore: install @dnd-kit)
- FOUND: dcec351 (feat: RouteConfirmPanel.tsx)
