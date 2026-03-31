# Stack Research

**Domain:** Map-centric field sales CRM — pin management, Google Places discovery, route optimization
**Researched:** 2026-03-31
**Confidence:** HIGH (core libraries verified against official docs and npm; versions spot-checked)

---

## Context: What Already Exists

The app has a working foundation. This research covers only the additions needed for the three
feature areas being built this milestone.

| Already Installed | Version | Notes |
|---|---|---|
| `next` | 16.2.1 | App Router, `"use client"` boundary pattern in use |
| `react` / `react-dom` | 19.2.4 | React 19 — state management must be compatible |
| `tailwindcss` | ^4 | CSS custom properties via `@theme inline` |
| `@googlemaps/js-api-loader` | ^2.0.2 | `importLibrary()` pattern already in use |
| `@types/google.maps` | ^3.58.1 | Maps types already present |

---

## Recommended Additions

### Core: Supabase Backend

| Technology | Version | Purpose | Why Recommended |
|---|---|---|---|
| `@supabase/supabase-js` | ^2.101.1 | Database CRUD, Realtime, Storage | Only client needed — auth is out of scope for this milestone, so `@supabase/ssr` is unnecessary overhead. Direct client with anon key is correct for the localStorage + cloud sync pattern described in PROJECT.md. |

**Install:**
```bash
npm install @supabase/supabase-js
```

**Why NOT `@supabase/ssr`:** That package exists to manage cookie-based auth sessions in Next.js server components. Since auth is explicitly out of scope (`PROJECT.md` → Out of Scope), using `@supabase/ssr` adds complexity (middleware, server client, browser client split) with zero benefit right now. Add it when auth is introduced.

**Environment variables needed:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

### Core: Global State Management

| Technology | Version | Purpose | Why Recommended |
|---|---|---|---|
| `zustand` | ^5.0.12 | Cross-feature shared state (pins, discover results, route stops, UI modes) | Smallest bundle (1.1 KB gzip), dead simple API, React 19 / `useSyncExternalStore` native in v5, no boilerplate. The app needs multiple features (pins, discover, route) to share state — component prop drilling won't scale. Zustand's slice pattern keeps feature state isolated while making cross-feature reads cheap. |

**Install:**
```bash
npm install zustand
```

**Why NOT React Context:** Context re-renders the entire subtree on every change. Pin list has potentially hundreds of items; discover results have up to ~200 items from multiple queries. Context would cause map re-renders on every list hover — unacceptable. Zustand subscriptions are selector-based.

**Why NOT Jotai:** Atomic model adds indirection that doesn't match this app's shape. The state here is a few well-defined global slices (pinsStore, discoverStore, routeStore, mapModeStore), not fine-grained independent atoms.

**Recommended store structure:**
```
app/stores/
  pins.store.ts        — pins[], selectedPinId, filterStatus, searchQuery
  discover.store.ts    — results[], selectedIds, isDrawing, drawBounds
  route.store.ts       — stops[], optimizedOrder, routePolyline
  map-mode.store.ts    — activeMode (pin|discover|route|view)
```

---

### Core: Places API (New) via `importLibrary`

No new npm package needed. `@googlemaps/js-api-loader` already loads the Google Maps JS API, and the **Places (New)** library is loaded dynamically via the existing `importLibrary()` pattern.

**Verified API pattern (from official docs, HIGH confidence):**
```typescript
const { Place } = await google.maps.importLibrary('places');

// Text search (for discover queries by category)
const { places } = await Place.searchByText({
  textQuery: 'roofing contractor',
  fields: ['displayName', 'location', 'formattedAddress', 'types',
           'businessStatus', 'rating', 'photos', 'id'],
  locationRestriction: {
    // LatLngBoundsLiteral — the drawn rectangle from discover feature
    low: { lat: swLat, lng: swLng },
    high: { lat: neLat, lng: neLng },
  },
  maxResultCount: 20,
});
```

**Why Places (New) over legacy `PlacesService`:**
- Legacy `PlacesService` is explicitly marked "Legacy status" in Google docs as of 2025
- `Place.searchByText` and `Place.searchNearby` support Promise/async natively — no callback hell
- `locationRestriction` with rectangle bounds is directly supported (critical for draw-to-search)
- `locationRestriction` enforces strict bounds (results only within the rectangle), matching the PROJECT.md requirement for "Strict bounds filtering"

**`@types/google.maps` already covers Places (New)** — no additional type package needed.

---

### Core: Route Optimization via Route Class (New)

No new npm package needed. The **Route class** in Maps JavaScript API is the client-side equivalent of the Routes REST API, loaded via `importLibrary`.

