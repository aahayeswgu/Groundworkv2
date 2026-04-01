# Phase 6: Planner - Research

**Researched:** 2026-03-31
**Domain:** Zustand persist migration, date-keyed state, planner UI (stops, notes, activity log, calendar, month view)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single-column layout in the sidebar — stops list on top, notes section below. NOT the old app's two-column layout.
- **D-02:** All planner content scrolls vertically within the sidebar. Collapsible sections for stops, activity log, and notes to manage vertical space.
- **D-03:** Zustand persist version bumped to 2 with migration function. PlannerSlice added to `partialize` alongside pins.
- **D-04:** PlannerSlice state keyed by date (ISO date string, e.g., "2026-04-01"). Each day has: stops array, notes (multi-page), activity log entries.
- **D-05:** Store ISO date strings in Zustand, not Date objects — Date objects don't deserialize correctly from persist.
- **D-06:** Stale planner data older than 30 days purged on app startup.
- **D-07:** Planned stops displayed as ordered list with business name, address, and status (pending/visited/skipped).
- **D-08:** Add stops from: pin info window ("Add to Plan" button), route confirm panel ("Send to Planner" button), sidebar pin list ("+ Plan" button).
- **D-09:** Mark stops as visited, skipped, or pending via tap/click status toggle on each stop.
- **D-10:** Stats bar shows: planned count, visited count, skipped count for current day.
- **D-11:** Daily notes with multi-page pagination — same as old app. Add page, delete page, prev/next page navigation.
- **D-12:** Notes auto-save on input (debounced).
- **D-13:** Timestamped activity log per day — entries for stop visits, route starts, notes added. Collapsible section.
- **D-14:** Privacy toggle — user can disable activity logging. When disabled, no entries recorded.
- **D-15:** Prev/next day arrows, "Today" quick button, inline calendar date picker.
- **D-16:** Switching dates saves current day's data and loads the selected day's data.
- **D-17:** Month view toggle — shows calendar grid with dots on days that have stops/notes.
- **D-18:** The existing "PINS" and "PLANNER" tab buttons in Sidebar.tsx become functional. Controlled state switches between PinList and PlannerPanel. DiscoverPanel overrides both when discoverMode is active.
- **D-19:** "Send to Planner" button in RouteConfirmPanel copies current route stops to today's planner stops.
- **D-20:** "Route It" button in planner sends planner stops to the route system for optimization.

### Claude's Discretion

- Exact PlannerSlice state shape details
- Component decomposition (PlannerPanel, PlannerStopItem, PlannerNotes, PlannerActivityLog, PlannerCalendar, etc.)
- Collapsible section implementation (CSS transitions vs headless UI)
- Activity log entry format
- Month view calendar component design
- How "Route It" interacts with the existing RouteSlice

### Deferred Ideas (OUT OF SCOPE)

- Voice dictation for notes — v1.2 (browser Speech API)
- GPS auto-check-in (auto-mark visited when near stop) — v1.2
- Supabase sync for planner data — after auth is added
- Activity log in Supabase — depends on planner Supabase sync
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUN-05 | Zustand schema version bumped with migration before adding Planner state to persist | Version bump pattern + migration branch verified from existing store structure |
| FOUN-06 | PlannerSlice added to Zustand store with planned stops, notes, activity log persisted to localStorage | Date-keyed state shape, partialize pattern, 30-day purge logic all documented |
| PLAN-01 | Planner tab in sidebar — clicking switches between Pins and Planner views | Sidebar.tsx tab buttons already in DOM; need `useState<"pins"\|"planner">` + content branch |
| PLAN-02 | Today's planned stops displayed as ordered list with business name, address, status | PlannerStop type, PlannerStopItem component pattern documented |
| PLAN-03 | User can add stops from pin info window, route confirm panel, or sidebar | Three integration points mapped: MarkerLayer, RouteConfirmPanel, PinListItem |
| PLAN-04 | User can mark stops as visited, skipped, or pending | Status cycle toggle pattern from old app documented |
| PLAN-05 | Daily notes text area for free-form notes about the day | Multi-page notes model: `notes: string[]` indexed by page number, debounced save |
| PLAN-06 | Date navigation — prev/next day arrows, today button, calendar date picker | Inline calendar component (hand-rolled, 7-column CSS grid), month nav, day select |
| PLAN-07 | Activity log per day — timestamped entries for stop visits, route starts, notes added | Activity log structure: `{ time: string, text: string }[]`, privacy toggle, collapsible |
| PLAN-08 | Stats display — planned count, visited count, skipped count for current day | Derived from `plannerDays[date].stops` — computed on render, not stored separately |
| PLAN-09 | Planner stops persist to localStorage via Zustand persist keyed by date | Date-keyed `Record<string, DayPlan>` pattern with 30-day purge on startup |
| PLAN-10 | Clean, minimal UI — cleaner than original Groundwork planner | Single-column, standard app typography (no serif "paper" look), collapsible sections |
</phase_requirements>

---

## Summary

Phase 6 delivers the full planner feature: a date-keyed daily work list in the sidebar that persists to localStorage via Zustand, with stop management, multi-page notes, activity logging, and calendar navigation. The core technical work has two parts: (1) a Zustand persist schema migration from version 1 to version 2 that safely adds `planner` to `partialize`, and (2) building the PlannerPanel component tree inside the existing sidebar tab system.

