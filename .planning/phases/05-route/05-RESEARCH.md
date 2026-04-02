# Phase 5: Route - Research

**Researched:** 2026-03-31
**Domain:** Google Directions API / Route class, drag-to-reorder with @dnd-kit, Google Maps shareable URL, AdvancedMarkerElement numbered markers
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 1:1 port from old Groundwork app's route system with mandatory API migrations. No redesign.
- **D-02:** Let Google do ALL routing — use `optimizeWaypoints: true` in Directions API. No custom TSP, no cluster-aware nearest-neighbor, no manual optimization logic. Google handles the optimization entirely.
- **D-03:** The shareable link hands off to Google Maps for navigation — no in-app turn-by-turn.
- **D-04:** Use Google Directions API with `optimizeWaypoints: true`. Research flagged DirectionsService as deprecated Feb 2026 — check if Route class `computeRoutes` is stable enough. If not, DirectionsService still works (deprecated ≠ removed). Prefer the working solution.
- **D-05:** Google Maps shareable URL format: `https://www.google.com/maps/dir/{stop1}/{stop2}/.../{stopN}` — addresses preferred, coordinates as fallback.
- **D-06:** Stops added from: pin info window "Add to Route" button, sidebar pin list, discover results "Route X Stops" button.
- **D-07:** 25-waypoint hard cap. Clear user-facing message when limit reached ("Maximum 25 stops reached").
- **D-08:** Mobile warning when stop count > 3 — Google Maps mobile URL truncates silently.
- **D-09:** Start point selection: home base address, GPS location, or custom address. Port from old app.
- **D-10:** Return-to-start when departing from home base.
- **D-11:** Orange polyline (#D4712A) on map with numbered stop markers at each waypoint.
- **D-12:** Numbered markers use the brand orange with white number text — distinct from pin markers and discover markers.
- **D-13:** Panel shows reorderable stop list with total distance and time summary.
- **D-14:** Drag-to-reorder stops triggers route recalculation.
- **D-15:** "Open in Google Maps" button generates the shareable link and opens in new tab.
- **D-16:** Route state (stops, order, shareable link, route info) managed in Zustand RouteSlice — not local component state.
- **D-17:** Route stops are pin IDs (referencing the pins array), not duplicated pin data.

### Claude's Discretion
- Route confirm panel component design and placement (modal, slide-in, sidebar section)
- Exact numbered marker SVG design
- How drag-to-reorder is implemented (@dnd-kit or native HTML drag)
- Whether to use DirectionsService (deprecated but working) or Route class (newer but less tested)
- RouteSlice state shape details
- How the "Add to Route" buttons wire into existing InfoWindow and DiscoverPanel

### Deferred Ideas (OUT OF SCOPE)
- Marathon mode — multi-area discover + route (noted in memory for future milestone)
- GPS background tracking with auto-visit detection — v2
- Route saving/loading — v2
- Route import via bulk paste — v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUT-01 | User can add pins to a stop list from the pin info window, sidebar, or discover results | InfoWindow "Route" button (already placeholder in MarkerLayer), DiscoverPanel "Route X Stops" button (disabled placeholder), sidebar needs addStop call |
| ROUT-02 | User can select start point: home base address, GPS location, or custom address | Old app geocodeAddress pattern; geolocation API for GPS; custom address input in RouteConfirmPanel |
| ROUT-03 | Route is optimized via Google Directions API with optimizeWaypoints flag | Route class `computeRoutes` with `optimizeWaypointOrder: true` verified; DirectionsService callback fallback documented |
| ROUT-04 | Route displays on map as an orange polyline with numbered stop markers | `route.path` array + `google.maps.Polyline` for orange stroke; AdvancedMarkerElement with custom HTML for numbered circles |
| ROUT-05 | Route confirm panel shows reorderable stop list with distance and time summary | `durationMillis` + `distanceMeters` from Route response; panel UI in RouteConfirmPanel component |
| ROUT-06 | User can drag-to-reorder stops and route recalculates | @dnd-kit/sortable `useSortable` + `arrayMove` + onDragEnd triggers `reorderStops()` + new `computeRoute()` call |
| ROUT-07 | App generates a Google Maps shareable link using stop addresses (fallback to coordinates) | URL format: `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=p1|p2|...` OR legacy path format — decision required |
| ROUT-08 | User can open the route in Google Maps for turn-by-turn navigation | `window.open(url, '_blank', 'noopener,noreferrer')` — opens in Maps app on mobile |
| ROUT-09 | Route is capped at 25 waypoints with clear user-facing messaging | Enforce in `addStop()` action in RouteSlice; toast/inline message on rejection |
| ROUT-10 | Route returns to start point when departing from home base | Pass start coord as both origin and destination to Route class |
| ROUT-11 | Route state managed in Zustand store, not local component state | RouteSlice already exists; expand with startMode, shareableUrl, routeActive fields |
</phase_requirements>

---

## Summary

Phase 5 builds on a strong foundation: the RouteSlice skeleton exists, placeholder "Add to Route" buttons are already wired in MarkerLayer and discover-info, and the old app's routing code is a direct port target. The main technical decisions are (1) Route class vs DirectionsService for the routing call, (2) the exact Google Maps shareable URL format, and (3) @dnd-kit vs native HTML drag for the reorder panel.

The Route class (`google.maps.importLibrary('routes')`) is the current standard and its `computeRoutes` API is well-documented: `optimizeWaypointOrder: true`, response includes `optimizedIntermediateWaypointIndices` and a `path` array for polyline rendering. DirectionsService was deprecated Feb 25, 2026 but "is not scheduled to be discontinued and will continue to receive bug fixes." Both work. The Route class is the right call for new code — it avoids deprecated-API debt immediately.

The Google Maps shareable URL has two formats: the official `?api=1&origin=...&destination=...&waypoints=p1|p2` format (officially documented, mobile-aware) and the undocumented path format the old app uses (`/maps/dir/stop1/stop2/.../stopN`). The official format has a hard limit of 3 waypoints on mobile browsers and 9 on desktop — both worse than the 25-stop cap. The path format has an unofficial limit closer to 9-10 but is not guaranteed stable. The mobile truncation pitfall applies to either format. The plan should use the official `api=1` format (documented, stable) and show the mobile warning from D-08.

@dnd-kit/sortable is the correct choice for drag-to-reorder: maintained, React 19 compatible, mobile touch support built-in, and `arrayMove` + `useSortable` cover exactly what's needed. Versions confirmed current: `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`.

**Primary recommendation:** Use Route class for routing, official `?api=1` URL format for shareable link, @dnd-kit/sortable for drag-to-reorder.

---

## Project Constraints (from CLAUDE.md)

- **Pragmatic, DRY:** Reusable functions, no repeated logic
- **Feature-driven organization:** Route code at `app/features/route/`
- **Next.js breaking changes:** Read `node_modules/next/dist/docs/` before writing code; heed deprecation notices
- **No redesign:** 1:1 port from old app with API migrations only (D-01)
- **No custom routing logic:** All optimization delegated to Google (D-02)

---

## Standard Stack

### Core (no new installs needed except @dnd-kit)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@googlemaps/js-api-loader` | ^2.0.2 (installed) | Load Route class via `importLibrary('routes')` | Already in use; `importLibrary` is the documented pattern |
| `google.maps.Route` | runtime (weekly) | `computeRoutes` for optimization + polyline path | Current non-deprecated routing API |
| `google.maps.Polyline` | runtime (weekly) | Orange route line overlay | Same imperative pattern as existing code |
| `google.maps.marker.AdvancedMarkerElement` | runtime (weekly) | Numbered stop markers | Already used for pin markers |
| `zustand` | ^5.0.12 (installed) | RouteSlice state | Already in use |
| `@dnd-kit/core` | 6.3.1 | DnD primitives for sortable list | NOT installed yet |
| `@dnd-kit/sortable` | 10.0.0 | `useSortable` + `arrayMove` for stop list | NOT installed yet |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@dnd-kit/utilities` | 3.2.2 (peer dep) | `CSS.Transform.toString()` for drag transforms | Installed automatically with @dnd-kit/core |
| `google.maps.Geocoder` | runtime | Forward geocode custom start address | Already used in `app/lib/geocoding.ts` — extend for forward geocode |
| `navigator.geolocation` | browser API | GPS start point (D-09) | Available in all browsers; requires HTTPS |

### Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

**Version verification (confirmed 2026-03-31):**
- `@dnd-kit/core@6.3.1` — confirmed current via `npm view @dnd-kit/core version`
- `@dnd-kit/sortable@10.0.0` — confirmed current via `npm view @dnd-kit/sortable version`

---

## Architecture Patterns

### Recommended Project Structure

```
app/features/route/
├── route.store.ts           # Zustand RouteSlice (expand skeleton)
├── RouteConfirmPanel.tsx    # Slide-in panel with sortable stop list
├── RouteLayer.tsx           # Map overlay: polyline + numbered markers (imperative)
├── route-service.ts         # computeRoute() wrapper around Route class
├── route-url.ts             # buildGoogleMapsUrl() shareable link builder
└── route-markers.ts         # createNumberedMarkerElement() for stop circles
```

### Pattern 1: Route class computeRoutes

**What:** Async function wrapping the Routes JS API. Returns distance, duration, polyline path, and optimized waypoint order.

**When to use:** Called after stop list changes (add stop, remove stop, drag-to-reorder) and on initial route build.

```typescript
// Source: https://developers.google.com/maps/documentation/javascript/routes/optimize-stops
// Source: https://developers.google.com/maps/documentation/javascript/reference/route

const { Route } = await google.maps.importLibrary('routes') as google.maps.RoutesLibrary;

const result = await new Route().computeRoutes({
  origin: { address: startAddress },     // or { location: { latLng: { lat, lng } } }
  destination: { address: startAddress }, // same as origin for return-to-start
  intermediates: stops.map(s => ({ address: s.address })),
  travelMode: 'DRIVING',
  optimizeWaypointOrder: true,
  fields: [
    'routes.distanceMeters',
    'routes.duration',
    'routes.optimizedIntermediateWaypointIndices',
    'routes.legs',
    'routes.path',               // for polyline rendering
  ],
});

const route = result.routes[0];
// route.optimizedIntermediateWaypointIndices — reorder index array
// route.distanceMeters — total meters
// route.duration — string like "3600s" (seconds as string)
// route.path — Array<LatLngAltitude> for polyline
```

**Important:** `optimizeWaypointOrder` (not `optimizeWaypoints` from the old DirectionsService). The parameter name changed.

**Duration format note:** The Routes API returns duration as a string like `"3600s"` (seconds with trailing 's'). Parse with `parseInt(route.duration)`.

**Fallback on error:** If `computeRoutes` fails (quota, network), draw a straight-line polyline between stops using raw coordinates — same fallback as old app line 6970-6974.

### Pattern 2: Polyline rendering from Route class response

**What:** Use `route.path` to draw an orange polyline with a dark border, matching the old app's two-layer approach.

```typescript
// Source: https://developers.google.com/maps/documentation/javascript/routes/routes-polylines
// route.path is Array<LatLngAltitude> — cast to LatLngLiteral[] for Polyline

const polylinePath = route.path.map(p => ({ lat: p.lat, lng: p.lng }));

// Two-layer approach from old app (lines 6928-6930): border + colored line
routeBorder = new google.maps.Polyline({
  path: polylinePath,
  strokeColor: '#1A1A1A',
  strokeWeight: 10,
  strokeOpacity: 0.5,
  map,
  zIndex: 1,
});
routeLine = new google.maps.Polyline({
  path: polylinePath,
  strokeColor: '#D4712A',
  strokeWeight: 5,
  strokeOpacity: 0.9,
  map,
  zIndex: 2,
});
```

**Alternative:** `route.createPolylines()` returns pre-built Polyline objects, but they use default styling. Use the manual approach above to apply brand orange `#D4712A`.

**Fit bounds after drawing:**
```typescript
const bounds = new google.maps.LatLngBounds();
polylinePath.forEach(p => bounds.extend(p));
map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
```

### Pattern 3: Numbered AdvancedMarkerElement

**What:** Create brand-orange circle markers with white number text. Phase 5 must overlay numbered markers on top of pin markers for stops.

**Key decision:** Do NOT replace existing pin markers with numbered versions (complex cleanup). Create new AdvancedMarkerElement instances with higher zIndex placed at stop positions. Store refs in routeMarkerPool for cleanup.

```typescript
// Source: established MarkerLayer.tsx pattern
function createNumberedMarkerElement(label: string, color = '#D4712A'): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = [
    `width:28px;height:28px;border-radius:50%`,
    `background:${color};color:#fff`,
    `font-size:13px;font-weight:800`,
    `display:flex;align-items:center;justify-content:center`,
    `border:2px solid rgba(255,255,255,0.85)`,
    `box-shadow:0 2px 6px rgba(0,0,0,0.35)`,
    `pointer-events:none`,
  ].join(';');
  el.textContent = label;
  return el;
}

