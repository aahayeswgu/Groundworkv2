# Project Research Summary

**Project:** Groundwork v2 — Field Sales CRM (v1.1 Power Features)
**Domain:** Map-centric field sales CRM — pin management, business discovery, route optimization
**Researched:** 2026-04-01
**Confidence:** HIGH

## Executive Summary

Groundwork v2 is a map-first field sales tool for construction trade reps. The v1 foundation (pin management, Google Places discovery, route optimization, Supabase sync) is already built and working. The v1.1 milestone adds three power features that extend the existing architecture without requiring new infrastructure: Marathon Mode (multi-area discovery accumulation), Ask AI (per-business Gemini sales brief in the discover info bubble), and Planner Tab (daily stop management and visit logging). The entire milestone requires exactly one new npm dependency — `@google/genai` — and one new Supabase table (`planner_days`, deferred to a later sync milestone).

The recommended approach builds on the existing Zustand slice pattern, a Next.js Route Handler proxy for the Gemini API, and the established imperative InfoWindow DOM mutation pattern. Marathon Mode extends the DiscoverSlice with a `marathonZones: MarathonZone[]` structure (not a flat append to `discoverResults`). Ask AI briefs live only in the InfoWindow DOM with a session-level `Map<placeId, string>` cache — no Zustand state involved. Planner is a fourth independent Zustand slice with its own localStorage partition. The three features are independent in terms of data and state; their build order is determined by dependency (Planner slice first, then Marathon, then Ask AI, then Planner UI).

The key risks are API key exposure (Gemini must be server-side only via a Route Handler), data model contamination (Planner stops and Route stops have different semantics and must not share a slice), store migration discipline (adding `plannerStops` to `partialize` requires bumping the persist version and writing a migration), and Marathon Mode's multi-zone data model choice. A flat append to `discoverResults` will cause problems; a `marathonZones: MarathonZone[]` structure keyed by zone preserves spatial context and enables per-zone clear — this is the single most architecturally consequential decision in the milestone.

---

## Key Findings

### Recommended Stack

The v1.1 milestone requires minimal stack changes. The existing Next.js 16 / React 19 / Zustand 5 / Supabase / dnd-kit stack covers Marathon Mode and Planner entirely. The only addition is `@google/genai` (v1.x, GA since May 2025) for the Gemini integration. The previous `@google/generative-ai` package is deprecated, archived, and all support ends August 31, 2025 — it must not be used.

**Core technologies:**
- `@google/genai` ^1.x: Gemini API SDK — only official SDK; use `gemini-2.5-flash` (stable GA, not preview)
- `zustand` ^5.0.12: Planner slice added as fourth feature slice; `plannerStops` added to `partialize` with version bump to 2
- `@supabase/supabase-js` ^2.x: Existing client reused; `planner_days` table deferred to Supabase sync milestone
- `@dnd-kit/sortable`: Reused for Planner stop reordering (already installed)
- Next.js Route Handler (`app/api/ask-ai/route.ts`): Server-side proxy for all Gemini calls — single call site

**Critical version and model notes:**
- `gemini-2.5-flash` is the correct stable GA model string. Gemini 2.0 models are deprecated with shutdown June 1, 2026.
- Store the model name in a single config constant — never scatter the string across call sites.
- Do not use `NEXT_PUBLIC_GEMINI_API_KEY` — exposes key in browser bundle. Use `GEMINI_API_KEY` (server-only, no prefix).
- Store ISO date strings in Zustand (not `Date` objects) — `Date` objects serialize to strings but do not deserialize back, causing silent type bugs.

### Expected Features

**Must have — P1 (this milestone):**
- Marathon Mode: accumulate-across-draws with cross-area dedup, persistent rectangle overlays on map, "Build Route from Session" CTA, "Clear All" escape hatch
- Ask AI: one-tap Gemini brief in discover info bubble, grounded Google Search via `tools: [{ googleSearch: {} }]`, session cache by placeId, graceful error + retry state
- Planner: today's stops list, outcome logging (Visited / Called / Left Material / No Answer / Booked Meeting), notes per stop, mark complete, activity log
- Planner: "Send to Planner" CTA in Route Confirm panel (one-time copy, not live sync)

