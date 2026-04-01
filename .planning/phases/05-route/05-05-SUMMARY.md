---
phase: 05-route
plan: "05"
subsystem: route
tags: [route, zustand, stops, marker-layer, discover, pin-list, wiring]
dependency_graph:
  requires:
    - app/types/route.types.ts (Plan 01 — RouteStop interface)
    - app/features/route/route.store.ts (Plan 01 — addStop action)
    - app/features/map/MarkerLayer.tsx (pin InfoWindow route button placeholder)
    - app/features/discover/discover-info.ts (discover InfoWindow route button placeholder)
    - app/features/discover/DiscoverLayer.tsx (buildDiscoverInfoContent call site)
    - app/features/discover/DiscoverPanel.tsx (disabled Route X Stops batch button)
    - app/features/pins/PinListItem.tsx (sidebar pin row)
  provides:
    - Pin InfoWindow "+ Route" button wired to addStop
    - Discover InfoWindow "+ Add to Route" button wired via onAddToRoute callback
    - DiscoverPanel "Route X Stops" batch button wired to addStop for all selected
    - PinListItem sidebar "+ Route" button wired to addStop
  affects:
    - app/features/route/RouteConfirmPanel.tsx (stop list populates from these entry points)
tech_stack:
  added: []
  patterns:
    - Zustand selector addStop called from multiple UI entry points
    - In-place button text update after action (no setContent/re-render)
    - onAddToRoute callback pattern passed into DOM-builder functions
key_files:
  created: []
  modified:
    - app/features/map/MarkerLayer.tsx
    - app/features/discover/discover-info.ts
    - app/features/discover/DiscoverLayer.tsx
    - app/features/discover/DiscoverPanel.tsx
    - app/features/pins/PinListItem.tsx
decisions:
  - onAddToRoute callback added to DiscoverInfoOptions interface — keeps DOM builder testable without store dependency
  - addStop added to DiscoverLayer main effect dependency array — Zustand selector is stable but declared for correctness
  - "+ Route" button placed before edit button in PinListItem — route is primary Phase 5 action
metrics:
  duration: "4 minutes"
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_modified: 5
requirements:
  - ROUT-01
---

# Phase 5 Plan 05: Route Entry Point Wiring Summary

**One-liner:** Wired all three "Add to Route" entry points — pin InfoWindow, discover InfoWindow via onAddToRoute callback, and DiscoverPanel batch button — plus PinListItem sidebar button, all calling Zustand addStop with 25-cap handling.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Wire route button in MarkerLayer and discover-info | 29e9ad4 | MarkerLayer.tsx, discover-info.ts, DiscoverLayer.tsx |
| 2 | Activate DiscoverPanel batch button and PinListItem route button | b41605a | DiscoverPanel.tsx, PinListItem.tsx |

## What Was Built

### Task 1 — MarkerLayer pin InfoWindow and discover-info InfoWindow

**MarkerLayer.tsx:**
- Added `addStop` store selector alongside existing `deletePin`
- Added `import type { RouteStop }` from route types
- Activated routeBtn style: removed `opacity:0.6;cursor:not-allowed`, set orange border/text with `cursor:pointer`
- In click handler: builds `RouteStop` from pin fields, calls `addStop(stop)`, updates button text to "✓ Added" or "Max 25" (disabled in both cases)
- Added `addStop` to `buildInfoWindowContent` useCallback dependency array

**discover-info.ts:**
- Added `onAddToRoute: () => void` to `DiscoverInfoOptions` interface
- Updated `buildDiscoverInfoContent` signature to destructure `onAddToRoute`
- Removed `disabled = true` and `title = 'Coming in Phase 5'` from routeBtn
- Replaced `cursor:not-allowed;opacity:0.5` with `cursor:pointer`
- Added click listener: calls `onAddToRoute()`, updates button text to "✓ Added to Route", disables button in-place (no setContent call per D-11)

**DiscoverLayer.tsx:**
- Added `addStop` store selector
- Added `import type { RouteStop }` from route types
- Added `onAddToRoute` callback to `buildDiscoverInfoContent` call — builds RouteStop from captured result, calls `addStop`
- Added `addStop` to main useEffect dependency array

### Task 2 — DiscoverPanel batch button and PinListItem sidebar button

**DiscoverPanel.tsx:**
- Added `addStop` selector and `RouteStop` import
- Replaced disabled "Route X Stops" button with active version: iterates `selectedDiscoverIds`, finds each result, builds RouteStop, calls `addStop(stop)` — breaks on cap (addStop returns false)
- Removed `disabled`, `cursor-not-allowed`, and `opacity-50` classes

**PinListItem.tsx:**
- Added `useStore` and `addStop` selector (uses `useStore` directly per established pattern in this file)
- Added `import type { RouteStop }` from route types
- Added "+ Route" button in pin row trailing area (before edit button): builds RouteStop from pin, calls `addStop`; `e.stopPropagation()` prevents row click from firing

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all buttons are wired to live Zustand addStop. No placeholder text or hardcoded data.

## Self-Check: PASSED

Files exist:
- FOUND: app/features/map/MarkerLayer.tsx
- FOUND: app/features/discover/discover-info.ts
- FOUND: app/features/discover/DiscoverLayer.tsx
- FOUND: app/features/discover/DiscoverPanel.tsx
- FOUND: app/features/pins/PinListItem.tsx

Commits exist:
- FOUND: 29e9ad4 (feat(05-05): wire Add to Route in MarkerLayer and discover InfoWindow)
- FOUND: b41605a (feat(05-05): activate Route batch button in DiscoverPanel and add Route button in PinListItem)
