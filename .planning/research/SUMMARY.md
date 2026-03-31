# Project Research Summary

**Project:** Groundwork v2
**Domain:** Map-centric field sales CRM — pin management, Google Places discovery, route optimization
**Researched:** 2026-03-31
**Confidence:** HIGH

## Executive Summary

Groundwork v2 is a map-first field sales CRM targeting construction trade reps. The application sits on a working Next.js 16 / React 19 foundation with Google Maps already bootstrapped. The three feature areas to build — pin management, draw-to-search business discovery, and route planning — each have well-documented patterns in the Google Maps JS API ecosystem. The recommended approach is: add Zustand for cross-feature state, Supabase JS for cloud persistence, and rely exclusively on the new (non-legacy) Google Maps APIs: `Place` class for Places (New), `Route` class for routing, and `AdvancedMarkerElement` for markers. No new npm packages are needed for the Maps work; only `@supabase/supabase-js`, `zustand`, `sonner`, and `@dnd-kit` need to be added.

The key architectural decision is a clean separation between the imperative Maps world and the declarative React world. Map state (markers, polylines, overlays) lives in refs and a marker pool, never in React state. Cross-feature shared state (pins, discover results, route stops) lives in Zustand slices. External API calls are isolated in `lib/` service files; components only dispatch actions and read state. This split is the single pattern that prevents the most common class of map-in-React bugs.

The primary risks are: (1) using deprecated Google APIs — the legacy `PlacesService`, `DirectionsService`, and `DrawingManager` are all at end-of-life; building against them now requires an immediate migration; (2) Places API bounds are a bias signal, not a hard filter — client-side containment filtering is mandatory; (3) the Supabase sync layer needs merge semantics with `updated_at` timestamps from the start, or multi-device use will clobber data; (4) the Google Maps shareable URL silently truncates to 3 waypoints on mobile, which is the primary use context.

---

## Key Findings

### Recommended Stack

The existing stack (Next.js 16.2.1, React 19.2.4, Tailwind 4, `@googlemaps/js-api-loader` ^2.0.2) requires five additions. Zustand v5 is the correct state solution: it uses native `useSyncExternalStore` (React 19 compatible), has selector-based subscriptions that prevent map re-renders on unrelated state changes, and supports a slice pattern that co-locates each feature's state with its components. Plain `@supabase/supabase-js` (not `@supabase/ssr`) is correct because auth is out of scope — the SSR package adds middleware and session complexity that provides zero benefit until auth is introduced. `@dnd-kit/core` + `@dnd-kit/sortable` replace the archived `react-beautiful-dnd` for route stop reordering. `sonner` handles toast notifications for async feedback (Places search progress, route share confirmation, error states).

All three Google Maps API features — Places (New), Route class, AdvancedMarkerElement — are loaded via the existing `importLibrary()` pattern with no new npm packages. Note: `DirectionsService` was deprecated February 25, 2026; the Route class is the current standard. `DrawingManager` was deprecated August 2025 (removal May 2026); the rectangle draw must be implemented manually with `mousedown/mousemove/mouseup` on the map instance.

**Core technologies:**
- `zustand` ^5.0.12: Cross-feature shared state — selector subscriptions prevent map re-renders on pin hover
- `@supabase/supabase-js` ^2.101.1: Database CRUD + debounced cloud sync — anon key only until auth is added
- `@dnd-kit/core` + `@dnd-kit/sortable` ^6.3.1 / ^10.0.0: Route stop drag-to-reorder — only in route planner, not pin list
- `sonner` ^2.0.7: Toast notifications — progress states for 18-query discover flow
- Google Places (New) via `importLibrary('places')`: `Place.searchByText` with `locationRestriction` bounds
- Google Route class via `importLibrary('routes')`: `computeRoutes` with `optimizeWaypointOrder: true`, 25-stop cap
- `AdvancedMarkerElement` via `importLibrary('marker')`: Custom SVG content per status; requires Map ID

### Expected Features

The competitive set (Badger Maps, SPOTIO, MapMyCustomers) establishes baseline expectations. The draw-to-search discovery mechanic is the primary differentiator — no competitor ships a rectangle-draw-to-discover flow; they use territory zones or address-based search. Construction-specific query defaults give immediate out-of-the-box value that generic tools require manual setup to replicate. The offline-first localStorage model with Supabase sync is a second differentiator — all three major competitors require constant connectivity.