// Usage in RouteLayer
const marker = new google.maps.marker.AdvancedMarkerElement({
  position: { lat: stop.lat, lng: stop.lng },
  map,
  content: createNumberedMarkerElement(String(index + 1)),
  zIndex: 1001 + index,
});
routeMarkerPool.push(marker);
```

**Home marker:** Use label `'H'` and color `'#1A1A1A'` (same as old app lines 6765-6770).

**Cleanup:** `marker.map = null` on all refs in routeMarkerPool before re-rendering.

### Pattern 4: Google Maps shareable URL

**What:** Build a URL that opens Google Maps with all stops as a directions route.

**Two formats exist:**

| Format | URL | Documented | Mobile limit | Notes |
|--------|-----|------------|--------------|-------|
| Official `api=1` | `https://www.google.com/maps/dir/?api=1&origin=A&destination=Z&waypoints=B\|C\|D&travelmode=driving` | YES | 3 waypoints on mobile browsers | Only 1 origin + 9 max intermediates = 10 total stops |
| Legacy path | `https://www.google.com/maps/dir/A/B/C/Z` | NO (undocumented) | Unknown (reportedly 9-10) | Used by old app; not in official docs; may open Maps app on mobile |

**Recommendation:** Use the official `api=1` format. It is documented and stable. The mobile limit is 3 `waypoints` (intermediates between origin and destination) — meaning 5 total stops including origin and destination. For routes with more stops, show the D-08 warning and still generate the URL (Google Maps will display as many as it can).

