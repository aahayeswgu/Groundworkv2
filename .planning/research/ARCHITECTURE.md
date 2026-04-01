# Architecture Research

**Domain:** Map-centric field sales CRM (Next.js 16 App Router) — v1.1 Power Features
**Researched:** 2026-03-31 (v1.0 baseline) / updated 2026-04-01 (v1.1 Marathon + AI + Planner additions)
**Confidence:** HIGH

---

## Part 1: Existing Architecture (v1.0 baseline)

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
│   │  Planner (stub)│  │         │  Rectangle overlay           │     │
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
│  │ supabase.ts  │  │  places API  │  │ directions   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│                        External APIs                                  │
│  Supabase          Google Places API      Google Directions API      │
└─────────────────────────────────────────────────────────────────────┘
```

### Current File Structure (actual, as-built)

```
app/
├── page.tsx                          # Client component — composes shell + PinModal gate
├── layout.tsx                        # Root HTML, fonts, global CSS
├── globals.css                       # Theme variables, Tailwind @theme
│
├── components/
│   ├── Sidebar.tsx                   # Tab container (Pins / Planner stub), collapse
│   ├── MobileBottomBar.tsx           # Mobile nav (static tabs, not yet wired)
│   ├── MapButton.tsx                 # Reusable floating action button
│   ├── PlacesAutocomplete.tsx        # Address autocomplete (used by RouteConfirmPanel)
│   └── StoreHydration.tsx            # Triggers Zustand rehydrate + Supabase sync on mount
│
├── features/
│   ├── map/
│   │   ├── Map.tsx                   # Map canvas, mode controller, floating buttons
│   │   ├── MapContext.ts             # React context — exposes map instance
│   │   ├── MarkerLayer.tsx           # Imperative AdvancedMarkerElement pool
│   │   └── map-styles.ts            # Theme → Google Maps style array
│   │
│   ├── pins/
│   │   ├── PinList.tsx               # Filtered list in sidebar
│   │   ├── PinListItem.tsx           # Single row with hover/click handlers
│   │   ├── PinModal.tsx              # Create/edit modal
│   │   ├── pin-marker.ts            # SVG marker content builder per status
│   │   ├── pins.store.ts            # Zustand slice
│   │   └── sync/
│   │       ├── merge.ts             # Merge semantics for Supabase sync
│   │       └── usePinSync.ts        # Hook: localStorage hydrate + Supabase pull/push
│   │
│   ├── discover/
│   │   ├── DiscoverLayer.tsx         # Map markers for discover results
│   │   ├── DiscoverPanel.tsx         # Results list (replaces PinList in sidebar)
│   │   ├── DiscoverResultItem.tsx    # Single discover row with checkbox + quick-save
│   │   ├── discover.store.ts        # Zustand slice
│   │   ├── discover-search.ts       # Places API query loop, cancel token, dedup
│   │   ├── discover-filters.ts      # Place classification + exclusion logic
│   │   ├── discover-info.ts         # InfoWindow HTML builder + buildQuickSavePin
│   │   └── discover-marker.ts       # Marker content builder for discover results
│   │
│   └── route/
│       ├── RouteConfirmPanel.tsx     # Stop list, drag-reorder (dnd-kit), start mode, optimize
│       ├── RouteLayer.tsx            # Polyline + numbered waypoint markers
│       ├── route.store.ts           # Zustand slice
│       ├── route-service.ts         # Directions API wrapper
│       ├── route-markers.ts         # Numbered stop marker content builders
│       └── route-url.ts             # buildGoogleMapsUrl()
│
├── store/
│   └── index.ts                      # Combines slices: PinsSlice & DiscoverSlice & RouteSlice
│
├── lib/
│   ├── supabase.ts                   # Supabase client singleton
│   └── geocoding.ts                  # reverseGeocode, forwardGeocode, getCurrentGpsPosition
│
├── config/
│   └── discover-queries.ts           # Industry-specific query list (fork point)
│
└── types/
    ├── pins.types.ts                 # Pin, PinStatus, NoteEntry
    ├── discover.types.ts             # DiscoverResult
    └── route.types.ts                # RouteStop, RouteResult, StartMode