**Should have — P2 (before milestone closes):**
- Ask AI: show source citations from `groundingMetadata.groundingChunks`
- Marathon: area result count badges on saved rectangle overlays
- Planner: follow-up scheduling from outcome (sets `followUpDate` on pin)
- Planner: visit history section in pin edit panel

**Defer to v1.2+:**
- Ask AI for pinned businesses (outside discover flow)
- Marathon session save/resume across days (requires auth)
- Planner manager dashboard / team view (requires auth + user profiles)
- GPS auto-check-in (requires background location permission + iOS restrictions)
- Batch AI brief generation for Marathon results (validate cost model first)

### Architecture Approach

The v1.1 features integrate into the existing four-layer architecture (Server Shell → Client Components → Zustand Global State → Service Layer) without restructuring it. Marathon Mode is an extension of the DiscoverSlice. Ask AI is a thin Next.js API Route proxy with no Zustand involvement. Planner is a new fourth Zustand slice with its own persist partition. Sidebar.tsx gains controlled `activeTab` state with a three-level priority hierarchy: `discoverMode=true` always wins over tab selection, then `activeTab="planner"`, then default PinList.

**Major components for v1.1:**
1. `discover.store.ts` (modified) — adds `marathonMode`, `marathonSearchCount`, `marathonZones: MarathonZone[]`
2. `app/api/ask-ai/route.ts` (new) — server-side Gemini proxy; single call site for all AI requests
3. `app/features/planner/` (new directory) — `planner.store.ts`, `PlannerPanel.tsx`, `PlannerStopItem.tsx`, `PlannerNoteEntry.tsx`
4. `gemini-brief.ts` (new) — client helper wrapping `fetch('/api/ask-ai')` with session-level `Map<placeId, string>` cache
5. `store/index.ts` (modified) — adds `PlannerSlice` to `AppStore` type, `plannerStops` to `partialize`, bumps version to 2 with migration

### Critical Pitfalls

1. **Marathon Mode flat-array accumulation loses zone context** — Do not implement as `setDiscoverResults([...existing, ...new])`. Use `marathonZones: MarathonZone[]` where each zone tracks `{ id, bounds, results }`. The flat result view the UI renders is derived with `flatMap`. This enables per-zone clear and prevents undifferentiated result soup across draws.

2. **Gemini API key exposed via `NEXT_PUBLIC_` prefix** — All Gemini calls must go through `app/api/ask-ai/route.ts`. The key lives only in `GEMINI_API_KEY` (server-only). Never instantiate `@google/genai` in any `'use client'` component.

3. **Gemini model string pointing to a deprecated endpoint** — `gemini-2.0-flash` shuts down June 1, 2026. Use `gemini-2.5-flash`. Store the model name in a single config constant. Subscribe to the Gemini deprecation page for future migration alerts.

4. **Zustand persist schema version conflict when adding Planner slice** — Adding `plannerStops` to `partialize` without bumping `version` causes silent hydration failures that can lose existing pin data. Bump version to 2 and write a migration branch: `if (version < 2) { persisted.plannerStops = [] }`.

5. **AI quota exhausted by repeated bubble opens** — Without a cache, every InfoWindow re-open fires a new Gemini API request. The free tier is 10 RPM / 250 RPD — easily exhausted in a normal discovery session. Add `aiBrief: string | null | 'loading' | 'error'` to `DiscoverResult` (or a module-level `Map<placeId, string>`) and implement cache-first fetch before wiring the UI trigger.