**Must have (table stakes):**
- Status-colored pin markers with 4-status palette (Prospect/Active/Follow-Up/Lost)
- Click-to-place pin drop with mode toggle to prevent accidental drops
- Pin CRUD with edit panel and reverse geocode on drop
- Pin list sidebar with text search and status filter chips
- Fly-to-pin + bidirectional sidebar/map hover sync
- localStorage persistence (session survival minimum)
- Multi-stop route building with optimization and map display
- Shareable Google Maps navigation link

**Should have (competitive differentiators):**
- Draw-to-search business discovery with construction query defaults
- Quick-save discovered business as pin (one-tap, in-flow)
- Drag-to-reorder stops in route confirm panel
- Supabase cloud sync (debounced, merge semantics)
- Bulk pin area-select (shift+drag) for delete and route-add

**Defer to v2+:**
- Auth and user profiles — adds multi-device/team sharing; validate single-user flow first
- GPS check-in / visit logging — adds accountability complexity; validate route + discover first
- Email/calendar integration — deferred; follow-up date + notes field covers the immediate need
- AI visit summaries — validate that reps write notes before adding summarization
- Marathon mode (>25 stops, multi-cluster) — rare; 25-stop cap covers most real field days

### Architecture Approach

The architecture is a client-rendered SPA shell assembled by a Next.js server page. `Map.tsx` owns the `google.maps.Map` instance and publishes it via `MapContext`; all sub-features (`MarkerLayer`, `DiscoverOverlay`, `RouteLayer`) consume the context rather than receiving the map as a prop. The Zustand store is composed of per-feature slices co-located with their feature folders; the root `store/index.ts` combines slices but is not a god-store. All external API calls are in `lib/` service files (never in components). Each feature is a self-contained folder under `app/features/` — the fork-friendly goal is served by having industry configuration isolated in `app/config/queries.ts`.

**Major components:**
1. `app/features/map/Map.tsx` + `MarkerLayer.tsx` — Map canvas, mode controller, imperative marker pool (ref-based, not state-based)
2. `app/features/pins/` — `PinList`, `PinPanel`, `PinInfoWindow`, `pins.store.ts`; core data foundation that route and discover both depend on
3. `app/features/discover/` — `DiscoverOverlay` (manual rectangle draw), `DiscoverPanel` (results + quick-save), `discover.store.ts`
4. `app/features/route/` — `RoutePlanner` (stop list + dnd reorder + optimize), `RouteLayer` (polyline + numbered markers), `route.store.ts`
5. `app/lib/` — `supabase.ts`, `places.ts`, `directions.ts`, `geocoding.ts` — pure service wrappers, no React dependencies, called by Zustand actions only

### Critical Pitfalls

1. **Places API bounds are biases, not hard filters** — Apply a mandatory client-side containment check (`google.maps.geometry.poly.containsLocation()`) after every Places API response. Do not trust the API's `locationRestriction` to enforce strict bounds; it does not.

2. **Using any legacy Google Maps API** — `PlacesService` (legacy), `DirectionsService` (deprecated Feb 2026), `DrawingManager` (deprecated Aug 2025, removal May 2026), and `google.maps.Marker` are all end-of-life. Use `Place` class, `Route` class, manual rectangle events, and `AdvancedMarkerElement` exclusively. Do not copy any search or routing code from the old prototype.

3. **Supabase sync overwrites local changes** — Implement last-write-wins merge using `updated_at` timestamps from the first schema migration. Never do `setLocalPins(remotePins)` — always merge record-by-record. Use soft-delete (`deleted_at`) not hard-delete.

4. **Google Maps shareable URL truncates silently on mobile** — The Google Maps consumer app supports only 3 waypoints on mobile browsers. A 10-stop route link that works perfectly in desktop testing will lose 7 stops when a field rep opens it on their phone. Add a stop-count warning in the route confirm panel and consider segment URL generation for longer routes.

5. **Map instance and event listener leaks across React unmounts** — React 18+ Strict Mode invokes effects twice in development. Every `useEffect` that initializes the map or attaches listeners must return a cleanup function that calls `clearInstanceListeners` and sets markers to `null`. Test with Strict Mode enabled from day one.

