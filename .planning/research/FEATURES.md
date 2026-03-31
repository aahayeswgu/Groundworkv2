# Feature Research

**Domain:** Field sales CRM / map-based route planning (construction trades focus)
**Researched:** 2026-03-31
**Confidence:** MEDIUM-HIGH (competitive analysis + Google API docs; no direct user interviews)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that every field sales map tool ships. Missing any of these makes the product feel broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Status-colored pin markers on map | Every competitor does this; reps navigate by visual color, not names | LOW | Fixed 4-status palette (Prospect/Active/Follow-Up/Lost) covers the full sales cycle |
| Click-to-place pin drop | Core input mechanic; analogous to dropping a pin in Google Maps | LOW | Requires a "pin drop mode" UI toggle to avoid accidental drops |
| Pin info window on marker click | Reps need name, status, address, phone without opening sidebar | LOW | Show only primary fields; full edit opens in sidebar panel |
| Pin list in sidebar with search and filter | How reps navigate when they know who they're looking for | MEDIUM | Status filter chips + text search are minimum; grouping is a v1 nice-to-have |
| Pin CRUD with edit panel | Add, edit, delete is non-negotiable for any data management tool | MEDIUM | Reverse geocoding on pin drop removes manual address entry burden |
| Pin persistence across sessions | Pins that vanish on reload are unusable | LOW | localStorage is minimum viable; cloud sync is expected for a "real" tool |
| Multi-stop route building | Core value proposition of the app; reason reps open it daily | MEDIUM | Must support at minimum 5-10 stops to cover a real day's route |
| Route display on map | Reps need to see the route visually before committing | LOW | Numbered stop markers + polyline is the standard pattern |
| Navigation handoff to Google Maps | Reps execute routes in Google Maps (turn-by-turn, traffic, voice); nobody expects the app to replicate that | LOW | Shareable link with `https://www.google.com/maps/dir/` is standard; addresses preferred over coords |
| Mobile-responsive layout | Field reps work on phones; desktop-first fails in the field | MEDIUM | Sidebar collapses to bottom bar on mobile; existing layout already handles this |
| Fly-to-pin from sidebar | Standard map UX: click item in list, map pans to it | LOW | Pan + zoom + brief marker bounce is the expected animation |

### Differentiators (Competitive Advantage)

Features that set this product apart from Badger Maps, SPOTIO, MapMyCustomers. Not expected but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Draw-to-search business discovery | No competitor offers draw-a-rectangle-to-discover; they all use territory zones or address-based search | HIGH | Rectangle draw + Google Places multi-category search is the unique mechanic; construction-specific query defaults make it immediately useful |
| Construction-specific query defaults | Generic tools require manual category setup; this works out of the box for trades | LOW | 18 default categories (roofing, HVAC, plumbing, contractors, etc.) configurable per fork |
| Quick-save discovered business as pin | Closes the discover-to-pipeline loop in one tap | LOW | Competitor tools require leaving the map to add a lead |
| Sidebar ↔ map hover sync | Bidirectional highlight feels polished and reduces "where is that pin?" confusion | MEDIUM | Requires shared hover state across map and sidebar components |
| Drag-to-reorder stops in route planner | Competitors offer optimization-then-lock; manual reorder lets reps apply local knowledge (customer prefers morning) | MEDIUM | React drag-and-drop on stop list; map polyline updates in real time |
| Area-select bulk pin operations | Lasso/shift+drag to select multiple pins for bulk delete or route-add beats clicking one by one | HIGH | Badger Maps has a similar "lasso" feature as a flagship differentiator; this is competitive parity + value |
| Offline-first with cloud sync | Field reps in low-signal areas can't lose their day's work | MEDIUM | localStorage as primary store, Supabase sync debounced; competitors require constant connectivity |
| Fork-friendly industry config | Contractors can hand this to a plumber, HVAC company, or real estate team with a config swap | LOW (for design, not implementation) | Requires clean separation of query config, branding colors, and status labels from core logic |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Built-in turn-by-turn navigation | Reps want one app | Google Maps, Waze, and Apple Maps are better at navigation than any custom implementation will ever be; building this is 6+ months of work that adds zero competitive advantage | One-tap shareable link handoff to Google Maps; let Google handle navigation |
| Real-time GPS rep tracking | Managers want visibility | Privacy friction kills adoption; reps resent surveillance tools; adds background location permissions complexity | Log visits manually at pin; GPS-verify check-in as a v2 opt-in feature |
| Custom status creation | Reps want to personalize | Unlimited custom statuses break color-coded visual scanning and complicate filtering logic | Fixed 4-status set covers the full sales cycle; avoid the configuration rabbit hole in v1 |
| Route import via CSV/bulk paste | Power users want to pre-load routes | Edge cases (bad addresses, geocoding failures, duplicate deduplication) are a long tail of bugs; adds a separate data entry paradigm | Manual pin placement + discover flow covers the use case without the import complexity |
| Email/calendar integration | Reps want to log comms in one place | Deep OAuth integrations with Gmail and Outlook are maintenance-heavy; each provider has breaking changes; this is a distraction from the map-first value | Store follow-up date and notes on pin; email integrations are v2 after core is validated |
| More than 25 stops per route | "I have 30 visits today" | Google Directions API hard cap at 25 waypoints (including origin/destination); circumventing this requires multiple API calls, stitching, and UX complexity | Cap at 25, communicate clearly; most field sales days are under 15 stops anyway |
| AI-generated visit summaries | Sounds cutting-edge | Requires LLM API calls, prompt engineering, and cost per-use; adds latency to core workflows; training data on construction industry notes is limited | Good notes field with structured fields (contact name, next action, follow-up date) delivers the same outcome without AI dependency |

