# Requirements: Groundwork v2

**Defined:** 2026-03-31
**Core Value:** A sales rep can discover businesses in an area, pin the ones worth visiting, build an optimized route, and launch Google Maps navigation — all in one seamless flow.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUN-01**: App uses Zustand store with feature slices (pins, discover, route) for all cross-component state
- [x] **FOUN-02**: Map instance shared via React Context so all features can access it without prop drilling
- [x] **FOUN-03**: All map markers use AdvancedMarkerElement (not deprecated google.maps.Marker)
- [x] **FOUN-04**: MapButton component extracted as reusable shared component

### Pins

- [x] **PINS-01**: User can enter pin-drop mode and click map to place a pin at that location
- [x] **PINS-02**: Pin stores title, address, status, contact name, phone, follow-up date, and notes
- [x] **PINS-03**: Address is reverse-geocoded automatically from pin coordinates on drop
- [x] **PINS-04**: Pin has one of four fixed statuses: Prospect (blue), Active (green), Follow-Up (amber), Lost (red)
- [x] **PINS-05**: User can edit a pin's fields via a slide-in edit panel
- [x] **PINS-06**: User can delete a pin from the edit panel or info window
- [x] **PINS-07**: Pins display as status-colored SVG markers on the map
- [x] **PINS-08**: Clicking a pin marker shows an info window with name, status, address, contact, and action buttons
- [x] **PINS-09**: Sidebar shows a searchable list of all pins with text search across title, address, and contact
- [x] **PINS-10**: Sidebar has status filter chips that filter both the list and map marker visibility
- [x] **PINS-11**: Clicking a pin in the sidebar pans and zooms the map to that pin and bounces the marker
- [x] **PINS-12**: Pins persist to localStorage as primary cache
- [x] **PINS-13**: Pins sync to Supabase with debounced cloud push and pull-on-load with merge semantics (updated_at comparison)

### Discover

- [x] **DISC-01**: User can click Discover button to enter discovery mode
- [x] **DISC-02**: User draws a rectangle on the map via click+drag to define the search area
- [x] **DISC-03**: Search area is validated (min 200m, max 30km)
- [x] **DISC-04**: App searches Google Places (New API) using configurable query categories (default: 18 construction/trade queries)
- [x] **DISC-05**: Results are filtered by chain/residential/irrelevant-type exclusion rules
- [x] **DISC-06**: Results are deduplicated by place_id, normalized name, and coordinate proximity
- [x] **DISC-07**: Results are strictly filtered to the drawn rectangle bounds (client-side containment check)
- [x] **DISC-08**: Results display in a scrollable list with business name, type classification, rating, and address
- [x] **DISC-09**: Results display as markers on the map (orange default, green selected, yellow hover)
- [x] **DISC-10**: Clicking a discover marker shows an info bubble with photo, name, type, rating, address, and action buttons
- [x] **DISC-11**: User can select multiple discovered businesses via checkboxes
- [x] **DISC-12**: User can quick-save a discovered business as a pin with default Prospect status
- [x] **DISC-13**: Mobile touch support: 300ms hold-to-draw to prevent accidental rectangles

### Route

- [x] **ROUT-01**: User can add pins to a stop list from the pin info window, sidebar, or discover results
- [ ] **ROUT-02**: User can select start point: home base address, GPS location, or custom address
- [x] **ROUT-03**: Route is optimized via Google Directions API with optimizeWaypoints flag
- [x] **ROUT-04**: Route displays on map as an orange polyline with numbered stop markers
- [x] **ROUT-05**: Route confirm panel shows reorderable stop list with distance and time summary
- [ ] **ROUT-06**: User can drag-to-reorder stops in the confirm panel and route recalculates
- [x] **ROUT-07**: App generates a Google Maps shareable link using stop addresses (fallback to coordinates)
- [x] **ROUT-08**: User can open the route in Google Maps for turn-by-turn navigation via the shareable link
- [x] **ROUT-09**: Route is capped at 25 waypoints with clear user-facing messaging when limit is reached
<<<<<<< HEAD
- [x] **ROUT-10**: Route returns to start point when departing from home base
=======
- [ ] **ROUT-10**: Route returns to start point when departing from home base
>>>>>>> worktree-agent-a2942c73
- [x] **ROUT-11**: Route state (stops, order, shareable link) is managed in Zustand store, not local component state

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Pin Enhancements