```

### Key Existing Patterns

**Zustand store composition:** Slices live in their feature folders (`pins.store.ts`, `discover.store.ts`, `route.store.ts`). `store/index.ts` composes them with `create()` + `persist` middleware. The persist layer only serializes `pins` — discover and route state is intentionally session-only (no localStorage).

**Sidebar mode switching:** `Sidebar.tsx` uses `discoverMode` from the store to swap between `<PinList />` and `<DiscoverPanel />`. The "Pins / Planner" tab row is rendered but the Planner tab has no handler yet.

**Map mode controller:** `Map.tsx` owns all interaction modes (drop pin, discover draw, route panel). Each mode is a local `useState` boolean; the map's `draggableCursor` and event listeners are set/cleared on entry/exit. MapContext publishes the live map instance so sub-features access it without prop drilling.

**DiscoverPanel replaces PinList:** When `discoverMode` is true, the sidebar content area swaps wholesale to `DiscoverPanel`. This is the pattern Marathon mode must extend.

---

## Part 2: v1.1 Integration Architecture

### New Features

1. **Marathon Mode** — accumulate discover results + route stops across multiple draw areas without clearing between searches.
2. **Ask AI (Gemini)** — per-business sales brief injected into the discover InfoWindow.
3. **Planner Tab** — daily stop management, per-stop notes, activity log.

---

### 2.1 Marathon Mode

#### What Changes

Marathon mode is a flag that controls whether `clearDiscover()` is called before each new search. In normal mode, each draw clears previous results. In Marathon mode, results accumulate.

The sidebar panel behavior also changes: in Marathon mode, `DiscoverPanel` persists across multiple draws rather than showing the "draw an area" prompt after each one.

#### State Changes — Discover Slice

Add `marathonMode: boolean` and `toggleMarathonMode()` to the existing `DiscoverSlice`. No new slice needed.

```typescript
// Additions to DiscoverSlice in discover.store.ts
marathonMode: boolean;
toggleMarathonMode: () => void;
marathonSearchCount: number;          // how many draws in this marathon session
incrementMarathonCount: () => void;
```

The `searchBusinessesInArea` function in `discover-search.ts` currently calls `setDiscoverResults([])` at the start. This must be conditional:

```typescript
// discover-search.ts — modified logic
const { marathonMode } = useStore.getState();
if (!marathonMode) {
  setDiscoverResults([]);
}
// Dedup logic already uses a `seen` Set — extend it to include existing results in marathon mode:
const existing = useStore.getState().discoverResults;
existing.forEach((r) => seen.add(r.placeId));
```

#### UI Integration Points

- **Map.tsx** — Marathon mode button in the floating control group. Toggles `marathonMode`. When active, the Discover button's draw-to-search behaviour accumulates instead of replacing.
- **DiscoverPanel.tsx** — Show a marathon session header when `marathonMode && marathonSearchCount > 0`, displaying the count of areas searched and total results. A "Clear All" button replaces the per-search "Close" button.
- **Sidebar.tsx** — No change needed. `discoverMode` still controls panel visibility.

#### Data Flow

```
User enables Marathon Mode (toggles flag in discover slice)
    ↓
User enters discover mode → draws area → searchBusinessesInArea()
    ↓
discover-search.ts: sees marathonMode=true → skips clearDiscover()
    pre-seeds `seen` Set with existing discoverResults placeIds
    runs DISCOVER_QUERIES, deduping against all existing results
    ↓
discover slice: setDiscoverResults([...existing, ...newUnique])
    incrementMarathonCount()
    ↓
DiscoverPanel: shows accumulated list with "X areas searched" header
    ↓
User draws another area → repeats; results keep accumulating
    ↓
User hits "Clear All" → clearDiscover() called, marathonSearchCount reset
```

#### Component Boundaries

| Component | Change Type | What Changes |
|-----------|-------------|--------------|
| `discover.store.ts` | Extend slice | Add `marathonMode`, `marathonSearchCount`, `toggleMarathonMode`, `incrementMarathonCount` |
| `discover-search.ts` | Modify function | Conditional clear; pre-seed dedup set from existing results; call `incrementMarathonCount` |
| `Map.tsx` | Add button | Marathon toggle `MapButton` in floating controls |
| `DiscoverPanel.tsx` | Extend UI | Show marathon session header + "Clear All" vs "Close" |
| `store/index.ts` | No change | Slice composition unchanged |

---

### 2.2 Ask AI (Gemini) Integration

#### Architecture Decision: API Route Proxy

The Gemini API key must not be exposed in the browser bundle. Use a Next.js API route (`app/api/ask-ai/route.ts`) as a server-side proxy. The client POSTs structured business data; the server calls Gemini and returns the brief. This is the standard pattern for Next.js + external AI APIs.

```
Browser (DiscoverLayer / discover-info.ts)
    → POST /api/ask-ai  { placeId, name, type, address, rating }
    → app/api/ask-ai/route.ts (server-side)
        → @google/genai SDK → Gemini API (GEMINI_API_KEY env var, server-only)
    ← { brief: string }
    ← InfoWindow DOM updated in-place (no React re-render)
