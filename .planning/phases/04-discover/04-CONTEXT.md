# Phase 4: Discover - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Draw-to-search business discovery: rectangle drawing on map, Google Places multi-query search with filtering/dedup, results panel with list + markers, info bubbles, multi-select with checkboxes, quick-save to pins. 1:1 port from the old Groundwork prototype with mandatory API migrations.

</domain>

<decisions>
## Implementation Decisions

### Core Approach
- **D-01:** 1:1 port of the old app's discover tool logic. Same UX flow, same filters, same classification, same selection behavior. Do not redesign — it's battle-tested.
- **D-02:** The 3-step flow is preserved: Step 1 (draw area) → Step 2 (searching with progress) → Step 3 (results list + markers).

### Mandatory API Migrations (deprecated APIs that MUST change)
- **D-03:** Replace `placesService.textSearch()` (legacy Places API) with `Place.searchByText()` (Places New API via `importLibrary('places')`). Field names change: `place.name` → `place.displayName.text`, `place.formatted_address` → `place.formattedAddress`, etc.
- **D-04:** Replace `google.maps.Marker` for discover markers with `AdvancedMarkerElement` (already available from Phase 1). SVG content set via `marker.content` DOM element, not `icon` property.
- **D-05:** DO NOT use `DrawingManager` (deprecated). The old app already uses manual mousedown/mousemove/mouseup + touch — port that directly.

### Info Bubble
- **D-06:** Use native Google Maps InfoWindow (same as pin InfoWindow from Phase 2). Build content as DOM nodes with `addEventListener` — NO string `onclick` attributes (prevents global scope issues and potential recursion from re-rendering).
- **D-07:** Info bubble shows: photo (if available), business name, type classification, rating with stars, address, Google Maps link, "Save as Pin" button, "Add to Route" placeholder. Same layout as old app.
- **D-08:** Single shared InfoWindow instance — opening a new one closes the previous (same toggle pattern as Phase 2 MarkerLayer). No stacking, no recursion.

