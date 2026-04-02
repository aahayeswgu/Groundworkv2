# Phase 4: Discover - Research

**Researched:** 2026-03-31
**Domain:** Google Places New API, AdvancedMarkerElement, draw-to-search, Google Maps Rectangle overlay
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 1:1 port of the old app's discover tool logic. Same UX flow, same filters, same classification, same selection behavior. Do not redesign.
- **D-02:** The 3-step flow is preserved: Step 1 (draw area) → Step 2 (searching with progress) → Step 3 (results list + markers).
- **D-03:** Replace `placesService.textSearch()` with `Place.searchByText()` via `importLibrary('places')`. Field names change: `place.name` → `place.displayName`, `place.formatted_address` → `place.formattedAddress`, `place.photos[0].getUrl()` → `place.photos[0].getURI()`.
- **D-04:** Replace `google.maps.Marker` for discover markers with `AdvancedMarkerElement`. SVG content set via `marker.content` DOM element.
- **D-05:** DO NOT use `DrawingManager` (deprecated). Port manual mousedown/mousemove/mouseup + touch directly.
- **D-06:** Use native Google Maps InfoWindow. Build content as DOM nodes with `addEventListener` — NO string `onclick` attributes.
- **D-07:** Info bubble shows: photo (if available), business name, type classification, rating with stars, address, Google Maps link, "Save as Pin" button, "Add to Route" placeholder.
- **D-08:** Single shared InfoWindow instance — opening a new one closes the previous. No stacking, no recursion.
- **D-09:** Marker click → focusDiscoverItem (pan, highlight, show info bubble, scroll list). Does NOT toggle selection.
- **D-10:** Hover from list → temp highlight marker on map. No info bubble on hover. Clean enter/leave events.
- **D-11:** Quick-save button in info bubble: update DOM node in place, do NOT rebuild entire info bubble.
- **D-12:** `EXCLUDED_CHAINS` regex — port as-is from old app.
- **D-13:** `EXCLUDED_PLACE_TYPES` array — port as-is (55+ types).
- **D-14:** `EXCLUDED_NAME_PATTERNS` regex — port as-is.
- **D-15:** Triple dedup: place_id → normalized name → coordinate proximity (~50m).
- **D-16:** `classifyGooglePlace()` type classifier — port as-is.
- **D-17:** Strict bounds filtering — client-side containment check AFTER Google returns results.
- **D-18:** `DISCOVER_QUERIES` lives in `app/config/discover-queries.ts`.
- **D-19:** Sequential query execution with 200ms delay between queries. Progress updates showing current query name and running count.
- **D-20:** Checkboxes for multi-select. Select All capped at 20.
- **D-21:** Quick-save creates a Prospect pin with first note "Discovered via Groundwork — {type}". Dedup check before save.
- **D-22:** Selected count shown in a bottom bar with "Route X Stop(s)" button (Phase 5 placeholder).
- **D-23:** Three marker states: default (orange 22px circle), selected (green 30px circle with checkmark), hover (yellow 30px circle). Render as `AdvancedMarkerElement.content`.
- **D-24:** Z-index stacking: default=600, selected=800, hover=900.
- **D-25:** 300ms hold-to-draw on touch devices. Port old app's touch handler pattern.
- **D-26:** Discover panel shows in the sidebar area (replaces pin list when active).

### Claude's Discretion

- Exact component decomposition (DiscoverPanel, DiscoverResultItem, etc.)
- How to share the InfoWindow instance between MarkerLayer and DiscoverLayer (or separate instances)
- Zustand DiscoverSlice shape updates (discoverResults, discoverSelected, discoverMode, etc.)
- CSS/styling details for the results panel and items
- Whether to batch Places API queries for performance (vs strict sequential — sequential with 200ms delay is the locked behavior)

### Deferred Ideas (OUT OF SCOPE)

