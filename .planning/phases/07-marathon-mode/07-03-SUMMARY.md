---
phase: 07-marathon-mode
plan: "03"
subsystem: discover-ui
tags: [marathon, discover, ui, zustand]
dependency_graph:
  requires: [07-01, 07-02]
  provides: [Marathon Mode MapButton, marathon session header, zone labels, per-zone clear, clear-all, Marathon toggle in Step 1]
  affects:
    - app/features/map/Map.tsx
    - app/features/discover/DiscoverPanel.tsx
    - app/features/discover/DiscoverResultItem.tsx
    - app/features/discover/discover.store.ts
tech_stack:
  added: []
  patterns: [useMemo for derived lookup map, conditional header rendering, zone attribution badges]
key_files:
  created: []
  modified:
    - app/features/map/Map.tsx
    - app/features/discover/DiscoverPanel.tsx
    - app/features/discover/DiscoverResultItem.tsx
    - app/features/discover/discover.store.ts
decisions:
  - "clearDiscover now also resets discoverMode and searchProgress to ensure consistent state reset"
  - "selectAllDiscover implemented in store (was missing) — caps at 20 selectable results matching existing UI logic"
  - "Per-zone Clear button reads discoverResults from store.getState() to filter inline without extra action"
  - "zoneLabel badge placed inline next to business name using flex row to prevent truncation of the name"
metrics:
  duration: "~15 minutes"
  completed: "2026-03-31T22:00:00Z"
  tasks: 2
  files: 4
---

# Phase 07 Plan 03: Marathon UI Summary

**One-liner:** Marathon Mode toggle in Map.tsx floating controls and full DiscoverPanel marathon UI — session header, zone attribution badges, per-zone Clear, and Clear All.

## What Was Built

### Task 1: Marathon Mode MapButton in Map.tsx

Added to the floating controls div, positioned between "Discover businesses" and "Show/hide pins":

- Reads `marathonMode` and `toggleMarathonMode` from store
- MapButton with repeat/loop SVG icon
- `active={marathonMode}` highlights button in orange when marathon mode is ON

### Task 2: DiscoverPanel marathon UI

**Step 1 — Marathon toggle:**
- Toggle button below the draw instructions text
- Shows "Marathon Mode ON" in orange when active, "Marathon Mode OFF" in default border when inactive
- Hint text "Draw multiple areas — results accumulate without clearing." appears when ON

**Step 3 — Results header (conditional):**
- Marathon active + zones searched: shows "Marathon" label (orange) with "X areas searched · Y businesses found" subtitle, plus Select All and Clear All buttons
- Otherwise: existing single-search header (businesses found count, Select All, Close)

**Step 3 — Per-zone summary bar:**
- Visible when `marathonMode && marathonZones.length > 0`
- Lists each zone: "Zone 1 — 12 results" with Clear button
- Clear button filters discoverResults to remove that zone's placeIds and calls `clearMarathonZone`

**Step 3 — Zone attribution on results:**
- `placeZoneLabel` useMemo builds a `Record<string, string>` mapping placeId to zone label from marathonZones
- Passes `zoneLabel={placeZoneLabel[result.placeId]}` to each DiscoverResultItem
- DiscoverResultItem renders a small pill badge (`text-[10px] px-1.5 py-0.5 rounded bg-orange/10 text-orange`) when zoneLabel is provided

**MARA-04 verification:** The existing "Route X Stops" button already operates on `discoverResults` (the combined pool). No changes needed.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | b4b4cd3 | feat(07-03): add Marathon Mode MapButton to Map.tsx floating controls |
| 2 | 54ee75b | feat(07-03): extend DiscoverPanel with full marathon UI |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing DiscoverSlice fields caused TypeScript errors across the codebase**
- **Found during:** Task 2 TypeScript verification
- **Issue:** DiscoverSlice was missing `discoverMode`, `setDiscoverMode`, `hoveredDiscoverId`, `setHoveredDiscoverId`, `searchProgress`, `setSearchProgress`, and `selectAllDiscover` — all of which were referenced in DiscoverPanel, DiscoverLayer, Map.tsx, and Sidebar but not defined in the store
- **Fix:** Added all missing fields and implementations to discover.store.ts. `selectAllDiscover` toggles all/none within the 20-result cap. `clearDiscover` now also resets `discoverMode` and `searchProgress`
- **Files modified:** `app/features/discover/discover.store.ts`
- **Commit:** 54ee75b (included in Task 2 commit)

## Known Stubs

None — all marathon UI flows are wired to real store state.

## Self-Check: PASSED

- app/features/map/Map.tsx — FOUND, marathonMode + toggleMarathonMode reads at lines 37-38
- app/features/discover/DiscoverPanel.tsx — FOUND, marathon UI present throughout
- app/features/discover/DiscoverResultItem.tsx — FOUND, zoneLabel prop at line 16
- app/features/discover/discover.store.ts — FOUND, all missing fields added
- commit b4b4cd3 — FOUND
- commit 54ee75b — FOUND
- TypeScript: only pre-existing test file errors remain (tests/route/route-store.test.ts), app code compiles cleanly
