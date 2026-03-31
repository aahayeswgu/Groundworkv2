# Roadmap: Groundwork v2

## Overview

Five phases take a working Next.js scaffold to a fully functional field sales CRM. The dependency chain is strict: the map foundation must exist before pins; pins must be stable before cloud sync; cloud sync must be in place before discover and route add their own data needs. Discover and route are independent of each other once pins are solid, but implementing discover before route means quick-save integration (discovered business → pin → route stop) flows naturally without retrofitting.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Map context, Zustand store skeleton, AdvancedMarkerElement init, shared MapButton component (completed 2026-03-31)
- [ ] **Phase 2: Pins** - Full pin CRUD, status-colored markers, sidebar list with search/filter, localStorage persistence
- [ ] **Phase 3: Supabase Sync** - Cloud sync for pins with merge semantics, debounced upsert, pull-on-load
- [ ] **Phase 4: Discover** - Draw-to-search rectangle, Places (New) multi-query, dedup, quick-save, mobile touch
- [ ] **Phase 5: Route** - Stop list, Directions optimization, map polyline, shareable Google Maps link

## Phase Details

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
**Plans**: TBD

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
**Plans**: TBD
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
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-31 |
| 2. Pins | 4/6 | In Progress|  |
| 3. Supabase Sync | 0/? | Not started | - |
| 4. Discover | 0/? | Not started | - |
| 5. Route | 0/? | Not started | - |