- Marathon mode (multi-area routing)
- AI research via Gemini ("Ask AI" button)
- Query batching/parallelization for performance
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISC-01 | User can click Discover button to enter discovery mode | Map.tsx already has a "Discover businesses" MapButton — needs onClick wired to discoverMode toggle in DiscoverSlice |
| DISC-02 | User draws a rectangle on the map via click+drag to define the search area | `google.maps.Rectangle` confirmed available (not deprecated). mousedown/mousemove/mouseup pattern from old app ports directly. |
| DISC-03 | Search area is validated (min 200m, max 30km) | `google.maps.geometry.spherical.computeDistanceBetween(ne, sw)` — geometry library already loaded in Map.tsx |
| DISC-04 | App searches Google Places (New API) using configurable query categories | `Place.searchByText()` via `importLibrary('places')` — places library already loaded. Fields array, locationRestriction rectangle shape documented. |
| DISC-05 | Results filtered by chain/residential/irrelevant-type exclusion rules | Port EXCLUDED_CHAINS, EXCLUDED_PLACE_TYPES, EXCLUDED_NAME_PATTERNS from old app as-is. Old app line 7131-7137. |
| DISC-06 | Results deduplicated by place_id, normalized name, and coordinate proximity | Triple-dedup pattern from old app (lines 7346-7354) ports directly. `place.id` replaces `place.place_id` in New API. |
| DISC-07 | Results strictly filtered to drawn rectangle bounds | Client-side lat/lng bounds check. Geometry library loaded. Old app pattern (lines 7342-7343) ports directly. |
| DISC-08 | Results display in scrollable list with name, type, rating, address | DiscoverPanel + DiscoverResultItem components. Sidebar swap pattern needed. |
| DISC-09 | Results display as markers (orange default, green selected, yellow hover) | AdvancedMarkerElement with innerHTML SVG content. 3 SVG strings from old app lines 7407-7413 port as-is. |
| DISC-10 | Clicking a discover marker shows info bubble with photo, name, type, rating, address, action buttons | DOM-built InfoWindow content (same pattern as MarkerLayer). `photos[0].getURI()` for photo URL. |
| DISC-11 | User can select multiple businesses via checkboxes | toggleDiscoverSelected in DiscoverSlice (already exists). Checkbox click = separate code path from marker click. |
| DISC-12 | User can quick-save a discovered business as a pin with default Prospect status | `addPin` from PinsSlice. Dedup check by name + coordinates. Note: "Discovered via Groundwork — {type}". |
| DISC-13 | Mobile touch support: 300ms hold-to-draw | touchstart timer → touchmove updates rectangle → touchend triggers search. Old app lines 7199-7266. |
</phase_requirements>

---

## Summary

Phase 4 is a 1:1 port of the old Groundwork prototype's discover tool with two mandatory API migrations: replacing `PlacesService.textSearch()` with `Place.searchByText()` from the New Places API, and replacing `google.maps.Marker` with `AdvancedMarkerElement`. Both migrations have clearly documented field-name and method-name changes.

The key technical risks are: (1) the `Place.searchByText()` API uses a `locationRestriction` with a `rectangle: { low, high }` structure (not a `LatLngBounds` object) for bounding searches; (2) the New Places API uses `place.id` not `place.place_id`, `place.displayName` not `place.name`, `photos[0].getURI()` not `photos[0].getUrl()`; and (3) strict post-request bounds filtering must be performed client-side because Google treats locationRestriction as a bias, not a hard filter (verified in PITFALLS.md).

The existing codebase has all prerequisite infrastructure in place: `places` and `geometry` libraries are already loaded in `Map.tsx`, the `DiscoverSlice` already exists in Zustand with the right shape for most state fields, and `MarkerLayer.tsx` provides the exact imperative marker pool + DOM-built InfoWindow pattern that `DiscoverLayer` should replicate.

**Primary recommendation:** Build `DiscoverLayer` as a sibling to `MarkerLayer` (same pattern, separate InfoWindow instance), `DiscoverPanel` as a sidebar overlay, and `app/config/discover-queries.ts` as the query config file. Port all filter/classify/dedup logic verbatim from the old app with only the API field-name translations applied.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `google.maps.places.Place` (New API) | weekly channel | Text search for businesses | Mandated by D-03; legacy PlacesService disabled for new projects since March 2025 |
| `google.maps.marker.AdvancedMarkerElement` | weekly channel | Discover result markers | Already used in Phase 1-2; required for custom SVG content |
| `google.maps.Rectangle` | weekly channel | Visual rectangle overlay during draw | Confirmed NOT deprecated — only DrawingManager is deprecated |
| `google.maps.InfoWindow` | weekly channel | Info bubble for clicked discover results | Already used in MarkerLayer; reuse same class |
| `google.maps.geometry.spherical` | weekly channel | Distance validation for drawn rectangle | Already loaded as "geometry" library in Map.tsx |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand DiscoverSlice | v5 (existing) | discoverResults, selectedDiscoverIds, isDrawing, drawBounds, discoverMode | All cross-component discover state |
| `app/config/discover-queries.ts` | — | 18 DISCOVER_QUERIES array | Single source of truth for query strings |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate InfoWindow for DiscoverLayer | Shared InfoWindow with MarkerLayer | Separate is simpler: no cross-layer coordination, no risk of pin InfoWindow closing on discover click. Recommended. |
| `google.maps.Polygon` for draw overlay | `google.maps.Rectangle` | Rectangle is the right primitive; polygon adds unnecessary complexity |

