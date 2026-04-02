# Feature Research

**Domain:** Field sales CRM / map-based route planning (construction trades focus)
**Researched:** 2026-03-31 (updated for v1.1 milestone)
**Confidence:** MEDIUM-HIGH (competitive analysis + Google API docs; no direct user interviews)

---

## Scope Note

This document covers v1.1 milestone features — Marathon mode, Ask AI (Gemini), and Planner tab — layered onto the already-built v1 foundation (pin management, discovery, route optimization, Supabase sync). The v1 feature landscape is preserved at the bottom for continuity.

---

## v1.1 Feature Landscape

### Marathon Mode — Multi-Area Discover + Route Accumulation

**What it is:** A persistent session where a rep can draw multiple search rectangles across different areas — accumulating discovered businesses across all draws — then build a single optimized route from the combined pool. Contrast with the current v1 flow where each new draw *replaces* previous results.

#### How Competitors Handle This

SPOTIO and Knockbase treat territory coverage as pre-planned zone assignments rather than live accumulation — managers assign zones, reps work them. Neither supports in-session "keep adding results from new draws." Badger Maps' lasso tool selects existing accounts; it doesn't discover new ones across areas. The live accumulate-across-draws pattern is not a standard competitor feature. This is a genuine differentiator.

RepMove and eCanvasser support re-optimizing routes when new stops are added mid-day — this is the closest analogue to what Marathon mode produces on the route side.

#### Table Stakes for Marathon Mode

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Accumulate results across draws | Reps can't re-draw the same area if prior results vanish | MEDIUM | Core mechanic: instead of `setDiscoverResults(results)` replacing state, Marathon appends with deduplication by `placeId` |
| Cross-area dedup | If two draws overlap, same business must not appear twice | LOW | Existing dedup logic in `discover-search.ts` already handles within-draw dedup; extend to cross-draw using `placeId` Set |
| Visual distinction of "area already searched" | Reps need to know which areas have been drawn | MEDIUM | Render completed draw rectangles as semi-transparent overlays on the map layer |
| Result count badge showing accumulated total | Rep needs to know how many they've found across all areas | LOW | Integer counter in Marathon UI header |
| "Clear all and restart" escape hatch | If rep draws a wrong area, they need to reset without leaving Marathon | LOW | Destructive confirm → clears all accumulated results and saved rectangles |

#### Differentiators for Marathon Mode

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Add entire accumulated pool to route in one tap | Converts a multi-area canvassing session into a route without stop-by-stop add | LOW | Calls `addStop()` for each selected result up to 25-stop cap; shows cap-reached notice if overflow |
| Persistent session across app navigation | Rep can switch to pin list or route panel and return to Marathon without losing accumulated results | MEDIUM | Marathon state lives in a new `marathonSlice` in the Zustand store, not in component state |
| Area rectangle count indicator | Shows "3 areas searched, 47 businesses found" — communicates scope of session | LOW | Derived from stored rectangle array length + accumulated results count |
| Filter/select from accumulated pool before routing | Rep sees the full pool and checks which ones to route to | MEDIUM | Reuse existing `selectedDiscoverIds` pattern from DiscoverSlice; Marathon extends selection to span multiple draws |

#### Anti-Features for Marathon Mode

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-route every newly drawn area | "Make it automatic" | Routing 25 stops mid-discovery interrupts the canvassing flow; reps want to discover first, route after | Explicit "Build Route from Session" CTA at end of Marathon session |
| Unlimited stop accumulation beyond 25 | "I found 60 businesses" | Google Directions API hard cap at 25 waypoints; circumventing requires multi-route stitching with significant UX complexity | Show count, communicate cap clearly, let rep select which 25 to prioritize — selection UX solves this |
| Saving Marathon sessions for replay | "I want to do this area again tomorrow" | Adds a session management system; the pin-quick-save flow already persists anything worth keeping | Quick-save the businesses you want to revisit as pins; that's the persistence mechanism |

---

### Ask AI — Gemini Sales Brief in Discover Info Bubble

**What it is:** A button in the discover result info bubble (the panel that opens when a rep taps a discovered business) that calls the Gemini API and returns a short sales brief about that business — what they do, likely pain points, relevant services, suggested talking points for a Gillman Services pitch.

#### How Competitors Handle This

