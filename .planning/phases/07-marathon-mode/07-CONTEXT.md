# Phase 7: Marathon Mode - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Marathon mode extends the existing Discover tool to support multi-area accumulation. User toggles Marathon mode, draws multiple rectangles, results accumulate across zones with dedup, persistent rectangle overlays show per-zone counts, user can clear per-zone or all, then build one optimized route from the combined pool. 1:1 port from old Groundwork (lines 10683-10752) with zone-structured data model per research.

</domain>

<decisions>
## Implementation Decisions

### Core Approach
- **D-01:** Marathon mode is an extension of the existing discover flow, not a separate feature. Toggle marathon mode ON → each draw accumulates instead of replacing results.
- **D-02:** Zone-structured data model: `MarathonZone[]` where each zone has `{ id, bounds, results, rectangle }`. Research explicitly warns against flat append — zone attribution is needed for per-zone clear.
- **D-03:** Cross-zone deduplication — same business in overlapping areas appears once. Dedup by placeId (primary) and coordinate proximity (fallback).

### State
- **D-04:** Add `marathonMode: boolean` and `marathonZones: MarathonZone[]` to DiscoverSlice. No new slice needed — this extends discover.
- **D-05:** When marathon mode is OFF, discover behaves exactly as before (single draw, results replace).
- **D-06:** When marathon mode is ON: after each draw+search, results are added as a new zone. The results list shows the combined deduplicated pool from all zones.

### Map Overlays
- **D-07:** Each searched zone's rectangle stays visible on the map (orange outline, semi-transparent fill). Badge overlay shows result count per zone.
- **D-08:** Clicking a zone rectangle could show a "Clear this zone" option.

### UI
- **D-09:** Marathon toggle button in the discover panel (Step 1) — "Marathon Mode" toggle switch or button.
- **D-10:** Session header shows "X areas searched · Y businesses found" when marathon is active.
- **D-11:** "Clear All" button removes all zones and results. Per-zone clear via zone badge or list.
- **D-12:** The existing "Route X Stops" button works on the combined selection from all zones.

### Integration
- **D-13:** When marathon mode is OFF and user enters normal discover, any existing marathon zones are cleared.
- **D-14:** Selection (checkboxes) works across the combined pool — same as current discover selection.

### Claude's Discretion
- Exact MarathonZone type shape
- How zone rectangles are rendered and managed (refs, cleanup)
- Zone badge component design
- How the toggle button looks
- Whether to show zone boundaries in the results list

</decisions>

<canonical_refs>
## Canonical References

### Old App
- `/home/wzrd/Groundwork/index.html` lines 10683-10752 — Marathon mode implementation

### Existing Code
- `app/features/discover/discover.store.ts` — DiscoverSlice to extend
- `app/features/discover/discover-search.ts` — searchBusinessesInArea to reuse
- `app/features/discover/DiscoverPanel.tsx` — UI to extend with marathon toggle
- `app/features/discover/DiscoverLayer.tsx` — Marker management
- `app/features/map/Map.tsx` — Rectangle drawing logic to reuse

### Research
- `.planning/research/ARCHITECTURE.md` — Marathon zone-keyed data model design
- `.planning/research/PITFALLS.md` — Flat append warning, zone structure required from day one

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `searchBusinessesInArea()` — reuse as-is for each zone's search
- `discover-filters.ts` — all filter/dedup logic reusable
- Rectangle drawing in Map.tsx — mousedown/mousemove/mouseup pattern
- DiscoverPanel 3-step flow — extend Step 1 with marathon toggle
- DiscoverLayer marker pool — works on combined results array

### Integration Points
- DiscoverSlice needs `marathonMode`, `marathonZones` fields + actions
- Map.tsx draw handler needs to NOT clear previous rectangle in marathon mode
- DiscoverPanel needs marathon toggle + zone count header
- discover-search.ts results feed into current zone, not replace all

</code_context>

<specifics>
## Specific Ideas

- Port from old app lines 10683-10752 but with zone-structured data model
- Research warns: do NOT use flat array append — use MarathonZone[] from day one
- The existing discover flow should be completely unaffected when marathon mode is OFF

</specifics>

<deferred>
## Deferred Ideas

None — all 7 requirements are in scope.

</deferred>

---

*Phase: 07-marathon-mode*
*Context gathered: 2026-04-01*
