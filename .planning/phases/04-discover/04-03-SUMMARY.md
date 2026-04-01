---
phase: 04-discover
plan: "03"
subsystem: discover
tags: [google-maps, advanced-marker, infowindow, dom, typescript]

requires:
  - phase: 04-discover plan 01
    provides: discover-filters.ts classifyGooglePlace(), DiscoverResult type
  - phase: 02-pins
    provides: Pin type in app/types/pins.types.ts

provides:
  - discover-marker.ts with createDiscoverMarkerElement() for 3 states
  - discover-info.ts with buildDiscoverInfoContent() and buildQuickSavePin()
  - MARKER_Z_INDEX constants per marker state

affects:
  - 04-04 (DiscoverLayer calls both modules imperatively from useEffect)

tech-stack:
  added: []
  patterns:
    - "Pure utility modules with no React, no use client — called imperatively from DiscoverLayer useEffect"
    - "DOM tree built with createElement, addEventListener — no innerHTML for user data, no onclick strings"
    - "In-place button update via textContent — avoids InfoWindow setContent re-render loop (Pitfall 5)"

key-files:
  created:
    - app/features/discover/discover-marker.ts
    - app/features/discover/discover-info.ts
  modified:
    - app/features/discover/discover-filters.ts

key-decisions:
  - "buildQuickSavePin uses Pin type field names (followUpDate, createdAt, updatedAt) not plan-specified aliases — plan contained stale field names from old app; real types take precedence"
  - "Save button updates textContent in-place after click — never calls infoWindow.setContent() per D-11 to prevent Pitfall 5 InfoWindow re-render loop"
  - "classifyGooglePlace restored to discover-filters.ts — plan-02 stub merge had replaced authoritative plan-01 implementation; Rule 3 auto-fix"

requirements-completed:
  - DISC-09
  - DISC-10
  - DISC-11
  - DISC-12

duration: 5min
completed: "2026-04-01"
---

# Phase 4 Plan 3: Discover Marker and InfoWindow Utilities Summary

**SVG-based AdvancedMarkerElement content generator (3 states) and DOM-built InfoWindow content builder with in-place quick-save — pure TypeScript modules for DiscoverLayer to call imperatively**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-01T01:45:00Z
- **Completed:** 2026-04-01T01:50:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `app/features/discover/discover-marker.ts`: exports `DiscoverMarkerState` type, `MARKER_Z_INDEX` (default 600, selected 800, hover 900), and `createDiscoverMarkerElement()` that returns an HTMLElement with the correct SVG per state (orange default, green selected with checkmark, yellow hover)
- Created `app/features/discover/discover-info.ts`: exports `buildDiscoverInfoContent()` (DOM-built InfoWindow with photo, name, type, rating, address, Google Maps link, save button, route placeholder) and `buildQuickSavePin()` (creates Prospect pin with discovery note)
- Fixed `discover-filters.ts`: restored `classifyGooglePlace()` and related exports (`EXCLUDED_CHAINS`, `EXCLUDED_NAME_PATTERNS`) that were lost when plan-02's stub was merged — these are required by discover-info.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create discover-marker.ts** - `d852b2c` (feat)
2. **Task 2: Create discover-info.ts + fix discover-filters.ts** - `b71bcbb` (feat)

## Files Created/Modified

- `app/features/discover/discover-marker.ts` — SVG marker content generator for 3 states
- `app/features/discover/discover-info.ts` — DOM InfoWindow builder with save button and quick-save helper
- `app/features/discover/discover-filters.ts` — Restored classifyGooglePlace() and chain/name exclusion exports

## Decisions Made

- `buildQuickSavePin` uses the real `Pin` type field names (`followUpDate`, `createdAt`, `updatedAt`) rather than the plan-specified aliases (`followup`, `created`, `updated_at`). The plan contained stale field names from the old HTML prototype; the actual TypeScript type governs.
- Save button in `buildDiscoverInfoContent` updates `textContent` in-place after click rather than rebuilding InfoWindow — prevents the InfoWindow re-render loop described in 04-RESEARCH.md Pitfall 5 and required by D-11.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored classifyGooglePlace() to discover-filters.ts**
- **Found during:** Task 2 (TypeScript check — `discover-info.ts` imports `classifyGooglePlace` which didn't exist)
- **Issue:** plan-02's minimal stub had replaced plan-01's authoritative `discover-filters.ts` implementation. The merge commit (75af740) only merged `discover.store.ts` and left plan-02's stub in place. `classifyGooglePlace`, `EXCLUDED_CHAINS`, and `EXCLUDED_NAME_PATTERNS` were missing.
- **Fix:** Re-added the three exports from the plan-01 commit (93ebd9a) to discover-filters.ts, preserving all existing plan-02 code.
- **Files modified:** app/features/discover/discover-filters.ts
- **Commit:** b71bcbb

**2. [Rule 1 - Bug] Corrected Pin field names in buildQuickSavePin**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** Plan specified `followup`, `created`, `updated_at` — old app field names. Actual `Pin` type uses `followUpDate`, `createdAt`, `updatedAt`.
- **Fix:** Used the real type field names. TypeScript type is the source of truth.
- **Files modified:** app/features/discover/discover-info.ts
- **Commit:** b71bcbb

## Issues Encountered

None beyond the two auto-fixed deviations above.

## Known Stubs

- `routeBtn` in `buildDiscoverInfoContent` is disabled with `cursor:not-allowed` and title "Coming in Phase 5" — intentional placeholder per D-07, will be wired in phase 5.

## User Setup Required

None.

## Next Phase Readiness

- Plan 04 (DiscoverLayer) can now import `createDiscoverMarkerElement` and `buildDiscoverInfoContent` and call them imperatively from useEffect
- `buildQuickSavePin` is ready for DiscoverLayer's onSave callback — dedup check (by name/coords) goes in DiscoverLayer before calling `useStore.getState().addPin()`
- Both modules are pure TypeScript with no React dependency — safe to call outside React render cycle

## Self-Check: PASSED

- app/features/discover/discover-marker.ts — FOUND
- app/features/discover/discover-info.ts — FOUND
- Commit d852b2c — FOUND (feat: add discover-marker.ts)
- Commit b71bcbb — FOUND (feat: add discover-info.ts)
- `npx tsc --noEmit` — PASSED, 0 errors

---
*Phase: 04-discover*
*Completed: 2026-04-01*