The old Groundwork app's planner is the primary feature reference. Its data model (stops array, notes pages, activity log, date-keyed localStorage keys) maps directly to the Zustand state shape. The UI layout differs: the old app used a two-column layout (stops left, notes right) which is explicitly NOT wanted — instead, single-column with collapsible sections. The old app's note page shifting logic (renumbering pages on delete) must be ported into Zustand state management rather than direct localStorage manipulation.

The biggest risk is the Zustand persist migration. Adding `planner` to `partialize` without bumping `version` causes silent hydration failures where the migrate function is not called and existing users see a broken initial state. The second risk is activity log bloat: the log must be capped (not persisted unboundedly) and stored in the per-day DayPlan object with a 30-day purge enforced on startup.

**Primary recommendation:** Build in this order — (1) PlannerSlice + store migration, (2) Sidebar tab wiring, (3) PlannerPanel with stops + stats, (4) notes pagination, (5) activity log + privacy toggle, (6) date navigation + inline calendar, (7) month view, (8) integration points (PinListItem "+ Plan", RouteConfirmPanel "Send to Planner", "Route It" button).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.12 (already installed) | State management + persist middleware | Already the project standard; PlannerSlice is a fourth feature slice |
| react | 19.2.4 (already installed) | Component rendering, useState/useCallback | Project standard |
| tailwindcss | ^4 (already installed) | Styling | Project standard |
| @dnd-kit/sortable | ^10.0.0 (already installed) | Drag-to-reorder stops in planner | Already used in RouteConfirmPanel — reuse exact same pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | No new dependencies needed | Everything required is already installed |

**No new packages needed.** The planner is built entirely from existing project dependencies.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled inline calendar | react-calendar, react-datepicker | External libraries add ~50KB bundle weight for a simple 7-column grid; the old app's calendar is ~80 lines of vanilla JS and trivially ports to React JSX |
| CSS max-height transition for collapsibles | @radix-ui/react-collapsible | Radix is correct for accessibility-critical components; for this internal tool sidebar, CSS transitions are sufficient and keep the bundle lean |

---

## Architecture Patterns

### Recommended Project Structure

```
app/features/planner/
├── planner.store.ts          # Zustand slice — PlannerSlice type + createPlannerSlice
├── PlannerPanel.tsx          # Main panel: date header, stats bar, content sections
├── PlannerStopItem.tsx       # Single stop row: status badge, label, address, drag handle
├── PlannerNotes.tsx          # Notes textarea with page pagination controls
├── PlannerActivityLog.tsx    # Collapsible activity log with privacy toggle
└── PlannerCalendar.tsx       # Inline calendar picker (day grid + month nav)

app/types/
└── planner.types.ts          # PlannerStop, DayPlan, ActivityEntry, PlannerStopStatus
```

Changes to existing files:
- `app/store/index.ts` — version bump to 2, add PlannerSlice to AppStore, add `planner` to partialize, extend migrate
- `app/components/Sidebar.tsx` — add `useState<"pins" | "planner">`, wire tab buttons, add PlannerPanel branch
- `app/features/pins/PinListItem.tsx` — add "+ Plan" button alongside existing "+ Route"
- `app/features/map/MarkerLayer.tsx` — add "Add to Plan" button in InfoWindow
- `app/features/route/RouteConfirmPanel.tsx` — add "Send to Planner" button

### Pattern 1: Date-Keyed State Shape

**What:** `plannerDays: Record<string, DayPlan>` where key is ISO date string "YYYY-MM-DD". Each day has its own stops, notes pages, activity log.

**When to use:** Any state that needs per-day isolation with date navigation and persistence.

**The shape:**

```typescript
// app/types/planner.types.ts

export type PlannerStopStatus = "planned" | "visited" | "skipped";

export interface PlannerStop {
  id: string;               // crypto.randomUUID()
  pinId: string | null;     // linked pin id, null for ad-hoc
  label: string;
  address: string;
  lat: number;
  lng: number;
  status: PlannerStopStatus;
  addedAt: string;          // ISO datetime string — NOT Date object
  visitedAt: string | null; // ISO datetime string — NOT Date object
}

export interface ActivityEntry {
  time: string;   // "9:15 AM" — formatted for display
  text: string;   // "Visited Acme Corp"
}

export interface DayPlan {
  stops: PlannerStop[];
  notes: string[];       // index 0 = page 1, index 1 = page 2, etc.
  activityLog: ActivityEntry[];
}

export interface PlannerSlice {
  plannerDays: Record<string, DayPlan>;   // keyed by "YYYY-MM-DD"
  activePlannerDate: string;              // ISO date string "YYYY-MM-DD"
  trackingEnabled: boolean;               // privacy toggle
  activeNotesPage: Record<string, number>; // current page per date (session-only, not persisted)
  calendarOpen: boolean;                  // inline calendar visibility (session-only)
  monthViewOpen: boolean;                 // month view toggle (session-only)

  // Actions
  setActivePlannerDate: (date: string) => void;
  addPlannerStop: (stop: PlannerStop) => void;
  removePlannerStop: (id: string) => void;
  setPlannerStopStatus: (stopId: string, status: PlannerStopStatus) => void;
  addNotesPage: () => void;
  deleteNotesPage: (pageIndex: number) => void;
  setNotesPage: (pageIndex: number, text: string) => void;
  setActiveNotesPage: (date: string, page: number) => void;
  addActivityEntry: (entry: ActivityEntry) => void;
  setTrackingEnabled: (enabled: boolean) => void;
  setCalendarOpen: (open: boolean) => void;
  setMonthViewOpen: (open: boolean) => void;
  purgeStaleDays: () => void;             // removes days older than 30 days
}
```

