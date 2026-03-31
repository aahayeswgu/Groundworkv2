# Groundwork v2

## What This Is

A construction field sales CRM for Gillman Services, rebuilt from a monolithic 12k-line HTML prototype into a modular Next.js application. Sales reps use it to manage business pins on a map, discover nearby construction-related businesses via Google Places, and create optimized multi-stop routes that export as shareable Google Maps navigation links. The codebase is structured to be fork-friendly for retrofitting to other industries.

## Core Value

A sales rep can discover businesses in an area, pin the ones worth visiting, build an optimized route, and launch Google Maps navigation — all in one seamless flow.

## Requirements

### Validated

- ✓ Google Maps rendering with dark/light/gray theme styles — existing
- ✓ Satellite/road view toggle — existing
- ✓ Responsive layout with sidebar + map + mobile bottom bar — existing
- ✓ Feature-driven code organization (app/features/, app/components/) — existing
- ✓ Floating map action buttons (pin drop, location, directions, discover, visibility, satellite, quick entry) — existing (UI shells only)
- ✓ Zustand state management with feature slices (pins, discover, route) — Phase 1
- ✓ MapContext for sharing map instance without prop drilling — Phase 1
- ✓ AdvancedMarkerElement support via mapId and marker library — Phase 1
- ✓ MapButton extracted as reusable shared component — Phase 1
- ✓ Pin drop, CRUD, status-colored 3D markers, edit modal, InfoWindow — Phase 2
- ✓ Sidebar pin list with search, status filter chips, fly-to-pin — Phase 2
- ✓ localStorage persistence via Zustand persist middleware — Phase 2
- ✓ Supabase cloud sync with merge semantics and soft-delete — Phase 3

### Active

**Discover Business**
- [ ] Draw-to-search: click+drag rectangle on map to define search area
- [ ] Configurable query categories (default: 18 construction/trade queries, swappable via config)
- [ ] Google Places API search with chain/residential/irrelevant-type exclusion filters
- [ ] Deduplication by place_id, normalized name, and coordinate proximity
- [ ] Results list with checkboxes, business type classification, rating, address
- [ ] Discover markers on map (orange default, green selected, yellow hover)
- [ ] Info bubble on discover marker click (photo, name, type, rating, address, actions)
- [ ] Quick-save discovered business as pin (default Prospect status)
- [ ] Strict bounds filtering — results only within drawn rectangle
- [ ] Mobile touch support — 300ms hold-to-draw

**Route Creation**
- [ ] Add pins to today's stops from pin list, info window, or drag-to-planner
- [ ] Route selected discovered businesses directly
- [ ] Start point selection: home base, GPS location, or custom address
- [ ] Route optimization via Google Directions API (optimizeWaypoints)
- [ ] Route display: orange polyline with numbered stop markers on map
- [ ] Route confirm panel with reorderable stop list and summary (distance, time)
- [ ] Google Maps shareable link generation (addresses preferred, fallback to coordinates)
- [ ] Open route in Google Maps for turn-by-turn navigation
- [ ] 25-waypoint cap (Google API limit)
- [ ] Drag-to-reorder stops in planner
- [ ] Return-to-start when starting from home base

### Out of Scope

- Auth/login system — add after big 3 are perfected
- User profiles — not needed without auth
- Daily notes and activity logging — v2 feature
- Marathon mode (multi-area routing) — v2 feature
- AI research via Gemini — v2 feature
- GPS background tracking and auto-visit detection — v2 feature
- Route import (bulk paste / quick add) — v2 feature
- Custom status creation — using fixed set for v1
- >25 waypoint clustering fallback — capped at 25 for v1
- Email integration from pins — v2 feature
- Voice dictation for notes — v2 feature

## Context

- Rebuilding from a working but monolithic HTML prototype at `/home/wzrd/Groundwork/index.html` (11,992 lines)
- The old app lost functionality at an unknown point; this rebuild breaks features into isolated modules
- Gillman Services is the primary customer but architecture should be fork-friendly for other industries
- Supabase is the backend (existing infrastructure from the old app)
- Google Maps API + Google Places API are the core external dependencies
- The old app's discover queries target construction/trades — these should be configurable for industry swaps
- Default center: Tampa, FL area (lat: 27.9506, lng: -82.4572)
- Orange (#D4712A) is the brand accent color throughout

## Constraints

- **Tech stack**: Next.js 16 + TypeScript + Tailwind CSS v4 — already established
- **Google API limits**: 25 waypoints max per Directions request, Places API quotas
- **Browser-first**: No native mobile app — must work well on mobile browsers
- **Fork-friendly**: Clean separation of business-specific config (queries, branding) from core logic
- **Feature-driven**: Code organized by domain feature, not technical layer (per CLAUDE.md)
- **DRY**: Reusable components and utilities — no duplicated logic across features

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed pin statuses over customizable | Reduces complexity for v1; 4 statuses cover the sales workflow | — Pending |
| Configurable discover queries | Enables industry swaps without code changes; core to fork-friendly goal | — Pending |
| 25-stop route cap | Matches Google API limit; avoids clustering complexity for v1 | — Pending |
| Supabase for persistence | Existing infrastructure from old app; proven to work | — Pending |
| localStorage + cloud sync | Offline-first with debounced sync — same pattern as old app | — Pending |
| Addresses preferred in Google Maps URLs | More readable navigation vs raw coordinates | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 after Phase 3 completion*
