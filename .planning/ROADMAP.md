# Roadmap: Groundwork v2

## Milestones

- ✅ **v1.0 Core CRM** - Phases 1-5 (shipped 2026-04-01)
- 🚧 **v1.1 Power Features** - Phases 6-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Core CRM (Phases 1-5) - SHIPPED 2026-04-01</summary>

### Phase 1: Foundation
**Goal**: The shared infrastructure required by all features exists and is stable
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04
**Success Criteria** (what must be TRUE):
  1. All cross-feature state (pins, discover, route) lives in Zustand slices accessible from any component
  2. The map instance is accessible to any feature component without prop drilling via MapContext
  3. Pin-style markers can be rendered using AdvancedMarkerElement (not deprecated google.maps.Marker)
  4. MapButton is a single reusable component used by all floating action buttons
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Zustand install, shared types (Pin, DiscoverResult, RouteStop), three feature slices, root store, MapButton extracted to app/components/
- [x] 01-02-PLAN.md — MapContext + useMapInstance() hook, Map.tsx upgraded with mapId + marker library + cleanup, MapContext.Provider wired
**UI hint**: yes

### Phase 2: Pins
**Goal**: Sales reps can create, view, edit, and delete pins on the map and manage them via the sidebar
**Depends on**: Phase 1
**Requirements**: PINS-01, PINS-02, PINS-03, PINS-04, PINS-05, PINS-06, PINS-07, PINS-08, PINS-09, PINS-10, PINS-11, PINS-12
**Success Criteria** (what must be TRUE):
  1. User can tap the pin-drop button, click anywhere on the map, and a new pin appears with auto-filled reverse-geocoded address
  2. User can open a pin's edit panel and update title, address, status, contact, phone, follow-up date, and notes
  3. User can delete a pin from the edit panel or info window and it disappears from map and sidebar immediately
  4. Map markers display in the correct status color (blue/green/amber/red) for each of the four pin statuses
  5. Clicking a pin marker opens an info window showing name, status, address, contact, and action buttons
  6. Sidebar shows all pins; user can search by text and filter by status chip; clicking a pin flies the map to it
  7. Pins survive a page reload (restored from localStorage)
**Plans**: 6 plans
Plans:
- [x] 02-01-PLAN.md — NoteEntry type upgrade, activeStatusFilter in PinsSlice, persist middleware, StoreHydration component
- [x] 02-02-PLAN.md — pin-marker.ts SVG generator, MarkerLayer imperative pool + InfoWindow
- [x] 02-03-PLAN.md — reverseGeocode utility, pin-drop mode wired into Map.tsx
- [x] 02-04-PLAN.md — PinModal portal overlay (create + edit, all 7 fields, activity log)
- [x] 02-05-PLAN.md — PinList + PinListItem (search, filter chips, fly-to-pin), Sidebar wired
- [x] 02-06-PLAN.md — Final wiring: MarkerLayer + PinModal in Map.tsx, StoreHydration + edit state in page.tsx
**UI hint**: yes

### Phase 3: Supabase Sync
**Goal**: Pins are durably stored in Supabase and merge safely across sessions and devices
**Depends on**: Phase 2
**Requirements**: PINS-13
**Success Criteria** (what must be TRUE):
  1. Pins created or edited in one browser session appear when the app is opened in a different browser
  2. Editing a pin in two tabs and refreshing both results in the newer edit winning (last-write-wins by updated_at)
  3. Deleting a pin does not clobber a concurrent edit from another session (soft-delete via deleted_at)
  4. The app loads pins from Supabase on startup and merges them with any local changes without losing data
**Plans**: 3 plans
Plans:
- [x] 03-01-PLAN.md — Install @supabase/supabase-js + vitest, create vitest.config.ts, checkpoint for Supabase project credentials
- [x] 03-02-PLAN.md — TDD: merge.ts pure functions (mergePins, localToRemote, remoteToLocal) + unit tests
- [x] 03-03-PLAN.md — app/lib/supabase.ts singleton, usePinSync hook, StoreHydration update, SQL migration, smoke test

