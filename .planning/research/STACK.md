# Stack Research

**Domain:** Map-centric field sales CRM — pin management, Google Places discovery, route optimization
**Researched:** 2026-03-31 (initial) / 2026-04-01 (v1.1 Power Features update)
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
| `@supabase/supabase-js` | ^2.101.1 | Database CRUD, cloud sync |
| `zustand` | ^5.0.12 | Feature slices: pins, discover, route |
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop primitives (route reorder) |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable preset with `useSortable` + `arrayMove` |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform utilities for dnd-kit |
| `sonner` | ^2.0.7 | Toast notifications |

---

## Recommended Additions for v1.1 Power Features

### 1. Gemini AI Integration (Ask AI feature)

| Technology | Version | Purpose | Why Recommended |
|---|---|---|---|
| `@google/genai` | ^1.x (latest) | Gemini API SDK for generating sales briefs | The only current official Google GenAI SDK. The previous `@google/generative-ai` package was deprecated and **all support ends August 31, 2025**. `@google/genai` reached GA in May 2025 and is the unified SDK for Gemini 2.x+ models. |

**Install:**
```bash
npm install @google/genai
```

**Do NOT use `@google/generative-ai`** — deprecated, archived GitHub repo, no Gemini 2.x features.

**Model to use:** `gemini-2.5-flash`
- Lowest latency and cost in the 2.5 family — ideal for request/response sales briefs
- `gemini-2.5-pro` is for complex reasoning tasks; overkill for a short marketing paragraph
- Gemini 2.0 models are deprecated and "will be shut down soon" per Google docs (verified 2026-04-01)

**Integration pattern — Next.js Route Handler (server-side only):**

The API key must never reach the browser. Use a Next.js Route Handler in `app/api/`:

