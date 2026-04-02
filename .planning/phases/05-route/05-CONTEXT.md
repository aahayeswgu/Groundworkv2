# Phase 5: Route - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Multi-stop route building: add stops from pins and discovered businesses, optimize via Google Directions API (let Google do the heavy lifting — no custom routing logic), display route on map, reorderable stop list with confirm panel, generate Google Maps shareable link for turn-by-turn navigation. 25-stop cap.

</domain>

<decisions>
## Implementation Decisions

### Core Approach
- **D-01:** 1:1 port from old Groundwork app's route system with mandatory API migrations. No redesign.
- **D-02:** Let Google do ALL routing — use `optimizeWaypoints: true` in Directions API. No custom TSP, no cluster-aware nearest-neighbor, no manual optimization logic. Google handles the optimization entirely.
- **D-03:** The shareable link hands off to Google Maps for navigation — no in-app turn-by-turn.

### API Choice
- **D-04:** Use Google Directions API with `optimizeWaypoints: true`. Research flagged DirectionsService as deprecated Feb 2026 — check if Route class `computeRoutes` is stable enough. If not, DirectionsService still works (deprecated ≠ removed). Prefer the working solution.
- **D-05:** Google Maps shareable URL format: `https://www.google.com/maps/dir/{stop1}/{stop2}/.../{stopN}` — addresses preferred, coordinates as fallback.

### Stop Management
- **D-06:** Stops added from: pin info window "Add to Route" button, sidebar pin list, discover results "Route X Stops" button.
- **D-07:** 25-waypoint hard cap. Clear user-facing message when limit reached ("Maximum 25 stops reached").
- **D-08:** Mobile warning when stop count > 3 — Google Maps mobile URL truncates silently.
- **D-09:** Start point selection: home base address, GPS location, or custom address. Port from old app.
- **D-10:** Return-to-start when departing from home base.

### Route Display
- **D-11:** Orange polyline (#D4712A) on map with numbered stop markers at each waypoint.
- **D-12:** Numbered markers use the brand orange with white number text — distinct from pin markers and discover markers.

### Route Confirm Panel
- **D-13:** Panel shows reorderable stop list with total distance and time summary.
- **D-14:** Drag-to-reorder stops triggers route recalculation.
- **D-15:** "Open in Google Maps" button generates the shareable link and opens in new tab.

### State Management
- **D-16:** Route state (stops, order, shareable link, route info) managed in Zustand RouteSlice — not local component state.
- **D-17:** Route stops are pin IDs (referencing the pins array), not duplicated pin data.

### Claude's Discretion
- Route confirm panel component design and placement (modal, slide-in, sidebar section)
- Exact numbered marker SVG design
- How drag-to-reorder is implemented (@dnd-kit or native HTML drag)
- Whether to use DirectionsService (deprecated but working) or Route class (newer but less tested)
- RouteSlice state shape details
- How the "Add to Route" buttons wire into existing InfoWindow and DiscoverPanel

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Old App (PORT SOURCE)
- `/home/wzrd/Groundwork/index.html` lines 4859-4945 — `routeStops()` planner route builder + Google Maps URL generation
- `/home/wzrd/Groundwork/index.html` lines 6903-6978 — `drawRoadRoute()` DirectionsService call + polyline rendering
- `/home/wzrd/Groundwork/index.html` lines 6714-6781 — `addRouteStopNumbers()` numbered marker creation
- `/home/wzrd/Groundwork/index.html` lines 7709-7893 — Route confirm panel + `launchToGoogleMaps()`

### Phase 1-4 Artifacts
- `app/features/route/route.store.ts` — Existing RouteSlice skeleton
- `app/types/route.types.ts` — Existing route type definitions
- `app/features/map/Map.tsx` — Map initialization, floating controls (directions button)
- `app/features/map/MarkerLayer.tsx` — Pin InfoWindow with "Add to Route" placeholder
- `app/features/discover/DiscoverPanel.tsx` — "Route X Stops" button (currently disabled)
- `app/features/discover/discover-info.ts` — Discover InfoWindow with "Add to Route" placeholder
- `app/store/index.ts` — Root store with RouteSlice

### Research
- `.planning/research/PITFALLS.md` — DirectionsService deprecation, mobile URL truncation at 3 waypoints
- `.planning/research/STACK.md` — @dnd-kit for drag-to-reorder

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RouteSlice` in `route.store.ts` — Skeleton with stops array, needs expansion
- `MapContext` + `useMapInstance()` — For route polyline and numbered markers
- `MapButton` — Directions button already in Map.tsx floating controls
- Pin and Discover stores — Route reads pin data by ID, discover selection for bulk route

### Established Patterns
- Imperative Google Maps objects via useRef pools (polyline, markers)
- DOM-built InfoWindow content with addEventListener
- Zustand slices for cross-component state
- Feature code at `app/features/route/`

### Integration Points
- MarkerLayer InfoWindow "Route" button → needs onClick to call `addStop(pinId)`
- DiscoverPanel "Route X Stops" button → needs onClick to add selected discover results as stops
- Map.tsx directions button → toggle route confirm panel
- Sidebar → may need a "Planner" tab or route section

</code_context>

<specifics>
## Specific Ideas

- Let Google handle ALL routing optimization — no custom algorithms
- Port the shareable link format from old app: `https://www.google.com/maps/dir/{addresses}`
- The old app's cluster-aware fallback (lines 6784-6901) is explicitly OUT OF SCOPE — we cap at 25 stops
- Mobile URL truncation warning is important — field reps use phones

</specifics>

<deferred>
## Deferred Ideas

- Marathon mode — multi-area discover + route (noted in memory for future milestone)
- GPS background tracking with auto-visit detection — v2
- Route saving/loading — v2
- Route import via bulk paste — v2

</deferred>

---

*Phase: 05-route*
*Context gathered: 2026-04-01*
