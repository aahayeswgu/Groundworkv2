# Architecture Research

**Domain:** Map-centric field sales CRM (Next.js 16 App Router)
**Researched:** 2026-03-31
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        app/page.tsx (Server)                         │
│              Composes shell — no state, no interactivity             │
├───────────────────────┬─────────────────────────────────────────────┤
│   app/components/     │         app/features/map/                    │
│   Sidebar.tsx         │         Map.tsx (Client)                     │
│   (Client)            │         ┌──────────────────────────────┐     │
│   ┌────────────────┐  │         │  google.maps.Map instance    │     │
│   │  PinList       │  │         │  AdvancedMarkerElement pool  │     │
│   │  Planner       │  │         │  Rectangle overlay           │     │
│   │  FilterChips   │  │         │  Route polyline              │     │
│   └───────┬────────┘  │         └──────────────────────────────┘     │
│           │           │                      │                       │
├───────────┴───────────┴──────────────────────┴───────────────────────┤
│                      Global State Layer (Zustand)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  pins slice  │  │ discover slice│  │  route slice │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│                        Service Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ supabase.ts  │  │  places.ts   │  │ directions.ts│               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│                        External APIs                                  │
│  Supabase          Google Places API      Google Directions API      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `app/page.tsx` | Server shell — assembles Sidebar + Map + MobileBottomBar | Nothing; pure composition |
| `app/components/Sidebar.tsx` | Tab container: Pins tab + Planner tab; collapse toggle | Zustand store (read/write) |
| `app/features/pins/PinList.tsx` | Filtered/grouped list of pins, hover sync, fly-to | pins slice |
| `app/features/pins/PinPanel.tsx` | Create/edit/delete form panel (slides in over sidebar) | pins slice, map ref (for reverse geocode) |
| `app/features/map/Map.tsx` | Map canvas, marker pool, mode controller, floating buttons | All slices via hooks; map instance ref shared via context |
| `app/features/map/MarkerLayer.tsx` | Manages AdvancedMarkerElement lifecycle — creates, updates, removes | pins slice, discover slice |
| `app/features/discover/DiscoverOverlay.tsx` | Draw-to-search rectangle, Places API calls, results list | discover slice, map instance |
| `app/features/discover/DiscoverPanel.tsx` | Results list with checkboxes, info bubbles, quick-save | discover slice, pins slice |
| `app/features/route/RoutePlanner.tsx` | Stop reordering, start point, optimize, share | route slice, directions service |
| `app/features/route/RouteLayer.tsx` | Orange polyline + numbered stop markers on map | route slice, map instance |
| `app/lib/supabase.ts` | Supabase client singleton, typed CRUD, debounced sync | Called by pins slice actions |
| `app/lib/places.ts` | Wraps PlacesService, deduplication, exclusion filters | Called by discover slice actions |
| `app/lib/directions.ts` | Wraps DirectionsService, builds shareable URLs | Called by route slice actions |
| `app/config/queries.ts` | Industry-specific search query list (swappable) | discover slice reads on init |

## Recommended Project Structure