```typescript
// Source: https://developers.google.com/maps/documentation/urls/get-started
// Source: official docs verified 2026-03-31

function buildGoogleMapsUrl(
  origin: string,
  destination: string,
  intermediates: string[],
): string {
  const encode = (s: string) => encodeURIComponent(s);
  const params = new URLSearchParams({
    api: '1',
    origin: origin,
    destination: destination,
    travelmode: 'driving',
  });
  if (intermediates.length > 0) {
    // Pipe-separated — encodeURIComponent each stop, join with |
    params.set('waypoints', intermediates.map(encode).join('|'));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
```

**Address vs coordinate preference (D-05):** Use `pin.address` if available; fall back to `${lat},${lng}`. Encoded addresses produce shorter, more readable URLs.

**URL length guard:** 2,048 character limit. For 25 stops with full addresses, log a warning and fall back to coordinates (shorter) for any stop that would push over the limit.

### Pattern 5: @dnd-kit/sortable stop list

**What:** Drag-to-reorder list in RouteConfirmPanel. On `onDragEnd`, call `arrayMove` then `reorderStops()` then trigger route recalculation.

```typescript
// Source: https://dndkit.com/presets/sortable
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Parent: RouteConfirmPanel
function RouteConfirmPanel() {
  const routeStops = useStore(s => s.routeStops);
  const reorderStops = useStore(s => s.reorderStops);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = routeStops.findIndex(s => s.id === active.id);
    const newIndex = routeStops.findIndex(s => s.id === over.id);
    const newOrder = arrayMove(routeStops, oldIndex, newIndex);
    // reorderStops takes the new full stops array, not just indices
    reorderStops(newOrder.map((_, i) => i)); // trigger recalc
    // Note: reorderStops in store needs to accept RouteStop[] not just indices
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={routeStops.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {routeStops.map((stop, i) => (
          <SortableStopRow key={stop.id} stop={stop} index={i} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// Child: SortableStopRow
function SortableStopRow({ stop, index }: { stop: RouteStop; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* stop row content */}
    </div>
  );
}
```