```

**Why not call Gemini directly from the browser:** The `@google/genai` package can run in the browser but requires exposing the API key via a `NEXT_PUBLIC_` env var — a security risk even for internal tooling. A thin API route costs ~10 lines and keeps the key server-side.

#### New Files

```
app/
├── api/
│   └── ask-ai/
│       └── route.ts               # Server route: POST handler → Gemini call → returns brief
│
└── features/
    └── discover/
        └── gemini-brief.ts        # Client helper: fetchAIBrief(placeData) → string
```

#### `app/api/ask-ai/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  const { name, type, address, rating } = await req.json();

  const prompt = `You are a sales rep assistant. Write a 2-3 sentence field sales brief for:
Business: ${name}
Type: ${type}
Address: ${address}
Rating: ${rating ?? "N/A"}

Focus on: likely decision-maker, best approach, any relevant context for a first cold visit.
Be concise and actionable. No fluff.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return NextResponse.json({ brief: response.text });
}
```

#### `app/features/discover/gemini-brief.ts`

```typescript
export interface BriefRequest {
  name: string;
  type: string;
  address: string;
  rating: number | null;
}

export async function fetchAIBrief(data: BriefRequest): Promise<string | null> {
  try {
    const res = await fetch("/api/ask-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.brief ?? null;
  } catch {
    return null;
  }
}
```

#### Integration into InfoWindow

The existing `discover-info.ts` builds the InfoWindow DOM imperatively. The AI brief slot is added as a placeholder `<div>` that gets populated after the async fetch resolves. This preserves the existing pattern of in-place DOM mutation (the same technique used for the save/route buttons to avoid InfoWindow re-render loops).

```
User hovers/clicks a discover marker → InfoWindow opens (discover-info.ts)
    ↓
InfoWindow DOM rendered synchronously with all existing content
    ↓
"Ask AI" button shown (or brief loading spinner if auto-fetch)
    ↓
User clicks "Ask AI" (or auto-triggers on open)
    → fetchAIBrief({ name, type, address, rating })
    → POST /api/ask-ai
    → Gemini returns brief string
    ↓
brief container div populated in-place (no infoWindow.setContent())
    ↓
Brief text displayed in InfoWindow
```

**Auto-fetch vs. on-demand:** On-demand (button click) is recommended for v1.1. Auto-fetching on every InfoWindow open would burn API quota rapidly during a Marathon session with 50+ results. Add auto-fetch only after testing actual usage patterns.

#### State Changes

No new Zustand state needed. AI brief results are ephemeral — they live only in the InfoWindow DOM. If a brief is needed again (InfoWindow re-opened), a new fetch fires. This avoids a brief cache that would need cache invalidation logic.

**Optional future state:** `aiCache: Map<placeId, string>` in the discover slice to avoid re-fetching the same business in a marathon session. Defer to v1.2.

#### Environment Variable

Add `GEMINI_API_KEY` (no `NEXT_PUBLIC_` prefix) to `.env.local`. It is server-only.

---

### 2.3 Planner Tab

#### What the Planner Is

A daily work list: the sales rep creates a set of stops for the day (from pins or discover results), adds visit notes, and tracks what they've done. It is distinct from the Route feature, which is about navigation optimization. The Planner is about planning + logging the day.

#### New Slice: `planner.store.ts`