6. **18 concurrent Places queries exhausting API quota** — At $0.032/Text Search request, one discovery session costs ~$0.58. 10 searches/day per rep = ~$5.76/day. Cap concurrency at 3-4 in-flight requests, cache by `{queryType, boundsHash}` with a 5-minute TTL, show progressive "Searching (3/18)..." feedback, and set a daily quota cap in Google Cloud Console.

---

## Implications for Roadmap

Based on the dependency graph in FEATURES.md and the build order in ARCHITECTURE.md, seven phases are suggested. Pin CRUD must precede both discover and route because both depend on the pin data layer. Discover and route can be parallelized in planning but should be sequential in implementation (route benefits from having saved pins to add as stops, which requires a working quick-save from discover).

### Phase 1: Map Foundation and State Architecture

**Rationale:** Everything depends on a stable map instance and a working state layer. MapContext, the Zustand store skeleton, and the error boundary must exist before any feature work starts. Getting cleanup patterns right here prevents the memory leak pitfall from compounding.

**Delivers:** `MapContext` with stable map ref, Zustand store with empty slice scaffolding, error boundary on map load failure, `AdvancedMarkerElement` initialization with Map ID, `lib/` service file structure.

**Addresses:** Basic map render, mode controller scaffold (IDLE | PLACE_PIN | DRAW | ROUTE_ADD)

**Avoids:** Map instance survival pitfall (Pitfall 5), missing error boundary tech debt

**Research flag:** Standard patterns — skip research-phase. Map initialization with `@googlemaps/js-api-loader` and Zustand slice pattern are both well-documented.

---

### Phase 2: Pin Management

**Rationale:** Pins are the data foundation. Route building and discover both write to the pins slice; neither can be properly built without it. This phase also establishes the localStorage persistence pattern used by all subsequent features.

**Delivers:** Pin drop (click-to-place with reverse geocode), Pin CRUD edit panel, status-colored `AdvancedMarkerElement` markers (4 statuses), `PinList` sidebar with search and status filter chips, fly-to-pin, bidirectional hover sync, `PinInfoWindow` on marker click, localStorage persistence.

**Addresses:** All P1 pin table-stakes features from FEATURES.md

**Avoids:** Marker recreation anti-pattern (use marker pool, never recreate on state change), prop-drilling anti-pattern (Zustand for hover sync)

**Research flag:** Standard patterns — skip research-phase. Pin CRUD + AdvancedMarkerElement pool is well-documented.

---

### Phase 3: Supabase Cloud Sync

**Rationale:** Isolated to its own phase so persistence bugs can be debugged independently from UI bugs. Must be built before discover and route add their own persistence needs. Schema design here (with `updated_at`, soft deletes) defines the pattern all future tables follow.

**Delivers:** Supabase client singleton, `pins` table schema with `updated_at` and `deleted_at`, debounced upsert (500ms) after mutations, merge-on-load logic (last-write-wins by `updated_at`), `beforeunload` immediate sync trigger.

**Addresses:** Cloud sync differentiator from FEATURES.md

**Avoids:** Supabase sync clobbers local changes (Pitfall 4) — merge semantics built in from schema day one

**Research flag:** Standard patterns — skip research-phase. Supabase JS CRUD is thoroughly documented.

---

### Phase 4: Business Discovery

**Rationale:** Depends on pin CRUD (quick-save writes to pins slice). Discovery is the primary differentiator and the most technically complex single feature — Place API (New) multi-query orchestration, manual rectangle draw, deduplication, and client-side bounds filtering all need to come together. Building it after the pin layer means quick-save integration is straightforward.

**Delivers:** Manual rectangle draw mode (`mousedown/mousemove/mouseup`, no DrawingManager), `lib/places.ts` with Places (New) multi-query orchestration (concurrency cap 3-4, 5-minute cache by bounds hash), client-side containment filter, deduplication by `placeId` + normalized name + coordinate proximity, `DiscoverPanel` results list with orange/green/yellow marker states, quick-save to pin.

**Addresses:** Draw-to-search differentiator, construction query defaults, quick-save as pin (FEATURES.md)

