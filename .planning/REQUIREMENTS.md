# Requirements: Groundwork v2 — Milestone v1.1

**Defined:** 2026-04-01
**Core Value:** A sales rep can discover businesses in an area, pin the ones worth visiting, build an optimized route, and launch Google Maps navigation — all in one seamless flow.

## v1.0 Requirements (Complete)

All 41 v1.0 requirements delivered. See `.planning/phases/` for verification reports.

## v1.1 Requirements

Requirements for milestone v1.1: Power Features.

### Foundation

- [ ] **FOUN-05**: Zustand schema version bumped with migration before adding Planner state to persist
- [ ] **FOUN-06**: PlannerSlice added to Zustand store with planned stops, notes, activity log persisted to localStorage

### Marathon

- [ ] **MARA-01**: User can enter Marathon mode from the discover panel
- [ ] **MARA-02**: User can draw multiple search rectangles sequentially without losing previous results
- [ ] **MARA-03**: Results accumulate across all drawn areas with cross-zone deduplication
- [ ] **MARA-04**: User can select businesses from the accumulated pool and build one optimized route
- [ ] **MARA-05**: Zone count progress indicator shows "X areas searched" during marathon session
- [ ] **MARA-06**: User can clear results per-zone or clear all accumulated results
- [ ] **MARA-07**: Per-zone attribution — each result tagged with which search area it came from

### Ask AI

- [ ] **ASKI-01**: "Ask AI" button appears in discover business info bubble
- [ ] **ASKI-02**: Server-side Route Handler proxies Gemini API calls (API key never exposed to browser)
- [ ] **ASKI-03**: Sales brief generated with pain points relevant to construction/staffing, crew size estimates, insider tips
- [ ] **ASKI-04**: Loading state shown while brief generates
- [ ] **ASKI-05**: "Learn More" expands brief with company profile, recent activity, decision maker intel, competitive landscape
- [ ] **ASKI-06**: Brief cached per placeId — same business doesn't re-fetch on repeated clicks

### Planner

- [x] **PLAN-01**: Planner tab in sidebar (alongside Pins tab) — clicking switches between Pins and Planner views
- [x] **PLAN-02**: Today's planned stops displayed as an ordered list with business name, address, and status
- [x] **PLAN-03**: User can add stops to planner from pin info window, route confirm panel ("Send to Planner"), or sidebar
- [x] **PLAN-04**: User can mark stops as visited, skipped, or pending
- [x] **PLAN-05**: Daily notes text area for free-form notes about the day
- [x] **PLAN-06**: Date navigation — prev/next day arrows, today button, calendar date picker
- [x] **PLAN-07**: Activity log per day — timestamped entries for stop visits, route starts, notes added
- [x] **PLAN-08**: Stats display — planned count, visited count, skipped count for the current day
- [x] **PLAN-09**: Planner stops persist to localStorage via Zustand persist (keyed by date)
- [x] **PLAN-10**: Clean, minimal UI — cleaner than original Groundwork planner

## Future Requirements

Deferred beyond v1.1.

### Planner Enhancements
- **PLAN-E01**: Voice dictation for notes (browser Speech API)
- **PLAN-E02**: GPS auto-check-in — automatically mark stop visited when within proximity
- **PLAN-E03**: Planner stops sync to Supabase (planner_days table)
- **PLAN-E04**: Activity log stored in Supabase (not just localStorage)

### Platform
- **PLAT-01**: Auth / login system with user profiles
- **PLAT-02**: Email integration from pins
- **PLAT-03**: Route import via bulk paste
- **PLAT-04**: Custom pin status creation

## Out of Scope

| Feature | Reason |
|---------|--------|
| GPS auto-check-in | Background location permissions + battery drain; defer to v1.2 |
| Voice dictation | Browser Speech API reliability; defer to v1.2 |
| Supabase planner sync | No auth yet; localStorage sufficient for single-user |
| Activity log in Supabase | Depends on planner Supabase sync |
| >25 waypoint clustering | Capped at 25 for simplicity |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-05 | Phase 6 | Pending |
| FOUN-06 | Phase 6 | Pending |
| PLAN-01 | Phase 6 | Complete |
| PLAN-02 | Phase 6 | Complete |
| PLAN-03 | Phase 6 | Complete |
| PLAN-04 | Phase 6 | Complete |
| PLAN-05 | Phase 6 | Complete |
| PLAN-06 | Phase 6 | Complete |
| PLAN-07 | Phase 6 | Complete |
| PLAN-08 | Phase 6 | Complete |
| PLAN-09 | Phase 6 | Complete |
| PLAN-10 | Phase 6 | Complete |
| MARA-01 | Phase 7 | Pending |
| MARA-02 | Phase 7 | Pending |
| MARA-03 | Phase 7 | Pending |
| MARA-04 | Phase 7 | Pending |
| MARA-05 | Phase 7 | Pending |
| MARA-06 | Phase 7 | Pending |
| MARA-07 | Phase 7 | Pending |
| ASKI-01 | Phase 8 | Pending |
| ASKI-02 | Phase 8 | Pending |
| ASKI-03 | Phase 8 | Pending |
| ASKI-04 | Phase 8 | Pending |
| ASKI-05 | Phase 8 | Pending |
| ASKI-06 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-03-31 — traceability updated after roadmap revision (Phase 9 merged into Phase 6)*