**API pattern (from official docs, HIGH confidence):**
```typescript
const { Route } = await google.maps.importLibrary('routes');

const result = await new Route().computeRoutes({
  origin: { address: startAddress },
  destination: { address: endAddress },
  intermediates: stops.map(s => ({ address: s.address })),
  travelMode: 'DRIVING',
  optimizeWaypointOrder: true,
  fields: ['routes.legs', 'routes.optimizedIntermediateWaypointIndices',
           'routes.duration', 'routes.distanceMeters'],
});
// Optimized order in: result.routes[0].optimizedIntermediateWaypointIndices
```

**Why Route class (New) over `DirectionsService` (legacy):**
- `google.maps.DirectionsService` was marked deprecated February 25, 2026 (official docs confirmed)
- Route class is the current recommended client-side routing API
- `optimizeWaypointOrder: true` is directly supported — Google's TSP solver handles the 25-waypoint optimization required by PROJECT.md
- Returns `optimizedIntermediateWaypointIndices` array to rebuild the confirmed stop order in the UI

**25-waypoint cap:** The Routes API supports up to 25 stopovers when using `optimizeWaypointOrder`. This exactly matches the PROJECT.md constraint. No special handling needed.

---

### Core: AdvancedMarkerElement (already available via `importLibrary`)

No new npm package needed. `AdvancedMarkerElement` and `PinElement` are loaded via `importLibrary('marker')`.

**Required: Map ID**

Advanced markers require a Map ID. The app must provide one when creating the `Map` instance:
```typescript
const map = new google.maps.Map(el, {
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,  // add to .env.local
  // ... other options
});
```

`DEMO_MAP_ID` can be used for development. A production Map ID is created in Google Cloud Console.

**Why use `AdvancedMarkerElement` over legacy `Marker`:**
- `google.maps.Marker` is not officially deprecated on a fixed timeline, but `AdvancedMarkerElement` is the current standard
- Status-colored SVG markers (Prospect/Active/Follow-Up/Lost) require custom HTML content — `AdvancedMarkerElement` accepts a `content` DOM element directly, making this clean
- Discover markers (orange/green/yellow states) need programmatic style switching — `AdvancedMarkerElement.content` is mutable after creation
- `PinElement` provides the built-in teardrop shape if custom SVG is not needed

---

### Supporting: Drag-to-Reorder for Route Planner

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop primitives | Route stop reordering in confirm panel |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable list preset | Wraps the DnD primitives with `useSortable` + `arrayMove` for list reorder |

**Install:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

**Why `@dnd-kit` over `react-beautiful-dnd`:** `react-beautiful-dnd` is unmaintained (archived repo). `@dnd-kit` is the community standard replacement, works with React 19, and is accessibility-first. The `@dnd-kit/sortable` preset provides `arrayMove()` and `useSortable()` — exactly what the route stop reorder list needs with minimal setup.

**Scope:** Only needed for the route planner's stop-reorder list. Do NOT use for the pin list sidebar — that list only needs click-to-select, not drag reorder.

---

### Supporting: Toast Notifications

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| `sonner` | ^2.0.7 | User feedback toasts | Pin saved, route copied, error states, discover progress |

**Install:**
```bash
npm install sonner
```

**Why `sonner` over `react-hot-toast`:** Sonner has 20.5M weekly downloads vs react-hot-toast's 3.0M — it has become the de facto standard, particularly after shadcn/ui adopted it as the official toast component. Both are fine, but sonner's API is slightly more ergonomic for progress/loading states (relevant for batch discover queries). Bundle is 9.1 KB gzip — acceptable.

**Usage:** Add `<Toaster />` once in `app/layout.tsx`. Call `toast.success()`, `toast.error()`, `toast.loading()` from anywhere without hooks.

---

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| `@react-google-maps/api` | Wrapper around the Maps JS API that adds abstraction over `@googlemaps/js-api-loader` which is already installed and working. Switching would require rewriting `Map.tsx` with no benefit. React wrapper libraries for Maps tend to lag behind Google's API updates. | Continue using `@googlemaps/js-api-loader` directly with `importLibrary()` |
| `use-places-autocomplete` | Hooks wrapper for legacy `PlacesAutocomplete` which is deprecated. | Call `Place.searchByText` directly via the new Places library |
| Legacy `google.maps.DirectionsService` | Deprecated February 25, 2026 per official Google docs. Not scheduled for immediate removal but will not receive new features. | `google.maps.importLibrary('routes')` + Route class |
| Legacy `google.maps.places.PlacesService` | Marked "Legacy status" by Google. Callback-based API, no Promises. | `Place.searchByText` / `Place.searchNearby` from Places (New) |
| `@supabase/ssr` | Designed for cookie-based auth session management in Next.js server components. Auth is out of scope — this package adds unnecessary complexity. | Plain `@supabase/supabase-js` with anon key |
| `react-beautiful-dnd` | Archived, unmaintained. | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Redux Toolkit | Significant boilerplate for a single-page app with 3-4 feature slices. Overkill. | Zustand with slice pattern |
| PowerSync / RxDB | Full offline-first sync engines — appropriate for native mobile apps or complex conflict resolution. PROJECT.md specifies "localStorage with Supabase cloud sync (debounced)" — a much simpler pattern that doesn't need a sync engine. | Manual `localStorage` read/write + `@supabase/supabase-js` upsert with `useEffect` + `setTimeout` debounce |

