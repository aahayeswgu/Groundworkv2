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

- [ ] **PINS-01**: User can enter pin-drop mode and click map to place a pin at that location
- [ ] **PINS-02**: Pin stores title, address, status, contact name, phone, follow-up date, and notes
- [ ] **PINS-03**: Address is reverse-geocoded automatically from pin coordinates on drop
- [ ] **PINS-04**: Pin has one of four fixed statuses: Prospect (blue), Active (green), Follow-Up (amber), Lost (red)
- [ ] **PINS-05**: User can edit a pin's fields via a slide-in edit panel
- [ ] **PINS-06**: User can delete a pin from the edit panel or info window
- [ ] **PINS-07**: Pins display as status-colored SVG markers on the map
- [ ] **PINS-08**: Clicking a pin marker shows an info window with name, status, address, contact, and action buttons
- [ ] **PINS-09**: Sidebar shows a searchable list of all pins with text search across title, address, and contact
- [ ] **PINS-10**: Sidebar has status filter chips that filter both the list and map marker visibility
- [ ] **PINS-11**: Clicking a pin in the sidebar pans and zooms the map to that pin and bounces the marker
- [ ] **PINS-12**: Pins persist to localStorage as primary cache
- [ ] **PINS-13**: Pins sync to Supabase with debounced cloud push and pull-on-load with merge semantics (updated_at comparison)

### Discover

- [ ] **DISC-01**: User can click Discover button to enter discovery mode
- [ ] **DISC-02**: User draws a rectangle on the map via click+drag to define the search area
- [ ] **DISC-03**: Search area is validated (min 200m, max 30km)
- [ ] **DISC-04**: App searches Google Places (New API) using configurable query categories (default: 18 construction/trade queries)
- [ ] **DISC-05**: Results are filtered by chain/residential/irrelevant-type exclusion rules
- [ ] **DISC-06**: Results are deduplicated by place_id, normalized name, and coordinate proximity
- [ ] **DISC-07**: Results are strictly filtered to the drawn rectangle bounds (client-side containment check)
- [ ] **DISC-08**: Results display in a scrollable list with business name, type classification, rating, and address
- [ ] **DISC-09**: Results display as markers on the map (orange default, green selected, yellow hover)
- [ ] **DISC-10**: Clicking a discover marker shows an info bubble with photo, name, type, rating, address, and action buttons
- [ ] **DISC-11**: User can select multiple discovered businesses via checkboxes
- [ ] **DISC-12**: User can quick-save a discovered business as a pin with default Prospect status
- [ ] **DISC-13**: Mobile touch support: 300ms hold-to-draw to prevent accidental rectangles

### Route

- [ ] **ROUT-01**: User can add pins to a stop list from the pin info window, sidebar, or discover results
- [ ] **ROUT-02**: User can select start point: home base address, GPS location, or custom address
- [ ] **ROUT-03**: Route is optimized via Google Directions API with optimizeWaypoints flag
- [ ] **ROUT-04**: Route displays on map as an orange polyline with numbered stop markers
- [ ] **ROUT-05**: Route confirm panel shows reorderable stop list with distance and time summary
- [ ] **ROUT-06**: User can drag-to-reorder stops in the confirm panel and route recalculates
- [ ] **ROUT-07**: App generates a Google Maps shareable link using stop addresses (fallback to coordinates)
- [ ] **ROUT-08**: User can open the route in Google Maps for turn-by-turn navigation via the shareable link
- [ ] **ROUT-09**: Route is capped at 25 waypoints with clear user-facing messaging when limit is reached
- [ ] **ROUT-10**: Route returns to start point when departing from home base
- [ ] **ROUT-11**: Route state (stops, order, shareable link) is managed in Zustand store, not local component state

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
| PINS-01 | Phase 2 | Pending |
| PINS-02 | Phase 2 | Pending |
| PINS-03 | Phase 2 | Pending |
| PINS-04 | Phase 2 | Pending |
| PINS-05 | Phase 2 | Pending |
| PINS-06 | Phase 2 | Pending |
| PINS-07 | Phase 2 | Pending |
| PINS-08 | Phase 2 | Pending |
| PINS-09 | Phase 2 | Pending |
| PINS-10 | Phase 2 | Pending |
| PINS-11 | Phase 2 | Pending |
| PINS-12 | Phase 2 | Pending |
| PINS-13 | Phase 3 | Pending |
| DISC-01 | Phase 4 | Pending |
| DISC-02 | Phase 4 | Pending |
| DISC-03 | Phase 4 | Pending |
| DISC-04 | Phase 4 | Pending |
| DISC-05 | Phase 4 | Pending |
| DISC-06 | Phase 4 | Pending |
| DISC-07 | Phase 4 | Pending |
| DISC-08 | Phase 4 | Pending |
| DISC-09 | Phase 4 | Pending |
| DISC-10 | Phase 4 | Pending |
| DISC-11 | Phase 4 | Pending |
| DISC-12 | Phase 4 | Pending |
| DISC-13 | Phase 4 | Pending |
| ROUT-01 | Phase 5 | Pending |
| ROUT-02 | Phase 5 | Pending |
| ROUT-03 | Phase 5 | Pending |
| ROUT-04 | Phase 5 | Pending |
| ROUT-05 | Phase 5 | Pending |
| ROUT-06 | Phase 5 | Pending |
| ROUT-07 | Phase 5 | Pending |
| ROUT-08 | Phase 5 | Pending |
| ROUT-09 | Phase 5 | Pending |
| ROUT-10 | Phase 5 | Pending |
| ROUT-11 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after roadmap creation*
