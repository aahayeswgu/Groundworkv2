# Phase 2: Pins - Research

**Researched:** 2026-03-31
**Domain:** Google Maps AdvancedMarkerElement, Zustand persist, reverse geocoding, modal UX
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Edit Panel UX**
- D-01: Pin edit form is a centered modal overlay on the map. Not a slide-in panel, not inline in sidebar.
- D-02: Modal shows all 7 editable fields: title, address, status picker, contact name, phone, follow-up date, notes.
- D-03: Modal works for both creating new pins (from pin-drop) and editing existing pins.

**Marker Style**
- D-04: Compact 3D pin markers — small-ish pin with a shaft sticking up from the map and a 3D head. Status color fills the head.
- D-05: Markers must be clearly distinguishable from default Google Maps pins — no red teardrop shapes. Use the compact 3D style with brand-specific look.
- D-06: Size should be restrained so clusters don't feel cluttered — smaller than the old app's 36px markers. Prioritize scannability at high pin density.
- D-07: Status colors: Prospect = blue (#3B82F6), Active = green (#22C55E), Follow-Up = amber (#F59E0B), Lost = red (#EF4444).

**Info Window**
- D-08: Use native Google Maps InfoWindow (not custom HTML overlay). Simpler implementation, acceptable styling trade-off for v1.
- D-09: Info window shows: pin title, status badge, address, contact name, phone, and action buttons (Edit, Delete, Add to Route placeholder).
- D-10: Clicking a different marker closes any open info window first (toggle behavior).

**Notes Model**
- D-11: Claude's Discretion — activity log (array of {text, date}) is recommended over single text field. Sales reps benefit from seeing visit history. Update the Pin type accordingly.

### Claude's Discretion
- Exact modal component implementation (portal, z-index, backdrop)
- SVG marker design details (exact gradients, shadows, dimensions) — keep compact and 3D-looking
- Reverse geocoding implementation approach (Google Geocoding API)
- localStorage serialization format and loading strategy
- Search implementation (client-side filter on title/address/contact)
- Status filter chip component design
- Pin-drop mode UX (cursor change, click handler toggle)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PINS-01 | User can enter pin-drop mode and click map to place a pin at that location | Pin-drop mode pattern: map click listener toggled on/off, cursor CSS override |
| PINS-02 | Pin stores title, address, status, contact name, phone, follow-up date, and notes | Notes field: upgrade from string to NoteEntry[] per D-11 |
| PINS-03 | Address is reverse-geocoded automatically from pin coordinates on drop | Google Geocoder.geocode({ location }) → results[0].formatted_address |
| PINS-04 | Pin has one of four fixed statuses: Prospect (blue), Active (green), Follow-Up (amber), Lost (red) | PinStatus type already established; colors locked in D-07 |
| PINS-05 | User can edit a pin's fields via a slide-in edit panel | D-01 overrides: modal overlay, not slide-in. updatePin() exists in store |
| PINS-06 | User can delete a pin from the edit panel or info window | deletePin() exists in store; both modal and InfoWindow trigger it |
| PINS-07 | Pins display as status-colored SVG markers on the map | AdvancedMarkerElement with inline SVG content property |
| PINS-08 | Clicking a pin marker shows an info window with name, status, address, contact, and action buttons | Native InfoWindow.open({ anchor: marker, map }) |
| PINS-09 | Sidebar shows a searchable list of all pins with text search across title, address, and contact | Client-side filter on useStore pins array |
| PINS-10 | Sidebar has status filter chips that filter both the list and map marker visibility | Filter state in component or store; MarkerLayer reads filterStatus |
| PINS-11 | Clicking a pin in the sidebar pans and zooms the map to that pin and bounces the marker | map.panTo() + map.setZoom() + CSS animation on marker element |
| PINS-12 | Pins persist to localStorage as primary cache | Zustand persist middleware with partialize({ pins }) |
</phase_requirements>

---

## Summary

Phase 2 wires full pin management on top of the Phase 1 foundation. The Google Maps integration work centers on three mechanics: the imperative AdvancedMarkerElement pool (already designed in ARCHITECTURE.md), the native InfoWindow anchored to an AdvancedMarkerElement, and a single-listener click mode for pin-drop. All three use the existing map instance from MapContext.

The Zustand side is simpler than it appears. The existing `PinsSlice` already has all CRUD actions. The main additions are: (1) persist middleware wrapping the root store with `partialize` to save only `pins`, and (2) a `notes` type upgrade from `string` to `NoteEntry[]` per D-11. The modal state (open/closed, editing which pin) is local component `useState` — not in the global store.

The sidebar wiring is the largest surface area: reading pins from store, client-side search filter, status filter chips, pin list rendering, and the fly-to-pin interaction. These are pure React/Zustand work with no new external dependencies needed.

**Primary recommendation:** Build in this order — (1) type upgrade + persist, (2) MarkerLayer + SVG icons, (3) pin-drop mode, (4) reverse geocoding utility, (5) PinModal, (6) InfoWindow, (7) PinList + sidebar wiring.

---

## Standard Stack

### Core (already installed — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zustand` | 5.0.12 | Store + persist | Already in use; persist middleware ships with it |
| `@googlemaps/js-api-loader` | ^2.0.2 | Maps API bootstrap | Already in use; marker + geocoding libraries already loaded |
| `@types/google.maps` | ^3.58.1 | TypeScript types | Already in use |
| React 19 | 19.2.4 | createPortal for modal | Already in use |

### No new packages required

The entire phase is implementable with the existing stack. Zustand `persist` middleware is already bundled at `zustand/middleware`. `createPortal` is part of React. The Google Maps Geocoder and InfoWindow are part of the `maps` library already loaded in `Map.tsx`.

**Version verification (confirmed 2026-03-31):**
- `zustand`: 5.0.12 (installed, confirmed by `npm view zustand dist-tags`)
- `react`: 19.2.4 (package.json)
- `@googlemaps/js-api-loader`: ^2.0.2 (package.json)

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure for Phase 2

```
app/
├── features/
│   ├── map/
│   │   ├── Map.tsx                  # Add pin-drop mode state + click listener
│   │   └── MarkerLayer.tsx          # NEW: imperative marker pool
│   └── pins/
│       ├── pins.store.ts            # EXISTING: no changes to actions needed
│       ├── PinModal.tsx             # NEW: create/edit modal (portal)
│       ├── PinList.tsx              # NEW: sidebar list with search + filter
│       ├── PinListItem.tsx          # NEW: single row component
│       └── pin-marker.ts            # NEW: SVG generation utility
├── lib/
│   └── geocoding.ts                 # NEW: reverse geocode utility
├── store/
│   └── index.ts                     # MODIFY: wrap with persist middleware
└── types/
    └── pins.types.ts                # MODIFY: notes: NoteEntry[]
```

### Pattern 1: Zustand Persist with Partialize

**What:** Wrap the root `create()` call with `persist` middleware. Use `partialize` to persist only the `pins` array, not discover results, route state, or UI flags.

**When to use:** PINS-12. Only `pins` need localStorage — discover results are ephemeral, route state resets per session.

**Critical SSR gotcha:** Next.js renders on the server where `localStorage` is unavailable. Use `skipHydration: true` on the persist options and call `useStore.persist.rehydrate()` in a `useEffect` in the root layout or a client component that mounts early.

```typescript
// app/store/index.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createPinsSlice } from "@/app/features/pins/pins.store";
import { createDiscoverSlice } from "@/app/features/discover/discover.store";
import { createRouteSlice } from "@/app/features/route/route.store";
import type { PinsSlice } from "@/app/features/pins/pins.store";
import type { DiscoverSlice } from "@/app/features/discover/discover.store";
import type { RouteSlice } from "@/app/features/route/route.store";

export type AppStore = PinsSlice & DiscoverSlice & RouteSlice;

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createPinsSlice(...a),
      ...createDiscoverSlice(...a),
      ...createRouteSlice(...a),
    }),
    {
      name: "groundwork-pins-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ pins: state.pins }),
      skipHydration: true,
    }
  )
);
```

Then in a client component (e.g., a `<StoreHydration />` component rendered in `app/page.tsx`):

```typescript
// app/components/StoreHydration.tsx
"use client";
import { useEffect } from "react";
import { useStore } from "@/app/store";

export default function StoreHydration() {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);
  return null;
}
```

**Source:** zustand.docs.pmnd.rs/reference/middlewares/persist (verified 2026-03-31)

### Pattern 2: AdvancedMarkerElement with Custom SVG Content

**What:** Create `AdvancedMarkerElement` instances with a `content` property set to a DOM element containing an inline SVG. The marker pool pattern (from ARCHITECTURE.md Pattern 3) manages lifecycle.

**Key API facts (HIGH confidence — official docs):**
- `new google.maps.marker.AdvancedMarkerElement({ position, map, content, title })`
- `content` accepts any `HTMLElement` — create with `document.createElement` then assign `innerHTML`
- Click listener: `marker.addListener('click', handler)` — NOT `addEventListener`
- Access the underlying DOM element via `marker.element` for CSS class manipulation
- Requires `mapId` on the map — already set in `Map.tsx`

```typescript
// app/features/pins/pin-marker.ts
// Source: developers.google.com/maps/documentation/javascript/advanced-markers/html-markers

const STATUS_COLORS: Record<PinStatus, string> = {
  prospect: "#3B82F6",
  active: "#22C55E",
  "follow-up": "#F59E0B",
  lost: "#EF4444",
};

export function createPinMarkerElement(status: PinStatus): HTMLElement {
  const color = STATUS_COLORS[status];
  // Compact 3D pin: 24px wide, 36px tall (smaller than old 36px head)
  // Head is a 3D sphere with radial gradient; shaft is thin tapered rect
  const el = document.createElement("div");
  el.innerHTML = `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="hg" cx="35%" cy="35%" r="60%" fx="25%" fy="25%">
        <stop offset="0%" stop-color="${lighten(color)}"/>
        <stop offset="50%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${darken(color)}"/>
      </radialGradient>
      <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="rgba(0,0,0,0.35)"/></filter>
    </defs>
    <ellipse cx="12" cy="33" rx="3" ry="1.2" fill="rgba(0,0,0,0.2)"/>
    <polygon points="10.5,13 13.5,13 12.5,32 11.5,32"
      fill="url(#metal)" stroke="none"/>
    <circle cx="12" cy="10" r="9" fill="url(#hg)"
      stroke="rgba(255,255,255,0.5)" stroke-width="1" filter="url(#sh)"/>
    <ellipse cx="9.5" cy="7.5" rx="3" ry="2" fill="rgba(255,255,255,0.2)"
      transform="rotate(-15,12,10)"/>
  </svg>`;
  el.style.cursor = "pointer";
  return el;
}
```

Note: the SVG above is a starting sketch — implement `lighten`/`darken` helpers (same as old app's `lightenColor`/`darkenColor`) and refine gradients. The old app's approach at `/home/wzrd/Groundwork/index.html:3749-3816` is the reference for the 3D sphere effect; scale the pin down to `width="24" height="36"` (from 36×65) per D-06.

### Pattern 3: InfoWindow with AdvancedMarkerElement

**What:** Create a single shared `google.maps.InfoWindow` instance. On marker click, call `infoWindow.open({ anchor: marker, map })`. Track `openMarkerId` in component state for toggle behavior (D-10).

**Key API facts (HIGH confidence — official docs):**
- `new google.maps.InfoWindow({ content: htmlString, ariaLabel: string })`
- Open: `infoWindow.open({ anchor: advancedMarkerElement, map })`
- Close: `infoWindow.close()`
- Close event: `infoWindow.addListener('closeclick', handler)`
- Best practice: reuse ONE InfoWindow instance, change content, re-open on different marker

```typescript
// Inside MarkerLayer.tsx
const infoWindow = useRef<google.maps.InfoWindow | null>(null);
const openPinId = useRef<string | null>(null);

// On marker click:
function handleMarkerClick(pin: Pin, marker: google.maps.marker.AdvancedMarkerElement) {
  if (!infoWindow.current) {
    infoWindow.current = new google.maps.InfoWindow();
    infoWindow.current.addListener("closeclick", () => {
      openPinId.current = null;
    });
  }
  // Toggle: same marker clicked again
  if (openPinId.current === pin.id) {
    infoWindow.current.close();
    openPinId.current = null;
    return;
  }
  infoWindow.current.setContent(buildInfoWindowContent(pin));
  infoWindow.current.open({ anchor: marker, map });
  openPinId.current = pin.id;
}
```

**InfoWindow content** is an HTML string or DOM node. For D-09 (buttons that call React actions), use DOM node content with event listeners attached after setting content, or dispatch events on a shared event bus. Simplest approach: render content as HTML string, use `data-pin-id` attributes on buttons, and attach delegated click handlers to the InfoWindow's container element.

### Pattern 4: Pin-Drop Mode

**What:** A `dropMode` boolean in `Map.tsx` local state toggles a map click listener. When `dropMode` is true, the next map click calls `addPin()` with the clicked LatLng and then exits drop mode.

**Key API facts (HIGH confidence):**
- Map click listener: `map.addListener('click', (e: google.maps.MapMouseEvent) => { e.latLng })`
- Remove listener: store the return value of `addListener` and call `google.maps.event.removeListener(listener)`
- Cursor change: `map.setOptions({ draggableCursor: 'crosshair' })` / `map.setOptions({ draggableCursor: '' })`

```typescript
// In Map.tsx
const [dropMode, setDropMode] = useState(false);
const dropListener = useRef<google.maps.MapsEventListener | null>(null);

function enterDropMode() {
  setDropMode(true);
  map.setOptions({ draggableCursor: "crosshair" });
  dropListener.current = map.addListener("click", async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    exitDropMode();
    const address = await reverseGeocode(e.latLng);
    // Open PinModal in "create" mode with pre-filled lat/lng/address
    setPendingPin({ lat: e.latLng.lat(), lng: e.latLng.lng(), address });
  });
}

function exitDropMode() {
  setDropMode(false);
  map.setOptions({ draggableCursor: "" });
  if (dropListener.current) {
    google.maps.event.removeListener(dropListener.current);
    dropListener.current = null;
  }
}
```

### Pattern 5: Reverse Geocoding

**What:** A utility function in `app/lib/geocoding.ts` wraps `google.maps.Geocoder`. Called once per pin-drop with the clicked LatLng. Returns a formatted address string.

**Key API facts (HIGH confidence — official docs):**
- `const { Geocoder } = await google.maps.importLibrary("geocoding")`
- `geocoder.geocode({ location: latLng })` returns a Promise
- Best result is `results[0].formatted_address`
- Geocoding library is separate from `maps` — must be imported

```typescript
// app/lib/geocoding.ts
let geocoder: google.maps.Geocoder | null = null;

export async function reverseGeocode(latLng: google.maps.LatLng): Promise<string> {
  if (!geocoder) {
    await google.maps.importLibrary("geocoding");
    geocoder = new google.maps.Geocoder();
  }
  try {
    const { results } = await geocoder.geocode({ location: latLng });
    return results[0]?.formatted_address ?? `${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}`;
  } catch {
    return `${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}`;
  }
}
```

### Pattern 6: Fly-to-Pin (Sidebar Click)

**What:** `map.panTo(position)` pans smoothly when the target is within the visible viewport; for distant points it jumps. Combine with `map.setZoom(15)` for a predictable close-up zoom. Add a CSS `bounce` animation class to the marker element for the visual cue.

```typescript
// In PinListItem onClick handler:
function flyToPin(pin: Pin) {
  const map = useMapInstance(); // via hook
  map.panTo({ lat: pin.lat, lng: pin.lng });
  map.setZoom(15);
  // Apply bounce animation to marker DOM element
  const markerEl = markerPool.current.get(pin.id)?.element as HTMLElement | undefined;
  if (markerEl) {
    markerEl.classList.add("marker-bounce");
    setTimeout(() => markerEl.classList.remove("marker-bounce"), 700);
  }
}
```

**Source:** developers.google.com/maps/documentation/javascript/interaction (panTo), standard DOM animation pattern.

### Pattern 7: Client-Side Search and Status Filter

**What:** `useMemo` derivations inside `PinList.tsx` compute the filtered list from raw `pins` array. Search text and active status filters live in component `useState` (not global store — transient UI state).

```typescript
// In PinList.tsx
const pins = useStore((s) => s.pins);
const [searchText, setSearchText] = useState("");
const [activeStatuses, setActiveStatuses] = useState<Set<PinStatus>>(
  new Set(["prospect", "active", "follow-up", "lost"])
);

const filtered = useMemo(() => {
  const q = searchText.toLowerCase();
  return pins.filter((p) => {
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.contact.toLowerCase().includes(q);
    const matchesStatus = activeStatuses.has(p.status);
    return matchesSearch && matchesStatus;
  });
}, [pins, searchText, activeStatuses]);
```

Status filter chips toggle entries in `activeStatuses`. The MarkerLayer also reads active status filters to hide/show markers (PINS-10). To bridge this, either (a) store `activeStatuses` in Zustand, or (b) the MarkerLayer receives the filter as a prop from a shared parent. Option (a) is cleaner — add `activeStatusFilter: Set<PinStatus>` and `setActiveStatusFilter` to PinsSlice.

### Pattern 8: PinModal Implementation

**What:** A centered modal overlay using `ReactDOM.createPortal` rendered into `document.body`. Local `useState` in the modal's parent tracks `{ mode: 'create' | 'edit', pin?: Pin }`. The modal handles form state internally.

**Key decisions:**
- Portal renders outside the map DOM subtree so z-index stacking is clean
- Backdrop click closes the modal
- ESC key closes the modal (`useEffect` + keydown listener)
- Form uses `useState` for each field (7 fields + notes array)
- On Save: calls `addPin(newPin)` or `updatePin(id, patch)` then closes

```typescript
// app/features/pins/PinModal.tsx
"use client";
import { createPortal } from "react-dom";

interface PinModalProps {
  mode: "create" | "edit";
  initialData: Partial<Pin>;
  onSave: (data: Partial<Pin>) => void;
  onClose: () => void;
}

export default function PinModal({ mode, initialData, onSave, onClose }: PinModalProps) {
  // ... form state, handlers
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Modal */}
      <div className="relative z-10 bg-bg-card rounded-xl border border-border shadow-gw w-full max-w-lg mx-4 p-6">
        {/* Form fields */}
      </div>
    </div>,
    document.body
  );
}
```

### Anti-Patterns to Avoid

- **Storing marker instances in React state:** Causes flicker and double-creation. Use `useRef<Map<string, AdvancedMarkerElement>>` for the marker pool.
- **Creating a new InfoWindow per click:** Leaks memory. Create ONE instance, reuse with `setContent()` + `open()`.
- **Calling `geocoder.geocode` in a component:** Move to `app/lib/geocoding.ts`, call from the pin-drop handler.
- **Persisting the entire store:** `partialize: (s) => ({ pins: s.pins })` — exclude discover results and route state.
- **Map click listener that survives drop mode exit:** Always `removeListener` after first click in drop mode.
- **Using `google.maps.Marker` (deprecated):** Use `AdvancedMarkerElement` exclusively. The old prototype uses deprecated `Marker` — do not copy its `addMarkerToMap` pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage persistence | Manual JSON.stringify/parse in useEffect | Zustand `persist` middleware | Handles serialization, hydration, SSR skipHydration, merge, versioning |
| Modal portal | Custom DOM injection | `ReactDOM.createPortal(content, document.body)` | Clean z-index isolation, already in React, 3 lines |
| SVG lighten/darken | Color library import | Simple hex math helpers (20 lines) | No dep needed; same functions exist in old prototype at lines 3818-3834 |
| Reverse geocode | HTTP fetch to Geocoding API | `google.maps.Geocoder` JS class | Already authenticated via Maps API key; no CORS issues |

**Key insight:** Every complex-looking problem in this phase has a 10-30 line solution using libraries already present. Resist adding new dependencies.

---

## Common Pitfalls

### Pitfall 1: Persist Middleware SSR Hydration Mismatch

**What goes wrong:** Next.js renders on the server where `localStorage` doesn't exist. Zustand persist tries to access it on import, causing a `localStorage is not defined` error or a hydration mismatch between SSR HTML (empty pins) and client HTML (loaded pins).

**Why it happens:** Default `persist` behavior calls `getItem` synchronously during store initialization, which runs during SSR.

**How to avoid:** Set `skipHydration: true` in persist options. Call `useStore.persist.rehydrate()` inside a `useEffect` in a client component that renders in the app shell. This defers localStorage access to after client hydration.

**Warning signs:** `localStorage is not defined` error, React hydration warning about mismatched HTML.

### Pitfall 2: InfoWindow Button Clicks Can't Call React Handlers

**What goes wrong:** `infoWindow.setContent(htmlString)` renders HTML inside an iframe-like container managed by Google Maps. Event handlers set on the string as `onclick="..."` attributes refer to global scope, not React component scope.

**Why it happens:** InfoWindow content is rendered by the Maps API, outside the React component tree. React's synthetic event system doesn't reach it.

**How to avoid:** Two options:
1. (Simpler) Use `infoWindow.setContent(domElement)` instead of a string. Build the content as a DOM node and attach event listeners with `addEventListener` before passing to `setContent`. These listeners CAN reference module-scoped callbacks.
2. (Alternative) After `open()`, query `document.querySelector('.gm-ui-hover-effect')` or the infoWindow's container element and attach delegated listeners. Fragile — avoid.

**Use Option 1.** Build `buildInfoWindowContent(pin: Pin, callbacks: InfoWindowCallbacks): HTMLElement`.

### Pitfall 3: Marker Pool Not Cleaned Up on Component Unmount

**What goes wrong:** `MarkerLayer` unmounts (Strict Mode double-invoke, or app navigation). The marker pool ref still holds `AdvancedMarkerElement` instances pointing to the map. On remount, new markers are created — duplicates appear.

**Why it happens:** `useRef` values survive re-renders but the cleanup `useEffect` must explicitly call `marker.map = null` for each entry.

**How to avoid:**
```typescript
useEffect(() => {
  return () => {
    for (const marker of markerPool.current.values()) {
      marker.map = null;
    }
    markerPool.current.clear();
    infoWindow.current?.close();
  };
}, []);
```

### Pitfall 4: Drop Mode Click Fires on Marker Click Events

**What goes wrong:** User is in drop mode and clicks a marker to view its info window. The drop mode click listener fires, creating an unintended new pin at the marker's location.

**Why it happens:** Map-level `click` event fires for all clicks on the map canvas, including clicks that also hit markers.

**How to avoid:** AdvancedMarkerElement clicks do NOT propagate to the map's `click` event by default. This is actually safe — clicking a marker in drop mode will fire the marker's `click` listener but not the map's. Verify during implementation by testing marker click while in drop mode.

### Pitfall 5: Status Filter Chips Not Wired to MarkerLayer

**What goes wrong:** Status filter chips hide pins from the sidebar list but markers for hidden pins remain visible on the map (PINS-10 requires both to filter).

**Why it happens:** Filter state lives in `PinList.tsx` component state. `MarkerLayer.tsx` doesn't have access to it.

**How to avoid:** Move `activeStatusFilter` to the Zustand `PinsSlice`. Both `PinList` and `MarkerLayer` read from the store. Add `activeStatusFilter: Set<PinStatus>` and `setActiveStatusFilter` action to `PinsSlice`.

### Pitfall 6: Notes Field Type Migration

**What goes wrong:** `Pin.notes` is currently `string` in `pins.types.ts`. D-11 recommends upgrading to `NoteEntry[]`. Existing pins in localStorage (if any) have a string `notes` field. After the upgrade, loading old data causes type errors.

**Why it happens:** Schema migration without migration logic.

**How to avoid:** Use Zustand persist's `migrate` option to handle version upgrade:
```typescript
{
  version: 1,
  migrate: (persisted, version) => {
    if (version === 0) {
      // v0 → v1: convert notes string to NoteEntry[]
      const state = persisted as { pins?: Array<{ notes: string }> };
      state.pins?.forEach((p) => {
        if (typeof p.notes === "string") {
          p.notes = p.notes ? [{ text: p.notes, date: new Date().toISOString() }] : [];
        }
      });
    }
    return persisted as AppStore;
  },
}
```

Since this is Phase 2 (first implementation of pins), there are likely no existing stored pins. But the migration guard costs nothing and protects against dev resets.

---

## Code Examples

### NoteEntry type addition

```typescript
// app/types/pins.types.ts — add NoteEntry, update Pin
export interface NoteEntry {
  text: string;
  date: string; // ISO 8601
}

export type PinStatus = "prospect" | "active" | "follow-up" | "lost";

export interface Pin {
  id: string;
  title: string;
  address: string;
  status: PinStatus;
  lat: number;
  lng: number;
  contact: string;
  phone: string;
  followUpDate: string;
  notes: NoteEntry[];  // was: string
  createdAt: string;
  updatedAt: string;
}
```

### MarkerLayer skeleton

```typescript
// app/features/map/MarkerLayer.tsx
"use client";
import { useEffect, useRef } from "react";
import { useStore } from "@/app/store";
import { useMapInstance } from "./MapContext";
import { createPinMarkerElement } from "@/app/features/pins/pin-marker";
import type { Pin } from "@/app/types/pins.types";

export default function MarkerLayer() {
  const map = useMapInstance();
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const openPinId = useRef<string | null>(null);

  useEffect(() => {
    const visibleIds = new Set(
      pins.filter((p) => activeStatusFilter.has(p.status)).map((p) => p.id)
    );
    // Remove stale/hidden markers
    for (const [id, marker] of markerPool.current) {
      if (!visibleIds.has(id)) {
        marker.map = null;
        markerPool.current.delete(id);
      }
    }
    // Create or update
    for (const pin of pins) {
      if (!activeStatusFilter.has(pin.status)) continue;
      if (markerPool.current.has(pin.id)) {
        // Update position if needed (future: pin relocation)
        continue;
      }
      const content = createPinMarkerElement(pin.status);
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: pin.lat, lng: pin.lng },
        content,
        title: pin.title,
      });
      marker.addListener("click", () => handleMarkerClick(pin, marker));
      markerPool.current.set(pin.id, marker);
    }
  }, [pins, activeStatusFilter, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const marker of markerPool.current.values()) marker.map = null;
      markerPool.current.clear();
      infoWindow.current?.close();
    };
  }, []);

  function handleMarkerClick(pin: Pin, marker: google.maps.marker.AdvancedMarkerElement) {
    // ... toggle infoWindow per Pattern 3
  }

  return null;
}
```

### Zustand PinsSlice additions

```typescript
// PinsSlice additions for Phase 2
activeStatusFilter: Set<PinStatus>;
setActiveStatusFilter: (statuses: Set<PinStatus>) => void;

// In createPinsSlice:
activeStatusFilter: new Set<PinStatus>(["prospect", "active", "follow-up", "lost"]),
setActiveStatusFilter: (statuses) => set({ activeStatusFilter: statuses }),
```

Note: `Set` is not JSON-serializable. In the `partialize` function, persist only `pins`, not `activeStatusFilter`. The filter resets to "all visible" on each page load, which is the correct UX.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `google.maps.Marker` | `AdvancedMarkerElement` | Feb 2024 (deprecated); removal TBD | Must use new class; requires mapId |
| Callback-based `geocoder.geocode(request, callback)` | Promise-based `geocoder.geocode(request).then(...)` | 2023+ | Use `await geocoder.geocode(...)` — no callback form needed |
| `infoWindow.open(map, marker)` (old 2-arg form) | `infoWindow.open({ anchor: marker, map })` (options object) | Current | Both still work; use options object form |
| Manual localStorage in useEffect | Zustand persist middleware | Zustand v4+ | skipHydration needed for SSR |

**Deprecated/outdated:**
- `google.maps.Marker`: Deprecated Feb 2024. Old prototype's `addMarkerToMap` function uses it — DO NOT copy.
- `infoWindow.open(map, marker)` two-arg form: Still works but options-object form is preferred.
- Zustand v4 `persist` pattern: v5 (in use) has minor API differences — use `create()()` double-call syntax with middleware.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 has no new external dependencies. All required services (Google Maps API, localStorage) are already used in Phase 1. The `geocoding` library is part of the Google Maps JS API already configured.

---

## Validation Architecture

### Test Framework

No test framework is installed. `nyquist_validation` is `true` in config.json. Wave 0 must establish the test infrastructure before implementation tasks run.

| Property | Value |
|----------|-------|
| Framework | None detected — must install Vitest (recommended for Next.js/Vite-adjacent) |
| Config file | None — Wave 0 gap |
| Quick run command | `npx vitest run --reporter=verbose` (after install) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PINS-01 | Pin-drop mode toggles cursor and click listener | unit | `vitest run tests/pins/pin-drop-mode.test.ts` | Wave 0 |
| PINS-02 | Pin type has NoteEntry[] notes field | unit (type check) | `tsc --noEmit` (free, always available) | n/a — type check |
| PINS-03 | reverseGeocode returns formatted_address string | unit (mock Geocoder) | `vitest run tests/lib/geocoding.test.ts` | Wave 0 |
| PINS-04 | PinStatus type covers exactly 4 values | unit (type check) | `tsc --noEmit` | n/a |
| PINS-05 | PinModal renders with 7 fields and calls onSave | unit | `vitest run tests/pins/PinModal.test.tsx` | Wave 0 |
| PINS-06 | deletePin removes pin from store | unit | `vitest run tests/pins/pins-store.test.ts` | Wave 0 |
| PINS-07 | createPinMarkerElement returns HTMLElement with SVG | unit | `vitest run tests/pins/pin-marker.test.ts` | Wave 0 |
| PINS-08 | InfoWindow opens anchored to marker on click | manual | — (Google Maps DOM not unit-testable) | manual only |
| PINS-09 | Search filter returns correct subset of pins | unit | `vitest run tests/pins/PinList.test.tsx` | Wave 0 |
| PINS-10 | Status filter updates both list and store | unit | `vitest run tests/pins/PinList.test.tsx` | Wave 0 |
| PINS-11 | Fly-to calls map.panTo and map.setZoom | unit (mock map) | `vitest run tests/pins/fly-to-pin.test.ts` | Wave 0 |
| PINS-12 | pins array persists to localStorage and rehydrates | unit (mock localStorage) | `vitest run tests/store/persist.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (zero config, always available)
- **Per wave merge:** `npx vitest run` (full suite, after Wave 0 installs Vitest)
- **Phase gate:** Full suite green + `tsc --noEmit` clean before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `package.json` devDependency: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/user-event` — install with `npm install -D vitest jsdom @testing-library/react @testing-library/user-event`
- [ ] `vitest.config.ts` — configure jsdom environment, path aliases matching tsconfig
- [ ] `tests/` directory with subdirectories: `pins/`, `lib/`, `store/`
- [ ] `tests/setup.ts` — global mocks for `google.maps.*` (Geocoder, Map, AdvancedMarkerElement, InfoWindow)
- [ ] `tests/pins/pins-store.test.ts` — covers PINS-06 (deletePin, addPin, updatePin)
- [ ] `tests/pins/pin-marker.test.ts` — covers PINS-07
- [ ] `tests/lib/geocoding.test.ts` — covers PINS-03
- [ ] `tests/pins/PinModal.test.tsx` — covers PINS-05
- [ ] `tests/pins/PinList.test.tsx` — covers PINS-09, PINS-10
- [ ] `tests/store/persist.test.ts` — covers PINS-12

---

## Open Questions

1. **MarkerLayer placement in JSX tree**
   - What we know: `Map.tsx` wraps children in `MapContext.Provider`. `MarkerLayer` must be a child of that provider.
   - What's unclear: Should `MarkerLayer` and `PinModal` be rendered directly in `Map.tsx` JSX, or should `page.tsx` render them as siblings to `<Map>`?
   - Recommendation: Render `MarkerLayer` inside `Map.tsx`'s JSX (as a child of the provider) since it needs map context. Render `PinModal` in `page.tsx` or a layout wrapper since it's a full-screen overlay that should not be nested under the map's z-index stack.

2. **InfoWindow action buttons calling React store**
   - What we know: InfoWindow content is rendered by Google Maps outside the React tree. String `onclick` handlers won't reach Zustand.
   - What's unclear: Exact implementation of DOM-node content with store dispatch.
   - Recommendation: Pass store action refs to a module-level callback registry (`window.__gwCallbacks = { openEdit, deletePin }`) that InfoWindow button onclick attributes can call. Or better: build InfoWindow content as a DOM node and use `addEventListener` before passing to `setContent`. The second approach is cleaner.

3. **Cursor change during drop mode on touch/mobile**
   - What we know: `draggableCursor` CSS change works on desktop. On mobile, there is no cursor.
   - What's unclear: What's the mobile affordance for knowing drop mode is active?
   - Recommendation: Show a floating banner/toast "Tap to drop a pin — tap again to cancel" when drop mode is active. This replaces cursor feedback on mobile. The MapButton should visually indicate active state (existing `active` prop on `MapButton`).

---

## Sources

### Primary (HIGH confidence)
- [developers.google.com — AdvancedMarkerElement HTML markers](https://developers.google.com/maps/documentation/javascript/advanced-markers/html-markers) — content property, click listeners, DOM access
- [developers.google.com — InfoWindows](https://developers.google.com/maps/documentation/javascript/infowindows) — open({ anchor, map }), close(), closeclick event
- [developers.google.com — Geocoding Service](https://developers.google.com/maps/documentation/javascript/geocoding) — Geocoder class, geocode() Promise API, importLibrary("geocoding")
- [zustand.docs.pmnd.rs — persist middleware](https://zustand.docs.pmnd.rs/reference/middlewares/persist) — partialize, skipHydration, migrate, createJSONStorage
- Installed packages: zustand 5.0.12 (`node_modules/zustand/middleware/persist.d.ts` read directly)
- Existing codebase: `app/store/index.ts`, `app/features/pins/pins.store.ts`, `app/types/pins.types.ts`, `app/features/map/Map.tsx`, `app/components/Sidebar.tsx` (all read directly)

### Secondary (MEDIUM confidence)
- [github.com/pmndrs/zustand discussions/2476](https://github.com/pmndrs/zustand/discussions/2476) — persist + Next.js App Router skipHydration pattern
- [developers.google.com — Controlling Zoom and Pan](https://developers.google.com/maps/documentation/javascript/interaction) — panTo() + setZoom() for fly-to-pin
- Old prototype `/home/wzrd/Groundwork/index.html:3749-3816` — createMarkerIcon SVG reference for 3D pin design

### Tertiary (LOW confidence)
- Community articles on Zustand persist + slices (multiple DEV.to sources) — aligned with official docs; used only to validate skipHydration approach

---

## Project Constraints (from CLAUDE.md)

Per CLAUDE.md and AGENTS.md, the following directives apply to all Phase 2 implementation:

1. **Read Next.js docs before writing code:** `node_modules/next/dist/docs/` — check relevant guides before writing any Next.js-specific patterns (App Router, Server vs Client components).
2. **Breaking changes warning:** Next.js 16 may have APIs that differ from training data. Verify before use.
3. **Pragmatic DRY code:** No duplication. Reuse `MapButton`, `useMapInstance()`, existing store actions.
4. **Feature-driven organization:** New files go under `app/features/pins/`, `app/lib/`, not a flat `app/components/pins/`.
5. **`"use client"` only when needed:** `MarkerLayer`, `PinModal`, `PinList` — all interactive, all need `"use client"`. `PinListItem` if it has event handlers. The modal backdrop and form are client-only.
6. **Props typed inline:** No separate `Props` interfaces in separate files. Type inline in function signature.
7. **No barrel files:** No `index.ts` aggregators.
8. **Relative imports within same feature; `@/` for cross-feature.**
9. **Tailwind semantic tokens only:** `bg-bg-card`, `text-text-primary`, `border-border` — never raw hex in className. Raw hex only in SVG fill/stroke attributes.
10. **`useRef` for DOM elements and mutable instances** (marker pool, infoWindow instance, dropListener).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages installed and version-confirmed from filesystem
- Architecture patterns: HIGH — verified against official Google Maps docs and Zustand 5.x source
- Pitfalls: HIGH — sourced from official docs + direct codebase inspection
- SVG marker design: MEDIUM — reference design from old prototype, final dimensions are implementation decisions

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (Google Maps API is stable; Zustand 5.x is stable)
