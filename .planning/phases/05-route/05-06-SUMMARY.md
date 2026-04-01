---
phase: 05-route
plan: "06"
subsystem: route
tags: [route, map-integration, wiring, checkpoint]
dependency_graph:
  requires:
    - app/features/route/RouteLayer.tsx (Plan 03)
    - app/features/route/RouteConfirmPanel.tsx (Plan 04)
    - app/features/map/MapContext.tsx (existing — map instance)
  provides:
    - app/features/map/Map.tsx (RouteLayer + RouteConfirmPanel mounted; directions button toggles panel)
  affects:
    - Full end-to-end route flow in browser
tech_stack:
  added:
    - "@dnd-kit/core@6.3.1 (worktree dependency fix)"
    - "@dnd-kit/sortable@10.0.0 (worktree dependency fix)"
    - "@dnd-kit/utilities (worktree dependency fix)"
  patterns:
    - Controlled open/onClose panel pattern (routePanelOpen state)
    - MapButton active prop for toggle button visual state
key_files:
  created: []
  modified:
    - app/features/map/Map.tsx
decisions:
  - RouteLayer rendered conditionally on mapState (same pattern as MarkerLayer and DiscoverLayer)
  - RouteConfirmPanel rendered unconditionally (panel handles its own null/hidden state via open prop)
  - @dnd-kit packages installed in worktree (were missing — worktree branched before Plan 04 install)
metrics:
  duration: "3 minutes"
  completed_date: "2026-04-01"
  tasks_completed: 1
  files_modified: 3
requirements:
  - ROUT-04
  - ROUT-05
  - ROUT-08
---

# Phase 5 Plan 06: Map.tsx Integration Summary

**One-liner:** Map.tsx wired as the final integration point — RouteLayer mounted inside MapContext.Provider, RouteConfirmPanel rendered as absolute overlay, and "Get directions" MapButton toggling the panel via routePanelOpen state.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Mount RouteLayer + RouteConfirmPanel; wire directions button | 3999ffc | app/features/map/Map.tsx, package.json, package-lock.json |

## What Was Built

### Task 1 — Mount RouteLayer + RouteConfirmPanel in Map.tsx

Modified `app/features/map/Map.tsx` with four changes:

1. **Imports:** Added `RouteLayer` and `RouteConfirmPanel` imports at the top.

2. **State:** Added `const [routePanelOpen, setRoutePanelOpen] = useState(false)` alongside existing Map state.

3. **MapButton wiring:** The previously inert "Get directions" MapButton now has:
   - `active={routePanelOpen}` — visual active state
   - `onClick={() => setRoutePanelOpen((prev) => !prev)}` — toggles the panel

4. **JSX rendering:**
   - `{mapState && <RouteLayer />}` after DiscoverLayer — inside MapContext.Provider, conditionally rendered like the other layers
   - `<RouteConfirmPanel open={routePanelOpen} onClose={() => setRoutePanelOpen(false)} />` — rendered unconditionally so the panel can manage its own animation/visibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @dnd-kit packages missing from worktree**
- **Found during:** Task 1 TypeScript verification — `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` were not in node_modules
- **Issue:** This worktree branched from earlier than Plan 04, which installed these packages on main. They were absent here causing TypeScript errors in RouteConfirmPanel.tsx
- **Fix:** `npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities`
- **Files modified:** package.json, package-lock.json
- **Commit:** 3999ffc (same commit as Map.tsx changes)

## Checkpoint: Awaiting Human Verification

The checkpoint requires browser verification of the full end-to-end route flow. See checkpoint details in the CHECKPOINT REACHED section.

## Known Stubs

None — all wiring is live. routePanelOpen state is real toggle state. RouteLayer and RouteConfirmPanel are fully implemented components from Plans 03 and 04.

## Self-Check: PASSED

Files exist:
- FOUND: app/features/map/Map.tsx

Commits exist:
- FOUND: 3999ffc
