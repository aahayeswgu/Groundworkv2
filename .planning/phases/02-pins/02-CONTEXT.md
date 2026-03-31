# Phase 2: Pins - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Full pin management: drop pins on map, CRUD with edit modal, status-colored 3D markers, info windows, sidebar list with search and filter, fly-to-pin, and localStorage persistence. No cloud sync (Phase 3), no discover integration (Phase 4), no route integration (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Edit Panel UX
- **D-01:** Pin edit form is a centered **modal overlay** on the map. Not a slide-in panel, not inline in sidebar.
- **D-02:** Modal shows all 7 editable fields: title, address, status picker, contact name, phone, follow-up date, notes.
- **D-03:** Modal works for both creating new pins (from pin-drop) and editing existing pins.

### Marker Style
- **D-04:** Compact 3D pin markers — small-ish pin with a shaft sticking up from the map and a 3D head. Status color fills the head.
- **D-05:** Markers must be clearly distinguishable from default Google Maps pins — no red teardrop shapes. Use the compact 3D style with brand-specific look.
- **D-06:** Size should be restrained so clusters don't feel cluttered — smaller than the old app's 36px markers. Prioritize scannability at high pin density.
- **D-07:** Status colors: Prospect = blue (#3B82F6), Active = green (#22C55E), Follow-Up = amber (#F59E0B), Lost = red (#EF4444).

### Info Window
- **D-08:** Use native Google Maps InfoWindow (not custom HTML overlay). Simpler implementation, acceptable styling trade-off for v1.
- **D-09:** Info window shows: pin title, status badge, address, contact name, phone, and action buttons (Edit, Delete, Add to Route placeholder).
- **D-10:** Clicking a different marker closes any open info window first (toggle behavior).

### Notes Model
- **D-11:** Claude's Discretion — activity log (array of {text, date}) is recommended over single text field. Sales reps benefit from seeing visit history. Update the Pin type accordingly.

### Claude's Discretion
- Exact modal component implementation (portal, z-index, backdrop)
- SVG marker design details (exact gradients, shadows, dimensions) — keep compact and 3D-looking
- Reverse geocoding implementation approach (Google Geocoding API)
- localStorage serialization format and loading strategy
- Search implementation (client-side filter on title/address/contact)
- Status filter chip component design
- Pin-drop mode UX (cursor change, click handler toggle)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Artifacts (Foundation)
- `app/features/pins/pins.store.ts` — Existing Zustand slice with CRUD actions, selectedPinId, hoveredPinId
- `app/types/pins.types.ts` — Pin interface and PinStatus type (may need notes field update)
- `app/store/index.ts` — Root store composition
- `app/features/map/MapContext.ts` — MapContext and useMapInstance() hook
- `app/features/map/Map.tsx` — Map initialization with mapId and AdvancedMarkerElement support
- `app/components/MapButton.tsx` — Shared floating action button component

### Existing UI
- `app/components/Sidebar.tsx` — Current sidebar shell with pin list placeholder, search, filters, stats footer
- `app/components/MobileBottomBar.tsx` — Mobile bottom nav
- `app/page.tsx` — Page composition

### Old App Reference
- `/home/wzrd/Groundwork/index.html` — Original 12k-line prototype with full pin implementation (lines 3625-4571 for pin logic, 3749-3816 for marker icon generation, 3873-3948 for info window)

### Research
- `.planning/research/ARCHITECTURE.md` — Imperative marker pool pattern via useRef, Zustand slice patterns
- `.planning/research/PITFALLS.md` — Google Maps API deprecation warnings, AdvancedMarkerElement requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PinsSlice` in `pins.store.ts` — Already has addPin, updatePin, deletePin, selectPin, hoverPin
- `MapButton` in `app/components/MapButton.tsx` — Used for pin-drop toggle button
- `useMapInstance()` hook — Provides the google.maps.Map instance for marker creation
- `Sidebar.tsx` — Has pin list placeholder, search input, filter chips, stats footer — all need to be wired up

### Established Patterns
- `"use client"` only on interactive components
- Props typed inline
- Feature code at `app/features/pins/`
- Tailwind utilities with CSS custom properties for theming
- Orange (#D4712A) brand accent, bg-bg-card, border-border, text-text-primary tokens

### Integration Points
- `Map.tsx` renders MapButton instances — pin-drop button needs click handler
- `Sidebar.tsx` renders static pin list — needs to consume `useStore` pins state
- `app/page.tsx` composes Sidebar + Map — both need to share pin state via Zustand
- AdvancedMarkerElement created imperatively via `new google.maps.marker.AdvancedMarkerElement()`

</code_context>

<specifics>
## Specific Ideas

- Markers must NOT look like default Google Maps pins — distinct 3D compact style with status colors
- Pin density is a real concern — markers should be small enough that 20+ pins in a city view don't clutter
- The old app at `/home/wzrd/Groundwork/index.html` has the full pin marker SVG generation at lines 3749-3816 — useful reference for the 3D effect but scale down the size

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-pins*
*Context gathered: 2026-03-31*
