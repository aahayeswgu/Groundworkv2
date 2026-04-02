# Phase 6: Planner - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Full planner implementation: Zustand schema migration, PlannerSlice, sidebar tab switching (Pins/Planner), today's stops with visit status, daily notes with multi-page pagination, activity log, date navigation with calendar, month view, privacy toggle, stats. Single-column layout in sidebar. Port all features from old Groundwork planner but with a cleaner, modern look.

</domain>

<decisions>
## Implementation Decisions

### Layout
- **D-01:** Single-column layout in the sidebar — stops list on top, notes section below. NOT the old app's two-column layout. Simpler, fits sidebar width naturally.
- **D-02:** All planner content scrolls vertically within the sidebar. Collapsible sections for stops, activity log, and notes to manage vertical space.

### Store Migration
- **D-03:** Zustand persist version bumped to 2 with migration function. PlannerSlice added to `partialize` alongside pins.
- **D-04:** PlannerSlice state keyed by date (ISO date string, e.g., "2026-04-01"). Each day has: stops array, notes (multi-page), activity log entries.
- **D-05:** Store ISO date strings in Zustand, not Date objects — Date objects don't deserialize correctly from persist.
- **D-06:** Stale planner data older than 30 days purged on app startup.

### Stops
- **D-07:** Planned stops displayed as ordered list with business name, address, and status (pending/visited/skipped).
- **D-08:** Add stops from: pin info window ("Add to Plan" button), route confirm panel ("Send to Planner" button), sidebar pin list ("+ Plan" button).
- **D-09:** Mark stops as visited, skipped, or pending via tap/click status toggle on each stop.
- **D-10:** Stats bar shows: planned count, visited count, skipped count for current day.

### Notes
- **D-11:** Daily notes with multi-page pagination — same as old app. Add page, delete page, prev/next page navigation.
- **D-12:** Notes auto-save on input (debounced).

### Activity Log
- **D-13:** Timestamped activity log per day — entries for stop visits, route starts, notes added. Collapsible section.
- **D-14:** Privacy toggle — user can disable activity logging. When disabled, no entries recorded.

### Date Navigation
- **D-15:** Prev/next day arrows, "Today" quick button, inline calendar date picker.
- **D-16:** Switching dates saves current day's data and loads the selected day's data.
- **D-17:** Month view toggle — shows calendar grid with dots on days that have stops/notes.

### Sidebar Tab Switching
- **D-18:** The existing "PINS" and "PLANNER" tab buttons in Sidebar.tsx become functional. Controlled state switches between PinList and PlannerPanel. DiscoverPanel overrides both when discoverMode is active (existing behavior).

### Integration with Route
- **D-19:** "Send to Planner" button in RouteConfirmPanel copies current route stops to today's planner stops.
- **D-20:** "Route It" button in planner sends planner stops to the route system for optimization.

### Claude's Discretion
- Exact PlannerSlice state shape details
- Component decomposition (PlannerPanel, PlannerStopItem, PlannerNotes, PlannerActivityLog, PlannerCalendar, etc.)
- Collapsible section implementation (CSS transitions vs headless UI)
- Activity log entry format
- Month view calendar component design
- How "Route It" interacts with the existing RouteSlice

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Old App (PORT SOURCE)
- `/home/wzrd/Groundwork/index.html` lines 1564-1673 — Planner HTML layout (two-column, stops, notes, activity log, calendar, pagination)
- `/home/wzrd/Groundwork/index.html` lines 3159-3320 — Planner data loading, date navigation, calendar, stop management
- `/home/wzrd/Groundwork/index.html` lines 4599-4688 — Stop drag-to-reorder
- `/home/wzrd/Groundwork/index.html` lines 4750-4945 — Route stops, planner start mode, routeStops()

### Existing Codebase
- `app/store/index.ts` — Root store with persist middleware (version must bump)
- `app/components/Sidebar.tsx` — Current sidebar with Pins/Planner tab buttons (needs controlled state)
- `app/features/route/route.store.ts` — RouteSlice (planner reads/writes route stops)
- `app/features/route/RouteConfirmPanel.tsx` — "Send to Planner" button target
- `app/features/pins/PinListItem.tsx` — Pin list item (needs "+ Plan" button)
- `app/features/map/MarkerLayer.tsx` — Pin InfoWindow (needs "Add to Plan" button)

### Research
- `.planning/research/ARCHITECTURE.md` — PlannerSlice design, sidebar tab wiring, integration points
- `.planning/research/PITFALLS.md` — Zustand migration risk, planner/route state separation, activity log bloat

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@dnd-kit/sortable` already installed — reuse for stop reorder in planner
- `useStore` Zustand hook — PlannerSlice accessed same way as all other slices
- Sidebar tab buttons already in DOM — just need controlled state
- RouteConfirmPanel has the route stops that feed into planner

### Established Patterns
- Zustand persist with `partialize` and `skipHydration` (Phase 2)
- StoreHydration client component rehydrates on mount (Phase 2)
- Feature code at `app/features/planner/`
- Single-column scrollable content in sidebar (PinList pattern)

### Integration Points
- Sidebar.tsx tab buttons → controlled `useState<"pins" | "planner">`
- PinListItem → "+ Plan" button alongside existing "+ Route" button
- MarkerLayer InfoWindow → "Add to Plan" button alongside existing Route button
- RouteConfirmPanel → "Send to Planner" button
- PlannerPanel → "Route It" button calls addStop for each planner stop

</code_context>

<specifics>
## Specific Ideas

- Port all old planner features but in a single-column layout — cleaner than the two-column original
- The old app's planner had a "paper" look with serif fonts for notes — user wants cleaner, so use the standard app typography
- Multi-page notes pagination is important (old app had it, user wants it ported)
- Activity log with privacy toggle — ported from old app
- Month view calendar with dots on active days — ported from old app
- "Route It" in planner ties everything together — planner feeds into route system

</specifics>

<deferred>
## Deferred Ideas

- Voice dictation for notes — v1.2 (browser Speech API)
- GPS auto-check-in (auto-mark visited when near stop) — v1.2
- Supabase sync for planner data — after auth is added
- Activity log in Supabase — depends on planner Supabase sync

</deferred>

---

*Phase: 06-planner*
*Context gathered: 2026-04-01*