**Avoids:** Places bounds bias (Pitfall 1 — mandatory containment filter), legacy PlacesService (Pitfall 3), 18-query quota exhaustion (Pitfall 6), DrawingManager deprecated API

**Research flag:** Needs deeper research during planning — the Places (New) `Place.searchByText` multi-query pattern with concurrency, caching, and dedup logic has limited community examples. Verify `locationRestriction` rectangle format and field mask requirements against current API docs before implementation sprint.

---

### Phase 5: Route Planning

**Rationale:** Depends on pin CRUD (stops sourced from pins), and benefits from having discover available (discovered businesses can be added to route directly). The Route class (New) replaces the now-deprecated `DirectionsService`; this phase must use the current API.

**Delivers:** `RoutePlanner` stop list with dnd reorder (`@dnd-kit/sortable`), Route class (`importLibrary('routes')`) with `optimizeWaypointOrder: true`, `RouteLayer` orange polyline + numbered stop markers, 25-stop cap with clear messaging, shareable Google Maps URL with mobile waypoint-count warning (>3 stop advisory).

**Addresses:** Route building, drag-to-reorder, navigation handoff (FEATURES.md P1)

**Avoids:** Legacy `DirectionsService` (deprecated Feb 2026), mobile URL truncation (Pitfall 2 — warn at >3 stops), marker recreation during route updates

**Research flag:** Needs research on Route class API during planning — `google.maps.importLibrary('routes')` + `Route` class is newer API surface. Verify `computeRoutes` field masks and `optimizedIntermediateWaypointIndices` response shape before sprint.

---

### Phase 6: Bulk Pin Operations

**Rationale:** Deferred to after the core pin/discover/route flow is stable. Area-select (shift+drag) conflicts with discover draw mode (both use mouse drag); implementing this after discover means the mode conflict can be resolved cleanly with the full mode system in place.

**Delivers:** Shift+drag area-select on map canvas (distinct from discover draw mode), selected state on pins, bulk delete and bulk add-to-route actions.

**Addresses:** Bulk pin operations differentiator (FEATURES.md P2)

**Avoids:** Input conflict between area-select and discover draw modes — resolved via explicit `activeMode` state in `map-mode.store.ts`

**Research flag:** Standard patterns — skip research-phase. Mouse event handling on the Maps instance is well-documented.

---

### Phase 7: Polish and Mobile

**Rationale:** Final pass after all features are functional. Mobile touch patterns (300ms hold-to-draw, bottom sheet info window, sidebar collapse) are validated against a working feature set rather than speculated upfront.

**Delivers:** Mobile touch draw (300ms hold-to-draw for discover), long-press pin placement on mobile, bottom sheet info window on mobile (replace map overlay), offline connectivity indicator, sidebar scroll position preservation, sonner toast placement optimization for mobile.

**Addresses:** Mobile-responsive table stakes, v1.x deferred mobile features (FEATURES.md)

**Avoids:** Accidental pin drops on mobile tap (use long-press), frustrating tap-to-dismiss info windows on mobile

**Research flag:** Standard patterns — skip research-phase.

---

### Phase Ordering Rationale

- Map foundation before everything: `MapContext` and Zustand skeleton must exist before any feature can wire to the map or shared state.
- Pins before discover and route: both features read/write the pins slice; the data layer must be stable before consumers are built.
- Supabase sync isolated: separating sync from CRUD makes bugs traceable; sync also needs schema decisions that affect all future tables.
- Discover before route: quick-save from discover writes to pins; discover results can be added directly to route — this ordering means route gets that integration for free.
- Bulk ops after core: mode conflict with discover draw is resolved after the full mode system exists.
- Polish last: mobile optimizations are faster and more accurate against working features than against mocks.

---

### Research Flags Summary

**Needs research-phase during planning:**
- Phase 4 (Discover): Places (New) multi-query orchestration, `locationRestriction` format, field masks, dedup pattern
- Phase 5 (Route): Route class `computeRoutes` API, field mask requirements, `optimizedIntermediateWaypointIndices` shape