### Phase 4: Discover
**Goal**: Sales reps can draw a rectangle on the map, search for nearby businesses, and save relevant ones as pins
**Depends on**: Phase 3
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, DISC-08, DISC-09, DISC-10, DISC-11, DISC-12, DISC-13
**Success Criteria** (what must be TRUE):
  1. User can enter discover mode, click+drag to draw a rectangle, and results appear only for businesses inside that rectangle
  2. Results list shows business name, type classification, rating, and address for each discovered business
  3. Discovered businesses appear as orange markers on the map; selected ones turn green; hovered ones turn yellow
  4. Clicking a discover marker shows an info bubble with photo, name, type, rating, address, and save/route actions
  5. User can check multiple businesses and quick-save any of them as a Prospect pin with one tap
  6. On mobile, holding the map for 300ms initiates a draw (instead of triggering on first tap)
**Plans**: 5 plans
Plans:
- [x] 04-01-PLAN.md — DiscoverSlice extension (discoverMode, searchProgress, selectAllDiscover, hoveredDiscoverId), query config, discover-filters.ts
- [x] 04-02-PLAN.md — discover-search.ts: Place.searchByText() sequential 19-query orchestrator with 200ms delay
- [x] 04-03-PLAN.md — discover-marker.ts (3 SVG states), discover-info.ts (DOM InfoWindow + quick-save builder)
- [x] 04-04-PLAN.md — DiscoverLayer.tsx (marker pool + InfoWindow), Map.tsx draw mode + Discover button wiring
- [x] 04-05-PLAN.md — DiscoverPanel.tsx (3-step UI), DiscoverResultItem.tsx, Sidebar.tsx swap
**UI hint**: yes

### Phase 5: Route
**Goal**: Sales reps can build an optimized multi-stop route from pins and discovered businesses and launch Google Maps navigation
**Depends on**: Phase 4
**Requirements**: ROUT-01, ROUT-02, ROUT-03, ROUT-04, ROUT-05, ROUT-06, ROUT-07, ROUT-08, ROUT-09, ROUT-10, ROUT-11
**Success Criteria** (what must be TRUE):
  1. User can add stops from pin info windows, the sidebar, or discover results, and the route is optimized automatically
  2. Route displays on the map as an orange polyline with numbered stop markers in optimized order
  3. Route confirm panel shows a reorderable stop list with total distance and time; drag-to-reorder triggers recalculation
  4. User can tap "Open in Google Maps" and the route opens in the Maps app for turn-by-turn navigation
  5. When the stop list exceeds 25, the user sees a clear message that the cap has been reached and no further stops can be added
  6. A warning appears when the stop count exceeds 3, noting that the Google Maps link may truncate on mobile
**Plans**: 7 plans
Plans:
- [x] 05-00-PLAN.md — Wave 0: TDD test scaffolds (route-url, route-store, route-service test files)
- [x] 05-01-PLAN.md — RouteSlice expansion (startMode, routeActive, shareableUrl, 25-cap addStop, RouteStop[] reorderStops), StartMode type
- [x] 05-02-PLAN.md — route-service.ts (Route class computeRoute), route-url.ts (api=1 shareable URL), route-markers.ts (numbered circles), geocoding.ts extended
- [x] 05-03-PLAN.md — RouteLayer.tsx (two-layer polyline + AdvancedMarkerElement pool, imperative)
- [x] 05-04-PLAN.md — RouteConfirmPanel.tsx (@dnd-kit sortable, start picker, mobile warning, Build Route, Open Maps)
- [x] 05-05-PLAN.md — Wiring: pin InfoWindow Route button, sidebar PinList, discover InfoWindow + batch
- [x] 05-06-PLAN.md — Map.tsx mounts RouteLayer + RouteConfirmPanel + directions button; human-verify checkpoint
**UI hint**: yes

</details>

### 🚧 v1.1 Power Features (In Progress)

**Milestone Goal:** Add Marathon mode, AI-powered business research, and daily planner to the field sales CRM.