**Important:** `activeNotesPage` and `calendarOpen` and `monthViewOpen` are NOT persisted (session-only UI state). Only `plannerDays`, `activePlannerDate`, and `trackingEnabled` go into `partialize`.

### Pattern 2: Zustand Persist Version Migration

**What:** Every time `partialize` gains a new top-level key, bump `version` and add a migration branch. This is mandatory — skipping it causes silent hydration failures.

**Current store state (`app/store/index.ts`):**

```typescript
// CURRENT (version 1 — persists only { pins })
version: 1,
partialize: (state) => ({ pins: state.pins }),
migrate: (persisted, version) => {
  if (version === 0) {
    // ... existing v0->v1 migration
  }
  return persisted as AppStore;
},
```

**Required change (version 2 — adds planner):**

```typescript
// AFTER (version 2 — persists { pins, planner })
version: 2,
partialize: (state) => ({
  pins: state.pins,
  planner: {
    plannerDays: state.plannerDays,
    activePlannerDate: state.activePlannerDate,
    trackingEnabled: state.trackingEnabled,
  },
}),
migrate: (persisted, version) => {
  if (version === 0) {
    const s = persisted as { pins?: Array<{ notes: unknown }> };
    s.pins?.forEach((p) => {
      if (typeof p.notes === "string") {
        p.notes = p.notes ? [{ text: p.notes, date: new Date().toISOString() }] : [];
      }
    });
  }
  if (version < 2) {
    // planner key didn't exist in v1 — initialize it
    const s = persisted as Record<string, unknown>;
    s.planner = {
      plannerDays: {},
      activePlannerDate: new Date().toISOString().slice(0, 10),
      trackingEnabled: true,
    };
  }
  return persisted as AppStore;
},
```

**Note on store key name:** The current store name is `"groundwork-pins-v1"`. The name does NOT need to change when bumping the version number — the `version` field inside the persist config handles migration, not the key name. Renaming the storage key would cause ALL existing data (pins) to be lost for current users.

### Pattern 3: DayPlan Helper Function

**What:** A helper that returns a guaranteed-non-null DayPlan for a given date. Centralizes the "create if absent" logic.

```typescript
// In planner.store.ts or a planner-utils.ts
function getOrCreateDay(days: Record<string, DayPlan>, date: string): DayPlan {
  return days[date] ?? { stops: [], notes: [""], activityLog: [] };
}
```

Notes always initialize with `[""]` (one empty page), never an empty array — this avoids null checks throughout the UI.

### Pattern 4: Sidebar Tab Wiring

**What:** The existing Sidebar.tsx has two hardcoded tab buttons with no state. Add `useState<"pins" | "planner">` and wire both buttons.

```typescript
// Sidebar.tsx — minimal change
const [activeTab, setActiveTab] = useState<"pins" | "planner">("pins");
const discoverMode = useStore((s) => s.discoverMode);

const content = discoverMode
  ? <DiscoverPanel />
  : activeTab === "planner"
    ? <PlannerPanel />
    : <PinList onEditPin={onEditPin ?? (() => {})} />;
```

Tab buttons need: active/inactive styling bound to `activeTab` state, `onClick` to `setActiveTab`.

### Pattern 5: Notes Multi-Page Pagination

**What:** Notes are stored as `string[]` in the DayPlan. Index 0 = page 1. Page navigation changes `activeNotesPage[date]` (session state). Adding a page appends `""` to the array. Deleting page N shifts all pages above N down by one (never delete index 0 / page 1).

**Old app logic translated to Zustand:**

```typescript
// Add page
addNotesPage: () =>
  set((s) => {
    const date = s.activePlannerDate;
    const day = getOrCreateDay(s.plannerDays, date);
    const newDays = {
      ...s.plannerDays,
      [date]: { ...day, notes: [...day.notes, ""] },
    };
    const newPage = day.notes.length; // 0-indexed: new page is at index day.notes.length
    return {
      plannerDays: newDays,
      activeNotesPage: { ...s.activeNotesPage, [date]: newPage },
    };
  }),

// Delete page (never delete index 0)
deleteNotesPage: (pageIndex: number) =>
  set((s) => {
    if (pageIndex === 0) return s;
    const date = s.activePlannerDate;
    const day = getOrCreateDay(s.plannerDays, date);
    const newNotes = day.notes.filter((_, i) => i !== pageIndex);
    const goTo = Math.max(0, pageIndex - 1);
    return {
      plannerDays: { ...s.plannerDays, [date]: { ...day, notes: newNotes } },
      activeNotesPage: { ...s.activeNotesPage, [date]: goTo },
    };
  }),
```