```
app/
├── page.tsx                      # Server component — composes shell
├── layout.tsx                    # Root HTML, fonts, global CSS
├── globals.css                   # Theme variables, Tailwind @theme
│
├── components/                   # Shared cross-feature UI
│   ├── Sidebar.tsx               # Tab container + collapse
│   ├── MobileBottomBar.tsx       # Mobile nav
│   └── MapButton.tsx             # Extracted from Map.tsx — reusable FAB
│
├── features/
│   ├── map/
│   │   ├── Map.tsx               # Map canvas + mode controller + floating buttons
│   │   ├── MarkerLayer.tsx       # Imperative AdvancedMarkerElement management
│   │   ├── RouteLayer.tsx        # Polyline + numbered waypoint markers
│   │   ├── map-styles.ts         # Theme → Google Maps style array
│   │   └── MapContext.ts         # React context exposing map instance ref
│   │
│   ├── pins/
│   │   ├── PinList.tsx           # Filtered list in sidebar
│   │   ├── PinListItem.tsx       # Single row with hover/click handlers
│   │   ├── PinPanel.tsx          # Create/edit slide-in form
│   │   ├── PinInfoWindow.tsx     # Marker click popup
│   │   ├── usePins.ts            # Hook wrapping pins slice
│   │   ├── pins.store.ts         # Zustand slice (pins state + actions)
│   │   └── pins.types.ts         # Pin, PinStatus, etc.
│   │
│   ├── discover/
│   │   ├── DiscoverOverlay.tsx   # Rectangle draw mode on map
│   │   ├── DiscoverPanel.tsx     # Results list (sidebar tab or drawer)
│   │   ├── DiscoverInfoBubble.tsx# Marker hover/click popup
│   │   ├── useDiscover.ts        # Hook wrapping discover slice
│   │   ├── discover.store.ts     # Zustand slice
│   │   └── discover.types.ts     # DiscoverResult, etc.
│   │
│   └── route/
│       ├── RoutePlanner.tsx      # Stop list, reorder, optimize, share
│       ├── useRoute.ts           # Hook wrapping route slice
│       ├── route.store.ts        # Zustand slice
│       └── route.types.ts        # Stop, RouteResult, etc.
│
├── store/
│   └── index.ts                  # Combines slices into single Zustand store
│
├── lib/
│   ├── supabase.ts               # Supabase client + typed CRUD
│   ├── places.ts                 # Places API wrapper + dedup + filters
│   ├── directions.ts             # Directions API wrapper + URL builder
│   └── geocoding.ts             # Reverse geocode utility
│
└── config/
    └── queries.ts                # Industry search queries (fork point)
```

### Structure Rationale

