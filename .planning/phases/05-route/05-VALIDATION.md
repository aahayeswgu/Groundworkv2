# Phase 5: Route - Validation Architecture

**Source:** Extracted from 05-RESEARCH.md — Validation Architecture section
**Phase:** 05-route

---

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (exists, `tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/route/` |
| Full suite command | `npx vitest run` |

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| ROUT-03 | `computeRoute` returns sorted waypoints when optimization succeeds | unit | `npx vitest run tests/route/route-service.test.ts` | tests/route/route-service.test.ts |
| ROUT-07 | `buildGoogleMapsUrl` produces correct URL for 1, 3, 10, 25 stops | unit | `npx vitest run tests/route/route-url.test.ts` | tests/route/route-url.test.ts |
| ROUT-07 | `buildGoogleMapsUrl` falls back to coordinates when address is empty | unit | `npx vitest run tests/route/route-url.test.ts` | tests/route/route-url.test.ts |
| ROUT-09 | `addStop` rejects when routeStops.length === 25 | unit | `npx vitest run tests/route/route-store.test.ts` | tests/route/route-store.test.ts |
| ROUT-11 | RouteSlice `clearRoute` resets all state fields | unit | `npx vitest run tests/route/route-store.test.ts` | tests/route/route-store.test.ts |
| ROUT-01, ROUT-04, ROUT-05, ROUT-06, ROUT-08 | Map rendering, panel UI, drag-to-reorder, "Open in Maps" | manual | N/A — DOM/map integration | checkpoint:human-verify in 05-05 |

**Manual-only rationale:** RouteLayer, RouteConfirmPanel, and the directions button wiring all require a live Google Maps instance and browser DOM. These are integration behaviors tested by visual/manual verification (Plan 05-05 checkpoint).

---

## Sampling Rate

- **Per task commit:** `npx vitest run tests/route/` (route-specific tests only)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

---

## Wave 0 Gaps (scaffolded by Plan 05-00)

- [x] `tests/route/route-url.test.ts` — covers ROUT-07 URL building logic (pure function, no Google Maps needed)
- [x] `tests/route/route-store.test.ts` — covers ROUT-09 cap enforcement and ROUT-11 clearRoute
- [x] `tests/route/route-service.test.ts` — covers ROUT-03 optimized order handling (mock `Route.computeRoutes`)

---

## Test State After Each Wave

| After Wave | Expected State |
|------------|----------------|
| Wave 0 | Test files exist, RED (source files not yet created) |
| Wave 1 (05-01) | route-store.test.ts GREEN; route-url + route-service still RED |
| Wave 2 (05-02) | All three test files GREEN |
| Wave 3-4 (05-03, 05-04) | All tests stay GREEN; no new unit tests (DOM/map code) |
| Wave 4 (05-05, 05-06) | All tests GREEN; manual checkpoint covers integration |