**Debounced save:** Use `useCallback` with a `useRef` debounce timer in `PlannerNotes.tsx`. Delay 800ms.

### Pattern 6: 30-Day Purge on Startup

**What:** `purgeStaleDays` removes all `plannerDays` entries where the key date is older than 30 days from today. Called in `StoreHydration.tsx` after rehydration.

```typescript
purgeStaleDays: () =>
  set((s) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const filtered = Object.fromEntries(
      Object.entries(s.plannerDays).filter(([date]) => date >= cutoffStr)
    );
    return { plannerDays: filtered };
  }),
```

**Call site:** Add `store.purgeStaleDays()` in `StoreHydration.tsx` after `store.rehydrate()`.

### Pattern 7: Inline Calendar (Hand-Rolled)

**What:** A 7-column CSS grid calendar rendered from JavaScript date math. No external library. Matches the old app's calendar exactly but as React JSX.

**Structure:**
- Month/year header with prev/next month buttons
- Day-of-week header row (Su Mo Tu We Th Fr Sa)
- Day cells: 7-column grid, `firstDayOfMonth` empty cells to offset
- Each cell: highlights today (border), selected date (filled), has-data dot (green dot below number)
- Today button + Close button in footer
- Toggle open/close via `calendarOpen` state

**Has-data detection:** A day has data if `plannerDays[dateStr]` exists and has any stops, notes content, or activity log entries.

```typescript
function dayHasData(plannerDays: Record<string, DayPlan>, dateStr: string): boolean {
  const day = plannerDays[dateStr];
  if (!day) return false;
  return (
    day.stops.length > 0 ||
    day.activityLog.length > 0 ||
    day.notes.some((n) => n.trim().length > 0)
  );
}
```

### Pattern 8: Activity Log

**What:** Per-day array of `{ time: string, text: string }`. Appended by `addActivityEntry`. Privacy toggle (`trackingEnabled`) gates all appends — when false, no entries written. Collapsible section with CSS max-height transition.

**Entry format (matching old app):**
```typescript
const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
// → "9:15 AM"
```

**Log triggers in v1.1 scope:**
- Stop marked visited: "Visited [label]"
- Stop marked skipped: "Skipped [label]"
- Stop added to planner: "Planned: [label]"
- Route started from planner: "Route started with [N] stops"
- Route stops sent to planner: "Added [N] stops from route"

**Privacy toggle:** `trackingEnabled` is persisted (included in `partialize`). Default: `true`. When `false`, `addActivityEntry` is a no-op.

### Pattern 9: Stats Bar

**What:** Derived counts from the active day's stops array. No separate state needed — computed inline in PlannerPanel.

```typescript
const day = plannerDays[activePlannerDate] ?? { stops: [], notes: [""], activityLog: [] };
const planned = day.stops.filter((s) => s.status === "planned").length;
const visited = day.stops.filter((s) => s.status === "visited").length;
const skipped = day.stops.filter((s) => s.status === "skipped").length;
```

### Pattern 10: "Send to Planner" from RouteConfirmPanel

**What:** A button in RouteConfirmPanel that calls `addPlannerStop` for each `routeStop` in the current route. Converts `RouteStop` → `PlannerStop`.

```typescript
function handleSendToPlanner() {
  const today = new Date().toISOString().slice(0, 10);
  setActivePlannerDate(today);
  routeStops.forEach((rs) => {
    addPlannerStop({
      id: crypto.randomUUID(),
      pinId: rs.id,       // RouteStop.id is pin.id when sourced from a pin
      label: rs.label,
      address: rs.address,
      lat: rs.lat,
      lng: rs.lng,
      status: "planned",
      addedAt: new Date().toISOString(),
      visitedAt: null,
    });
  });
  if (trackingEnabled) {
    addActivityEntry({ time: formatTime(), text: `Added ${routeStops.length} stops from route` });
  }
}
```

**Dedup:** Before adding, check if a stop with the same `pinId` already exists for today. If it does, skip it rather than creating a duplicate.

### Pattern 11: "Route It" from PlannerPanel

**What:** A button in PlannerPanel that populates RouteSlice with today's planned stops (pending + visited status both included, or only pending — TBD by Claude's discretion). Calls `addStop` from RouteSlice for each planner stop.

```typescript
function handleRouteIt() {
  clearRoute();
  day.stops.forEach((ps) => {
    const routeStop: RouteStop = {
      id: ps.pinId ?? ps.id,  // prefer pinId for consistency with route dedup
      label: ps.label,
      address: ps.address,
      lat: ps.lat,
      lng: ps.lng,
    };
    addStop(routeStop);
  });
  addActivityEntry({ time: formatTime(), text: `Route started with ${day.stops.length} stops` });
}
```

**Key:** This is a one-way copy operation, not a binding. `clearRoute` wipes route state without affecting planner state (per Pitfall 18 analysis).

### Anti-Patterns to Avoid