AI pre-call research is an emerging category. Leadbeam explicitly lists "meeting prep" as an AI-generated feature. LinkedIn Sales Navigator does pre-visit research for B2B accounts. ZoomInfo provides company intelligence. None of these are embedded in a map discovery flow — they require leaving the map, switching apps, and pasting company names. Embedding AI brief generation directly in the discover info bubble is a genuine workflow improvement.

SPOTIO's 2026 adoption report found only 33% of field sales teams use AI at all; 26% use it for content/proposal generation. This is early-adopter territory — the feature needs to degrade gracefully (work without it, not require it).

#### How Gemini Grounding Works (HIGH confidence — official API docs)

The Gemini API supports "Grounding with Google Search" — the model automatically decides if a web search would improve the answer, generates one or more search queries, executes them, and returns a response grounded in live web content with citation metadata. This is particularly well-suited for business research where training data may be stale.

- Supported models: Gemini 2.5 Flash, Gemini 3 Flash, Gemini 3.1 series
- Billing: Per-search-query that the model executes (Gemini 3+ models), plus standard token pricing
- Free tier: AI Studio free tier available for Gemini 2.5 Flash and Flash variants with rate limits
- Pricing: Gemini 2.5 Flash at $0.30/1M input + $2.50/1M output is the right balance of quality vs cost for this use case; brief generation per business is ~500 tokens in + ~300 tokens out — roughly $0.0002 per request at scale

#### Table Stakes for Ask AI

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One-tap "Ask AI" button in discover info bubble | Reps won't navigate away from the map to research a business; the button must be in the existing info context | LOW | Button added to `discover-info.ts` or `DiscoverResultItem` component; triggers API call |
| Brief returned in < 5 seconds | Reps will abandon if it's slow; field conditions mean they may tap and then pocket the phone | MEDIUM | Gemini Flash models typically respond in 1-3 seconds for short outputs; use streaming if available |
| Readable, scannable output format | A wall of text won't be read in the field | LOW | Prompt Gemini to return structured output: 2-3 bullets max (what they do, pain point, talking point); no prose paragraphs |
| Graceful failure state | API quota, network error, or unknown business must not break the info bubble | LOW | Show "Couldn't load brief — try again" with retry; never throw unhandled errors into map UI |
| Company name + address passed as context | The business is already in `DiscoverResult`; the AI needs both to ground the search correctly | LOW | Prompt template: `"Research [displayName] at [address]. Return: what they do (1 sentence), likely need for construction services (1 sentence), opening talking point (1 sentence)."` |

#### Differentiators for Ask AI

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Grounded search (not hallucinated) | Brief is based on live web results about this specific business, not generic industry info | MEDIUM | Use `tools: [{ googleSearch: {} }]` in Gemini API call; groundingMetadata confirms sources used |
| Brief cached per placeId within session | If rep taps "Ask AI" twice on the same business, don't make two API calls | LOW | Session-level cache: `Map<placeId, brief>` in component state or Zustand slice; cleared when discover is cleared |
| Show source citations | Reps trust the brief more when they can see where it came from | LOW | `groundingMetadata.groundingChunks` contains source URIs; render as collapsed "Sources" section below brief |
| Construction-context system prompt | Generic AI output mentions "customer service improvements"; construction-context prompt generates "potential roofing contract, storm damage work, equipment maintenance" | LOW | System prompt sets industry context; easily configurable per fork |

#### Anti-Features for Ask AI

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-generate brief for every discover result | "Research everything automatically" | 50+ businesses per draw × API cost × latency = expensive and slow; reps rarely read all results | On-demand per business; rep taps Ask AI only when interested |
| Save brief to pin notes automatically | "I want this in my CRM" | Auto-save creates noise in notes; rep may not pin this business at all | "Copy to Notes" button when saving as pin; rep opts in to what they keep |
| Ask AI about pinned businesses (not discovered) | "I want research on existing accounts" | Reasonable feature but different surface area — pins have their own edit panel | Scope v1.1 to discover info bubble only; pin-level AI research is a natural v1.2 addition |
| Voice output of brief | "Read it to me while I drive" | Browser TTS APIs are inconsistent across mobile browsers; driving + app interaction is a safety/legal issue | Screen-readable format with large text; rep can use device accessibility features if needed |

---

### Planner Tab — Daily Stop Management and Activity Log

**What it is:** A dedicated tab (not the map, not the route panel) where a rep manages today's planned stops, records what happened at each visit (outcome, notes), and sees a running log of past activity. The planner sits between planning (route builder) and recording (pin notes).