```typescript
// app/features/planner/planner.store.ts

export type PlannerStopStatus = "planned" | "visited" | "skipped";

export interface PlannerNote {
  text: string;
  createdAt: string;
}

export interface PlannerStop {
  id: string;           // unique planner stop ID
  pinId: string | null; // linked Pin.id if sourced from a pin (null for ad-hoc)
  label: string;
  address: string;
  lat: number;
  lng: number;
  status: PlannerStopStatus;
  notes: PlannerNote[];
  addedAt: string;
  visitedAt: string | null;
}

export interface PlannerSlice {
  plannerStops: PlannerStop[];
  activePlannerDate: string;   // ISO date string "YYYY-MM-DD"

  addPlannerStop: (stop: PlannerStop) => void;
  removePlannerStop: (id: string) => void;
  updatePlannerStop: (id: string, patch: Partial<PlannerStop>) => void;
  setPlannerStopStatus: (id: string, status: PlannerStopStatus) => void;
  addPlannerNote: (stopId: string, note: PlannerNote) => void;
  clearPlannerDay: () => void;
  setActivePlannerDate: (date: string) => void;
}
```

The planner slice is added to `store/index.ts` alongside the existing three slices. Planner stops are persisted to localStorage (add `plannerStops` to the `partialize` selector in the persist config).

#### Sidebar Integration

`Sidebar.tsx` currently renders "Pins" and "Planner" tab buttons with no active state management. The tab switching needs to become controlled state:

```typescript
// Sidebar.tsx change
const [activeTab, setActiveTab] = useState<"pins" | "planner">("pins");
// discoverMode overrides to show DiscoverPanel regardless of activeTab
```

Content area logic:
```
discoverMode=true  → <DiscoverPanel />
activeTab="pins"   → <PinList />
activeTab="planner"→ <PlannerPanel />
```

#### New Files

```
app/features/planner/
├── PlannerPanel.tsx         # Main planner tab content — stop list, date header
├── PlannerStopItem.tsx      # Single stop row: status toggle, label, notes expand
├── PlannerNoteEntry.tsx     # Note form within a stop
└── planner.store.ts        # Zustand slice
```

#### Adding Stops to Planner

Planner stops can be sourced from three places:

1. **From PinListItem** — "Add to Plan" action on pin list row (same pattern as "Add to Route").
2. **From DiscoverResultItem** — "Plan" button alongside the existing quick-save button.
3. **From PlannerPanel directly** — "Add stop" with address search (using PlacesAutocomplete, already built).

#### PlannerStop vs RouteStop

These are intentionally separate types. A `RouteStop` is for same-session navigation. A `PlannerStop` is a persisted work item with status and notes. A stop can exist in both simultaneously (a pin added to both the day plan and the route).

#### Data Flow: Add to Plan from PinList

```
User clicks "Add to Plan" on PinListItem
    ↓
Calls addPlannerStop({ ...pin fields, status: "planned", notes: [] })
    ↓
planner slice: appends to plannerStops[]
    ↓
localStorage write (via persist middleware)
    ↓
PlannerPanel re-renders with new stop
```

#### Data Flow: Mark Visited

```
User taps status toggle on PlannerStopItem
    ↓
Calls setPlannerStopStatus(id, "visited")
    ↓
planner slice: updates stop.status, sets stop.visitedAt = now
    ↓
PlannerStopItem shows checkmark; stop moves to "done" visual group
```

#### Planner Persistence

Planner stops persist to `localStorage` via the existing Zustand persist middleware. The `partialize` function in `store/index.ts` must be updated:

```typescript
// Before:
partialize: (state) => ({ pins: state.pins }),

// After:
partialize: (state) => ({ pins: state.pins, plannerStops: state.plannerStops }),
```

No Supabase sync for planner in v1.1 — it's day-ephemeral and the rep clears it each morning. Supabase sync can be added in a later milestone alongside the activity log feature.

---

## Part 3: Integrated System Overview (v1.1)