- **Storing Date objects in Zustand:** `new Date()` in state will serialize to ISO string on persist write but deserialize as a string (not Date) on rehydration. Always store ISO strings; construct Date objects at display/compute time.
- **Using routeStops as backing state for planner:** Route state is session-ephemeral. Planner needs its own persisted slice.
- **Skipping version bump on partialize change:** Always bump `version` when adding new keys to `partialize`. Silent hydration failures are the cost of skipping this.
- **Persisting activityLog unboundedly:** The 30-day purge handles stop/notes growth but activity logs can grow within a single day. Cap at 100 entries per day.
- **Calling setContent() on InfoWindow:** The "Add to Plan" button in MarkerLayer must mutate DOM in-place, same as the existing "Add to Route" button — never call `infoWindow.setContent()`.
- **Persisting activeNotesPage or calendarOpen:** These are UI state, not data. Exclude from `partialize`. They reset to defaults on app reload (fine — page 1, calendar closed).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-to-reorder stops | Custom drag logic | `@dnd-kit/sortable` (already installed) | Same pattern as RouteConfirmPanel — exact reuse |
| Debounce for notes autosave | lodash debounce | `useRef` with `setTimeout`/`clearTimeout` | One-liner with no import; keep it simple |
| Calendar date math | date-fns, dayjs | Native `new Date(year, month, 1).getDay()` + `new Date(year, month+1, 0).getDate()` | Old app proves 30 lines of vanilla JS is sufficient; no lib needed |
| UUID for stop IDs | nanoid, uuid package | `crypto.randomUUID()` | Built-in browser API, available in all modern browsers and Node 19+ |

---

## Common Pitfalls

### Pitfall 1: Zustand Persist Version Not Bumped (CRITICAL)

**What goes wrong:** Adding `planner` to `partialize` without incrementing `version` from 1 to 2. Existing users have localStorage with `{ pins: [...] }`. When Zustand hydrates and finds no `planner` key, it silently falls back to initial state. If the migrate function was not updated either, there is no error — the app just initializes with empty planner state and may reset pin data if the migration code has a bug.

**Why it happens:** "It's just adding new state, not changing existing state" — the version bump feels unnecessary.

**How to avoid:** Version 1 → 2 bump is mandatory. Write the `version < 2` migration branch that adds `planner: { plannerDays: {}, activePlannerDate: today, trackingEnabled: true }` to the persisted object.

**Warning signs:** No `version: 2` in `store/index.ts` after this phase ships.

**Source:** PITFALLS.md Pitfall 12 (HIGH confidence, project-specific)

---

### Pitfall 2: Date Object in State

**What goes wrong:** `activePlannerDate: new Date()` in the initial state. Zustand serializes this to `"2026-04-01T00:00:00.000Z"` on persist. On rehydration, it comes back as a string, not a Date. Code that calls `.toLocaleDateString()` on it throws `TypeError: activePlannerDate.toLocaleDateString is not a function`.

**Why it happens:** Using `new Date()` as a default feels natural.

**How to avoid:** Initial state: `activePlannerDate: new Date().toISOString().slice(0, 10)`. All date computations in actions reconstruct Date objects from the string: `new Date(s.activePlannerDate)`.

**Source:** CONTEXT.md D-05 + STATE.md accumulated decisions (HIGH confidence)

---

### Pitfall 3: Activity Log Grows Unbounded Within a Day

**What goes wrong:** Every stop status toggle appends to `activityLog`. A rep toggling stops back and forth creates dozens of entries per day. 365 days × 30 entries/day = ~11,000 entries in localStorage. With 30-day purge, the cap is 30 × 30 = 900 entries max — still potentially large per write.

**Why it happens:** Append-only log with no cap.

**How to avoid:** Cap `activityLog` at 100 entries per day in `addActivityEntry`:
```typescript
addActivityEntry: (entry) =>
  set((s) => {
    const date = s.activePlannerDate;
    const day = getOrCreateDay(s.plannerDays, date);
    const newLog = [...day.activityLog, entry].slice(-100); // keep last 100
    return { plannerDays: { ...s.plannerDays, [date]: { ...day, activityLog: newLog } } };
  }),
```

**Source:** PITFALLS.md Pitfall 16 (HIGH confidence)

---

### Pitfall 4: Notes Page Delete Index Off-By-One

**What goes wrong:** Deleting page index 2 (page 3 in display) shifts pages incorrectly. Old app used `localStorage.removeItem` then manually shifted keys. Zustand version uses `array.filter((_, i) => i !== pageIndex)` which automatically shifts — but if page indices are displayed as 1-based to the user and stored as 0-based, the delete button passes the wrong index.

**Why it happens:** 1-based display vs. 0-based array indexing confusion.

**How to avoid:** Always store and compute with 0-based indices internally. Convert to 1-based only at the display layer: `Page ${activeNotesPage[date] + 1} / ${day.notes.length}`. The delete button passes `activeNotesPage[date]` (0-based), never `pageNumber - 1` computed at call time.

**Source:** Old app notes pagination analysis (MEDIUM confidence — derived from old app logic)

---

### Pitfall 5: "Send to Planner" Creating Duplicate Stops

**What goes wrong:** Rep clicks "Send to Planner" twice (or adds the same pin from multiple entry points). The planner now has duplicate stops for the same business.

**Why it happens:** No dedup check before `addPlannerStop`.

