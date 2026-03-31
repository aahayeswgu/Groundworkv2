# Phase 1: Foundation - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the shared infrastructure all three features (pins, discover, route) depend on: Zustand state management with feature slices, MapContext for sharing the map instance, AdvancedMarkerElement support, and a shared MapButton component. No feature logic — just the scaffolding features plug into.

</domain>

<decisions>
## Implementation Decisions

### Store Shape
- **D-01:** Zustand store with three feature slices: `usePinStore`, `useDiscoverStore`, `useRouteStore`. Each slice owns its domain state. Cross-feature reads use selectors (e.g., route slice reads pin data via selector, not duplication).
- **D-02:** UI-only state (panel open/closed, hover, edit mode) stays in local `useState` — only shared/persistent state goes in Zustand.
- **D-03:** Store files live at `app/store/` with one file per slice plus an `index.ts` barrel export.

### Map Setup
- **D-04:** Map instance shared via React Context (`MapContext`). The existing `Map.tsx` component becomes the provider — it initializes the map and provides it to children.
- **D-05:** Use `DEMO_MAP_ID` for development to unblock AdvancedMarkerElement. Production Map ID to be configured via env var `NEXT_PUBLIC_GOOGLE_MAP_ID`.
- **D-06:** Theme switching stays as-is (CSS `data-theme` attribute) — map style updates when theme changes. No need to move theme into Zustand.

### Module Boundaries
- **D-07:** Shared components at `app/components/` (MapButton, UI primitives). Feature-specific components at `app/features/{feature}/`.
- **D-08:** Shared types at `app/types/` — pin types, discover result types, route types defined here so all features can import them.
- **D-09:** Shared utilities at `app/lib/` — Google Maps helpers, Supabase client, geocoding.
- **D-10:** Features import from `app/store/`, `app/types/`, `app/lib/`, and `app/components/` — never directly from each other's `app/features/` directories.

### Claude's Discretion
- Exact Zustand middleware choices (persist, devtools) — use what makes sense
- AdvancedMarkerElement wrapper API design — whatever pattern is cleanest for status-colored pins
- MapContext implementation details — useContext vs custom hook

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Codebase
- `.planning/codebase/ARCHITECTURE.md` — Current app structure, data flow, architectural decisions
- `.planning/codebase/STACK.md` — Current dependencies and configuration
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, component patterns, styling conventions

### Research
- `.planning/research/STACK.md` — Recommended libraries (Zustand 5, @dnd-kit, sonner), API migration notes
- `.planning/research/ARCHITECTURE.md` — Zustand slice pattern, MapContext design, imperative marker pool pattern
- `.planning/research/PITFALLS.md` — Google Maps API deprecations, AdvancedMarkerElement Map ID requirement

### Source Files to Modify
- `app/features/map/Map.tsx` — Current map initialization, MapButton local component to extract
- `app/features/map/map-styles.ts` — Theme style arrays (unchanged, but referenced by map init)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MapButton` in `app/features/map/Map.tsx:131-157` — Extract to `app/components/MapButton.tsx` as shared component
- `getStyleForTheme()` in `app/features/map/map-styles.ts` — Already clean, reuse as-is
- Google Maps loader config in `Map.tsx:21-25` — Move to shared `app/lib/google-maps.ts`

### Established Patterns
- `"use client"` only on interactive components — maintain this boundary
- Props typed inline, not as separate interfaces — continue this convention
- Feature-driven organization (`app/features/{name}/`) — extend for new features
- Tailwind utility classes with CSS custom properties for theming — continue

### Integration Points
- `app/page.tsx` composes `Sidebar`, `Map`, `MobileBottomBar` — will need to wrap with MapContext provider
- `app/layout.tsx` sets `data-theme="dark"` — map reads this for styles
- Google Maps API key from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var — add `NEXT_PUBLIC_GOOGLE_MAP_ID`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User confirmed the direction and deferred implementation details to Claude's judgment.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-31*