6. **Marathon route stop dedup bypassed by placeId/pinId mismatch** — When a discover result is saved as a pin and then added to the route, the route stop ID is `pin.id` not `placeId`. Two Marathon zone searches returning the same business generate two pins with different IDs; dedup misses the duplicate. Fix: store `pin.sourceId = discoverResult.placeId` during quick-save, and check `sourceId` collision in `addStop`.

---

## Implications for Roadmap

Based on the combined research, the v1.1 milestone naturally decomposes into four sequential phases driven by data model dependencies.

### Phase 1: Foundation — Planner Slice and Store Migration

**Rationale:** The Planner slice is a prerequisite for all Planner UI work. The store version bump and migration must be completed first — as a standalone, reviewable change — to avoid breaking existing pin data. This phase has zero UI impact and can be verified in isolation before any feature work begins.

**Delivers:** `planner.store.ts` with full `PlannerSlice` interface, `store/index.ts` updated to `AppStore = PinsSlice & DiscoverSlice & RouteSlice & PlannerSlice`, version bumped to 2 with migration, `partialize` including `plannerStops`, Sidebar.tsx tab state wired with empty `PlannerPanel` stub. Implements 30-day localStorage retention policy for planner data (not deferred).

**Features addressed:** Planner persistence foundation; "Send to Planner" data model; planner/route separation

**Pitfalls avoided:** Zustand persist schema version conflict (Pitfall 12); planner date data stale without expiry (Pitfall 13 — 30-day purge policy implemented here, not as a follow-up)

**Research flag:** Standard patterns. Zustand slice composition and persist migration are well-documented. No phase research needed.

---

### Phase 2: Marathon Mode

**Rationale:** Marathon Mode is self-contained — it modifies DiscoverSlice and `discover-search.ts` without depending on Planner. Building it as a complete unit before the Planner UI allows focused testing of the accumulation mechanic and the multi-zone data model. The zone-keyed data structure decision must be made here; retrofitting it into a flat array later requires migrating all downstream consumers.

**Delivers:** `marathonZones: MarathonZone[]` in DiscoverSlice, conditional clear logic in `discover-search.ts`, Marathon toggle in Map.tsx floating controls, marathon session header in DiscoverPanel ("X areas searched, Y businesses found") with "Clear All" button, rectangle overlays for each searched area on the map.

**Features addressed:** Accumulate-across-draws, cross-area dedup, area rectangle count indicator, per-zone clear, "Build Route from Session" CTA

**Pitfalls avoided:** Marathon flat-array accumulation loses zone context (Pitfall 10); Marathon route stop dedup via `sourceId` on pins (Pitfall 11); duplicate Places searches on zone re-draw via normalized bounds hash cache (Pitfall 15)

**Research flag:** The `MarathonZone[]` data structure is a custom design with no direct competitor precedent. Recommend a brief implementation spike on zone-based dedup and per-zone clear UX before building the full UI. Specifically: validate that the "Clear All" vs. per-zone clear UX decision is made before component work begins.

---

### Phase 3: Ask AI (Gemini)

**Rationale:** Fully independent of both Marathon Mode and Planner. Depends only on the existing `DiscoverResult` type and the InfoWindow DOM pattern. The server-side proxy architecture must be established before any AI prompt logic is written — this is the non-negotiable first step within this phase.

**Delivers:** `app/api/ask-ai/route.ts` (Gemini proxy with `GEMINI_API_KEY` server-only), `gemini-brief.ts` (client helper with session-level `Map<placeId, string>` cache), "Ask AI" button in discover info bubble with brief loading state and brief slot, graceful error + retry state, text-only renderer (no `dangerouslySetInnerHTML`).

**Features addressed:** One-tap Gemini brief, grounded search, session cache by placeId, graceful error state; source citations (P2)

**Pitfalls avoided:** API key exposure via `NEXT_PUBLIC_` (Pitfall 7); deprecated model string — use `gemini-2.5-flash` in a config constant (Pitfall 8); LLM output injected without validation — text-only renderer, sanitize input before prompt (Pitfall 9); quota exhaustion by bubble re-opens — cache-first fetch (Pitfall 14)