**How to avoid:** In `addPlannerStop`, check if a stop with the same `pinId` already exists in today's stops:
```typescript
addPlannerStop: (stop) =>
  set((s) => {
    const date = s.activePlannerDate;
    const day = getOrCreateDay(s.plannerDays, date);
    // Dedup by pinId (when sourced from a pin) or id
    const alreadyExists = day.stops.some(
      (existing) => (stop.pinId && existing.pinId === stop.pinId) || existing.id === stop.id
    );
    if (alreadyExists) return s; // no-op
    return { plannerDays: { ...s.plannerDays, [date]: { ...day, stops: [...day.stops, stop] } } };
  }),
```

**Source:** Architecture pattern analysis (MEDIUM confidence — derived from route dedup pattern)

---

### Pitfall 6: InfoWindow "Add to Plan" Calling setContent()

**What goes wrong:** Adding the "Add to Plan" button to MarkerLayer's InfoWindow by rebuilding the content and calling `infoWindow.setContent()` causes the info window to re-render, losing position and triggering layout shifts.

**Why it happens:** The natural React instinct is to re-render when state changes.

**How to avoid:** Follow the existing pattern in `MarkerLayer.tsx` — the "Add to Plan" button is created with `document.createElement("button")` and mutates itself in-place when clicked (text changes to "Added"). Never call `infoWindow.setContent()` after the initial open.

**Source:** ARCHITECTURE.md Pattern 3 + CONTEXT.md code_context (HIGH confidence)

---

### Pitfall 7: Planner/Route State Coupling

**What goes wrong:** Using `routeStops` as the backing store for planner's daily stop list. When the rep closes the route panel or calls `clearRoute`, the planner view is wiped.

**Why it happens:** `RouteStop` already has the right shape; seems DRY.

**How to avoid:** `PlannerSlice.plannerDays[date].stops` is the source of truth for the day's plan. "Route It" copies planner stops INTO route state — one-way, at click time. `clearRoute` never affects planner state.

**Source:** PITFALLS.md Pitfall 18 (HIGH confidence)

---

## Code Examples

### PlannerSlice createPlannerSlice skeleton

```typescript
// app/features/planner/planner.store.ts
import type { StateCreator } from "zustand";
import type { PlannerSlice, PlannerStop, ActivityEntry } from "@/app/types/planner.types";

function getOrCreateDay(days: Record<string, import("@/app/types/planner.types").DayPlan>, date: string) {
  return days[date] ?? { stops: [], notes: [""], activityLog: [] };
}

export const createPlannerSlice: StateCreator<PlannerSlice> = (set, get) => ({
  plannerDays: {},
  activePlannerDate: new Date().toISOString().slice(0, 10),
  trackingEnabled: true,
  activeNotesPage: {},
  calendarOpen: false,
  monthViewOpen: false,

  setActivePlannerDate: (date) => set({ activePlannerDate: date, calendarOpen: false }),

  addPlannerStop: (stop) =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const alreadyExists = day.stops.some(
        (e) => (stop.pinId && e.pinId === stop.pinId) || e.id === stop.id
      );
      if (alreadyExists) return s;
      return { plannerDays: { ...s.plannerDays, [date]: { ...day, stops: [...day.stops, stop] } } };
    }),

  removePlannerStop: (id) =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      return { plannerDays: { ...s.plannerDays, [date]: { ...day, stops: day.stops.filter((s) => s.id !== id) } } };
    }),

  setPlannerStopStatus: (stopId, status) =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const stops = day.stops.map((stop) =>
        stop.id === stopId
          ? { ...stop, status, visitedAt: status === "visited" ? new Date().toISOString() : stop.visitedAt }
          : stop
      );
      return { plannerDays: { ...s.plannerDays, [date]: { ...day, stops } } };
    }),

  addActivityEntry: (entry) =>
    set((s) => {
      if (!s.trackingEnabled) return s;
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const newLog = [...day.activityLog, entry].slice(-100);
      return { plannerDays: { ...s.plannerDays, [date]: { ...day, activityLog: newLog } } };
    }),

  setTrackingEnabled: (enabled) => set({ trackingEnabled: enabled }),

  purgeStaleDays: () =>
    set((s) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const filtered = Object.fromEntries(
        Object.entries(s.plannerDays).filter(([date]) => date >= cutoffStr)
      );
      return { plannerDays: filtered };
    }),

  // ... notes actions (see Pattern 5)
  setCalendarOpen: (open) => set({ calendarOpen: open }),
  setMonthViewOpen: (open) => set({ monthViewOpen: open }),
  addNotesPage: () => set((s) => { /* see Pattern 5 */ return s; }),
  deleteNotesPage: (pageIndex) => set((s) => { /* see Pattern 5 */ return s; }),
  setNotesPage: (pageIndex, text) =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const notes = [...day.notes];
      notes[pageIndex] = text;
      return { plannerDays: { ...s.plannerDays, [date]: { ...day, notes } } };
    }),
  setActiveNotesPage: (date, page) =>
    set((s) => ({ activeNotesPage: { ...s.activeNotesPage, [date]: page } })),
});
```

### Store index.ts version 2 update