**Installation:** No new packages required. All Google Maps libraries are already loaded.

---

## Architecture Patterns

### Recommended Project Structure

```
app/
├── config/
│   └── discover-queries.ts          # DISCOVER_QUERIES array (D-18)
├── features/
│   └── discover/
│       ├── discover.store.ts        # DiscoverSlice (already exists — extend)
│       ├── DiscoverLayer.tsx        # Imperative marker pool + InfoWindow (new)
│       ├── DiscoverPanel.tsx        # Sidebar panel: steps 1/2/3 (new)
│       ├── DiscoverResultItem.tsx   # Single result row with checkbox (new)
│       ├── discover-marker.ts       # SVG generator for 3 states (new)
│       ├── discover-search.ts       # searchBusinessesInArea() orchestrator (new)
│       ├── discover-filters.ts      # EXCLUDED_*, classifyGooglePlace() (new)
│       └── discover-info.ts         # buildDiscoverInfoContent() DOM builder (new)
```

### Pattern 1: DiscoverLayer (replicate MarkerLayer pattern)

**What:** Imperative marker pool managed via `useRef<Map<string, AdvancedMarkerElement>>`. Single InfoWindow instance in a ref. Sync effect driven by `discoverResults` + `selectedDiscoverIds` from Zustand.

**When to use:** All discover marker rendering and info bubble management.

**Example:**
```typescript
// Source: app/features/map/MarkerLayer.tsx (established pattern)
"use client";
import { useEffect, useRef, useContext } from "react";
import { MapContext } from "../map/MapContext";
import { useStore } from "@/app/store";

export function DiscoverLayer() {
  const map = useContext(MapContext);
  const discoverResults = useStore((s) => s.discoverResults);
  const selectedDiscoverIds = useStore((s) => s.selectedDiscoverIds);

  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const openPlaceId = useRef<string | null>(null);

  // Sync effect: upsert/remove markers based on discoverResults
  useEffect(() => {
    if (!map) return;
    // ... marker pool sync (same structure as MarkerLayer)
  }, [map, discoverResults, selectedDiscoverIds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const m of markerPool.current.values()) m.map = null;
      markerPool.current.clear();
      infoWindow.current?.close();
    };
  }, []);

  return null;
}
```

### Pattern 2: Place.searchByText() with locationRestriction

**What:** New Places API static method. Requires `{ Place }` destructured from `importLibrary('places')`. Returns `{ places: Place[] }`. `locationRestriction` takes a `rectangle` with `low` (SW) and `high` (NE) as `LatLngLiteral`.

**When to use:** Each of the 18 sequential query iterations in `searchBusinessesInArea`.

**Example:**
```typescript
// Source: official Google Maps JS API docs (verified 2026-03-31)
const { Place } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

const { places } = await Place.searchByText({
  textQuery: 'electrician contractor',
  fields: ['id', 'displayName', 'formattedAddress', 'location', 'types', 'rating', 'userRatingCount', 'photos'],
  locationRestriction: {
    rectangle: {
      low:  { lat: bounds.sw.lat, lng: bounds.sw.lng },  // SW corner
      high: { lat: bounds.ne.lat, lng: bounds.ne.lng },  // NE corner
    }
  },
  maxResultCount: 20,
});
```

**Critical field-name migrations from legacy:**

| Legacy field | New API field | Notes |
|---|---|---|
| `place.place_id` | `place.id` | String unique identifier |
| `place.name` | `place.displayName` | String (NOT `.text` — see below) |
| `place.formatted_address` | `place.formattedAddress` | String |
| `place.geometry.location.lat()` | `place.location.lat()` | LatLng object, same method call |
| `place.photos[0].getUrl({maxWidth})` | `place.photos[0].getURI({maxWidth})` | Method name change: `getUrl` → `getURI` |
| `place.rating` | `place.rating` | Same |
| `place.user_ratings_total` | `place.userRatingCount` | camelCase |
| `place.types` | `place.types` | Same — array of strings |

**Note on `displayName`:** The reference page states `displayName` is a string containing the location's display name. It is NOT `displayName.text` — that's the REST API shape. In the JavaScript `Place` class, `place.displayName` is the string directly.

### Pattern 3: Sequential Query with 200ms Delay

**What:** Async function that iterates DISCOVER_QUERIES one at a time, awaiting each query, sleeping 200ms between, updating progress state after each.