### Updated Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        app/page.tsx (Client)                         │
│              Composes shell + PinModal gate + StoreHydration         │
├───────────────────────────┬─────────────────────────────────────────┤
│   app/components/         │         app/features/map/                │
│   Sidebar.tsx             │         Map.tsx (Client)                 │
│   ┌──────────────────┐    │         ┌──────────────────────────────┐ │
│   │ tab: Pins        │    │         │  google.maps.Map instance    │ │
│   │   → PinList      │    │         │  MarkerLayer                 │ │
│   │ tab: Planner     │    │         │  DiscoverLayer               │ │
│   │   → PlannerPanel │    │         │  RouteLayer                  │ │
│   │ (discoverMode)   │    │         │  Marathon draw mode          │ │
│   │   → DiscoverPanel│    │         └──────────────────────────────┘ │
│   └──────────────────┘    │                                          │
├───────────────────────────┴──────────────────────────────────────────┤
│                      Global State Layer (Zustand)                     │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────┐  ┌────────────┐  │
│  │ pins slice │  │  discover slice  │  │  route   │  │  planner  │  │
│  │            │  │  + marathonMode │  │  slice   │  │  slice    │  │
│  └────────────┘  └─────────────────┘  └──────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                        Service Layer                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────────┐    │
│  │ supabase.ts  │  │  Places API   │  │  /api/ask-ai route.ts  │    │
│  └──────────────┘  └───────────────┘  │  (Gemini proxy)        │    │
│                                       └────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                        External APIs                                  │
│  Supabase          Google Places API      Gemini API                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Updated Project Structure (v1.1 additions marked with +)

```
app/
├── api/                               # + NEW directory
│   └── ask-ai/
│       └── route.ts                   # + Gemini API proxy (server-side)
│
├── features/
│   ├── discover/
│   │   ├── discover.store.ts          # MODIFY: add marathonMode + marathonSearchCount
│   │   ├── discover-search.ts         # MODIFY: conditional clear, accumulate dedup
│   │   ├── DiscoverPanel.tsx          # MODIFY: marathon header, "Clear All" button
│   │   ├── discover-info.ts           # MODIFY: add "Ask AI" button + brief slot
│   │   └── gemini-brief.ts           # + NEW: fetchAIBrief() client helper
│   │
│   └── planner/                       # + NEW feature directory
│       ├── planner.store.ts           # + Zustand slice
│       ├── PlannerPanel.tsx           # + Tab content component
│       ├── PlannerStopItem.tsx        # + Single stop row
│       └── PlannerNoteEntry.tsx       # + Note input form
│
├── components/
│   └── Sidebar.tsx                    # MODIFY: wire tab state, add PlannerPanel branch
│
└── store/
    └── index.ts                       # MODIFY: add PlannerSlice + plannerStops to partialize
```

---

## Part 4: Architectural Patterns

### Pattern 1: Map Instance via React Context (existing, unchanged)

**What:** `Map.tsx` owns initialization and publishes the `google.maps.Map` instance through `MapContext`. Sub-features consume it via `useContext(MapContext)`.

**Applies to v1.1:** No change needed. Marathon mode reuses the existing draw infrastructure in `Map.tsx`.

### Pattern 2: Zustand Slices per Feature (existing, extended)

**What:** Each feature owns a `*.store.ts` with its state and actions. The root store composes all slices.

**v1.1 addition:** `planner.store.ts` added as a fourth slice. The `PlannerSlice` type added to `AppStore` in `store/index.ts`.

```typescript
// store/index.ts — updated type
export type AppStore = PinsSlice & DiscoverSlice & RouteSlice & PlannerSlice;
```

### Pattern 3: Imperative InfoWindow DOM Mutation (existing, extended for AI brief)

**What:** `discover-info.ts` builds the InfoWindow content as raw DOM. Buttons mutate themselves in-place when clicked (save → pinned, add to route → added). The rule is never call `infoWindow.setContent()` after initial open — this would re-render the popup, losing position and triggering layout shifts.

**v1.1 addition:** The "Ask AI" button follows the same in-place mutation pattern. It replaces itself with a loading state, then replaces that with the brief text — all DOM manipulation, no `setContent()`.

### Pattern 4: Next.js API Route as AI Proxy (new for v1.1)

**What:** The browser never calls Gemini directly. A thin `app/api/ask-ai/route.ts` accepts POST, runs the Gemini SDK with a server-side env var, and returns the brief string.

**When to use:** Any time a third-party API key must be kept server-side in a Next.js app.

**Trade-offs:** Adds a network hop. Response time ~500ms-2s for Gemini Flash (acceptable for on-demand brief). No latency concern for auto-fetch because it's explicitly deferred to v1.2 until actual usage is measured.

### Pattern 5: Sidebar Mode Hierarchy (new for v1.1)

**What:** `Sidebar.tsx` has three content states. The hierarchy is:

1. `discoverMode=true` (from store) → always shows `DiscoverPanel`, overriding any tab selection
2. `activeTab="planner"` (local state) → shows `PlannerPanel`
3. Default → shows `PinList`