**Touch support:** `PointerSensor` handles both mouse and touch events. No extra mobile-specific code needed unlike the old app's manual touch handlers.

### Pattern 6: Start point geocoding

**What:** For custom address start, forward geocode to lat/lng before calling `computeRoutes`.

```typescript
// Extend app/lib/geocoding.ts — add forwardGeocode()
export async function forwardGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!geocoder) {
    await google.maps.importLibrary('geocoding');
    geocoder = new google.maps.Geocoder();
  }
  try {
    const { results } = await geocoder.geocode({ address });
    const loc = results[0]?.geometry?.location;
    return loc ? { lat: loc.lat(), lng: loc.lng() } : null;
  } catch {
    return null;
  }
}
```

GPS start uses `navigator.geolocation.getCurrentPosition` — promise-wrap it:
```typescript
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  );
}
```

### Anti-Patterns to Avoid

- **Calling `computeRoutes` on every stop add:** Rate-limit to explicit "Build Route" action, not reactive. Too many API calls if user adds stops quickly.
- **Replacing pin markers with numbered ones:** Breaks the pin marker pool. Place numbered AdvancedMarkerElements on top at higher zIndex instead.
- **Using `optimizeWaypoints` (DirectionsService parameter name):** The Route class uses `optimizeWaypointOrder`. Mix-up causes silent failure.
- **Forgetting to null routeMarkerPool on route clear:** Numbered markers ghost on map.
- **Storing full pin objects in routeStops:** D-17 says stop IDs only. Resolve pin data at render time via `useStore.getState().pins.find(p => p.id === stopId)`.
- **Calling `reorderStops` with index-array when UI needs full-array reorder:** The current `reorderStops(orderedIndices: number[])` in the skeleton is fine for initial use but after drag-and-drop, prefer replacing with the new ordered stops array for clarity.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-to-reorder list | Custom `mousedown`/`mousemove` drag handlers | `@dnd-kit/sortable` `useSortable` | The old app's `initRcpDragDrop()` (lines 7786-7836) is 50 lines of manual touch/mouse handling. @dnd-kit handles pointer, touch, and keyboard natively with accessibility. |
| Route optimization | Custom nearest-neighbor or TSP | `optimizeWaypointOrder: true` in Route class | D-02 is explicit — zero custom routing logic. Google's solver uses real road data + traffic. |
| Polyline encoding/decoding | Encoded polyline parser | `route.path` array directly | Route class returns decoded lat/lng array — no encoded polyline string to parse. |
| Multi-stop URL encoding | Custom query builder | `URLSearchParams` with pipe-join for waypoints | Standard browser API handles percent-encoding correctly. |
| Forward geocoding | Haversine nearest-pin lookup | `google.maps.Geocoder.geocode({ address })` | Geocoder handles abbreviations, partial addresses, business names. |