**When to use:** `searchBusinessesInArea()` in `discover-search.ts`.

**Example:**
```typescript
// Source: old app lines 7321-7372 adapted to New API
async function searchBusinessesInArea(bounds: DrawBounds): Promise<DiscoverResult[]> {
  const queries = DISCOVER_QUERIES;
  const seen = new Set<string>();
  const results: DiscoverResult[] = [];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    updateProgress(`Searching: ${query}... (${results.length} found)`); // Zustand action

    try {
      const { places } = await Place.searchByText({ textQuery: query, fields: [...], locationRestriction: toRectangle(bounds) });
      for (const place of places ?? []) {
        const result = filterAndMap(place, bounds, seen);
        if (result) results.push(result);
      }
    } catch { /* skip failed query, continue */ }

    await sleep(200);
  }
  return results;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

### Pattern 4: AdvancedMarkerElement with SVG Content

**What:** Marker state is reflected by replacing `marker.content` with a new DOM element containing the state-specific SVG. Z-index set via `marker.zIndex`.

**When to use:** Marker creation, selection toggle, hover enter/leave.

**Example:**
```typescript
// Source: app/features/pins/pin-marker.ts (established pattern) + old app lines 7407-7413
function createDiscoverMarkerElement(state: 'default' | 'selected' | 'hover'): HTMLElement {
  const svgs = {
    default:  `<svg width="22" height="22" viewBox="0 0 22 22" ...><circle cx="11" cy="11" r="9" fill="#D4712A" opacity="0.7" stroke="#fff" stroke-width="2"/><circle cx="11" cy="11" r="3" fill="#fff"/></svg>`,
    selected: `<svg width="30" height="30" viewBox="0 0 30 30" ...><circle cx="15" cy="15" r="13" fill="#22C55E" stroke="#fff" stroke-width="2.5"/><path d="M10 15l4 4 6-7" stroke="#fff" stroke-width="2.5" fill="none" .../></svg>`,
    hover:    `<svg width="30" height="30" viewBox="0 0 30 30" ...><circle cx="15" cy="15" r="13" fill="#F59E0B" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="15" r="4" fill="#fff"/></svg>`,
  };
  const el = document.createElement('div');
  el.innerHTML = svgs[state];
  el.style.cursor = 'pointer';
  el.style.lineHeight = '0';
  return el;
}

// Update state: replace content + set zIndex
marker.content = createDiscoverMarkerElement('selected');
marker.zIndex = 800;
```

### Pattern 5: Sidebar Panel Swap

**What:** `Sidebar.tsx` currently renders `<PinList>` unconditionally. Phase 4 adds a `discoverMode` flag to `DiscoverSlice`. `Sidebar.tsx` reads that flag and renders `<DiscoverPanel>` instead of `<PinList>` when active.

**When to use:** When user clicks Discover button (sets `discoverMode: true`).

**Example:**
```typescript
// In Sidebar.tsx
const discoverMode = useStore((s) => s.discoverMode);
// ...
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
  {discoverMode ? <DiscoverPanel /> : <PinList onEditPin={onEditPin ?? (() => {})} />}