**Research flag:** Validate Gemini 2.5 Flash free tier limits (250 RPD) against realistic rep behavior before launch. At 50-business Marathon sessions, first-open cache misses could exhaust the daily quota by noon. Establish cost expectations and plan the session cache design before implementation.

---

### Phase 4: Planner Tab UI

**Rationale:** Depends on Phase 1 (Planner slice). Builds the UI on top of the already-working slice. Can proceed after Phase 3 completes or in parallel since Planner and Ask AI share no dependencies. The "Send to Planner" CTA in Route Confirm panel is included here because it requires the Planner slice to be wired to the Route UI.

**Delivers:** `PlannerPanel.tsx`, `PlannerStopItem.tsx`, `PlannerNoteEntry.tsx`, "Add to Plan" action on `PinListItem` and `DiscoverResultItem`, "Send to Planner" CTA on Route Confirm panel (one-time copy from `routeStops`), outcome logging with pre-defined set, mark complete toggle, today's date header with stop count, activity log (last 7 days locally; Supabase insert-only for historical data).

**Features addressed:** Today's stops list, outcome logging, notes per stop, mark complete, activity log, "Send to Planner" from route; follow-up scheduling from outcome (P2); visit history in pin edit panel (P2)

**Pitfalls avoided:** Planner activity log as performance bottleneck — activity log entries go to Supabase `activity_log` table via insert-only pattern, not into the Zustand persisted state; keep only last 7 days locally (Pitfall 16)

**Research flag:** Standard patterns for status-toggle list UI. The "Send to Planner" one-time copy UX needs an explicit product decision before implementation: silent copy or confirm dialog. Not a research question — a design decision.

---

### Phase Ordering Rationale

- Phase 1 before everything: Store migration must not happen mid-feature. Doing it first as an isolated change keeps the diff reviewable and testable, with no UI changes to mask bugs.
- Phase 2 and Phase 3 are independent. Single-developer sequence: Marathon first (more complex data model, higher architectural risk), then Ask AI (smaller surface area, lower risk). With two developers: parallelize.
- Phase 4 last: depends on Phase 1 slice; benefits from UI patterns established in Phase 2 (DiscoverPanel extension) and Phase 3 (InfoWindow DOM mutation pattern).
- This order matches the build sequence from ARCHITECTURE.md: slice + store update → sidebar tab wiring → Marathon discover + search → Gemini route + client helper → Ask AI in InfoWindow → Planner UI + Discover "Plan" button + PlannerNoteEntry.

### Research Flags

**Needs deeper investigation before implementation:**
- **Phase 2 (Marathon Mode):** The `MarathonZone[]` data structure is custom. Recommend an implementation spike on zone-keyed dedup and per-zone clear before committing to the full UI build. Also validate the "Clear All" vs. per-zone clear UX decision upfront.
- **Phase 3 (Ask AI):** Validate Gemini 2.5 Flash free tier (250 RPD) against realistic rep behavior. Design the session cache before writing the UI trigger — cache-first is non-negotiable.

**Standard patterns — skip research-phase:**
- **Phase 1 (Store Foundation):** Zustand slice composition, persist migration, and version bumping are thoroughly documented.
- **Phase 4 (Planner UI):** Status-toggle list UI is a standard React pattern. dnd-kit sortable reuse is already proven in the Route Confirm panel.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified against official npm and GitHub repos. `@google/genai` v1.x GA confirmed May 2025. Deprecated SDK confirmed archived. `gemini-2.5-flash` confirmed stable GA. Only one new package needed for the entire milestone. |
| Features | MEDIUM-HIGH | Competitive analysis covers SPOTIO, Badger Maps, RepMove, Knockbase, Leadbeam. Multi-area accumulation is confirmed as a genuine gap not replicated by any competitor. No direct user interviews — feature prioritization is inference from competitor patterns. |
| Architecture | HIGH | Comprehensive research grounded in the actual as-built codebase. File structure, existing patterns, and integration points all verified against live code. Build order validated against real dependency graph. |
| Pitfalls | HIGH | Gemini billing and quota limits verified via official pricing pages. Google API behavior pitfalls verified via official docs. Supabase sync patterns verified via official and community sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **Gemini daily quota vs. real usage:** The 250 RPD free tier limit needs empirical validation against a realistic rep session. Session cache mitigates this significantly, but if reps do long Marathon sessions comparing 50+ businesses, first-open cache misses could consume quota rapidly. Validate in Phase 3 before launch and set a server-side rate limit on the Route Handler as a secondary safeguard.