```typescript
// Sidebar.tsx content resolution
const content = discoverMode
  ? <DiscoverPanel />
  : activeTab === "planner"
    ? <PlannerPanel />
    : <PinList onEditPin={onEditPin ?? (() => {})} />;
```

This keeps `Sidebar.tsx` as a dumb container — it only decides what to show, not how features work.

---

## Part 5: Data Flows

### Marathon Discover Flow

```
User toggles Marathon Mode on (MapButton → toggleMarathonMode)
    ↓
discover slice: marathonMode = true
    ↓
User enters discover mode → draws first area
    ↓
searchBusinessesInArea(bounds):
  marathonMode=true → skip clearDiscover()
  pre-seed seen Set with existing discoverResults placeIds
  run DISCOVER_QUERIES → collect new unique results
  setDiscoverResults([...existing, ...new])
  incrementMarathonCount()
    ↓
DiscoverPanel shows: "Marathon: 1 area · 23 results"
    ↓
User draws second area in a different location
    ↓
searchBusinessesInArea(bounds):
  pre-seed seen Set now includes all 23 existing results
  adds only truly new unique results
  setDiscoverResults([...all 23, ...new unique])
  incrementMarathonCount() → count = 2
    ↓
DiscoverPanel shows: "Marathon: 2 areas · 31 results"
    ↓
User clicks "Clear All"
    ↓
clearDiscover() → resets results, count, and marathon flag
```

### Ask AI (Gemini) Flow

```
User clicks discover marker → InfoWindow opens
    ↓
discover-info.ts: builds DOM, appends "Ask AI" button
    ↓
User clicks "Ask AI"
    ↓
Button: textContent = "Thinking..." disabled=true
    ↓
fetchAIBrief({ name, type, address, rating })
    POST /api/ask-ai
    ↓
app/api/ask-ai/route.ts:
    builds prompt with business context
    GoogleGenAI.generateContent(prompt) → Gemini API
    returns { brief: "..." }
    ↓
fetchAIBrief resolves with brief string
    ↓
InfoWindow DOM: brief container div populated in-place
Button replaced with brief text block
No infoWindow.setContent() called
```

### Planner Day Flow

```
User (on PinList) clicks "Add to Plan" on a pin row
    ↓
addPlannerStop({ id: uuid, pinId: pin.id, label, address, lat, lng,
                 status: "planned", notes: [], addedAt: now, visitedAt: null })
    ↓
planner slice: plannerStops.push(stop)
    ↓
localStorage write (persist middleware)
    ↓
User switches to Planner tab in sidebar
    ↓
PlannerPanel renders plannerStops for activePlannerDate
    ↓
User is at a stop, taps "Mark Visited"
    ↓
setPlannerStopStatus(id, "visited") → updates status + visitedAt
    ↓
PlannerStopItem re-renders with visited state
    ↓
User adds a note: "Spoke with owner, follow up Friday"
    ↓
addPlannerNote(id, { text: "...", createdAt: now })
    ↓
planner slice: note appended to stop.notes[]
    ↓
localStorage write
```

---

## Part 6: Integration Points

### External Services (v1.1 additions)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Gemini API | `@google/genai` in Next.js API route (server-side proxy) | Model: `gemini-2.0-flash` — fast and cheap for short briefs. Use `GEMINI_API_KEY` env var (no `NEXT_PUBLIC_`). |
| Google Places API | Unchanged | Marathon mode accumulates results but the search mechanism is identical. |

### Internal Boundaries (v1.1 additions)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `DiscoverPanel` ↔ `planner` slice | Zustand `addPlannerStop` | DiscoverResultItem gets "Plan" button that calls planner slice action directly. |
| `PinListItem` ↔ `planner` slice | Zustand `addPlannerStop` | Same action, different call site. DRY: a shared `buildPlannerStopFromPin(pin)` helper in planner feature. |
| Browser ↔ Gemini API | `fetch('/api/ask-ai')` → Next.js route → SDK | Never bypass the proxy. The route.ts is the single call site for Gemini. |
| `planner` slice ↔ localStorage | Zustand `persist` middleware | Add `plannerStops` to `partialize`. No Supabase sync in v1.1. |
| Marathon mode ↔ `discover-search.ts` | Zustand `getState()` inside async function | Same pattern as existing `searchBusinessesInArea` — reads store state imperatively during async execution. |