---

## Feature Dependencies

```
[Pin CRUD + Edit Panel]
    └──requires──> [Reverse Geocoding on Drop]
    └──requires──> [Pin Persistence (localStorage)]
                       └──enhances──> [Supabase Cloud Sync]

[Pin List Sidebar]
    └──requires──> [Pin CRUD]
    └──enhances──> [Fly-to-Pin]
    └──enhances──> [Sidebar ↔ Map Hover Sync]

[Route Building]
    └──requires──> [Pin CRUD] (must have pins to route to)
    └──requires──> [Google Directions API]
    └──enhances──> [Route Display (polyline + numbered markers)]
                       └──enhances──> [Drag-to-Reorder Stops]

[Navigation Handoff]
    └──requires──> [Route Building]
    └──requires──> [Shareable Link Generation]

[Business Discovery]
    └──requires──> [Draw-to-Search Rectangle UI]
    └──requires──> [Google Places API multi-query search]
    └──requires──> [Deduplication logic]
    └──enhances──> [Quick-Save as Pin]
                       └──requires──> [Pin CRUD]
    └──enhances──> [Route discovered businesses directly]
                       └──requires──> [Route Building]

[Bulk Pin Operations]
    └──requires──> [Pin CRUD]
    └──requires──> [Area-select UI (shift+drag)]
```

### Dependency Notes

- **Route Building requires Pin CRUD:** You cannot add stops to a route until pins exist. Pin persistence must be solid before routing is built.
- **Business Discovery enhances Pin CRUD:** Discovery produces results; quick-save converts them to pins. The discover flow is a pin creation accelerator, not a standalone feature.
- **Navigation Handoff requires Route Building:** The shareable link is the output of a completed route. No route = no link.
- **Area-select conflicts with Draw-to-Search:** Both use mouse drag on the map canvas. These must use distinct modes (shift+drag for area-select, explicit "discover mode" button for draw-to-search) to avoid input conflicts.

---

## MVP Definition

### Launch With (v1 — this milestone)

- [x] Pin drop, CRUD, status, reverse geocode address — the data foundation
- [x] Status-colored SVG markers on map with info window
- [x] Pin list sidebar with search and status filters
- [x] Fly-to-pin, hover sync between sidebar and map
- [x] Bulk pin operations (area-select, delete selected)
- [x] localStorage persistence with Supabase cloud sync
- [x] Draw-to-search business discovery with construction query defaults
- [x] Discover markers (orange/green/yellow) with info bubble + quick-save to pin
- [x] Route builder: add pins or discovered businesses to stop list
- [x] Route optimization via Google Directions API (optimizeWaypoints)
- [x] Route display: numbered stops + orange polyline on map
- [x] Drag-to-reorder stops in confirm panel
- [x] Shareable Google Maps link + open in Google Maps

### Add After Validation (v1.x)

- [ ] Mobile touch: 300ms hold-to-draw for discover rectangle — validate that touch users actually use discovery before optimizing it
- [ ] Pin relocate (pick up and re-drop) — lower frequency action; can use delete + re-drop initially
- [ ] Route "return to start" for home base departures — useful but not blocking

### Future Consideration (v2+)