---

## Full Installation Command

```bash
# Add these to the existing project
npm install @supabase/supabase-js zustand sonner @dnd-kit/core @dnd-kit/sortable
```

No new dev dependencies required — all type definitions are bundled in these packages.

---

## Environment Variables to Add

```bash
# .env.local additions
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your-map-id   # Required for AdvancedMarkerElement
```

---

## Version Compatibility Notes

| Package | React Version | Notes |
|---|---|---|
| `zustand` ^5.0.12 | React 18+ required | v5 uses native `useSyncExternalStore` — compatible with React 19.2.4 |
| `@dnd-kit/core` ^6.3.1 | React 16.8+ | Compatible with React 19; last updated ~1 year ago but stable |
| `@dnd-kit/sortable` ^10.0.0 | Matches core | Version jump from 8.x to 10.x is a major bump — install both explicitly |
| `sonner` ^2.0.7 | React 18+ | Compatible with React 19 |
| `@supabase/supabase-js` ^2.101.1 | Framework-agnostic | Works in both Server and Client components; use only in Client components for this milestone |
| Google Places (New) | N/A | Loaded via `importLibrary('places')` — already available in `@googlemaps/js-api-loader` ^2.0.2 |
| Google Route class | N/A | Loaded via `importLibrary('routes')` — already available in `@googlemaps/js-api-loader` ^2.0.2 |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| Zustand | React Context | If the app had <3 components sharing state and no map involved. Map interactions make Context re-render costs unacceptable. |
| Zustand | Jotai | If state were highly granular and reactive (e.g., a spreadsheet). This app has coarse feature-level slices, not fine atomic state. |
| `@dnd-kit` | `react-beautiful-dnd` | Never — it's archived. |
| `sonner` | `react-hot-toast` | Either works. Choose `react-hot-toast` if bundle size is a hard constraint (4.7 KB vs 9.1 KB). |
| Route class (New) | `DirectionsService` (Legacy) | If you need to ship immediately and can't test the Route class API — `DirectionsService` still works and won't be removed with short notice. Flag as tech debt. |
| `Place.searchByText` | Legacy `PlacesService.textSearch` | Same caveat — legacy still works, but new projects should not start on it. |

---

## Sources

- [Google Maps JavaScript API: Place Class](https://developers.google.com/maps/documentation/javascript/place) — Places (New) confirmed current standard; `importLibrary('places')` pattern verified
- [Place.searchByText docs](https://developers.google.com/maps/documentation/javascript/place-search) — `locationRestriction` rectangle bounds confirmed; field mask pattern verified
- [Place.searchNearby docs](https://developers.google.com/maps/documentation/javascript/nearby-search) — `SearchNearbyRankPreference` and radius confirmed
- [Google Maps DirectionsService reference](https://developers.google.com/maps/documentation/javascript/reference/directions) — Deprecated status February 25, 2026 confirmed
- [Route class overview](https://developers.google.com/maps/documentation/javascript/routes/route-class-overview) — Current routing API confirmed; `optimizeWaypointOrder` supported
- [Advanced Markers overview](https://developers.google.com/maps/documentation/javascript/advanced-markers/overview) — Map ID requirement confirmed; migration guide referenced
- [supabase-js GitHub releases](https://github.com/supabase/supabase-js/releases) — v2.101.1 confirmed current stable (2026-03-31)
- [zustand GitHub releases](https://github.com/pmndrs/zustand/releases) — v5.0.12 confirmed current stable
- [dnd-kit npm](https://www.npmjs.com/package/@dnd-kit/core) — @dnd-kit/core 6.3.1 current
- [sonner npm](https://www.npmjs.com/package/sonner) — 2.0.7 current stable; 12M+ weekly downloads confirmed
- [LogRocket toast comparison 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) — sonner vs react-hot-toast comparison; sonner adoption numbers

---

*Stack research for: map-centric field sales CRM (Groundwork v2)*
*Researched: 2026-03-31*