#### How Competitors Handle This

SPOTIO is the benchmark here. Its pattern: one-tap activity logging at GPS-verified location, visit audit log with arrival time + duration + outcome, "Download My Day" offline pre-load, custom fields per visit. SPOTIO treats every field visit as an auditable event.

RepMove focuses on route management with "activity logging on the go" — add notes per stop after visiting.

Badger Maps is weaker here: route-centric but visit logging is basic.

The consensus pattern across competitors:
1. A "today's stops" list derived from the current day's route
2. Tap a stop to log an outcome (called, visited, left material, no answer, booked meeting)
3. Add a free-text note per stop
4. History view showing past activity

#### Table Stakes for Planner

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Today's planned stops list | Without this, the planner is just a notes app; stops must be the primary unit | MEDIUM | Derive from `routeStops` initially; rep can also add stops to planner manually without a route |
| Tap stop to log outcome | "What happened here?" is the core question; reps need a fast answer mechanism | MEDIUM | Outcome options: Visited / Called / Left Material / No Answer / Booked Meeting — pre-defined set, not free text |
| Notes per stop per visit | Outcome alone isn't enough; reps need to capture details | LOW | Textarea with timestamp; appended to visit log, not replacing prior entries |
| Activity log (past visits) | Reps and managers need to see what was done; without history, the planner has no memory | MEDIUM | Per-pin list of dated entries: `{ date, outcome, note }`; persisted in Supabase alongside pin data |
| Today's date header with stop count | "Monday — 6 stops planned" — the daily anchor | LOW | Derived date + count from planner state |
| Mark stop complete | Visual check-off for "done with this one today" — reps think in terms of completion | LOW | Toggle on each stop item; completed stops visually dimmed or moved to bottom of list |

#### Differentiators for Planner

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Push stops from Route Confirm panel to Planner in one tap | Closing the loop between "I built a route" and "I'm executing it today" | MEDIUM | Route Confirm panel gets "Send to Planner" CTA; copies ordered stops into planner's daily list |
| Follow-up scheduling from planner outcome | "No answer today" → prompt "Schedule follow-up?" → sets `followUpDate` on pin | MEDIUM | After logging "No Answer" or "Called", surface a date picker; writes back to pin's `followUpDate` field |
| Planner persists separately from route | Route is planning; planner is execution. Clearing a route doesn't wipe the day's planner | LOW | Separate Zustand slice (`plannerSlice`) with its own localStorage partition key |
| Quick-add stop to planner from pin list | Rep is reviewing pins and wants to add one to today's visits without rebuilding the route | LOW | "Add to Today" button in pin info window or sidebar pin list item |
| Activity history per pin visible in pin edit panel | "When did I last visit this account?" currently requires scrolling notes | MEDIUM | In pin edit panel, render a collapsed "Visit History" section pulled from planner log entries for that pin's ID |

#### Anti-Features for Planner

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| GPS auto-check-in (detect when rep arrives) | "Log it automatically" | Background location permission required; battery drain; iOS background execution restrictions; privacy friction; out of scope in PROJECT.md | One-tap manual check-in button when rep arrives; fast enough that manual is not a burden |
| Manager dashboard / team view | "Show my team's activity" | Requires auth, user profiles, and a completely different UI surface; adds months of scope | Single-rep tool in v1.1; team features are a post-auth milestone |
| Planned vs actual time tracking | "Show how long visits took" | Requires start-time and end-time logging, which adds interaction overhead to every visit | Log visit date and outcome; time tracking is a v2 opt-in if reps request it |
| Weekly/monthly reporting views | "Show my month's activity" | Adds charting and aggregation complexity; the daily view is the core value | Simple chronological log sorted by date; filtering by date range is a v2 feature |
| CRM sync (Salesforce, HubSpot) | "Write back to our CRM" | Deep OAuth integrations with external CRMs are maintenance-heavy; each has breaking changes; out of scope for a field-focused tool | Supabase is the source of truth; export as CSV is a simpler bridge if needed |

---

## Feature Dependencies (v1.1)