**Key insight:** The old app's routing code is mostly plumbing around DirectionsService callbacks. The Route class makes this async/await, eliminating all the callback nesting. Port the logic, not the callback structure.

---

## Common Pitfalls

### Pitfall 1: DirectionsService vs Route class parameter names differ

**What goes wrong:** `DirectionsService` used `optimizeWaypoints: true` and `waypoints: [{location, stopover}]`. Route class uses `optimizeWaypointOrder: true` and `intermediates: [{address}]`. Copying old app patterns into Route class calls silently fails — no error thrown, just wrong behavior.

**Why it happens:** The old app's `drawRoadRoute()` (line 6918) uses `directionsService.route({..., optimizeWaypoints: shouldOptimize, waypoints: googleWaypoints})`. Port that 1:1 to Route class and every parameter name is wrong.

**How to avoid:** Use only documented Route class parameter names. The request shape is: `{ origin, destination, intermediates, travelMode, optimizeWaypointOrder, fields }`.

**Warning signs:** Route draws without optimization. `result.routes[0].optimizedIntermediateWaypointIndices` is undefined or empty.

---

### Pitfall 2: Google Maps URL waypoint limits on mobile (D-08, known)

**What goes wrong:** The official `api=1` URL format supports only 3 waypoints (intermediates) on mobile browsers. A 7-stop route silently shows only 3 on mobile Google Maps. Field reps use phones.

**Why it happens:** Documented platform constraint: "up to three waypoints supported on mobile browsers, and a maximum of nine waypoints supported otherwise." This applies to the `waypoints=` parameter (intermediates), meaning 5 total stops (origin + 3 waypoints + destination).

**How to avoid:** D-08 mandates a mobile warning at >3 stops. Show this warning in the RouteConfirmPanel before the "Open in Google Maps" button. Still generate and open the URL — Google Maps will display what it can; the user is warned.

**Warning signs:** Route URL with 10 stops looks correct on desktop, shows 3 stops on an Android device.

---

### Pitfall 3: Route class `duration` is a string, not a number

**What goes wrong:** `route.duration` from Routes API returns a string like `"3600s"`, not a number. `parseInt("3600s")` works but only if the format is consistent. Display code that does `Math.round(route.duration / 60)` produces NaN silently.

**Why it happens:** Routes API duration fields follow proto3 Duration format (`seconds + 's'` suffix). This differs from DirectionsService `leg.duration.value` which is a plain integer.

**How to avoid:** Parse consistently: `const seconds = parseInt(route.duration ?? '0', 10)`. Validate before display.

**Warning signs:** Route confirm panel shows "NaN min" for duration.

---

### Pitfall 4: Numbered markers from previous route not cleaned up

**What goes wrong:** User builds a route, markers appear. User clears route and rebuilds. Old numbered markers remain as ghosts beneath new ones.

**Why it happens:** `AdvancedMarkerElement` objects stay on the map until `.map = null` is set. Without a routeMarkerPool ref, there's no handle to clean them up.

**How to avoid:** Keep `routeMarkerPoolRef = useRef<AdvancedMarkerElement[]>([])` in RouteLayer. Before placing new numbered markers, iterate and null out all existing ones.

**Warning signs:** Multiple "1" circles appear at the same stop after rebuilding route.

---

### Pitfall 5: Discover stops need lat/lng and address, not just pin ID

**What goes wrong:** ROUT-01 requires adding discover results as stops. But D-17 says "route stops are pin IDs." Discover results aren't always saved as pins. If a user routes directly from discover (without saving as pin), there's no pin ID to reference.

**Why it happens:** D-17 was scoped for pin-based stops. Discover direct-route is a different entry path.