- **PINE-01**: Sidebar ↔ map bidirectional hover sync (highlight marker on sidebar hover, highlight list item on marker hover)
- **PINE-02**: Bulk area-select via shift+drag on map
- **PINE-03**: Pin grouping options (by status, A-Z, follow-up date, most recent)
- **PINE-04**: Pin relocate (pick up and re-drop on map)
- **PINE-05**: Customizable pin statuses (user-defined names and colors)

### Platform

- **PLAT-01**: Auth / login system with user profiles
- **PLAT-02**: Daily notes and activity logging in planner
- **PLAT-03**: Marathon mode (multi-area routing)
- **PLAT-04**: AI research via Gemini on discovered businesses
- **PLAT-05**: GPS background tracking with auto-visit detection
- **PLAT-06**: Route import via bulk paste or quick add
- **PLAT-07**: Email integration from pins
- **PLAT-08**: >25 waypoint clustering fallback

## Out of Scope

| Feature | Reason |
|---------|--------|
| Built-in turn-by-turn navigation | Google Maps handles this better than any custom implementation; shareable link is the handoff |
| Real-time GPS rep tracking | Privacy friction kills adoption; defer to opt-in v2 feature |
| Custom status creation | Fixed 4-status set covers the sales cycle; avoids configuration complexity |
| CSV/bulk route import | Edge cases with bad addresses and geocoding failures; manual pin + discover covers the use case |
| Email/calendar integration | Deep OAuth integrations are maintenance-heavy; follow-up date field is sufficient for v1 |
| AI-generated visit summaries | LLM API dependency adds cost and latency; good structured fields deliver the same outcome |
| Voice dictation | Browser speech API is unreliable; defer to v2 |
| Native mobile app | Web-first; must work well on mobile browsers |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Complete |
| FOUN-02 | Phase 1 | Complete |
| FOUN-03 | Phase 1 | Complete |
| FOUN-04 | Phase 1 | Complete |
| PINS-01 | Phase 2 | Complete |
| PINS-02 | Phase 2 | Complete |
| PINS-03 | Phase 2 | Complete |
| PINS-04 | Phase 2 | Complete |
| PINS-05 | Phase 2 | Complete |
| PINS-06 | Phase 2 | Complete |
| PINS-07 | Phase 2 | Complete |
| PINS-08 | Phase 2 | Complete |
| PINS-09 | Phase 2 | Complete |
| PINS-10 | Phase 2 | Complete |
| PINS-11 | Phase 2 | Complete |
| PINS-12 | Phase 2 | Complete |
| PINS-13 | Phase 3 | Complete |
| DISC-01 | Phase 4 | Complete |
| DISC-02 | Phase 4 | Complete |
| DISC-03 | Phase 4 | Complete |
| DISC-04 | Phase 4 | Complete |
| DISC-05 | Phase 4 | Complete |
| DISC-06 | Phase 4 | Complete |
| DISC-07 | Phase 4 | Complete |
| DISC-08 | Phase 4 | Complete |
| DISC-09 | Phase 4 | Complete |
| DISC-10 | Phase 4 | Complete |
| DISC-11 | Phase 4 | Complete |
| DISC-12 | Phase 4 | Complete |
| DISC-13 | Phase 4 | Complete |
| ROUT-01 | Phase 5 | Complete |
| ROUT-02 | Phase 5 | Pending |
| ROUT-03 | Phase 5 | Complete |
| ROUT-04 | Phase 5 | Complete |
| ROUT-05 | Phase 5 | Complete |
| ROUT-06 | Phase 5 | Pending |
| ROUT-07 | Phase 5 | Complete |
| ROUT-08 | Phase 5 | Complete |
| ROUT-09 | Phase 5 | Complete |
<<<<<<< HEAD
| ROUT-10 | Phase 5 | Complete |
=======
| ROUT-10 | Phase 5 | Pending |
>>>>>>> worktree-agent-a2942c73
| ROUT-11 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after roadmap creation*
