---
phase: 05-route
verified: 2026-03-31T13:20:00Z
status: gaps_found
score: 9/11 requirements verified
re_verification: null
gaps:
  - truth: "ROUT-06: Drag-to-reorder stops triggers route recalculation"
    status: partial
    reason: "Drag-to-reorder is implemented and reorders the stop list, but it deliberately clears the route display (sets routeActive=false, routeResult=null) rather than auto-recalculating. User must press Build Route again. This was an intentional user-approved change. REQUIREMENTS.md marks ROUT-06 as Pending."
    artifacts:
      - path: "app/features/route/RouteConfirmPanel.tsx"
        issue: "handleDragEnd calls reorderStops + clears route but does not call computeRoute. Comment says 'Clear stale route display — polyline no longer matches stop order'."
    missing:
      - "Auto-recalculation after drag OR update ROUT-06 to reflect the approved manual-rebuild behavior and mark it complete"
  - truth: "route-service.test.ts tests pass against actual implementation"
    status: failed
    reason: "2 of 3 route-service tests fail. Tests mock google.maps.importLibrary and the Route class (per original plan), but the implementation was switched to DirectionsService. The mock doesn't apply to DirectionsService so computeRoute returns null in the test environment."
    artifacts:
      - path: "tests/route/route-service.test.ts"
        issue: "Tests mock Route class via google.maps.importLibrary. Implementation uses google.maps.DirectionsService directly. Mocks don't cover DirectionsService so computeRoute always returns null in tests."
    missing:
      - "Update route-service.test.ts to mock google.maps.DirectionsService instead of Route class, OR document that these tests are intentionally out of sync with the DirectionsService switch"
  - truth: "REQUIREMENTS.md accurately reflects phase 5 completion status"
    status: failed
    reason: "REQUIREMENTS.md has an unresolved git merge conflict (worktree-agent-a2942c73) affecting ROUT-10. HEAD side marks ROUT-10 complete (round-trip implemented), worktree side marks it Pending. The conflict markers (<<<<<<< HEAD, =======, >>>>>>>) are present in the file. Additionally, ROUT-02 is marked Pending in REQUIREMENTS.md but the code fully implements it (home/GPS/custom start picker + PlacesAutocomplete + forwardGeocode)."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Lines 60-64 and 148-152 contain unresolved merge conflict markers. ROUT-02 marked Pending but code is complete."
    missing:
      - "Resolve merge conflict in REQUIREMENTS.md: keep HEAD version (ROUT-10 complete)"
      - "Mark ROUT-02 as complete in REQUIREMENTS.md — start mode selector, PlacesAutocomplete, GPS, and forwardGeocode are all implemented and wired"
human_verification: null
---

# Phase 5: Route Verification Report