```typescript
// app/store/index.ts — AFTER update
import { createPlannerSlice } from "@/app/features/planner/planner.store";
import type { PlannerSlice } from "@/app/features/planner/planner.store";

export type AppStore = PinsSlice & DiscoverSlice & RouteSlice & PlannerSlice;

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createPinsSlice(...a),
      ...createDiscoverSlice(...a),
      ...createRouteSlice(...a),
      ...createPlannerSlice(...a),
    }),
    {
      name: "groundwork-pins-v1",  // DO NOT change the key name — would lose existing pin data
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pins: state.pins,
        planner: {
          plannerDays: state.plannerDays,
          activePlannerDate: state.activePlannerDate,
          trackingEnabled: state.trackingEnabled,
        },
      }),
      skipHydration: true,
      version: 2,
      migrate: (persisted, version) => {
        if (version === 0) {
          const s = persisted as { pins?: Array<{ notes: unknown }> };
          s.pins?.forEach((p) => {
            if (typeof p.notes === "string") {
              p.notes = p.notes ? [{ text: p.notes, date: new Date().toISOString() }] : [];
            }
          });
        }
        if (version < 2) {
          const s = persisted as Record<string, unknown>;
          s.planner = {
            plannerDays: {},
            activePlannerDate: new Date().toISOString().slice(0, 10),
            trackingEnabled: true,
          };
        }
        return persisted as AppStore;
      },
    }
  )
);
```

### Sidebar tab wiring

```typescript
// Sidebar.tsx — additions
const [activeTab, setActiveTab] = useState<"pins" | "planner">("pins");

// Tab buttons (replace static buttons):
<button
  onClick={() => setActiveTab("pins")}
  className={`flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-wider border-b-2 text-center transition-all duration-200
    ${activeTab === "pins" ? "text-orange border-orange" : "text-text-muted border-transparent hover:text-text-secondary"}`}
>
  Pins
</button>
<button
  onClick={() => setActiveTab("planner")}
  className={`flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-wider border-b-2 text-center transition-all duration-200
    ${activeTab === "planner" ? "text-orange border-orange" : "text-text-muted border-transparent hover:text-text-secondary"}`}
>
  Planner
</button>

// Content area:
{discoverMode
  ? <DiscoverPanel />
  : activeTab === "planner"
    ? <PlannerPanel />
    : <PinList onEditPin={onEditPin ?? (() => {})} />
}
```

---

## State of the Art

| Old Approach (old app) | New Approach (v2) | Impact |
|------------------------|-------------------|--------|
| `localStorage.setItem('gw_stops_YYYY-MM-DD', ...)` direct writes | Zustand `plannerDays` with persist middleware | Unified state management; no direct localStorage manipulation |
| Per-key localStorage for notes pages (`gw_notes_DATE_p2`) | `notes: string[]` array in DayPlan | Simpler data structure; page index = array index |
| Imperative DOM manipulation for calendar rendering | React JSX calendar component with state | Predictable, testable, React-native |
| Two-column layout (stops left, notes right) | Single-column collapsible sections | Fits sidebar width; cleaner mobile experience |
| Serialize `plannerDate = new Date()` | Store ISO date string "YYYY-MM-DD" | Survives persist/rehydrate correctly |

**Old app patterns explicitly not porting:**
- Serif "paper" fonts on notes — use standard app typography
- "Start From" home/GPS/custom section — deferred / out of scope
- Voice dictation button — deferred to v1.2
- Drag pins from sidebar to planner drop zone — old app drag-to-add is replaced by explicit "+ Plan" buttons
- "Share" and "Add Leg" route buttons in planner — not needed in v2 planner

---

## Open Questions

1. **Stop reorder in planner (drag-to-reorder)**
   - What we know: `@dnd-kit/sortable` is installed and used in RouteConfirmPanel with an identical pattern.
   - What's unclear: Context.md references CONTEXT lines 4599-4688 (stop drag-to-reorder in old app) but D-07 only specifies "ordered list" — does the user want drag-reorder or just a static ordered list?
   - Recommendation: Implement drag-to-reorder using the exact RouteConfirmPanel DndContext/SortableContext pattern. It's already available at no cost. Add `reorderPlannerStops: (stops: PlannerStop[]) => void` action to the slice.

2. **"Route It" — which stops to include**
   - What we know: D-20 says "sends planner stops to the route system for optimization." Unclear if all stops (including visited/skipped) or only pending stops are sent.
   - What's unclear: Should visited stops be excluded from routing (they've already been visited)?
   - Recommendation: Route only `status === "planned"` stops by default. This matches the intuitive UX ("I've visited these, don't route me back").