</div>
```

### Pattern 6: Rectangle Drawing (Desktop)

**What:** `google.maps.event.addListenerOnce(map, 'mousedown', onAreaMouseDown)` starts drawing. `mousemove` listener updates `areaRect.setBounds()`. `mouseup` listener finalizes and triggers search. `google.maps.Rectangle` with `editable: false, clickable: false`.

**When to use:** Desktop draw-to-search flow.

**Example:**
```typescript
// Source: old app lines 7278-7305 — direct port
function onAreaMouseDown(e: google.maps.MapMouseEvent) {
  const areaStartLL = e.latLng!;
  const areaRect = new google.maps.Rectangle({
    bounds: new google.maps.LatLngBounds(areaStartLL, areaStartLL),
    strokeColor: '#D4712A', strokeWeight: 2,
    fillColor: '#D4712A', fillOpacity: 0.08,
    map, editable: false, clickable: false,
  });
  const moveListener = map.addListener('mousemove', (e2) => {
    areaRect.setBounds(new google.maps.LatLngBounds(
      { lat: Math.min(areaStartLL.lat(), e2.latLng!.lat()), lng: Math.min(areaStartLL.lng(), e2.latLng!.lng()) },
      { lat: Math.max(areaStartLL.lat(), e2.latLng!.lat()), lng: Math.max(areaStartLL.lng(), e2.latLng!.lng()) }
    ));
  });
  google.maps.event.addListenerOnce(map, 'mouseup', (e3) => {
    google.maps.event.removeListener(moveListener);
    const bounds = areaRect.getBounds()!;
    const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
    const size = google.maps.geometry.spherical.computeDistanceBetween(ne, sw);
    if (size < 200) { /* toast + return */ }
    if (size > 30000) { /* toast + return */ }
    searchBusinessesInArea(bounds);
  });
}
```

### Pattern 7: InfoWindow DOM Builder (No String onclick)

**What:** Build InfoWindow content as `document.createElement` tree. Attach listeners via `addEventListener`. Update save button in-place via DOM mutation (never rebuild the whole InfoWindow).

**When to use:** `buildDiscoverInfoContent()` in `discover-info.ts`.

**Example:**
```typescript
// Source: MarkerLayer.tsx buildInfoWindowContent pattern (established)
function buildDiscoverInfoContent(result: DiscoverResult, onSave: () => void, alreadySaved: boolean): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'width:300px;font-family:inherit';

  if (result.photoUri) {
    const photo = document.createElement('div');
    photo.style.cssText = `height:140px;background:url('${result.photoUri}') center/cover;border-radius:12px 12px 0 0`;
    container.appendChild(photo);
  }
  // ... name, type, rating, address nodes ...

  const saveBtn = document.createElement('button');
  saveBtn.textContent = alreadySaved ? '✓ Pinned' : 'Save as Pin';
  saveBtn.addEventListener('click', () => {
    onSave();
    saveBtn.textContent = '✓ Pinned'; // in-place update (D-11)
    saveBtn.disabled = true;
  });
  container.appendChild(saveBtn);
  return container;
}
```

### Anti-Patterns to Avoid

- **String onclick in InfoWindow HTML:** `onclick="quickSave(${i})"` — causes global scope issues, potential recursion on re-render. Use `addEventListener` on DOM nodes.
- **Calling focusDiscoverItem from checkbox click:** Marker click and checkbox are separate code paths (D-09). Never combine.
- **Rebuilding entire InfoWindow on save:** Only update the save button DOM node in place (D-11). Calling `infoWindow.setContent()` again closes and reopens the bubble.
- **Using `place.displayName.text`:** In the JavaScript Places API class, `displayName` is a direct string, not an object with a `.text` property (that's the REST API format). Reading `.text` on a string returns `undefined`.
- **Passing `LatLngBounds` object directly to `locationRestriction`:** The New API requires `{ rectangle: { low: LatLngLiteral, high: LatLngLiteral } }`, not a `LatLngBounds` instance.
- **Copying `placesService.textSearch()` from old app:** The old app uses the legacy API (lines 7326). Do not copy those call sites — only copy the filter/classify/dedup logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Places text search | Custom HTTP fetch to Places API | `Place.searchByText()` via `importLibrary('places')` | Field masks, auth, quota, type safety all handled |
| Marker z-index management | CSS z-index hacks | `marker.zIndex = 800` on AdvancedMarkerElement | Direct API support |
| Distance calculation for bounds validation | Haversine formula | `google.maps.geometry.spherical.computeDistanceBetween()` | Geometry library already loaded |
| Rectangle bounds math | Manual lat/lng arithmetic | `google.maps.LatLngBounds` with `getNorthEast()` / `getSouthWest()` | Handles antimeridian edge cases |
| InfoWindow | Custom tooltip/modal overlay | `google.maps.InfoWindow` | Already in use, handles map anchor positioning, mobile, z-layering |

**Key insight:** The Google Maps geometry library (already loaded as `"geometry"` in Map.tsx `setOptions`) handles all spatial math. No hand-rolled distance or containment logic is needed — but the POST-request bounds filter IS necessary because `locationRestriction` is a bias not a hard filter.

---

## Common Pitfalls

### Pitfall 1: `locationRestriction` Is Still a Bias

**What goes wrong:** Results appear outside the drawn rectangle.

**Why it happens:** Google's documentation says locationRestriction restricts results, but "some results outside of the defined boundaries may appear." In practice, highly-relevant results leak through.

**How to avoid:** Always apply client-side containment after `Place.searchByText()` returns:
```typescript
const lat = place.location!.lat();
const lng = place.location!.lng();
if (lat < bounds.sw.lat || lat > bounds.ne.lat || lng < bounds.sw.lng || lng > bounds.ne.lng) continue;
```

**Warning signs:** Discover markers appearing outside the orange rectangle overlay on the map.

### Pitfall 2: `place.displayName` vs `place.displayName.text`

**What goes wrong:** Business names render as `undefined`.

**Why it happens:** The REST Places API (HTTP) returns `{ displayName: { text: "...", languageCode: "en" } }`. But the JavaScript `Place` class maps `displayName` directly to the string. Developers who read the REST docs or look at Network tab responses assume `.text` is needed.

**How to avoid:** Access `place.displayName` directly (it is a string in the JS API). No `.text` suffix.

**Warning signs:** `undefined` in result names; empty name cells in the discover panel.

### Pitfall 3: Legacy `place.place_id` Field

**What goes wrong:** Dedup by place_id fails silently — all IDs are `undefined`.

**Why it happens:** The New Places API uses `place.id` not `place.place_id`.

**How to avoid:** Use `place.id` for all dedup and result storage. Update `DiscoverResult.placeId` assignment to use `place.id`.

### Pitfall 4: Separate Code Paths for Click vs Checkbox

**What goes wrong:** Selecting a checkbox causes info bubble to open; clicking a marker toggles selection — or recursive call stacks. The old app had a subtle bug where `toggleDiscoverItem` was called from both paths.

**Why it happens:** Easy to conflate "focus" (map pan + show bubble) with "select" (toggle checkbox). In the old app, `disc-item-info` called both `toggleDiscoverSelect` AND `focusDiscoverItem` from the same click handler (old app line 7478 — note `onclick="toggleDiscoverSelect(${i});focusDiscoverItem(${i})"` on `disc-item-info`). In the React port, these MUST be separated: `focusDiscoverItem` on marker click, `toggleDiscoverSelected` on checkbox click only.

**How to avoid:** Wire marker `.addListener('click', () => focusDiscoverItem(id))` and checkbox `onChange={() => toggleDiscoverSelected(id)}` as completely separate handlers. Never call one from the other.

**Warning signs:** Clicking a marker causes checkboxes to toggle; selecting a checkbox opens the info bubble.

### Pitfall 5: InfoWindow Re-render Loop on Quick-Save

**What goes wrong:** Clicking "Save as Pin" triggers `addPin` (Zustand state update) → DiscoverLayer syncs → rebuilds InfoWindow → "Save as Pin" button reappears un-clicked.

**Why it happens:** If `buildDiscoverInfoContent` is called from inside the sync `useEffect`, every Zustand state change rebuilds the InfoWindow, resetting user-visible button state.

**How to avoid:** Update the save button DOM node in-place (D-11):
```typescript
saveBtn.addEventListener('click', () => {
  addPin(newPin);
  saveBtn.textContent = '✓ Pinned';
  saveBtn.disabled = true;
  // Never call infoWindow.setContent() here
});
```
The InfoWindow is not rebuilt on `addPin` because DiscoverLayer's sync effect only manages markers, not the InfoWindow content.

### Pitfall 6: `Place` Class Not Loaded at Drawing Time

**What goes wrong:** `google.maps.places.Place is not a constructor` error when the user draws their first rectangle.

**Why it happens:** `importLibrary('places')` is async. If `searchBusinessesInArea` calls `Place.searchByText()` but `Place` was not yet imported, it crashes.

**How to avoid:** Import `Place` lazily inside `searchBusinessesInArea` (or load it eagerly when DiscoverLayer mounts). Since Map.tsx already calls `setOptions({ libraries: ['places'] })`, the library bundle is available — but `importLibrary('places')` must still be called to get the `Place` class reference.

```typescript
// In searchBusinessesInArea or DiscoverLayer mount
const { Place } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
```

### Pitfall 7: Rectangle setBounds During Live Draw

**What goes wrong:** Rectangle flickers or shows incorrect bounds while dragging on mobile.

**Why it happens:** Touch pixel coordinates need conversion to LatLng. The old app uses a bounds-based interpolation (not `OverlayView.getProjection()`) because projection is unavailable synchronously. The touch handler in the old app uses `map.getBounds()` + `mapDiv.getBoundingClientRect()` to compute lat/lng from pixel position.

**How to avoid:** Port the old app's touch coordinate conversion exactly (lines 7212-7221 and 7236-7247). Do not try to use `OverlayView` projection.

---

## Zustand DiscoverSlice — Required Extensions

The existing `DiscoverSlice` in `app/features/discover/discover.store.ts` needs these additions:

| Field / Action | Type | Purpose |
|---|---|---|
| `discoverMode` | `boolean` | Whether discover panel is active (controls sidebar swap) |
| `discoverStep` | `1 \| 2 \| 3` | Which step is shown in the panel |
| `discoverProgress` | `string` | Current progress message during step 2 |
| `setDiscoverMode` | `(active: boolean) => void` | Toggle discover mode |
| `setDiscoverStep` | `(step: 1 \| 2 \| 3) => void` | Drive step transitions |
| `setDiscoverProgress` | `(msg: string) => void` | Update progress text during search |

Existing fields (`discoverResults`, `selectedDiscoverIds`, `isDrawing`, `drawBounds`, `setDiscoverResults`, `setDrawBounds`, `toggleDiscoverSelected`, `setIsDrawing`, `clearDiscover`) are sufficient — only the above additions are needed.

**Note on `selectedDiscoverIds` type:** It is `Set<string>` keyed by `place.id` (New API). The existing store uses `placeId` strings. Zustand v5 handles Set correctly — confirmed in Phase 1 decision log.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `new google.maps.places.PlacesService(div)` | `const { Place } = await importLibrary('places')` | March 2025 hard cutoff | New projects cannot enable legacy Places |
| `placesService.textSearch({ query, bounds }, callback)` | `await Place.searchByText({ textQuery, fields, locationRestriction })` | March 2025 | Promise-based, field masks required |
| `place.name` | `place.displayName` (string) | March 2025 | Field rename in JS API |
| `place.formatted_address` | `place.formattedAddress` | March 2025 | camelCase in JS API |
| `place.photos[0].getUrl({maxWidth})` | `place.photos[0].getURI({maxWidth})` | March 2025 | Method renamed |
| `place.user_ratings_total` | `place.userRatingCount` | March 2025 | camelCase |
| `place.place_id` | `place.id` | March 2025 | Field renamed |
| `new google.maps.Marker({ icon })` | `new AdvancedMarkerElement({ content })` | August 2023 (hard deprecated 2024) | Content is DOM element, not icon URL |
| `DrawingManager` for user-drawn shapes | Manual event listeners (mousedown/mousemove/mouseup) | Drawing Library deprecated August 2025 | Port old app's manual approach directly |

**Deprecated/outdated (do NOT use):**
- `google.maps.places.PlacesService`: Disabled for new projects since March 1, 2025
- `google.maps.drawing.DrawingManager`: Deprecated August 2025, unavailable May 2026
- `google.maps.Marker`: Deprecated August 2023, unavailable in newer API versions

---

## Environment Availability

Step 2.6: All dependencies are already available — the Google Maps JS SDK (with `places`, `geometry`, `marker` libraries) is already loaded in `Map.tsx`. No external services, CLIs, or new package installs are needed for this phase.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|---------|
| `google.maps.places.Place` | DISC-04 | Yes (via `setOptions libraries: ['places']`) | weekly | — |
| `google.maps.geometry.spherical` | DISC-03 | Yes (via `setOptions libraries: ['geometry']`) | weekly | — |
| `google.maps.marker.AdvancedMarkerElement` | DISC-09 | Yes (via `importLibrary('marker')`) | weekly | — |
| `google.maps.Rectangle` | DISC-02 | Yes (core Maps API, not deprecated) | weekly | — |
| Zustand DiscoverSlice | DISC-01, 11 | Yes (exists at `app/features/discover/discover.store.ts`) | v5 | — |
| `addPin` PinsSlice action | DISC-12 | Yes (exists at `app/features/pins/pins.store.ts`) | — | — |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (detected at `vitest.config.ts`) |
| Config file | `/home/wzrd/gwv2/gwv2/vitest.config.ts` |
| Quick run command | `npx vitest run tests/discover/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-05 | EXCLUDED_CHAINS/TYPES/PATTERNS filter logic | unit | `npx vitest run tests/discover/discover-filters.test.ts` | Wave 0 |
| DISC-06 | Triple dedup: place_id, normalized name, coordinates | unit | `npx vitest run tests/discover/discover-filters.test.ts` | Wave 0 |
| DISC-07 | Strict bounds containment check | unit | `npx vitest run tests/discover/discover-filters.test.ts` | Wave 0 |
| DISC-16 | classifyGooglePlace() type classifier | unit | `npx vitest run tests/discover/classify.test.ts` | Wave 0 |
| DISC-03 | Area size validation (min 200m, max 30km) | unit | `npx vitest run tests/discover/discover-search.test.ts` | Wave 0 |
| DISC-01,02,08,09,10,11,12,13 | UI interaction, map drawing, marker states, info bubble | manual | — | manual-only (browser required) |