#### Phase 6: Planner
**Goal**: Sales reps can plan their day's stops, log visit outcomes, take daily notes, and review their activity — all from the Planner tab in the sidebar, backed by a migrated Zustand store
**Depends on**: Phase 5
**Requirements**: FOUN-05, FOUN-06, PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07, PLAN-08, PLAN-09, PLAN-10
**Success Criteria** (what must be TRUE):
  1. The app loads and operates normally with no regressions — existing pins, sync, discover, and route are unaffected by the store migration
  2. User can switch to the Planner tab in the sidebar and see today's planned stops as an ordered list with business name, address, and status
  3. User can add stops to the planner from a pin info window, from the route confirm panel ("Send to Planner"), or from the sidebar pin list
  4. User can mark any stop as visited, skipped, or pending — the status updates immediately and is reflected in the day's stats
  5. User can navigate to previous or future days with prev/next arrows, a today button, and a calendar date picker
  6. User can write free-form daily notes in a text area and view a timestamped activity log — both persist per day across page reloads
  7. Stale planner data older than 30 days is purged automatically on app startup
**Plans**: 5 plans
Plans:
- [ ] 06-01-PLAN.md — Planner types (PlannerStop, DayPlan, ActivityEntry), PlannerSlice + createPlannerSlice, store migration v1→v2, StoreHydration purge wiring
- [ ] 06-02-PLAN.md — Sidebar tab switching (Pins/Planner), PlannerPanel skeleton with stats bar and stops list, PlannerStopItem with status cycle
- [ ] 06-03-PLAN.md — PlannerNotes (multi-page pagination, debounced auto-save), PlannerActivityLog (collapsible, privacy toggle), both mounted in PlannerPanel
- [ ] 06-04-PLAN.md — PlannerCalendar (hand-rolled 7-column grid, month nav, has-data dots), date navigation (prev/next/today/month-view) in PlannerPanel
- [ ] 06-05-PLAN.md — Integration: "+ Plan" in PinListItem, "Add to Plan" in MarkerLayer InfoWindow, "Send to Planner" in RouteConfirmPanel, "Route It" in PlannerPanel
**UI hint**: yes

#### Phase 7: Marathon Mode
**Goal**: Sales reps can search multiple areas in one session, accumulate results across zones, and build a single optimized route from the combined pool
**Depends on**: Phase 6
**Requirements**: MARA-01, MARA-02, MARA-03, MARA-04, MARA-05, MARA-06, MARA-07
**Success Criteria** (what must be TRUE):
  1. User can toggle Marathon mode from the discover panel and draw successive rectangles without losing results from previous draws
  2. Each searched area is shown as a persistent rectangle overlay on the map with a result-count badge
  3. Results from all zones are deduplicated — the same business discovered in two overlapping areas appears only once in the list
  4. User can clear results for one specific zone or clear all accumulated results with a single action
  5. Each result in the list is tagged with the zone it came from, and the session header shows total areas searched and businesses found
  6. User can select businesses from the full accumulated pool and build one optimized route from them
**Plans**: TBD
**UI hint**: yes

#### Phase 8: Ask AI
**Goal**: Sales reps can get an AI-generated sales brief for any discovered business without leaving the discover info bubble
**Depends on**: Phase 7
**Requirements**: ASKI-01, ASKI-02, ASKI-03, ASKI-04, ASKI-05, ASKI-06
**Success Criteria** (what must be TRUE):
  1. An "Ask AI" button appears in the discover info bubble for every business result
  2. Tapping "Ask AI" shows a loading state and then displays a sales brief with pain points, crew size estimates, and insider tips relevant to construction/staffing
  3. Tapping "Learn More" expands the brief with company profile, recent activity, decision maker intel, and competitive landscape
  4. Re-opening the same business's info bubble within the session shows the cached brief instantly — no second API call is made
  5. The Gemini API key is never accessible from the browser — all calls are proxied through a server-side route handler
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 2/2 | Complete | 2026-03-31 |
| 2. Pins | v1.0 | 6/6 | Complete | 2026-04-01 |
| 3. Supabase Sync | v1.0 | 3/3 | Complete | 2026-04-01 |
| 4. Discover | v1.0 | 5/5 | Complete | 2026-04-01 |
| 5. Route | v1.0 | 7/7 | Complete | 2026-04-01 |
| 6. Planner | v1.1 | 0/5 | Not started | - |
| 7. Marathon Mode | v1.1 | 0/TBD | Not started | - |
| 8. Ask AI | v1.1 | 0/TBD | Not started | - |