- [ ] Auth / user profiles — required for multi-device sync and team sharing; defer until single-user flow is validated
- [ ] GPS check-in / visit logging — adds accountability but increases complexity; validate core route + discover first
- [ ] AI visit summaries via Gemini — validate that reps actually write notes before adding AI to summarize them
- [ ] Marathon mode (multi-area routing, >25 stops with clustering) — rare use case; 25-stop cap covers most days
- [ ] Email / calendar integration — validated need before building; follow-up date field may be sufficient

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Pin drop + CRUD + status colors | HIGH | MEDIUM | P1 |
| Pin list sidebar (search + filter) | HIGH | MEDIUM | P1 |
| localStorage persistence | HIGH | LOW | P1 |
| Status-colored map markers + info window | HIGH | LOW | P1 |
| Fly-to-pin + hover sync | MEDIUM | LOW | P1 |
| Draw-to-search business discovery | HIGH | HIGH | P1 |
| Quick-save discovered business as pin | HIGH | LOW | P1 |
| Route builder + Directions API optimization | HIGH | HIGH | P1 |
| Route display (polyline + numbered markers) | HIGH | LOW | P1 |
| Drag-to-reorder stops | MEDIUM | MEDIUM | P1 |
| Shareable Google Maps navigation link | HIGH | LOW | P1 |
| Bulk pin operations (area-select) | MEDIUM | HIGH | P2 |
| Supabase cloud sync | MEDIUM | MEDIUM | P2 |
| Pin relocate | LOW | MEDIUM | P2 |
| Mobile touch draw (300ms hold) | MEDIUM | LOW | P2 |
| Auth + user profiles | HIGH | HIGH | P3 |
| GPS check-in logging | MEDIUM | HIGH | P3 |
| AI visit summaries | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when core is stable
- P3: Future milestone — defer until v1 is validated

---

## Competitor Feature Analysis

| Feature | Badger Maps | SPOTIO | MapMyCustomers | Our Approach |
|---------|-------------|--------|----------------|--------------|
| Map pin markers | Yes, colorized by custom field | Yes, color by deal stage | Yes, color by status | Fixed 4-status color system; simpler than custom fields |
| Business/lead discovery | Lead Finder (separate paid tier, address-based) | No native discovery | Limited | Draw-a-rectangle + Google Places; construction-query defaults; in-flow not separate tier |
| Route optimization | Yes, up to 120 stops, optimizeWaypoints | Yes, up to 150 stops | Yes | Google Directions API, 25-stop cap; matches Google's hard limit cleanly |
| Navigation handoff | Google Maps, Apple Maps, Waze | One-tap to Google/Apple/Waze | Google Maps link | Shareable link + open in Google Maps; no proprietary nav |
| Sidebar pin list | Account list view | Lead list | Customer list | Sidebar with search, status filter chips, grouping |
| Bulk selection | Lasso tool (flagship differentiator) | Territory selection | Limited | Shift+drag area-select; parity with Badger's flagship feature |
| Offline support | Partial (data cached) | No | No | localStorage-first; full offline read, syncs when online |
| Industry config | Generic (any industry) | Generic | Generic | Construction defaults; fork-friendly config for industry swap |

---

## Sources

- [SPOTIO Sales Mapping Software overview](https://spotio.com/blog/sales-mapping-software/) — competitor feature breakdown (MEDIUM confidence, marketing copy)
- [SPOTIO Route Optimization features](https://spotio.com/features/sales-route-optimization/) — navigation handoff detail (MEDIUM confidence)
- [Badger Maps homepage](https://www.badgermapping.com/) — Lead Finder, lasso tool, route limits (MEDIUM confidence)
- [Badger Maps vs SPOTIO comparison](https://spotio.com/compare/badger-maps-vs-spotio/) — feature differentiation (MEDIUM confidence)
- [Google Directions API waypoint optimization](https://developers.google.com/maps/documentation/routes/opt-way) — 25-waypoint cap confirmed (HIGH confidence)
- [Google Places API (New) overview](https://developers.google.com/maps/documentation/places/web-service/op-overview) — Nearby Search, Text Search capabilities (HIGH confidence)
- [Maptive Best Sales Mapping Software 2026](https://www.maptive.com/15-best-sales-territory-mapping-software/) — competitive landscape (LOW confidence, aggregator)
- [Monday.com Sales Mapping Software Guide 2026](https://monday.com/blog/crm-and-sales/sales-mapping-software/) — feature expectations (LOW confidence, vendor blog)

---

*Feature research for: construction field sales CRM — pin management, business discovery, route planning*
*Researched: 2026-03-31*