**Manual-only justification:** Drawing, AdvancedMarkerElement, InfoWindow, and mobile touch require a live Google Maps instance in a browser. Vitest runs in Node (`environment: 'node'`) with no DOM or Maps SDK available.

### Sampling Rate

- **Per task commit:** `npx vitest run tests/discover/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/discover/discover-filters.test.ts` — covers DISC-05, DISC-06, DISC-07 (filter, dedup, bounds check)
- [ ] `tests/discover/classify.test.ts` — covers `classifyGooglePlace()` type classifications
- [ ] `tests/discover/discover-search.test.ts` — covers area size validation logic

*(No framework install needed — vitest already configured.)*

---

## Open Questions

1. **`place.displayName` string vs object in TypeScript types**
   - What we know: Official JS API docs say `displayName` is the location's name. The REST API uses `{ text, languageCode }`.
   - What's unclear: Whether the `@types/google.maps` TypeScript definitions type `displayName` as `string` or as `{ text: string }`. This affects TS compile errors.
   - Recommendation: At implementation time, check `node_modules/@types/google.maps/index.d.ts` for the `Place` class `displayName` property type. If typed as object, access `.text`; if typed as string, use directly. Adjust code accordingly.

2. **`maxResultCount` limit per query**
   - What we know: The old app's `textSearch()` returned up to 20 results per query. `searchByText()` accepts `maxResultCount`.
   - What's unclear: Whether the API enforces a maximum (e.g., 20) and whether we want to request more.
   - Recommendation: Start with `maxResultCount: 20` to match old app behavior. Monitor result quality after first run.