---

## Part 7: Build Order

Dependencies determine sequencing. This is the recommended order within the v1.1 milestone:

1. **Planner slice + `store/index.ts` update** — Add `PlannerSlice`, update `AppStore` type and `partialize`. No UI yet. Unblocks all planner UI work.

2. **Sidebar tab wiring** — Convert "Pins / Planner" tab buttons in `Sidebar.tsx` to controlled state. Add `<PlannerPanel />` stub (empty div). Unblocks testing the tab switch before Planner is fully built.

3. **PlannerPanel + PlannerStopItem** — Build the planner UI: stop list, status toggle, basic layout. Wire "Add to Plan" from `PinListItem`.

4. **Marathon mode** — Extend `discover.store.ts` + `discover-search.ts`. Add the Marathon toggle button to `Map.tsx`. Update `DiscoverPanel.tsx` header. Self-contained; no dependencies on Planner.

5. **Gemini API route + `gemini-brief.ts`** — Create `app/api/ask-ai/route.ts` and the client helper. Test the endpoint in isolation with a curl or fetch before wiring to the InfoWindow.

6. **Ask AI in InfoWindow** — Modify `discover-info.ts` to add the "Ask AI" button and brief slot. Wire `fetchAIBrief` calls.

7. **Planner note entry + "Add to Plan" from Discover** — Complete planner UX: `PlannerNoteEntry`, "Plan" button on `DiscoverResultItem`.

---

## Part 8: Anti-Patterns to Avoid

### Anti-Pattern: Calling Gemini from the Browser

**What people do:** Set `NEXT_PUBLIC_GEMINI_API_KEY` and call the `@google/genai` SDK directly in a React component.

**Why it's wrong:** The key is exposed in the browser bundle and network traffic. Anyone with devtools can extract it.

**Do this instead:** Route all Gemini calls through `app/api/ask-ai/route.ts`. The component only calls `/api/ask-ai`.

### Anti-Pattern: Adding briefs to Zustand State

**What people do:** Store AI brief text in the discover slice: `aiBreifs: Record<placeId, string>`.

**Why it's wrong:** Briefs are ephemeral sales context, not data. They go stale as businesses change. Caching them in state adds complexity (invalidation, serialization, localStorage size) for minimal gain.

**Do this instead:** Briefs live only in the InfoWindow DOM. Re-fetch on demand. Add a simple `Map<placeId, string>` in-memory cache as a module-level variable in `gemini-brief.ts` if per-session deduplication is needed — no Zustand involvement.

### Anti-Pattern: A Separate "Marathon Slice"

**What people do:** Create `marathon.store.ts` to hold marathon state separately from the discover slice.

**Why it's wrong:** Marathon mode is a behaviour of the discover feature, not a separate domain. Splitting it creates artificial coupling where `marathonMode` must be read by `discover-search.ts` from a different slice, complicating state access.

**Do this instead:** Add `marathonMode` and `marathonSearchCount` directly to the existing `DiscoverSlice`.

### Anti-Pattern: Planner as a Route Alias

**What people do:** Repurpose `RouteSlice` stops as the planner list, adding a "planner mode" flag to the route slice.

**Why it's wrong:** Route stops are session-ephemeral, navigation-optimized, and capped at 25. Planner stops are persistent, status-tracked work items. Their lifecycles and semantics are completely different.

**Do this instead:** `PlannerSlice` is a separate slice with its own data shape. A stop can exist in both simultaneously — this is fine and expected.

---

## Sources

- Google Gen AI JavaScript SDK: https://github.com/googleapis/js-genai
- Gemini API quickstart (JavaScript): https://ai.google.dev/gemini-api/docs/quickstart
- Gemini API available models: https://ai.google.dev/gemini-api/docs/models
- Next.js API routes as secure proxy: https://nextnative.dev/blog/api-key-secure
- Next.js App Router proxy pattern: https://nextjs.org/docs/app/getting-started/proxy
- Zustand slices pattern: https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern
- Google Maps AdvancedMarkerElement migration: https://developers.google.com/maps/documentation/javascript/advanced-markers/migration

---

*Architecture research for: Map-centric field sales CRM (Groundwork v2) — v1.1 Power Features*
*Researched: 2026-04-01*