- **features/**: Each folder is a self-contained domain. The fork-friendly goal is served by keeping industry-specific logic in `config/` and feature behavior in each slice — a different industry swaps `config/queries.ts` and potentially `discover.types.ts`.
- **store/**: Combining slices at one entry point keeps imports clean. Slices stay in their feature folder for co-location with related components.
- **lib/**: Pure service wrappers with no React dependencies. Testable in isolation. Called by Zustand actions, not by components directly.
- **MapContext.ts**: Exposes the map instance to sub-features without prop drilling. The `Map` component owns initialization and publishes the instance via context.

## Architectural Patterns

### Pattern 1: Map Instance via React Context

**What:** `Map.tsx` holds the `google.maps.Map` ref and publishes it through a `MapContext`. Sub-features (`MarkerLayer`, `DiscoverOverlay`, `RouteLayer`) consume the context to access the imperative API.

**When to use:** Any component that needs to call methods on the map instance directly — adding markers, fitting bounds, panning, attaching event listeners.

**Trade-offs:** Keeps `Map.tsx` as the single owner of initialization while preventing prop-drilling across sibling trees. The context value is a ref (stable), not a state value, so consumers do not re-render when the map moves.

```typescript
// app/features/map/MapContext.ts
import { createContext, useContext } from "react";

export const MapContext = createContext<google.maps.Map | null>(null);

export function useMapInstance() {
  const map = useContext(MapContext);
  if (!map) throw new Error("useMapInstance must be used inside MapProvider");
  return map;
}

// In Map.tsx, after initialization:
// <MapContext.Provider value={mapInstance.current}>
//   <MarkerLayer />
//   <DiscoverOverlay />
//   <RouteLayer />
// </MapContext.Provider>
```

### Pattern 2: Zustand Slices per Feature

**What:** Each feature owns a Zustand slice that contains its state shape and all actions. The root store in `store/index.ts` composes slices with `create()`.

**When to use:** Any state that must be shared between the map canvas and the sidebar (pins, discover results, route stops). Local UI state (panel open/closed, hover row) stays in `useState` within the component.

**Trade-offs:** Keeps feature state co-located with feature code. Avoids a god-store that every feature imports from. The downside is slightly more boilerplate in `store/index.ts` when adding a new feature.

```typescript
// app/features/pins/pins.store.ts
import { StateCreator } from "zustand";
import { Pin } from "./pins.types";

export interface PinsSlice {
  pins: Pin[];
  selectedPinId: string | null;
  hoveredPinId: string | null;
  addPin: (pin: Pin) => void;
  updatePin: (id: string, patch: Partial<Pin>) => void;
  deletePin: (id: string) => void;
  selectPin: (id: string | null) => void;
  hoverPin: (id: string | null) => void;
}

export const createPinsSlice: StateCreator<PinsSlice> = (set) => ({
  pins: [],
  selectedPinId: null,
  hoveredPinId: null,
  addPin: (pin) => set((s) => ({ pins: [...s.pins, pin] })),
  updatePin: (id, patch) =>
    set((s) => ({ pins: s.pins.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  deletePin: (id) => set((s) => ({ pins: s.pins.filter((p) => p.id !== id) })),
  selectPin: (id) => set({ selectedPinId: id }),
  hoverPin: (id) => set({ hoveredPinId: id }),
});

// app/store/index.ts
import { create } from "zustand";
import { createPinsSlice, PinsSlice } from "../features/pins/pins.store";
import { createDiscoverSlice, DiscoverSlice } from "../features/discover/discover.store";
import { createRouteSlice, RouteSlice } from "../features/route/route.store";

type AppStore = PinsSlice & DiscoverSlice & RouteSlice;
export const useStore = create<AppStore>((...a) => ({
  ...createPinsSlice(...a),
  ...createDiscoverSlice(...a),
  ...createRouteSlice(...a),
}));
```

### Pattern 3: Imperative Marker Pool

**What:** `MarkerLayer` maintains a `Map<string, google.maps.marker.AdvancedMarkerElement>` keyed by pin ID. On each render (triggered by pins slice changes), it diffs the current marker pool against the new pins array — creating, updating, or removing `AdvancedMarkerElement` instances imperatively.

**When to use:** Managing Google Maps markers in React. The Maps JS API is fully imperative; wrapping it in declarative React state via this pattern prevents marker flicker and unnecessary DOM re-creation.

**Trade-offs:** More explicit than a declarative wrapper library, but directly matches how the Maps API works. Avoids the overhead of `@react-google-maps/api` or `@vis.gl/react-google-maps` since the codebase already uses `@googlemaps/js-api-loader` directly.

**Important:** `google.maps.Marker` is deprecated as of February 2024 (v3.56). Use `google.maps.marker.AdvancedMarkerElement` exclusively. Requires a `mapId` on the map initialization options.

```typescript
// app/features/map/MarkerLayer.tsx (sketch)
import { useEffect, useRef } from "react";
import { useStore } from "../../store";
import { useMapInstance } from "./MapContext";

export function MarkerLayer() {
  const map = useMapInstance();
  const pins = useStore((s) => s.pins);
  const hoveredPinId = useStore((s) => s.hoveredPinId);
  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  useEffect(() => {
    // Sync pool with current pins array
    const currentIds = new Set(pins.map((p) => p.id));
    // Remove stale
    for (const [id, marker] of markerPool.current) {
      if (!currentIds.has(id)) { marker.map = null; markerPool.current.delete(id); }
    }
    // Create or update
    for (const pin of pins) {
      // ...create AdvancedMarkerElement with custom SVG content per status
    }
  }, [pins, map]);

  useEffect(() => {
    // Update hover visual without recreating markers
    for (const [id, marker] of markerPool.current) {
      (marker.content as HTMLElement)?.classList.toggle("hovered", id === hoveredPinId);
    }
  }, [hoveredPinId]);

  return null; // Pure side-effect component
}
```

### Pattern 4: Manual Rectangle Draw (DrawingManager Replacement)

**What:** Implement click-drag rectangle drawing manually using Google Maps mouse events (`mousedown`, `mousemove`, `mouseup` on the map instance) plus a `google.maps.Rectangle` overlay. This replaces the deprecated DrawingManager (deprecated August 2025, removed May 2026).

**When to use:** The draw-to-search feature. The user holds the Discover button to enter draw mode, then click-drags to define the search area.

**Trade-offs:** More code than DrawingManager but not complex. Avoids a dependency on deprecated API. The rectangle shape itself is non-deprecated.

```typescript
// Sketch of draw mode in DiscoverOverlay.tsx
function startDraw(map: google.maps.Map, onComplete: (bounds: google.maps.LatLngBounds) => void) {
  let startLatLng: google.maps.LatLng | null = null;
  let rect: google.maps.Rectangle | null = null;

  const down = map.addListener("mousedown", (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    startLatLng = e.latLng;
    map.set("draggable", false); // prevent map pan during draw
  });

  const move = map.addListener("mousemove", (e: google.maps.MapMouseEvent) => {
    if (!startLatLng || !e.latLng) return;
    const bounds = new google.maps.LatLngBounds(startLatLng, e.latLng);
    if (!rect) {
      rect = new google.maps.Rectangle({ map, bounds, strokeColor: "#D4712A", fillOpacity: 0.08 });
    } else {
      rect.setBounds(bounds);
    }
  });

  const up = map.addListener("mouseup", () => {
    google.maps.event.removeListener(down);
    google.maps.event.removeListener(move);
    google.maps.event.removeListener(up);
    map.set("draggable", true);
    if (rect) onComplete(rect.getBounds()!);
  });
}
```

### Pattern 5: LocalStorage + Supabase Debounced Sync

**What:** Pins are written to `localStorage` immediately (synchronous, instant). A debounced effect (500ms) triggers a Supabase upsert after write activity settles. On load, hydrate from Supabase if available, fall back to localStorage.

**When to use:** All pin mutations. This gives offline-first behaviour with eventual cloud persistence — the same pattern as the original monolith.

**Trade-offs:** Two sources of truth require a clear authority order (Supabase wins on hydration, localStorage wins during session). Simple to implement; no sync conflict resolution needed for single-user use.

## Data Flow

### Pin Creation Flow

```
User clicks "drop pin" button
    ↓
Map.tsx enters PLACE_PIN mode (local useState)
    ↓
Map click event fires → LatLng captured
    ↓
Reverse geocode via lib/geocoding.ts
    ↓
PinPanel.tsx opens with pre-filled address
    ↓
User fills form, hits Save
    ↓
pins slice: addPin() → updates pins[]
    ↓
    ├── localStorage write (immediate)
    ├── supabase.ts debounced upsert (500ms)
    └── MarkerLayer re-runs useEffect → creates AdvancedMarkerElement
         → PinList re-renders with new item
```

### Map ↔ Sidebar Hover Sync Flow

```
User hovers PinListItem in sidebar
    ↓
PinListItem calls hoverPin(id) on pins slice
    ↓
MarkerLayer useEffect [hoveredPinId] fires
    ↓
Marker content element gets .hovered CSS class → visual highlight

User hovers AdvancedMarkerElement on map
    ↓
Marker's DOM mouseover event calls hoverPin(id)
    ↓
PinListItem receives hoveredPinId === id → highlight class
```

### Discover Flow

```
User enters draw mode → drags rectangle on map
    ↓
DiscoverOverlay: onComplete(bounds) fires
    ↓
discover slice: setActiveBounds(bounds), setStatus("loading")
    ↓
lib/places.ts: runs configurable query list against bounds
    PlacesService.nearbySearch() × N queries (sequential, rate-limited)
    Dedup by place_id + normalized name + coordinate proximity
    Filter: exclude residential, chains, irrelevant types
    ↓
discover slice: setResults(deduped[]) → status: "done"
    ↓
DiscoverPanel renders results
MarkerLayer renders orange discover markers within bounds
```

### Route Build Flow

```
User adds pins/discovered businesses to route
    ↓
route slice: addStop(pin or discoverResult)
    ↓
RoutePlanner panel shows stop list
    ↓
User hits Optimize
    ↓
lib/directions.ts: DirectionsService.route({ optimizeWaypoints: true })
    → Returns DirectionsResult with waypoint_order[]
    ↓
route slice: reorderStops(waypoint_order), setRouteResult(result)
    ↓
RouteLayer renders orange polyline + numbered stop markers
RoutePlanner shows reordered list, distance, time
    ↓
User hits Share
    ↓
lib/directions.ts: buildGoogleMapsUrl(stops)
    Prefer address strings; fall back to lat,lng
    Format: https://www.google.com/maps/dir/?api=1&origin=...&waypoints=...&destination=...
    ↓
URL copied to clipboard or opened directly
```

### State Management Summary

```
Local useState (component-internal)
  - Map interaction mode (IDLE | PLACE_PIN | DRAW | ROUTE_ADD)
  - Panel open/closed
  - Hover on individual DOM elements

Zustand store (cross-component shared)
  - pins[]         → PinList, MarkerLayer, RoutePlanner, PinPanel
  - hoveredPinId   → PinList, MarkerLayer
  - selectedPinId  → PinPanel, MarkerLayer (info window)
  - discoverResults[], activeBounds   → DiscoverPanel, MarkerLayer
  - route stops[], routeResult        → RoutePlanner, RouteLayer

DOM attribute (not React state)
  - data-theme on <body>  → CSS custom properties + map styles
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user, ~500 pins | Current design is fine. localStorage + Supabase sync handles it. |
| Multi-user SaaS (future) | Add auth, namespace Supabase rows by user_id, add Row Level Security |
| >500 pins in view | Add marker clustering via `@googlemaps/markerclusterer`; store pins in Supabase only, paginate sidebar list |
| Multi-industry forks | Swap `config/queries.ts` and `pins.types.ts` (status set). No structural change needed. |

## Anti-Patterns

### Anti-Pattern 1: Storing Map State in React State

**What people do:** `const [markers, setMarkers] = useState([])` and recreate `google.maps.Marker` instances on every render.

**Why it's wrong:** The Maps API is imperative. React re-renders will destroy and recreate marker DOM nodes causing flicker, animation breakage, and performance issues with 50+ markers.

**Do this instead:** Keep markers in a `useRef<Map<string, AdvancedMarkerElement>>` (the marker pool pattern). React state only drives *what* should exist; the pool handles *how* it exists on the map.

### Anti-Pattern 2: Calling Places API from Components

**What people do:** Trigger `PlacesService.nearbySearch()` directly inside a React component's event handler.

**Why it's wrong:** Places API calls are async and stateful. Running them in components couples UI rendering to API timing and makes retry/dedup logic messy.

**Do this instead:** Place all API calls in `lib/places.ts`. Zustand actions call the lib function and update state. Components only dispatch actions and read state.

### Anti-Pattern 3: Using `@react-google-maps/api` on Top of `@googlemaps/js-api-loader`

**What people do:** Import a React wrapper library when the bare loader is already initialized.

**Why it's wrong:** Both libraries manage the Maps JS API bootstrap. Running them together causes double-loading, version conflicts, and harder-to-trace initialization races.

**Do this instead:** Since the app already uses `@googlemaps/js-api-loader` with `importLibrary()`, continue that pattern. Implement the map instance context and marker pool manually — the code is small and avoids the wrapper overhead entirely.

### Anti-Pattern 4: Using DrawingManager for the Discover Rectangle

**What people do:** Load the `drawing` library and use `google.maps.drawing.DrawingManager`.

**Why it's wrong:** The Drawing Library was deprecated in August 2025 and will be removed in May 2026. Building on it now requires a migration under deadline.

**Do this instead:** Implement the rectangle with `mousedown/mousemove/mouseup` events on the map instance plus a `google.maps.Rectangle` overlay (not deprecated). The manual implementation is ~40 lines and avoids the library entirely.

### Anti-Pattern 5: One Monolithic Sidebar Component

**What people do:** Put pin list, planner, discover results, and filter controls all inside `Sidebar.tsx`.

**Why it's wrong:** Sidebar becomes the god component — every feature imports and re-renders from it. Impossible to extract features for the fork-friendly goal.

**Do this instead:** `Sidebar.tsx` is a container that renders `<PinList />` or `<RoutePlanner />` depending on the active tab. Each feature owns its own panel component.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Maps JS API | `@googlemaps/js-api-loader` `importLibrary()` in `Map.tsx` `useEffect` | Load `maps`, `places`, `geometry`, `marker` libraries. Requires `mapId` for AdvancedMarkerElement. |
| Google Places API | `google.maps.places.PlacesService` in `lib/places.ts` | Use `nearbySearch()` with bounds constraint. Rate-limit sequential queries; Places API has QPS limits. |
| Google Directions API | `google.maps.DirectionsService` in `lib/directions.ts` | `optimizeWaypoints: true` bills at higher rate; cap at 25 stops (23 waypoints + origin + destination). |
| Supabase | Supabase JS client in `lib/supabase.ts` | Debounced upsert after pin mutations. No auth for v1; add RLS when auth is introduced. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Map ↔ Sidebar | Zustand store (shared slices) | No direct prop passing between Map and Sidebar. Both read/write store. |
| Map canvas ↔ feature layers | React Context (map instance) | MarkerLayer, RouteLayer, DiscoverOverlay consume `useMapInstance()`. |
| Feature components ↔ external APIs | Zustand actions → lib functions | Components never call APIs directly. |
| Pins feature ↔ Discover feature | Zustand store (`addPin` from discover) | Quick-save from discover calls `addPin` from pins slice. |
| Pins feature ↔ Route feature | Zustand store (`addStop` accepts Pin) | Route planner reads pins array to offer them as stops. |

## Build Order (Phase Dependencies)

The recommended implementation sequence based on dependency graph:

1. **MapContext + map instance ref** — everything else depends on having a stable map reference.
2. **Zustand store skeleton** — create empty slices early; components can be wired before actions are full.
3. **Pin CRUD + MarkerLayer** — core value. PinPanel, PinList, localStorage persistence, AdvancedMarkerElement pool.
4. **Supabase sync** — add after local CRUD works. Isolates persistence bugs from UI bugs.
5. **Discover / draw-to-search** — depends on map context (for rectangle) and pins slice (for quick-save).
6. **Route planner + RouteLayer** — depends on pins (stop source) and Directions API wrapper.
7. **Sidebar tab switching + mobile** — wiring existing tab buttons to show/hide feature panels.

## Sources

- Google Maps AdvancedMarkerElement migration: https://developers.google.com/maps/documentation/javascript/advanced-markers/migration
- Google Maps Drawing Library deprecation notice: https://developers.google.com/maps/documentation/javascript/drawinglayer
- Google Directions API with optimizeWaypoints: https://developers.google.com/maps/documentation/javascript/legacy/directions
- Zustand slices pattern: https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern
- React + Google Maps imperative pattern: https://medium.com/@johnmarkredding/declarative-meets-imperative-blending-react-google-maps-a4a775b7b2c5
- Google Maps Directions waypoints: https://developers.google.com/maps/documentation/javascript/examples/directions-waypoints
- Zustand with Next.js App Router: https://www.dimasroger.com/blog/how-to-use-zustand-with-next-js-15

---

*Architecture research for: Map-centric field sales CRM (Groundwork v2)*
*Researched: 2026-03-31*