---

## Sources

### Primary (HIGH confidence)

- Google Maps JS API Reference — `Place` class: https://developers.google.com/maps/documentation/javascript/reference/place — field names `id`, `displayName`, `formattedAddress`, `location`, `rating`, `userRatingCount`, `photos`, `types`
- Google Maps JS API — Text Search (New): https://developers.google.com/maps/documentation/javascript/place-search — `Place.searchByText()` parameters, `locationRestriction` rectangle format
- Google Maps JS API — Place Text Search Example: https://developers.google.com/maps/documentation/javascript/examples/place-text-search — `importLibrary('places')`, `{ places } = await Place.searchByText(request)`
- Google Maps JS API — Shapes: https://developers.google.com/maps/documentation/javascript/shapes — `google.maps.Rectangle` confirmed available and not deprecated
- Google Maps Deprecations page: https://developers.google.com/maps/deprecations — DrawingManager deprecated August 2025; `google.maps.Marker` deprecated; PlacesService disabled March 2025
- Old app at `/home/wzrd/Groundwork/index.html` lines 7115-7600 — complete discover implementation (port source)
- `.planning/research/PITFALLS.md` — Places bounds bias, New vs Legacy API pitfalls
- `app/features/map/MarkerLayer.tsx` — established imperative marker pool + InfoWindow pattern
- `app/features/discover/discover.store.ts` — existing DiscoverSlice shape
- `app/features/map/Map.tsx` — confirms `places`, `geometry`, `marker` libraries already loaded