```
[Marathon Mode]
    └──requires──> [Discover (v1)] — extends the draw-to-search mechanic
    └──requires──> [DiscoverSlice] — adds accumulation behavior to existing state
    └──requires──> [RouteSlice.addStop()] — reuses existing stop-add mechanic
    └──new state──> [MarathonSlice] — accumulates results + rectangles
                       └──persists in localStorage (session only, not Supabase)

[Ask AI (Gemini)]
    └──requires──> [DiscoverResult] type — placeId, displayName, address already available
    └──requires──> [Gemini API key] — new environment variable
    └──requires──> [discover-info.ts / DiscoverResultItem] — button added to existing info surface
    └──new utility──> [gemini-brief.ts] — wraps Gemini API call, handles grounding + cache
    └──no new state required──> (session cache in module scope or component state is sufficient)

[Planner Tab]
    └──requires──> [Pin] type — pins are the subjects of planner stops
    └──requires──> [RouteSlice.routeStops] — "Send to Planner" reads from route state
    └──new state──> [PlannerSlice] — daily stops list + visit log entries
    └──new type──> [VisitLog] — { id, pinId, date, outcome, note }
    └──enhances──> [Pin edit panel] — visit history section
    └──enhances──> [Pin.followUpDate] — planner outcome can write back

[Planner] ──conflicts with routing concerns── [RouteSlice]
    — Route is planning; Planner is execution. They share stop data but must not
      share state slices. "Send to Planner" is a one-time copy, not a live sync.
```

### Dependency Notes

