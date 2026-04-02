---
phase: 04-discover
plan: "05"
subsystem: discover
tags: [react, zustand, typescript, sidebar, discover-ui]

requires:
  - phase: 04-discover plan 01
    provides: DiscoverSlice with discoverMode, selectedDiscoverIds, toggleDiscoverSelected, selectAllDiscover, clearDiscover, setDiscoverMode, setHoveredDiscoverId, hoveredDiscoverId
  - phase: 04-discover plan 03
    provides: buildQuickSavePin from discover-info.ts, classifyGooglePlace from discover-filters.ts

provides:
  - DiscoverPanel.tsx — 3-step discover UI (draw prompt, searching progress, results list with selection)
  - DiscoverResultItem.tsx — single result row with checkbox-only selection, hover highlight, quick-save
  - Sidebar.tsx updated — conditionally renders DiscoverPanel or PinList based on discoverMode

affects:
  - Sidebar.tsx (modified)
  - Any future plan needing discover panel behavior

tech-stack:
  added: []
  patterns:
    - "Sidebar content area swap pattern: discoverMode ? <DiscoverPanel /> : <PinList /> inside existing flex container"
    - "Checkbox onChange-only selection — e.stopPropagation() on checkbox click prevents row interaction from firing"
    - "Quick-save reads useStore.getState().pins for dedup at call time — avoids stale closure from render"
    - "Step determination: discoverResults.length > 0 → 3, searchProgress truthy → 2, else → 1"

key-files:
  created:
    - app/features/discover/DiscoverResultItem.tsx
    - app/features/discover/DiscoverPanel.tsx
  modified:
    - app/components/Sidebar.tsx

key-decisions:
  - "DiscoverResultItem exported as named export (not default) — imported by DiscoverPanel in same feature folder"
  - "Deselect All logic: allSelected = selectedDiscoverIds.size === min(results.length, 20) — matches selectAllDiscover action cap"
  - "Quick-save dedup reads useStore.getState().pins at call time (not from closure) to avoid stale pin list"

requirements-completed:
  - DISC-01
  - DISC-08
  - DISC-11
  - DISC-12

duration: 2min
completed: "2026-04-01"
---

# Phase 4 Plan 5: Discover Sidebar UI Summary

**3-step DiscoverPanel and DiscoverResultItem rows wired into Sidebar — checkbox-only selection, hover-to-highlight, quick-save with dedup, and sticky bottom bar with Route placeholder**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-01T01:53:46Z
- **Completed:** 2026-04-01T01:55:17Z
- **Tasks:** 2 (+ 1 checkpoint awaiting human verify)
- **Files modified:** 3

## Accomplishments

- Created `app/features/discover/DiscoverResultItem.tsx`: named export with checkbox (onChange-only), hover enter/leave, orange type+rating, gray address, green checkmark when saved, orange + icon for quick-save with e.stopPropagation() to prevent row interactions
- Created `app/features/discover/DiscoverPanel.tsx`: reads all state from Zustand, step 1 draw prompt, step 2 searching progress, step 3 results list with header (count, Select All/Deselect All, Close button), scrollable DiscoverResultItem list, sticky bottom bar with "Route X Stop(s)" disabled placeholder
- Updated `app/components/Sidebar.tsx`: added imports for useStore and DiscoverPanel, reads discoverMode, conditionally swaps content area between DiscoverPanel and PinList

## Task Commits

Each task was committed atomically:

1. **Task 1: DiscoverResultItem + DiscoverPanel** - `265ea84` (feat)
2. **Task 2: Sidebar swap** - `534c4d2` (feat)

## Files Created/Modified

- `app/features/discover/DiscoverResultItem.tsx` — Single result row, checkbox-only selection, hover callbacks, quick-save with dedup
- `app/features/discover/DiscoverPanel.tsx` — 3-step discover panel reading from Zustand
- `app/components/Sidebar.tsx` — Added discoverMode-based content area swap

## Decisions Made

- `DiscoverResultItem` is a named export (not default) — imported by DiscoverPanel in the same feature folder; consistent with plan spec
- Deselect All condition: `selectedDiscoverIds.size === Math.min(discoverResults.length, 20) && size > 0` — mirrors the cap in selectAllDiscover action
- Quick-save reads `useStore.getState().pins` at click time instead of the closure pin list — avoids stale dedup check after other pins are added during the session

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

- "Route X Stop(s)" button in the sticky bottom bar is disabled with `opacity-50 cursor-not-allowed` and `title="Coming in Phase 5"` — intentional placeholder per D-22, will be wired in Phase 5 route planning.

## User Setup Required

None.

## Next Phase Readiness

- Full discover flow is now UI-complete (plans 01-05): draw area → search → results in sidebar + map markers → select/hover/save
- Checkpoint human-verify pending: user needs to exercise the full flow at localhost:3000
- Phase 5 (Route) can begin after checkpoint approval — "Route X Stop(s)" button wiring is the entry point

## Self-Check: PASSED

- app/features/discover/DiscoverResultItem.tsx — FOUND
- app/features/discover/DiscoverPanel.tsx — FOUND
- app/components/Sidebar.tsx (modified) — FOUND
- Commit 265ea84 — FOUND
- Commit 534c4d2 — FOUND
- `npx tsc --noEmit` — PASSED, 0 errors

---
*Phase: 04-discover*
*Completed: 2026-04-01*