- **Marathon Mode UX for per-zone clear:** Research recommends the `marathonZones` data structure with per-zone clear capability, but the UI flow for clearing a single zone (vs. clearing all) is not yet specified. This needs a product/UX decision before Phase 2 implementation begins to avoid building and then redesigning the component.

- **Planner activity log persistence boundary:** The recommendation is Supabase insert-only for historical log data and 7-day local window. The exact trigger for flushing the local buffer to Supabase (on app startup, on log write, on connectivity return) and the offline queuing approach need a design decision in Phase 4.

- **No Supabase sync for Planner stops in v1.1:** Planner stops are localStorage-only this milestone. This means data is lost if the user clears browser storage. Acceptable for v1.1. The activity log (Pitfall 16) should still route to Supabase from day one — keep this boundary explicit in Phase 4.

---

## Sources

### Primary (HIGH confidence)
- [@google/genai npm page](https://www.npmjs.com/package/@google/genai) — v1.x GA; install confirmed
- [googleapis/js-genai GitHub](https://github.com/googleapis/js-genai) — official SDK; unified for Gemini + Vertex AI
- [deprecated-generative-ai-js GitHub](https://github.com/google-gemini/deprecated-generative-ai-js) — confirmed deprecated; archived
- [Gemini API Models docs](https://ai.google.dev/gemini-api/docs/models) — `gemini-2.5-flash` stable GA; Gemini 2.0 shutdown June 1, 2026
- [Gemini API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart) — `GoogleGenAI` import and `generateContent` pattern
- [Gemini API Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search) — grounding mechanics, billing model
- [Gemini API Key security docs](https://ai.google.dev/gemini-api/docs/api-key) — server-only key requirement confirmed
- [Google Directions API waypoint optimization](https://developers.google.com/maps/documentation/routes/opt-way) — 25-waypoint cap
- [Google Places API (New) overview](https://developers.google.com/maps/documentation/places/web-service/op-overview) — new class hierarchy, field masks
- [Next.js App Router proxy pattern](https://nextjs.org/docs/app/getting-started/proxy) — Route Handler as AI proxy

### Secondary (MEDIUM confidence)
- [SPOTIO Sales Tracking features](https://spotio.com/features/sales-tracking/) — visit logging, GPS check-in, audit log patterns
- [SPOTIO AI Sales Tools 2026](https://spotio.com/blog/ai-sales-tools/) — AI adoption stats (33% of field teams use AI; 26% for content generation)
- [Gemini API Pricing 2026 — MetaCTO](https://www.metacto.com/blogs/the-true-cost-of-google-gemini-a-guide-to-api-pricing-and-integration) — token pricing for Flash tier
- [Leadbeam Field Sales Apps 2025](https://www.leadbeam.ai/blog/field-sales-apps) — AI meeting prep as flagship feature
- [RepMove outside sales management](https://repmove.app) — route + activity log pattern
- [eCanvasser route planning](https://www.ecanvasser.com/route-planning) — 200-stop accumulation, closest competitor analogue for Marathon route side

### Tertiary (LOW confidence)
- [Maptive Best Sales Mapping Software 2026](https://www.maptive.com/15-best-sales-territory-mapping-software/) — competitive landscape overview; treat as directional only

---

*Research completed: 2026-04-01*
*Ready for roadmap: yes*