```typescript
// app/api/ai/brief/route.ts
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  const { businessName, types, address } = await req.json();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Write a 2-sentence sales brief for visiting ${businessName}, a ${types.join('/')} at ${address}. Focus on construction-related opportunities.`,
  });
  return Response.json({ brief: response.text });
}
```

**Environment variable needed (server-only, no `NEXT_PUBLIC_` prefix):**
```
GEMINI_API_KEY=your-key-from-ai-studio
```

**Why Route Handler over Server Action:** The AI call is triggered from a map bubble UI click (not a form submit), which is the canonical case for a Route Handler. Server Actions are optimized for form mutations. Both work but Route Handler is cleaner for fire-and-fetch patterns.

**Why NOT Vercel AI SDK (`ai` package):** The Vercel AI SDK adds excellent streaming + React hooks (`useChat`, `useCompletion`) but is significant overhead for a single non-chat use case. The Ask AI feature generates one short paragraph on demand — no streaming needed, no conversation history, no multi-turn. Direct `@google/genai` is 3 lines of code. The Vercel AI SDK pays off if chat-style interactions are added later; add it then.

---

### 2. Marathon Mode — No New Packages Needed

Marathon mode accumulates discover results and route stops across multiple drawn areas before committing to a route. This is pure state management work with the existing stack.

**What changes:**
- `discover.store.ts` — add `marathonMode: boolean`, `accumulatedResults: DiscoverResult[]`, actions to toggle mode and merge results from repeated searches
- `route.store.ts` — already has `addStop()` + dedup; Marathon mode calls it after each area search
- `discover-search.ts` — existing search logic is called repeatedly; dedup by Place ID already required

**No new npm package needed.** The existing Places API, Zustand slices, and dnd-kit (for reordering accumulated stops) are sufficient.

**Key constraint:** The Places API returns up to 20 results per `searchByText` call (`maxResultCount: 20`). Marathon mode accumulates across multiple polygons — dedup by `place.id` must happen in the store, not just the UI.

---

### 3. Planner Tab — No New Packages Needed

The Planner stores daily stops, notes, and an activity log. All required infrastructure exists:

| Capability | How |
|---|---|
| Daily plan state | New `planner.store.ts` Zustand slice, persisted via existing `persist` middleware |
| Plan data shape | `{ date: string (ISO), stops: PlanStop[], notes: string, log: LogEntry[] }` — date as string key |
| Supabase sync | New `planner_days` table; same upsert + merge pattern used by pins |
| Drag reorder | `@dnd-kit/sortable` already installed — reuse for daily stop ordering |
| Notes textarea | Plain React controlled input, no rich text editor needed for v1 |
| Activity log | Append-only array in the plan store; rendered as a timestamped list |

**No new npm package needed.** The existing Zustand + Supabase + dnd-kit stack covers all Planner requirements.

**Zustand date-keyed plan pattern:**
```typescript
// planner.store.ts
interface PlannerSlice {
  plans: Record<string, DailyPlan>;   // keyed by ISO date string "2026-04-15"
  activeDate: string;                  // which day is open
  // ...actions
}
```

`Record<string, DailyPlan>` serializes cleanly with `JSON.stringify` — no custom serializer (like `superjson`) is needed as long as dates are stored as ISO strings, not `Date` objects.

---

## Full Installation Command for This Milestone

```bash
npm install @google/genai
```

That is the only new dependency. Everything else reuses existing packages.

---

## Environment Variables to Add

```bash
# .env.local additions for v1.1
GEMINI_API_KEY=your-key-from-google-ai-studio   # server-only, no NEXT_PUBLIC_ prefix
```

Keep the Gemini key server-only. It must never appear in client bundle. The Route Handler pattern above guarantees this by placing the key in a non-`NEXT_PUBLIC_` variable consumed only in `app/api/`.

---

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| `@google/generative-ai` | Deprecated; archived; all support ends Aug 31, 2025; no Gemini 2.x features | `@google/genai` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Exposes API key to browser bundle; anyone can scrape it from the JS | Server-only `GEMINI_API_KEY` via Route Handler |
| Vercel AI SDK (`ai` package) | Correct tool for streaming chat UIs; overkill for a single on-demand brief generation with no conversation state | Direct `@google/genai` in a Route Handler |
| `superjson` / `serialize-javascript` | Only needed if storing `Date` objects or `Map`/`Set` in Zustand state; planner avoids this by using ISO date strings | ISO string dates throughout |
| Rich text editor (TipTap, Slate, Quill) | Planner notes are field notes, not documents — plain `<textarea>` is appropriate for v1; add rich text only if users explicitly request it | Native `<textarea>` |
| Separate analytics library (Segment, Mixpanel) | Activity log is internal audit trail, not product analytics | Append to `log: LogEntry[]` in planner store |
| `@supabase/ssr` | Cookie-based auth session management — auth is still out of scope this milestone | Plain `@supabase/supabase-js` anon client |

---

## Supabase Schema Additions

Two new tables needed for this milestone:

**`planner_days`**
```sql
create table planner_days (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,             -- ISO date, unique per "user" (no auth yet)
  stops       jsonb default '[]',
  notes       text default '',
  log         jsonb default '[]',
  updated_at  timestamptz default now()
);
```

No new Supabase client config needed — same `@supabase/supabase-js` client from `app/lib/supabase.ts`.

---

## Version Compatibility Notes

| Package | Compat | Notes |
|---|---|---|
| `@google/genai` ^1.x | Node.js 18+ | Next.js Route Handlers run in Node.js runtime by default — compatible. Do NOT run in Edge Runtime (no Node.js built-ins). |
| `@google/genai` ^1.x | React 19.2.4 | SDK is used server-side only; no React compat concern |
| `gemini-2.5-flash` model | `@google/genai` ^1.x | GA model, stable identifier — not a preview string |
| Zustand `Record<string, DailyPlan>` | Zustand ^5.0.12 | Serializes cleanly with default JSON storage; no migration needed if schema starts correct |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| `@google/genai` direct | Vercel AI SDK with `@ai-sdk/google` provider | If the project adds streaming chat, multi-turn conversation, or needs to swap AI providers. Vercel AI SDK's `useChat` hook and `streamText` are better than hand-rolling streaming. Add it at that point. |
| Route Handler for AI call | Server Action | Server Actions are cleaner for form mutations. For a UI-triggered fetch (clicking "Ask AI" on a map bubble), a Route Handler is the conventional Next.js pattern. |
| ISO string dates in Zustand | `Date` objects | Never store `Date` objects in Zustand persist — they serialize to strings but don't deserialize back to `Date`, causing silent type bugs. Always use ISO strings. |
| Plain `<textarea>` for notes | TipTap / Slate | Add rich text only when users actually request formatting. Field notes in a sales CRM are typically one-liners. Avoid the 50+ KB bundle cost speculatively. |

---

## Sources

- [@google/genai npm page](https://www.npmjs.com/package/@google/genai) — v1.x current, GA since May 2025; install command confirmed
- [googleapis/js-genai GitHub](https://github.com/googleapis/js-genai) — official SDK repo; unified SDK for Gemini + Vertex AI
- [deprecated-generative-ai-js GitHub](https://github.com/google-gemini/deprecated-generative-ai-js) — confirmed deprecated; "use new unified Google GenAI SDK"
- [Gemini API Models docs](https://ai.google.dev/gemini-api/docs/models) — `gemini-2.5-flash` confirmed stable GA; Gemini 2.0 deprecated "shut down soon"
- [Gemini API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart) — `GoogleGenAI` import + `ai.models.generateContent` pattern confirmed; `GEMINI_API_KEY` auto-pickup confirmed
- [Gemini API Key security docs](https://ai.google.dev/gemini-api/docs/api-key) — server-only key requirement confirmed
- [Vercel AI SDK docs](https://ai-sdk.dev/docs/introduction) — `useChat`/`streamText` for streaming chat; confirmed overkill for single-brief use case
- [Zustand persist GitHub discussion](https://github.com/pmndrs/zustand/discussions/2476) — `Record<string, T>` pattern for date-keyed state; ISO string advice confirmed
- [dnd-kit/sortable docs](https://docs.dndkit.com/concepts/sortable) — `useSortable` + `arrayMove` reuse confirmed for Planner stop ordering

---

*Stack research for: map-centric field sales CRM (Groundwork v2) — v1.1 Power Features*
*Initial research: 2026-03-31 | Updated: 2026-04-01*