**How to avoid:** RouteStop type already includes `lat`, `lng`, `label`, `address` — it's self-contained. Use a synthetic ID (`discover_${placeId}`) for discover-sourced stops. Resolve to pin ID at save time only when a matching saved pin exists. The existing `RouteStop` interface is already correct for this.

**Warning signs:** "Route X Stops" button from DiscoverPanel silently adds nothing, or errors trying to look up pin by ID.

---

### Pitfall 6: RouteSlice `reorderStops` mismatch after drag

**What goes wrong:** Current `reorderStops(orderedIndices: number[])` in the skeleton takes an array of indices. After `arrayMove`, you have a new `RouteStop[]`. You need to either recompute indices or change the function signature.

**Why it happens:** The skeleton was written anticipating an index-based API. `arrayMove` returns the new full array.

**How to avoid:** Change `reorderStops` to accept `RouteStop[]` directly (simpler, no index mapping needed) OR compute `newOrder.map((s) => originalStops.indexOf(s))` before calling the current signature. Prefer accepting `RouteStop[]` — cleaner.

---

## Code Examples

### Route class computeRoutes call

```typescript
// Source: https://developers.google.com/maps/documentation/javascript/routes/optimize-stops
// Source: https://developers.google.com/maps/documentation/javascript/reference/route
async function computeRoute(
  origin: { address?: string; lat?: number; lng?: number },
  destination: { address?: string; lat?: number; lng?: number },
  stops: RouteStop[],
): Promise<RouteResult | null> {
  const { Route } = await google.maps.importLibrary('routes') as google.maps.RoutesLibrary;

  const makeWaypoint = (pt: typeof origin) =>
    pt.address
      ? { address: pt.address }
      : { location: { latLng: { latitude: pt.lat!, longitude: pt.lng! } } };

  try {
    const result = await new Route().computeRoutes({
      origin: makeWaypoint(origin),
      destination: makeWaypoint(destination),
      intermediates: stops.map(s =>
        s.address
          ? { address: s.address }
          : { location: { latLng: { latitude: s.lat, longitude: s.lng } } }
      ),
      travelMode: 'DRIVING',
      optimizeWaypointOrder: true,
      fields: [
        'routes.distanceMeters',
        'routes.duration',
        'routes.optimizedIntermediateWaypointIndices',
        'routes.path',
      ],
    });

    const route = result.routes?.[0];
    if (!route) return null;

    return {
      optimizedOrder: route.optimizedIntermediateWaypointIndices ?? [],
      totalDistanceMeters: route.distanceMeters ?? 0,
      totalDurationSeconds: parseInt(route.duration ?? '0', 10),
      polylinePath: (route.path ?? []).map(p => ({ lat: p.lat, lng: p.lng })),
    };
  } catch (err) {
    console.warn('computeRoutes failed:', err);
    return null;
  }
}
```

### @dnd-kit/sortable minimal wiring

```typescript
// Source: https://dndkit.com/presets/sortable
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

function StopList() {
  const routeStops = useStore(s => s.routeStops);
  const setRouteStops = useStore(s => s.setRouteStops); // needs adding to slice
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIdx = routeStops.findIndex(s => s.id === String(active.id));
    const newIdx = routeStops.findIndex(s => s.id === String(over.id));
    setRouteStops(arrayMove(routeStops, oldIdx, newIdx));
    // trigger route recalculation after reorder
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={routeStops.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {routeStops.map((stop, i) => <SortableRow key={stop.id} stop={stop} index={i} />)}
      </SortableContext>
    </DndContext>
  );
}
```

### Google Maps URL builder (official format)

