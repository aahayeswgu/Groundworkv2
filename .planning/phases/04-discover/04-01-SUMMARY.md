---
phase: 04-discover
plan: 01
subsystem: discover
tags: [zustand, google-places, typescript, dedup, filter]

requires:
  - phase: 01-foundation
    provides: Zustand StateCreator slice composition pattern and DiscoverSlice base interface
  - phase: 02-pins
    provides: DiscoverResult type definition in app/types/discover.types.ts

provides:
  - DiscoverSlice extended with discoverMode, searchProgress, selectAllDiscover
  - app/config/discover-queries.ts — 19 construction/trade query strings (industry-swappable)
  - app/features/discover/discover-filters.ts — filter, classify, dedup pure utilities

affects: [04-02, 04-03, 04-04, 04-05]

tech-stack:
  added: []
  patterns:
    - "Pure utility module pattern — discover-filters.ts has no React, no use client, no runtime Google Maps import"
    - "google.maps.LatLng used only in type signature of filterAndMapPlace place parameter"
    - "Triple dedup via Set<string> passed by reference through filterAndMapPlace"

key-files:
  created:
    - app/config/discover-queries.ts
    - app/features/discover/discover-filters.ts
  modified:
    - app/features/discover/discover.store.ts

key-decisions:
  - "classifyGooglePlace takes (types: string[], displayName: string) directly — not a place object — so it can be called at render time from DiscoverResultItem without needing full place data"
  - "filterAndMapPlace accepts seen: Set<string> by reference to allow callers to accumulate dedup state across multiple query batches"
  - "isInBounds uses strict inequality (< >) not <= >= to reject boundary-touching results per D-17"

patterns-established:
  - "Pure utility modules in app/features/{feature}/ have no use client directive and no React dependency"
  - "Config files in app/config/ export named constants as const arrays for industry-swap configurability"

requirements-completed: [DISC-04, DISC-05, DISC-06, DISC-07]

duration: 8min
completed: 2026-03-31
---

# Phase 4 Plan 1: Discover Data Foundation Summary

**Zustand DiscoverSlice extended with discoverMode/searchProgress/selectAllDiscover, plus pure filter/classify/dedup utility module and 19-query construction trade config ported from old app**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-31T00:00:00Z
- **Completed:** 2026-03-31T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended DiscoverSlice with discoverMode boolean, searchProgress string, selectAllDiscover action (max-20 cap), and updated clearDiscover to reset new fields
- Created app/config/discover-queries.ts with 19 verbatim construction/trade query strings from old app — fork-friendly via single config file
- Created app/features/discover/discover-filters.ts as pure TypeScript module: EXCLUDED_CHAINS regex, EXCLUDED_PLACE_TYPES array, EXCLUDED_NAME_PATTERNS regex, classifyGooglePlace(), isInBounds(), filterAndMapPlace() with triple dedup (place_id, normalized name, coord proximity ~50m)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend DiscoverSlice** - `d91dc0b` (feat)
2. **Task 2: Query config and discover-filters** - `93ebd9a` (feat)

## Files Created/Modified

- `app/features/discover/discover.store.ts` — Extended with discoverMode, searchProgress, selectAllDiscover, updated clearDiscover
- `app/config/discover-queries.ts` — 19 construction/trade search query strings
- `app/features/discover/discover-filters.ts` — Filter/classify/dedup pure utility module with 6 exports

## Decisions Made

- classifyGooglePlace takes `(types: string[], displayName: string)` directly (not a place object) — allows calling at render time in DiscoverResultItem without full place data dependency
- filterAndMapPlace accepts `seen: Set<string>` by reference — accumulates dedup state across multiple searchNearbyPlaces batches in plan 02
- isInBounds uses strict inequality (`<`, `>`) not `<=`/`>=` — rejects boundary-touching results per D-17 strict containment requirement

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 02-05 can now proceed: search (02), markers (03), panel UI (04), save-as-pin (05)
- filterAndMapPlace and DISCOVER_QUERIES are the primary contracts consumed by plan 02 (discover-search.ts)
- discoverMode and setDiscoverMode are consumed by plan 04 (DiscoverLayer toggle button)

---
*Phase: 04-discover*
*Completed: 2026-03-31*