**Phase Goal:** Sales reps can build an optimized multi-stop route from pins and discovered businesses and launch Google Maps navigation
**Verified:** 2026-03-31T13:20:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can add stops from pin info windows, sidebar, or discover results | VERIFIED | MarkerLayer.tsx L113-123 (pin InfoWindow + Route button), PinList.tsx L60-71 (sidebar), DiscoverLayer.tsx L129-137 (discover), DiscoverPanel.tsx L139-152 (batch) |
| 2 | Route displays on map as orange polyline with numbered stop markers | VERIFIED | RouteLayer.tsx: two-layer Polyline (#1A1A1A border + #D4712A fill), AdvancedMarkerElement pool with createNumberedMarkerElement() |
| 3 | Route confirm panel shows reorderable stop list with distance and time; drag-to-reorder | PARTIAL | Panel, distance/time summary, and drag are present. Drag clears route (requires manual rebuild) rather than auto-recalculating. User approved. ROUT-06 = Pending in REQUIREMENTS.md |
| 4 | User can tap "Open in Google Maps" for turn-by-turn navigation | VERIFIED | RouteConfirmPanel.tsx L179-200: handleOpenMaps resolves origin, builds URL via buildGoogleMapsUrl(), opens in new tab |
| 5 | Stop list exceeds 25: clear user message | VERIFIED | MarkerLayer.tsx L123: "Max 25" button text on cap hit; RouteConfirmPanel header: "{n} / 25 stops" display |
| 6 | Warning appears when stop count exceeds 3 (mobile truncation) | PARTIAL | showMobileWarning computed (L209) but rendering removed per user request (L267 comment). ROUT-11 says this is ROUT-06 scope. |

**Score:** 4/6 truths fully verified (2 partial — user-approved behavior changes)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/types/route.types.ts` | RouteStop, RouteResult, StartMode types | VERIFIED | Exports all 3 types with correct shapes |
| `app/features/route/route.store.ts` | RouteSlice with all route state and actions | VERIFIED | MAX_STOPS=25, addStop returns boolean, reorderStops(RouteStop[]), all setters |
| `app/features/route/route-service.ts` | computeRoute() async wrapper | VERIFIED | Uses DirectionsService (switched from Route class), returns null on failure, round-trip origin=destination |
| `app/features/route/route-url.ts` | buildGoogleMapsUrl() shareable link builder | VERIFIED | api=1 format, URLSearchParams, pipe-joined waypoints, lat/lng fallback |
| `app/features/route/route-markers.ts` | createNumberedMarkerElement() factory | VERIFIED | 28px orange circle, #D4712A, white text, pointer-events:none |
| `app/features/route/RouteLayer.tsx` | Imperative polyline + numbered markers | VERIFIED | Two-layer polyline, AdvancedMarkerElement pool, InfoWindow on click, cleanup on unmount |
| `app/features/route/RouteConfirmPanel.tsx` | Slide-in panel with stop list, start picker, Maps launch | VERIFIED | DnD sortable, start mode selector (home/GPS/custom), PlacesAutocomplete, Build Route, Open Maps |
| `app/features/map/Map.tsx` | RouteLayer + RouteConfirmPanel mounted | VERIFIED | L12-13 imports, L378-379 both rendered inside MapContext.Provider |
| `app/features/map/MarkerLayer.tsx` | Route button in pin InfoWindow | VERIFIED | L89-123: "+ Route" button, addStop call, "Max 25" on cap |
| `app/features/discover/discover-info.ts` | Add to Route in discover InfoWindow | VERIFIED | L95-103: "+ Add to Route" button, onAddToRoute callback |
| `app/features/discover/DiscoverPanel.tsx` | Batch route add button | VERIFIED | L139-152: "Route X Stops" button, loop calls addStop, breaks on cap |
| `app/lib/geocoding.ts` | forwardGeocode() + getCurrentGpsPosition() | VERIFIED | L25 forwardGeocode, L43 getCurrentGpsPosition |
| `app/components/PlacesAutocomplete.tsx` | Places Autocomplete (New API) for custom start | VERIFIED | Full component, used in RouteConfirmPanel |
| `tests/route/route-url.test.ts` | URL builder unit tests | VERIFIED | 4 tests, all pass |
| `tests/route/route-store.test.ts` | Store slice unit tests | VERIFIED | 4 tests, all pass |
| `tests/route/route-service.test.ts` | Service unit tests | STUB | 3 tests — 2 fail because tests mock Route class but implementation uses DirectionsService |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `RouteLayer.tsx` | `route-markers.ts` | createNumberedMarkerElement() | WIRED | L6 import, L70 usage |
| `RouteLayer.tsx` | `app/store/index.ts` | useStore routeResult/routeActive/routeStops | WIRED | L5 import, L10-12 usage |
| `RouteConfirmPanel.tsx` | `route-service.ts` | computeRoute() | WIRED | L20 import, L159 call in handleBuildRoute |
| `RouteConfirmPanel.tsx` | `route-url.ts` | buildGoogleMapsUrl() | WIRED | L21 import, L185/L197 usage |
| `RouteConfirmPanel.tsx` | `geocoding.ts` | forwardGeocode + getCurrentGpsPosition | WIRED | L22 import, L112/L123 usage |
| `Map.tsx` | `RouteLayer.tsx` | `<RouteLayer>` inside MapContext.Provider | WIRED | L12 import, L378 render |
| `Map.tsx` | `RouteConfirmPanel.tsx` | `<RouteConfirmPanel open={routePanelOpen}>` | WIRED | L13 import, L379 render |
| `MarkerLayer.tsx` | `app/store/index.ts` | addStop called on route button | WIRED | L19 addStop from useStore, L121 call |
| `DiscoverLayer.tsx` | `discover-info.ts` | onAddToRoute callback | WIRED | L129 callback passed to buildDiscoverInfoContent |
| `route.store.ts` | `route.types.ts` | import RouteStop, RouteResult, StartMode | WIRED | L2: `from "@/app/types/route.types"` |
| `app/store/index.ts` | `route.store.ts` | createRouteSlice in persist() | WIRED | L5 import, L17 in composition |
| `tests/route/route-service.test.ts` | `route-service.ts` | import computeRoute | WIRED (broken) | Import resolves but mock pattern mismatches implementation — Route class mocked, DirectionsService used |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `RouteLayer.tsx` | routeResult / routeStops / routeActive | Zustand store (set by RouteConfirmPanel.handleBuildRoute via computeRoute) | Yes — DirectionsService returns real route data | FLOWING |
| `RouteConfirmPanel.tsx` | routeStops | Zustand store (addStop from MarkerLayer, DiscoverPanel, DiscoverLayer) | Yes — populated from real pin/discover data | FLOWING |
| `RouteConfirmPanel.tsx` | routeResult.totalDistanceMeters/.totalDurationSeconds | computeRoute() → DirectionsService → leg totals | Yes — parsed from real API response | FLOWING |
| `buildGoogleMapsUrl()` | origin, stops | Zustand store + resolveOrigin() | Yes — origin resolved at call time; stops from store | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — No runnable entry points without a live server and Google Maps API key. Route functionality requires browser context with Google Maps loaded. All checks would require server + authenticated Map session.

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| ROUT-01 | Add pins from info window, sidebar, or discover results | SATISFIED | MarkerLayer.tsx, PinList.tsx, DiscoverLayer.tsx, DiscoverPanel.tsx all call addStop |
| ROUT-02 | Select start point: home base, GPS, custom address | SATISFIED (code) / PENDING (docs) | RouteConfirmPanel L84-129: full start mode selector implemented; REQUIREMENTS.md incorrectly marks Pending — unresolved conflict with actual code |
| ROUT-03 | Route optimized via Google Directions API with optimizeWaypoints | SATISFIED | route-service.ts L43-44: DirectionsService with optimizeWaypoints:true |
| ROUT-04 | Route displays as orange polyline with numbered stop markers | SATISFIED | RouteLayer.tsx: #D4712A polyline + AdvancedMarkerElement numbered circles |
| ROUT-05 | Confirm panel shows reorderable stop list with distance and time | SATISFIED | RouteConfirmPanel: DnD sortable list, L202-208 distance/time computed from routeResult |
| ROUT-06 | Drag-to-reorder triggers recalculation | PARTIALLY SATISFIED | Drag reorders stops and clears route display; user must press Build Route to recalculate. User approved this behavior. REQUIREMENTS.md marks Pending. |
| ROUT-07 | Google Maps shareable link using stop addresses | SATISFIED | route-url.ts: api=1 format, address-first with lat/lng fallback, pipe-separated waypoints |
| ROUT-08 | Open route in Google Maps for turn-by-turn navigation | SATISFIED | RouteConfirmPanel L179-200: handleOpenMaps opens URL in new tab |
| ROUT-09 | Route capped at 25 waypoints with clear messaging | SATISFIED | route.store.ts MAX_STOPS=25; MarkerLayer "Max 25"; RouteConfirmPanel "{n} / 25 stops" |
| ROUT-10 | Route returns to start point (round trip) | SATISFIED | route-service.ts L41: destination: originPoint (round trip). REQUIREMENTS.md has merge conflict — HEAD correctly marks Complete |
| ROUT-11 | Route state managed in Zustand, not local component state | SATISFIED | route.store.ts: routeStops, routeResult, routeActive, shareableUrl, startMode all in RouteSlice |

**Note on ROUT-06 mobile warning (Success Criterion 6):** The success criteria states "A warning appears when the stop count exceeds 3." showMobileWarning is computed in RouteConfirmPanel but the render block was removed per user request (L267 comment). This is a user-approved change, not a bug.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 60-64, 148-152 | Unresolved git merge conflict markers | Warning | REQUIREMENTS.md is corrupted — `<<<<<<< HEAD`, `=======`, `>>>>>>> worktree-agent-a2942c73` markers in the file. Doesn't affect runtime but is a documentation defect. |
| `tests/route/route-service.test.ts` | 28-46 | Tests mock Route class but implementation uses DirectionsService | Warning | 2/3 service tests permanently fail until test mocks are updated to match actual implementation |
| `app/features/route/RouteConfirmPanel.tsx` | 267 | Mobile warning removed (comment: "removed per user request") | Info | ROUT-06 success criterion not met as written; user approved removal |

---

## Human Verification Required

All human verification was completed and approved prior to this verification run per the user's note. The following were validated during human testing:

1. DirectionsService route optimization with real Google Maps API
2. Round-trip routing (origin = destination, all stops as waypoints)
3. Stop list reordering to match Google's optimized sequence
4. Drag-to-reorder clears route display until Build Route clicked
5. Route markers clickable with InfoWindow showing business details
6. Google Maps URL uses resolved origin coordinates
7. Places Autocomplete for custom start address
8. Smooth camera pan on pin click

---

## Gaps Summary

Three gaps exist, none of which block the core user flow:

**Gap 1 — ROUT-06 partial implementation (informational):** Drag-to-reorder works and updates the stop list, but does not auto-recalculate the route. User explicitly approved this behavior. The route clears visually and the rep presses "Build Route" to recalculate with the new order. This is a UX tradeoff, not a broken feature. No code change needed unless REQUIREMENTS.md is updated to reflect the approved behavior.

**Gap 2 — route-service tests out of sync (minor, non-blocking):** The Wave 0 test scaffolds for route-service mock the Route class (per original plan design). The implementation was switched to DirectionsService during human testing. The 2 failing tests never covered the actual implementation after the switch. The test for "returns null on failure" passes because both codepaths return null on error. Updating the test mocks to cover DirectionsService would make the test suite accurate.

**Gap 3 — REQUIREMENTS.md merge conflict (docs only):** The file contains unresolved git conflict markers from a worktree agent. HEAD version correctly marks ROUT-10 Complete and should be kept. Additionally, ROUT-02 should be updated from Pending to Complete — the code fully implements home/GPS/custom start selection with PlacesAutocomplete.

**Overall:** Phase 5 goal is achieved. Sales reps can build an optimized multi-stop route from pins and discovered businesses and launch Google Maps navigation. All runtime behaviors work correctly. The three gaps are: one user-approved UX tradeoff, one stale test, and one docs conflict.

---

_Verified: 2026-03-31T13:20:00Z_
_Verifier: Claude (gsd-verifier)_