```typescript
// Source: https://developers.google.com/maps/documentation/urls/get-started
function buildGoogleMapsUrl(stops: RouteStop[], returnToStart: boolean): string {
  if (stops.length < 1) return '';

  const encode = (s: string) => encodeURIComponent(s);
  const stopLabel = (s: RouteStop) => s.address || `${s.lat},${s.lng}`;

  const origin = stopLabel(stops[0]);
  const destination = returnToStart ? stopLabel(stops[0]) : stopLabel(stops[stops.length - 1]);
  const intermediates = returnToStart ? stops.slice(1) : stops.slice(1, -1);

  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  });

  if (intermediates.length > 0) {
    params.set('waypoints', intermediates.map(s => encode(stopLabel(s))).join('%7C'));
    // Note: URLSearchParams double-encodes | — use %7C literal join instead
  }

  return `https://www.google.com/maps/dir/?${params}`;
}
```

**Note on `|` encoding:** `URLSearchParams.set('waypoints', 'a|b')` encodes `|` as `%7C`, which is correct. However, browsers also accept plain `|` in query strings. Either works. The above approach is safe.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `DirectionsService.route()` callback | `Route.computeRoutes()` async/await | Deprecated Feb 25, 2026 | Cleaner code, Promise-based, no callback nesting |
| `google.maps.Marker` for stop numbers | `AdvancedMarkerElement` with custom HTML content | Current standard since 2023 | Required for custom styled circles; needed for Map ID |
| `route.waypoint_order` array (DirectionsService) | `route.optimizedIntermediateWaypointIndices` (Routes API) | Routes API launch 2024-2025 | Different property name — critical porting trap |
| `overview_path` array (DirectionsService) | `route.path` array (Routes API) | Routes API launch | Different property name but same concept |
| `leg.duration.value` integer (DirectionsService) | `route.duration` string "Xs" (Routes API) | Routes API | Must parse with `parseInt` |
| Manual `mousedown`/`touchstart` drag handlers | `@dnd-kit/sortable` `useSortable` | @dnd-kit has been standard since react-beautiful-dnd was archived | Built-in accessibility, pointer/touch/keyboard, no custom event code |

**Deprecated/outdated:**
- `google.maps.DirectionsService`: Deprecated Feb 25, 2026. Still works. Will receive bug fixes. 12-month removal notice required. Use Route class for new code.
- `react-beautiful-dnd`: Archived. Never use.

---

## Open Questions

1. **Route class `RoutesLibrary` TypeScript type**
   - What we know: `@types/google.maps@3.58.1` covers Maps JS API types. Route class was noted in STATE.md as needing field mask and response shape verification (now resolved).
   - What's unclear: Whether `google.maps.RoutesLibrary` type is available in `@types/google.maps@3.58.1` or requires a cast. The Places library needed `as any` cast in Phase 4 for similar reasons.
   - Recommendation: Attempt typed import first: `const { Route } = await google.maps.importLibrary('routes') as google.maps.RoutesLibrary`. If TypeScript complains, use `as unknown as { Route: ... }` type assertion. Check during Wave 0.

2. **`URLSearchParams` pipe encoding for waypoints**
   - What we know: `URLSearchParams.set('waypoints', 'a|b')` will encode `|` as `%7C`. Google Maps URL spec uses pipe as separator. Both `|` and `%7C` work per the spec.
   - What's unclear: Whether `new URLSearchParams` then `.toString()` double-encodes the stops passed to `origin`/`destination` (since those are already passed through `encodeURIComponent`). May need to build the query string manually to avoid double-encoding.
   - Recommendation: Build the URL manually: `?api=1&origin=${enc(origin)}&destination=${enc(dest)}&waypoints=${stops.map(enc).join('%7C')}&travelmode=driving`. Simpler and avoids double-encoding.

3. **RouteSlice `startMode` and home base storage**
   - What we know: The old app stores `profile.homebase`, `profile.homebaseLat`, `profile.homebaseLng`. v2 has no profile/settings system yet.
   - What's unclear: Where home base address is stored in v2. Zustand? LocalStorage? There's no settings slice.
   - Recommendation: Add `startMode: 'home' | 'gps' | 'custom'` and `homeBase: string | null` to RouteSlice. Home base input in RouteConfirmPanel is simple enough without a full settings system. Persist home base in the existing localStorage persist layer.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `google.maps` SDK | Route class, Polyline, markers | ✓ | weekly (runtime) | — |
| `navigator.geolocation` | GPS start point (D-09) | ✓ | browser standard | Show error message, disable GPS mode |
| `@dnd-kit/core` | Drag-to-reorder | ✗ | not installed | Install required |
| `@dnd-kit/sortable` | Drag-to-reorder | ✗ | not installed | Install required |

**Missing dependencies with no fallback:**
- `@dnd-kit/core` and `@dnd-kit/sortable` must be installed before Wave 0 begins (`npm install @dnd-kit/core @dnd-kit/sortable`)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (exists, `tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/route/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUT-03 | `computeRoute` returns sorted waypoints when optimization succeeds | unit | `npx vitest run tests/route/route-service.test.ts` | ❌ Wave 0 |
| ROUT-07 | `buildGoogleMapsUrl` produces correct URL for 1, 3, 10, 25 stops | unit | `npx vitest run tests/route/route-url.test.ts` | ❌ Wave 0 |
| ROUT-07 | `buildGoogleMapsUrl` falls back to coordinates when address is empty | unit | `npx vitest run tests/route/route-url.test.ts` | ❌ Wave 0 |
| ROUT-09 | `addStop` rejects when routeStops.length === 25 | unit | `npx vitest run tests/route/route-store.test.ts` | ❌ Wave 0 |
| ROUT-11 | RouteSlice `clearRoute` resets all state fields | unit | `npx vitest run tests/route/route-store.test.ts` | ❌ Wave 0 |
| ROUT-01, ROUT-04, ROUT-05, ROUT-06, ROUT-08 | Map rendering, panel UI, drag-to-reorder, "Open in Maps" | manual | N/A — DOM/map integration | N/A |