**Standard patterns — skip research-phase:**
- Phase 1 (Foundation): Map init + Zustand slices are thoroughly documented
- Phase 2 (Pins): AdvancedMarkerElement marker pool is well-documented
- Phase 3 (Supabase sync): Supabase JS CRUD is thoroughly documented
- Phase 6 (Bulk ops): Map mouse event handling is well-documented
- Phase 7 (Polish): Mobile UX patterns are well-documented

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against official npm releases and docs as of 2026-03-31; no speculative picks |
| Features | MEDIUM-HIGH | Table stakes verified against three direct competitors; differentiators based on competitive gap analysis (marketing copy sources); no direct user interviews |
| Architecture | HIGH | Patterns verified against official Google Maps docs, Zustand docs, and Next.js App Router patterns; code sketches provided and reviewed |
| Pitfalls | HIGH | Critical pitfalls verified against official API docs and changelog (deprecation dates confirmed); billing costs verified against current Google pricing |

**Overall confidence:** HIGH

### Gaps to Address

- **Places (New) multi-query concurrency pattern:** The exact approach for firing 18 queries with a cap of 3-4 in-flight and a bounds-hash cache has no single canonical reference. The pattern is derived from first principles — verify during Phase 4 planning sprint with the Route class and Places (New) docs.
- **Route class `computeRoutes` response shape:** `optimizedIntermediateWaypointIndices` is documented in Google's reference but has sparse community examples in 2026. Verify field mask requirements and response parsing before the Phase 5 sprint.
- **Mobile Google Maps URL waypoint limit:** The 3-waypoint mobile limit is documented but behavior may vary by device (Android vs iOS, in-app vs browser). Test on physical devices during Phase 5.
- **`@dnd-kit/sortable` v10 API changes:** The jump from v8 to v10 is a major version; release notes should be checked for breaking `useSortable` API changes before Phase 5 implementation.

---

## Sources

### Primary (HIGH confidence)
- [Google Maps Place class](https://developers.google.com/maps/documentation/javascript/place) — Places (New) confirmed current standard
- [Place.searchByText docs](https://developers.google.com/maps/documentation/javascript/place-search) — `locationRestriction` rectangle, field masks
- [Google Maps DirectionsService reference](https://developers.google.com/maps/documentation/javascript/reference/directions) — Deprecated Feb 25, 2026 confirmed
- [Route class overview](https://developers.google.com/maps/documentation/javascript/routes/route-class-overview) — Current routing API, `optimizeWaypointOrder`
- [Advanced Markers overview](https://developers.google.com/maps/documentation/javascript/advanced-markers/overview) — Map ID requirement, migration guide
- [Google Maps Drawing Library deprecation](https://developers.google.com/maps/documentation/javascript/drawinglayer) — Deprecated Aug 2025, removal May 2026
- [Google Directions API waypoint optimization](https://developers.google.com/maps/documentation/routes/opt-way) — 25-waypoint cap confirmed
- [Google Maps URLs — waypoint limits](https://developers.google.com/maps/documentation/urls/get-started) — Mobile 3-waypoint limit confirmed
- [Google Places API (New) — locationRestriction biasing](https://developers.google.com/maps/documentation/places/web-service/text-search) — Bounds are biases not filters confirmed
- [supabase-js GitHub releases](https://github.com/supabase/supabase-js/releases) — v2.101.1 confirmed current
- [zustand GitHub releases](https://github.com/pmndrs/zustand/releases) — v5.0.12 confirmed current

### Secondary (MEDIUM confidence)
- [SPOTIO feature overview](https://spotio.com/features/sales-route-optimization/) — competitor feature breakdown
- [Badger Maps homepage](https://www.badgermapping.com/) — Lead Finder, lasso tool, route limits
- [LogRocket toast comparison 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) — sonner vs react-hot-toast
- [Zustand slices pattern](https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern) — slice composition pattern
- [Supabase offline-first discussion](https://github.com/orgs/supabase/discussions/357) — sync conflict patterns

### Tertiary (LOW confidence)
- [Maptive Best Sales Mapping Software 2026](https://www.maptive.com/15-best-sales-territory-mapping-software/) — competitive landscape overview
- [Monday.com Sales Mapping Guide 2026](https://monday.com/blog/crm-and-sales/sales-mapping-software/) — feature expectations (vendor blog)

---

*Research completed: 2026-03-31*
*Ready for roadmap: yes*