3. **Activity log — should "notes added" log on every keystroke or on blur?**
   - What we know: D-13 says "notes added" is a log entry type. D-12 says notes auto-save on input (debounced).
   - What's unclear: Log on every autosave (too noisy) or on first keystroke per session (once per page visit)?
   - Recommendation: Log "Notes updated" once per notes session: set a `notesDirty` flag on first keystroke, log when the textarea blurs (not on every debounced save).

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is pure code changes with no new external service dependencies. All required libraries (`zustand`, `@dnd-kit/sortable`, `tailwindcss`) are already installed. No new CLI tools, databases, or external APIs are introduced.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.2 |
| Config file | none detected — likely needs vitest.config.ts in Wave 0 |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUN-05 | Version bumps to 2; migration initializes `planner` key for v1 data | unit | `npx vitest run tests/store-migration.test.ts` | Wave 0 |
| FOUN-06 | PlannerSlice actions (addPlannerStop, purgeStaleDays, setPlannerStopStatus) | unit | `npx vitest run tests/planner.store.test.ts` | Wave 0 |
| PLAN-01 | Sidebar renders PlannerPanel when activeTab="planner" | unit | `npx vitest run tests/Sidebar.test.tsx` | Wave 0 |
| PLAN-02 | PlannerPanel renders stop list with correct status labels | unit | `npx vitest run tests/PlannerPanel.test.tsx` | Wave 0 |
| PLAN-03 | addPlannerStop deduplicates by pinId | unit | `npx vitest run tests/planner.store.test.ts` | Wave 0 |
| PLAN-04 | setPlannerStopStatus cycles through planned/visited/skipped; sets visitedAt on "visited" | unit | `npx vitest run tests/planner.store.test.ts` | Wave 0 |
| PLAN-05 | Notes page add/delete/navigate; deleteNotesPage never removes index 0 | unit | `npx vitest run tests/planner.store.test.ts` | Wave 0 |
| PLAN-06 | Calendar renders correct day grid for given month; dayHasData returns true for populated days | unit | `npx vitest run tests/PlannerCalendar.test.tsx` | Wave 0 |
| PLAN-07 | addActivityEntry appends entry; respects trackingEnabled=false; caps at 100 | unit | `npx vitest run tests/planner.store.test.ts` | Wave 0 |
| PLAN-08 | Stats bar counts derive correctly from stops array | unit | `npx vitest run tests/PlannerPanel.test.tsx` | Wave 0 |
| PLAN-09 | purgeStaleDays removes entries older than 30 days, keeps recent | unit | `npx vitest run tests/planner.store.test.ts` | Wave 0 |
| PLAN-10 | Visual review — single column, no serif fonts, collapsible sections | manual | N/A — visual inspection | N/A |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/planner.store.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — framework config needed if not present
- [ ] `tests/planner.store.test.ts` — covers FOUN-05, FOUN-06, PLAN-03, PLAN-04, PLAN-05, PLAN-07, PLAN-09
- [ ] `tests/store-migration.test.ts` — covers FOUN-05 migration from v1 to v2
- [ ] `tests/PlannerPanel.test.tsx` — covers PLAN-02, PLAN-08
- [ ] `tests/Sidebar.test.tsx` — covers PLAN-01
- [ ] `tests/PlannerCalendar.test.tsx` — covers PLAN-06

---

## Sources

### Primary (HIGH confidence)

- `app/store/index.ts` — Current store version, partialize shape, existing migrate function — read directly
- `app/components/Sidebar.tsx` — Current tab buttons, discoverMode pattern — read directly
- `app/features/pins/PinListItem.tsx` — "+ Route" button pattern to replicate for "+ Plan" — read directly
- `app/features/map/MarkerLayer.tsx` — InfoWindow DOM mutation pattern — read directly
- `app/features/route/route.store.ts` — RouteSlice pattern (StateCreator, actions) — read directly
- `app/features/route/RouteConfirmPanel.tsx` — DndContext/SortableContext pattern for stop reorder — read directly
- `.planning/research/PITFALLS.md` — Pitfalls 12, 13, 16, 18 (Zustand migration, date stale, log bloat, planner/route coupling) — read directly
- `.planning/research/ARCHITECTURE.md` — PlannerSlice design, Sidebar Pattern 5, integration data flows — read directly
- `.planning/phases/06-planner/06-CONTEXT.md` — All locked decisions D-01 through D-20 — read directly
- `package.json` — Confirmed: zustand ^5.0.12, @dnd-kit/sortable ^10.0.0, no new packages needed — read directly

### Secondary (MEDIUM confidence)

- `/home/wzrd/Groundwork/index.html` lines 1564-1673 — Old app planner HTML (two-column layout reference, notes pagination UI, activity log UI, calendar HTML)
- `/home/wzrd/Groundwork/index.html` lines 3159-3320 — Old app planner date navigation, inline calendar logic, save/load functions
- `/home/wzrd/Groundwork/index.html` lines 3320-3400 — Old app month view toggle and render logic
- `/home/wzrd/Groundwork/index.html` lines 3485-3555 — Old app notes pagination: notesPageKey, loadNotesPage, notesAddPage, notesDeletePage
- `/home/wzrd/Groundwork/index.html` lines 10037-10091 — Old app activity log: logActivity, refreshActivityLog, getActivityLog

### Tertiary (LOW confidence)

- None — all findings are grounded in direct code inspection of the project files and old app source.

---

## Metadata

**Confidence breakdown:**
- Store migration pattern: HIGH — read actual store code, pitfalls, and architecture docs
- PlannerSlice shape: HIGH — derived from CONTEXT.md decisions + ARCHITECTURE.md design
- Notes pagination: HIGH — read old app source directly, translated to Zustand model
- Calendar (hand-rolled): HIGH — old app calendar is 80 lines of vanilla JS, fully readable
- Activity log: HIGH — read old app logActivity + pitfall 16 analysis
- Integration points (PinListItem, MarkerLayer, RouteConfirmPanel): HIGH — read all three files
- Test infrastructure: MEDIUM — vitest installed, no config file found, need Wave 0 setup

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (stable — no external APIs in scope, all findings from project source)