### Event Handling — No Recursion
- **D-09:** Marker click → focusDiscoverItem (pan, highlight, show info bubble, scroll list). This does NOT toggle selection. Selection only happens via checkbox click. These are two separate code paths — never call each other.
- **D-10:** Hover from list → temp highlight marker on map. Unhover → revert. No info bubble on hover (only on click). Clean enter/leave — no cascading events.
- **D-11:** Quick-save button in info bubble: save pin → re-render button as "✓ Pinned" (update DOM node in place, don't rebuild entire info bubble). Prevents recursive re-render loops.

### Filters & Dedup (port directly)
- **D-12:** `EXCLUDED_CHAINS` regex — port as-is from old app (Home Depot, Lowe's, banks, fast food, etc.)
- **D-13:** `EXCLUDED_PLACE_TYPES` array — port as-is (55+ types: residential, services, food, government, etc.)
- **D-14:** `EXCLUDED_NAME_PATTERNS` regex — port as-is (home, residential, handyman, lawn care, etc.)
- **D-15:** Triple dedup: place_id → normalized name → coordinate proximity (~50m). Port as-is.
- **D-16:** `classifyGooglePlace()` type classifier — port as-is (Electrical, Plumbing, HVAC, Roofing, etc.)
- **D-17:** Strict bounds filtering — client-side containment check AFTER Google returns results (Google treats bounds as bias, not filter).

### Query Configuration
- **D-18:** `DISCOVER_QUERIES` array lives in a config file at `app/config/discover-queries.ts` (not hardcoded inline). Default: 18 construction/trade queries from old app. Other industries swap this file.
- **D-19:** Sequential query execution with 200ms delay between queries (same as old app). Progress updates between queries showing current query name and running count.

### Selection & Quick-Save
- **D-20:** Checkboxes on each result item for multi-select. Select All button (capped at 20 for route limit). Toggle behavior on checkbox click.
- **D-21:** Quick-save creates a Prospect pin with first note "Discovered via Groundwork — {type}". Dedup check before save (same name or coordinates within ~111m).
- **D-22:** Selected count shown in a bottom bar with "Route X Stop(s)" button (placeholder for Phase 5 wiring).

### Discover Markers
- **D-23:** Three states: default (orange 22px circle), selected (green 30px circle with checkmark), hover (yellow 30px circle). Port SVG from old app, render as `AdvancedMarkerElement.content`.
- **D-24:** Z-index stacking: default=600, selected=800, hover=900.

### Mobile
- **D-25:** 300ms hold-to-draw on touch devices. Port the old app's touch handler pattern (touchstart timer → touchmove updates rectangle → touchend triggers search).

### Results Panel UI
- **D-26:** Discover panel shows in the sidebar area (replaces pin list when active). Header with result count, scrollable list, selection bar at bottom. Close button returns to pin list.

### Claude's Discretion
- Exact component decomposition (DiscoverPanel, DiscoverResultItem, etc.)
- How to share the InfoWindow instance between MarkerLayer and DiscoverLayer (or separate instances)
- Zustand DiscoverSlice shape updates (discoverResults, discoverSelected, discoverMode, etc.)
- CSS/styling details for the results panel and items
- Whether to batch Places API queries for performance (vs strict sequential)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Old App (PORT SOURCE — primary reference)
- `/home/wzrd/Groundwork/index.html` lines 7115-7600 — Complete discover tool implementation (queries, filters, search, rendering, selection, quick-save)
- `/home/wzrd/Groundwork/index.html` lines 7381-7401 — `classifyGooglePlace()` type classifier
- `/home/wzrd/Groundwork/index.html` lines 7403-7414 — Discover marker SVG icons (3 states)
- `/home/wzrd/Groundwork/index.html` lines 7423-7461 — Info bubble HTML builder
- `/home/wzrd/Groundwork/index.html` lines 7191-7305 — Rectangle drawing (desktop + mobile touch)

### Phase 1-3 Artifacts
- `app/features/map/MapContext.ts` — MapContext and useMapInstance() hook
- `app/features/map/Map.tsx` — Map initialization, floating controls, pin-drop mode pattern (reuse for discover mode toggle)
- `app/features/map/MarkerLayer.tsx` — Imperative marker pool pattern + InfoWindow (reference for DiscoverLayer)
- `app/features/pins/pin-marker.ts` — SVG marker generation pattern (reference for discover markers)
- `app/features/pins/pins.store.ts` — PinsSlice with addPin (used by quick-save)
- `app/types/discover.types.ts` — Existing discover type definitions
- `app/store/index.ts` — Root store with DiscoverSlice

### Research
- `.planning/research/PITFALLS.md` — Places API bounds bias (not filter), Places New vs Legacy migration
- `.planning/research/ARCHITECTURE.md` — DrawingManager deprecated, manual rectangle required

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MapButton` component — Discover button already in Map.tsx floating controls, just needs onClick handler
- `useMapInstance()` hook — For DiscoverLayer to access the map
- `MarkerLayer.tsx` pattern — Imperative marker pool with shared InfoWindow (replicate for discover markers)
- `pin-marker.ts` pattern — SVG generation for markers (adapt for discover's simpler circle markers)
- `addPin` Zustand action — Used by quick-save to create pins
- `reverseGeocode` utility — Not needed for discover (Places API provides addresses)

### Established Patterns
- Imperative Google Maps objects managed via useRef pools (not React state)
- DOM-built InfoWindow content with addEventListener (not string onclick)
- "use client" on interactive components only
- Feature code at app/features/{name}/

### Integration Points
- Map.tsx floating controls — Discover button needs onClick to toggle discover mode
- Sidebar.tsx — Needs to swap between PinList and DiscoverPanel based on mode
- DiscoverSlice in Zustand — Holds results, selection state, mode flag
- PinsSlice addPin — Called by quick-save

</code_context>

<specifics>
## Specific Ideas

- Port logic 1:1 from old app — do not redesign the discover UX, it's already proven
- Info bubble must use DOM nodes with addEventListener — no string onclick, no recursive re-renders
- Single InfoWindow instance per layer — opening new one closes previous
- Marker click and checkbox selection are SEPARATE code paths — never call each other
- Quick-save updates the save button in-place (DOM mutation) rather than rebuilding the entire info bubble

</specifics>

<deferred>
## Deferred Ideas

- Marathon mode (multi-area routing) — explicitly out of scope for v1
- AI research via Gemini ("Ask AI" button) — out of scope for v1
- Query batching/parallelization for performance — sequential with 200ms delay for now

</deferred>

---

*Phase: 04-discover*
*Context gathered: 2026-03-31*