- **Marathon Mode requires DiscoverSlice:** Marathon is a mode *on top of* discover, not a replacement. The existing `discoverResults`, `selectedDiscoverIds`, and `drawBounds` state must be refactored or extended to support accumulation without breaking normal discover flow.
- **Ask AI requires no new store state:** The brief is ephemeral — it's per-session, per-business. A module-level `Map<placeId, brief>` cache avoids Zustand overhead for transient data.
- **Planner requires a new Zustand slice:** Visit log entries must persist across sessions (rep needs yesterday's log today). Supabase sync for planner entries is appropriate since this is auditable activity data.
- **Planner conflicts with route in UX, not data:** "Send to Planner" copies stops from `routeStops` — it does not bind them. Clearing the route after sending to planner must not affect the planner's stop list.

---

## MVP Definition (v1.1)

### Launch With (this milestone)

- [ ] Marathon Mode: accumulate-across-draws, persistent rectangle overlays, cross-area dedup, "build route from session" CTA — core mechanic is differentiating and has zero dependencies on new infrastructure
- [ ] Ask AI: one-tap Gemini brief in discover info bubble, grounded search, session cache, graceful error state — low infrastructure cost, high demo value, constrained to existing discover surface
- [ ] Planner: today's stops list, outcome logging, free-text notes per visit, mark complete, activity log — core daily execution loop without GPS or manager features

### Add After Validation (v1.2)

- [ ] Marathon mode: area-level result count badges on saved rectangles — validate that reps use Marathon before adding visual polish
- [ ] Ask AI for pinned businesses — validate demand for AI research outside discover flow before expanding surface area
- [ ] Planner follow-up scheduling from outcome — validate that reps use the planner consistently before adding CRM write-back
- [ ] Planner visit history in pin edit panel — nice-to-have; add when planner adoption is confirmed

### Future Consideration (v2+)

- [ ] Marathon mode: session save/resume across days — requires auth first
- [ ] Planner: manager dashboard / team view — requires auth + user profiles
- [ ] Planner: GPS auto-check-in — requires background location permission flow + opt-in UX
- [ ] Ask AI: batch brief generation for Marathon results — validate cost model at scale first

---

## Feature Prioritization Matrix (v1.1)

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Marathon: accumulate-across-draws + dedup | HIGH | MEDIUM | P1 |
| Marathon: saved rectangle overlays on map | MEDIUM | MEDIUM | P1 |
| Marathon: "Build Route from Session" CTA | HIGH | LOW | P1 |
| Ask AI: Gemini brief button in discover info | HIGH | MEDIUM | P1 |
| Ask AI: grounded search (not hallucinated) | HIGH | LOW | P1 — just pass `tools: [{googleSearch: {}}]` |
| Ask AI: session cache per placeId | MEDIUM | LOW | P1 |
| Ask AI: graceful error state | HIGH | LOW | P1 |
| Planner: today's stops list | HIGH | MEDIUM | P1 |
| Planner: outcome logging + notes per stop | HIGH | MEDIUM | P1 |
| Planner: mark stop complete | HIGH | LOW | P1 |
| Planner: activity log (past visits) | MEDIUM | MEDIUM | P1 |
| Planner: Send to Planner from Route | HIGH | LOW | P1 |
| Marathon: area result count badges | LOW | LOW | P2 |
| Ask AI: show source citations | MEDIUM | LOW | P2 |
| Planner: follow-up scheduling from outcome | MEDIUM | MEDIUM | P2 |
| Planner: visit history in pin edit panel | MEDIUM | MEDIUM | P2 |
| Ask AI: pin-level research | MEDIUM | LOW | P2 |
| Marathon: session save/resume | LOW | HIGH | P3 |
| Planner: manager/team view | MEDIUM | HIGH | P3 |
| Planner: GPS auto-check-in | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Add when core is working, before milestone closes
- P3: Future milestone — defer

---

## Competitor Feature Analysis (v1.1 scope)

| Feature | Leadbeam | SPOTIO | Badger Maps | Our Approach |
|---------|----------|--------|-------------|--------------|
| Multi-area discovery session | Not a distinct feature; routes pull from CRM | No in-draw accumulation; territory zones are pre-assigned | Lasso selects existing pins across areas, doesn't discover new ones | Live accumulate-across-draws: unique mechanic not replicated by any competitor |
| AI pre-visit research | AI-generated "meeting prep" (flagship feature) | LinkedIn Sales Navigator + ZoomInfo integrations for B2B | None | Embedded in discover info bubble; grounded Gemini brief for the specific business at point of discovery |
| Daily planner / visit log | Route + auto-logging (AI-powered) | Full activity log + GPS-verified check-in + visit audit log | Basic visit notes | Planner tab: manual check-in, outcome types, notes per stop, activity log — no GPS tracking burden |
| Outcome types per visit | AI-detected + manual | Customizable activity types | Note field only | Pre-defined set: Visited / Called / Left Material / No Answer / Booked Meeting |
| Offline support for planner | Unknown | "Download My Day" (24h offline pre-load) | No | localStorage-first planner state; Supabase sync when online |

---

## Sources

**v1.1 Research Sources:**

- [SPOTIO Sales Tracking features](https://spotio.com/features/sales-tracking/) — visit logging, GPS check-in, audit log detail (MEDIUM confidence)
- [SPOTIO AI Sales Tools 2026](https://spotio.com/blog/ai-sales-tools/) — AI adoption stats, pre-visit research patterns (MEDIUM confidence)
- [Gemini API Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search) — grounding mechanics, response schema, billing model (HIGH confidence — official docs)
- [Gemini API Pricing 2026 — MetaCTO](https://www.metacto.com/blogs/the-true-cost-of-google-gemini-a-guide-to-api-pricing-and-integration) — token pricing for Flash and Pro tiers (MEDIUM confidence)
- [Gemini API tooling updates: Maps grounding, tool combos](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-tooling-updates/) — function calling + Google Search combo (HIGH confidence)
- [Leadbeam Field Sales Apps 2025](https://www.leadbeam.ai/blog/field-sales-apps) — AI-powered meeting prep feature description (MEDIUM confidence)
- [Knockbase canvassing + roofing field sales](https://www.knockbase.com/features/canvassing-software) — zone sweep, territory assignment patterns (MEDIUM confidence)
- [RepMove: Outside Sales Management Platform](https://repmove.app) — route + activity log pattern (MEDIUM confidence)
- [eCanvasser route planning](https://www.ecanvasser.com/route-planning) — 200-stop accumulation, territory coverage (MEDIUM confidence)

**v1 Research Sources (preserved):**

- [SPOTIO Route Optimization features](https://spotio.com/features/sales-route-optimization/) — navigation handoff detail (MEDIUM confidence)
- [Badger Maps homepage](https://www.badgermapping.com/) — Lead Finder, lasso tool, route limits (MEDIUM confidence)
- [Google Directions API waypoint optimization](https://developers.google.com/maps/documentation/routes/opt-way) — 25-waypoint cap confirmed (HIGH confidence)
- [Google Places API (New) overview](https://developers.google.com/maps/documentation/places/web-service/op-overview) — Nearby Search, Text Search capabilities (HIGH confidence)
- [Maptive Best Sales Mapping Software 2026](https://www.maptive.com/15-best-sales-territory-mapping-software/) — competitive landscape (LOW confidence)

---

*Feature research for: construction field sales CRM — Marathon mode, Gemini AI brief, daily planner*
*v1.1 milestone research updated: 2026-03-31*