### Secondary (MEDIUM confidence)

- Google Places API (New) — Text Search: https://developers.google.com/maps/documentation/places/web-service/text-search — REST API `locationRestriction.rectangle.low/high` structure (shape mirrors JS API)
- WebSearch result confirming `google.maps.Rectangle` not deprecated (only DrawingManager is)

### Tertiary (LOW confidence)

- `SearchByTextRequest.locationRestriction` TypeScript interface shape — reconstructed from REST API docs + official examples; exact JS API TypeScript definition should be verified at implementation time via `@types/google.maps`

---

## Project Constraints (from CLAUDE.md)

- **Pragmatic and DRY:** Port logic 1:1, no redesign. Organize by feature (`app/features/discover/`).
- **Feature-driven structure:** All discover code under `app/features/discover/` and `app/config/`.
- **Read `node_modules/next/dist/docs/` before writing any code** — Next.js version has breaking changes.
- **"use client" on interactive components only:** `DiscoverLayer`, `DiscoverPanel`, `DiscoverResultItem` will all need `"use client"`. Pure utility files (`discover-filters.ts`, `discover-search.ts`, `discover-marker.ts`) should NOT have `"use client"`.
- **No `DrawingManager`:** Confirmed deprecated — manual event handling is the only approach (D-05).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against Google official docs and existing codebase
- Architecture: HIGH — established patterns from MarkerLayer and old app fully documented
- API field names: HIGH — verified via official reference page
- `locationRestriction` rectangle exact TS types: MEDIUM — REST API shape verified, JS API TS definition should be confirmed at implementation
- Pitfalls: HIGH — Places New vs Legacy from PITFALLS.md, additional pitfalls from code analysis

**Research date:** 2026-03-31
**Valid until:** 2026-06-30 (Google Maps API is on weekly channel; major changes announced in advance)