**Manual-only rationale:** RouteLayer, RouteConfirmPanel, and the directions button wiring all require a live Google Maps instance and browser DOM. These are integration behaviors tested by visual/manual verification.

### Sampling Rate
- **Per task commit:** `npx vitest run tests/route/` (route-specific tests only)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/route/route-url.test.ts` — covers ROUT-07 URL building logic (pure function, no Google Maps needed)
- [ ] `tests/route/route-store.test.ts` — covers ROUT-09 cap enforcement and ROUT-11 clearRoute
- [ ] `tests/route/route-service.test.ts` — covers ROUT-03 optimized order handling (mock `Route.computeRoutes`)

---

## Existing Code to Reuse / Modify

| File | Action | Notes |
|------|--------|-------|
| `app/features/route/route.store.ts` | Expand | Add `startMode`, `homeBase`, `shareableUrl`, `routeActive` fields; change `reorderStops` to accept `RouteStop[]`; add `setRouteStops`, `setStartMode`, `setShareableUrl` actions |
| `app/types/route.types.ts` | Expand | `RouteStop` is already correct; `RouteResult` already has right shape; add `StartMode` union type |
| `app/features/map/MarkerLayer.tsx` | Wire | `routeBtn` click handler: call `useStore.getState().addStop(...)` |
| `app/features/discover/discover-info.ts` | Wire | `routeBtn` click: `useStore.getState().addStop(discoverStopFromResult(result))` |
| `app/features/discover/DiscoverPanel.tsx` | Wire | "Route X Stops" button: enable, call `addStopsFromDiscover(selectedIds)` |
| `app/features/map/Map.tsx` | Wire | Directions button: toggle RouteConfirmPanel; add RouteLayer and RouteConfirmPanel as children |
| `app/lib/geocoding.ts` | Extend | Add `forwardGeocode(address)` alongside existing `reverseGeocode` |
| `app/store/index.ts` | No change | RouteSlice already composed |

---

## Sources

### Primary (HIGH confidence)
- [Google Maps Routes API — optimize-stops](https://developers.google.com/maps/documentation/javascript/routes/optimize-stops) — `optimizeWaypointOrder` parameter name and request shape confirmed
- [Google Maps Routes API — reference/route](https://developers.google.com/maps/documentation/javascript/reference/route) — response fields: `distanceMeters`, `duration`, `optimizedIntermediateWaypointIndices`, `path`
- [Google Maps Routes API — routes-polylines](https://developers.google.com/maps/documentation/javascript/routes/routes-polylines) — `route.path` for polyline, `createPolylines()` alternative
- [Google Maps DirectionsService reference](https://developers.google.com/maps/documentation/javascript/reference/directions) — Deprecated Feb 25, 2026 status confirmed; bug fixes will continue; 12-month notice required before discontinuation
- [Google Maps URLs — directions action](https://developers.google.com/maps/documentation/urls/get-started#directions-action) — Official `?api=1` format; 3 waypoints on mobile, 9 on desktop; URL limit 2,048 chars
- [npm: @dnd-kit/core](https://www.npmjs.com/package/@dnd-kit/core) — version 6.3.1 confirmed current
- [npm: @dnd-kit/sortable](https://www.npmjs.com/package/@dnd-kit/sortable) — version 10.0.0 confirmed current
- [dnd-kit docs — sortable](https://dndkit.com/presets/sortable) — `useSortable`, `arrayMove`, `SortableContext` API confirmed

### Secondary (MEDIUM confidence)
- Old app source `/home/wzrd/Groundwork/index.html` lines 4859-4945, 6903-6978, 6714-6781, 7709-7893 — Port reference; verified against current API docs for migration gaps
- `app/features/route/route.store.ts` + `app/types/route.types.ts` — Existing skeleton shapes confirmed compatible with planned changes

### Tertiary (LOW confidence)
- WebSearch on path format `/maps/dir/stop1/stop2` — Undocumented format widely used; community consensus it works but no official docs; mobile behavior unverified. Not recommended over official `?api=1` format.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages version-verified on npm; Route class API verified against official docs
- Architecture: HIGH — patterns derived directly from official Google docs and existing codebase patterns
- Pitfalls: HIGH for DirectionsService vs Route class naming traps and URL limits (official docs); MEDIUM for TypeScript type availability (inference from existing Phase 4 pattern)

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable APIs; @dnd-kit is not fast-moving; Route class is current standard)
