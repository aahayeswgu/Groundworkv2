# Phase 3: Supabase Sync - Research

**Researched:** 2026-03-31
**Domain:** Supabase client-side sync with Zustand persist middleware — debounced upsert, pull-on-load, last-write-wins merge
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PINS-13 | Pins sync to Supabase with debounced cloud push and pull-on-load with merge semantics (updated_at comparison) | Supabase upsert API, merge algorithm, schema design, StoreHydration hook pattern — all researched and documented below |

</phase_requirements>

---

## Summary

Phase 3 introduces Supabase as a durable cloud backend for pins. The app already persists pins to `localStorage` via Zustand `persist` middleware — Supabase becomes a second persistence layer that operates asynchronously alongside it. The pattern is: **localStorage is the primary cache (fast, available offline), Supabase is the source of truth (durable, cross-device)**.

The core mechanism is a sync hook that fires in two directions: on app load it pulls all remote pins and merges them with local state using `updated_at` comparison (last-write-wins), and after every mutation it debounces a push to Supabase. Deletes are soft — pins get a `deleted_at` timestamp rather than being removed from the database, preventing a remote delete from clobbering a concurrent edit on another device.

The implementation touches three layers: a new Supabase table with the right schema, a singleton supabase client module, and a `usePinSync` hook that replaces the bare `StoreHydration` component for its initialization responsibility. The existing `PinsSlice` actions (`addPin`, `updatePin`, `deletePin`) are not changed — the sync hook listens to the Zustand store and reacts to its state.

**Primary recommendation:** Implement sync as a standalone `usePinSync` hook co-located in `app/features/pins/`. Keep the Supabase client as a singleton in `app/lib/supabase.ts`. The hook calls `useStore.persist.rehydrate()` first (existing localStorage restore), then fetches remote pins and merges. Use a 2-second `setTimeout` debounce for push, and flush on `beforeunload`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.101.1 | Database CRUD via PostgREST, client-side only | Minimal footprint for no-auth use case. `@supabase/ssr` is NOT needed — that package exists for cookie-based auth session management in server components. Auth is out of scope for this phase. |

### Already Installed (no new installs needed beyond supabase-js)

| Package | Version | Role in this phase |
|---------|---------|-------------------|
| `zustand` | ^5.0.12 | Store reads via `useStore.getState()` for debounce flush; `useStore.subscribe()` for change detection |
| `next` | 16.2.1 | `'use client'` boundary — sync hook must be client-side only |

### What NOT to Use

| Avoid | Why |
|-------|-----|
| `@supabase/ssr` | Adds Next.js server component plumbing (middleware, server client, browser client split) with zero benefit — auth is out of scope |
| PowerSync / RxDB / ElectricSQL | Full offline-first sync engines — PROJECT.md specifies a simple debounced pattern, not a sync engine |
| Supabase Realtime subscriptions | Real-time multi-tab sync is a v2 feature (PLAT-01+). For v1, pull-on-load is sufficient and avoids open WebSocket complexity |

**Installation:**
```bash
npm install @supabase/supabase-js
```

**Version verification:** `npm view @supabase/supabase-js version` confirms `2.101.1` as of 2026-03-31.

---

## Architecture Patterns

### Recommended Project Structure (additions for this phase)

```
app/
├── lib/
│   └── supabase.ts          # Singleton createClient — one file, one export
├── features/
│   └── pins/
│       ├── pins.store.ts    # UNCHANGED — addPin/updatePin/deletePin stay as-is
│       ├── sync/
│       │   └── usePinSync.ts  # New hook: pull-on-load + debounced push
│       └── ...existing files
├── components/
│   └── StoreHydration.tsx   # MODIFIED — call usePinSync instead of bare rehydrate
└── store/
    └── index.ts             # UNCHANGED — persist config stays as-is
```

### Pattern 1: Supabase Singleton Client

**What:** A single module-level `supabase` client created once, imported everywhere.
**When to use:** Always — do not call `createClient` inside hooks or components (creates a new connection per render).

```typescript
// app/lib/supabase.ts
// Source: https://supabase.com/docs/reference/javascript/initializing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Pattern 2: Table Schema — Columns Match the Pin Type Exactly

The Supabase `pins` table uses column names that map 1:1 to the TypeScript `Pin` interface. The `id` is the existing UUID string from the client (not a Supabase-generated identity). This prevents double-ID complexity and makes upsert on conflict straightforward.

```sql
-- Migration: create pins table
create table pins (
  id             text primary key,           -- client-generated UUID string
  title          text not null default '',
  address        text not null default '',
  status         text not null default 'prospect',
  lat            double precision not null,
  lng            double precision not null,
  contact        text not null default '',
  phone          text not null default '',
  follow_up_date text not null default '',    -- stored as ISO string (matches client)
  notes          jsonb not null default '[]', -- NoteEntry[] serialized
  created_at     timestamptz not null,
  updated_at     timestamptz not null,
  deleted_at     timestamptz                  -- null = active, non-null = soft-deleted
);

-- RLS: enable but allow anon full access (auth added in PLAT-01)
alter table pins enable row level security;

create policy "anon_select" on pins for select to anon using (true);
create policy "anon_insert" on pins for insert to anon with check (true);
create policy "anon_update" on pins for update to anon using (true) with check (true);
```

**Column mapping:**

| TypeScript `Pin` field | Supabase column | Type | Notes |
|------------------------|-----------------|------|-------|
| `id` | `id` | `text` | Client UUID string, primary key |
| `title` | `title` | `text` | |
| `address` | `address` | `text` | |
| `status` | `status` | `text` | One of the four PinStatus literals |
| `lat` | `lat` | `double precision` | |
| `lng` | `lng` | `double precision` | |
| `contact` | `contact` | `text` | |
| `phone` | `phone` | `text` | |
| `followUpDate` | `follow_up_date` | `text` | camelCase → snake_case in DB |
| `notes` | `notes` | `jsonb` | NoteEntry[] array |
| `createdAt` | `created_at` | `timestamptz` | |
| `updatedAt` | `updated_at` | `timestamptz` | Merge key |
| _(not on Pin)_ | `deleted_at` | `timestamptz` | Soft-delete only |

**camelCase ↔ snake_case mapping** is the only translation layer needed. The sync hook must map `followUpDate` → `follow_up_date` when sending to Supabase and back when receiving.

### Pattern 3: Merge Algorithm — Last-Write-Wins by updated_at

**What:** On pull-on-load, merge remote pins with local pins record-by-record. The winner is whichever has the later `updated_at`. Soft-deleted remote records are removed from local state only if the remote `updated_at` is newer than the local `updatedAt`.

**Why:** A naive `setLocalPins(remotePins)` (last-remote-wins) clobbers unsaved local changes. This is the exact scenario documented in PITFALLS.md Pitfall 4.

```typescript
// Source: merge logic derived from PITFALLS.md Pitfall 4 + standard last-write-wins pattern
function mergePins(localPins: Pin[], remotePins: RemotePin[]): Pin[] {
  const merged = new Map<string, Pin>();

  // Seed with local pins
  for (const pin of localPins) {
    merged.set(pin.id, pin);
  }

  // Apply remote pins: keep whichever is newer
  for (const remote of remotePins) {
    const local = merged.get(remote.id);

    // Soft-delete: remote deleted newer than any local version → remove
    if (remote.deleted_at) {
      if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
        merged.delete(remote.id);
      }
      continue;
    }

    // No local record, or remote is newer → use remote
    if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
      merged.set(remote.id, remoteToLocal(remote));
    }
    // Otherwise local is newer: keep it (no action needed)
  }

  return Array.from(merged.values());
}
```

### Pattern 4: usePinSync Hook — Pull-on-Load + Debounced Push

**What:** A single `useEffect`-based hook that handles the full sync lifecycle. It replaces the responsibility of `StoreHydration` for the Supabase pull step.

**Key behaviors:**
1. `useStore.persist.rehydrate()` fires first — restores localStorage pins synchronously
2. Supabase pull fires after rehydrate — fetches all non-deleted pins, merges, updates store
3. `useStore.subscribe()` watches the `pins` array — schedules a debounced push on any change
4. `beforeunload` event listener flushes any pending debounce immediately

```typescript
// app/features/pins/sync/usePinSync.ts
'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/app/store';
import { supabase } from '@/app/lib/supabase';
import type { Pin } from '@/app/types/pins.types';

// camelCase → snake_case for DB
function localToRemote(pin: Pin) {
  return {
    id: pin.id,
    title: pin.title,
    address: pin.address,
    status: pin.status,
    lat: pin.lat,
    lng: pin.lng,
    contact: pin.contact,
    phone: pin.phone,
    follow_up_date: pin.followUpDate,
    notes: pin.notes,
    created_at: pin.createdAt,
    updated_at: pin.updatedAt,
    deleted_at: null,
  };
}

export function usePinSync() {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Step 1: Restore from localStorage
    useStore.persist.rehydrate();

    // Step 2: Pull from Supabase and merge
    async function pullAndMerge() {
      const { data, error } = await supabase
        .from('pins')
        .select('*');

      if (error || !data) return;

      const localPins = useStore.getState().pins;
      const merged = mergePins(localPins, data);
      useStore.setState({ pins: merged });
    }

    pullAndMerge();

    // Step 3: Debounced push on mutations
    const unsubscribe = useStore.subscribe(
      (state) => state.pins,
      (pins) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => pushPins(pins), 2000);
      }
    );

    // Step 4: Flush on page unload
    function flushOnUnload() {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        pushPins(useStore.getState().pins);
      }
    }
    window.addEventListener('beforeunload', flushOnUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', flushOnUnload);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
}

async function pushPins(pins: Pin[]) {
  if (!pins.length) return;
  await supabase
    .from('pins')
    .upsert(pins.map(localToRemote), { onConflict: 'id' });
}
```

**Note on `useStore.subscribe` with selector:** Zustand v5 `subscribe` takes `(selector, listener, options?)`. The selector `(state) => state.pins` makes the subscription fire only when `pins` changes, not on any store update.

**Note on delete:** The existing `deletePin` action removes from local `pins[]` and from Supabase via a separate soft-delete push. The push hook must detect deletions by comparing the previous pin set to the new one and upsert with `deleted_at: new Date().toISOString()` for removed IDs. Alternatively, `deletePin` can be augmented to call a fire-and-forget `softDeleteFromSupabase(id)` utility. Both approaches work — the planner should choose one.

### Pattern 5: StoreHydration Component Replacement

`StoreHydration.tsx` currently calls `useStore.persist.rehydrate()` directly. For Phase 3, replace this with a call to `usePinSync()` so the component renders nothing but triggers both localStorage restore and Supabase pull.

```typescript
// app/components/StoreHydration.tsx (updated)
'use client';
import { usePinSync } from '@/app/features/pins/sync/usePinSync';

export default function StoreHydration() {
  usePinSync();
  return null;
}
```

No changes to `app/page.tsx` — it still renders `<StoreHydration />` in exactly the same position.

### Anti-Patterns to Avoid

- **`setLocalPins(remotePins)`** — overwrites local state with remote data. Kills any unsaved local work. Use the merge algorithm instead (documented above and in PITFALLS.md Pitfall 4).
- **`createClient` inside a hook or component** — creates a new connection per render. Create once in `app/lib/supabase.ts`.
- **Hard-delete from Supabase on pin delete** — a hard delete means a concurrent edit on another device silently loses its work when that device syncs. Use soft-delete with `deleted_at`.
- **Not flushing the debounce on `beforeunload`** — a user who edits a pin and immediately closes the tab loses those changes. The `beforeunload` flush handles this.
- **Importing Supabase client in a Server Component** — the client must only be imported in `'use client'` files (hooks, client components). Mark `usePinSync.ts` and `supabase.ts` accordingly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database upsert with conflict handling | Custom INSERT + UPDATE SQL logic | `supabase.from('pins').upsert(rows, { onConflict: 'id' })` | PostgREST handles conflict resolution atomically — hand-rolled check-then-insert races |
| JSON serialization of `NoteEntry[]` | Custom serializer | Store as `jsonb` column, Supabase returns it as parsed JS array | Postgres `jsonb` is queried natively; `supabase-js` deserializes it automatically |
| UUID generation for new pins | Custom random string | `crypto.randomUUID()` (already used in phase 2) | Browser-native, no collision risk, no extra package |
| Subscription-based cleanup | Manual ref tracking | `useStore.subscribe()` return value (unsubscribe function) | Zustand returns cleanup automatically |

**Key insight:** Supabase's PostgREST layer handles most of the "hard" database work. The sync logic complexity is in the merge algorithm and debounce, not in the Supabase client calls themselves.

---

## Common Pitfalls

### Pitfall 1: Naive Overwrite on Load (CRITICAL)
**What goes wrong:** Pull from Supabase on load and call `useStore.setState({ pins: remotePins })` without merging. Clobbers any local changes made since the last push.
**Why it happens:** "Sync on load" reads like "set state to remote state." The merge step is easy to skip.
**How to avoid:** Always use the merge algorithm (Pattern 3 above). Compare each pin's `updated_at` before deciding which wins.
**Warning signs:** `setLocalPins(remotePins)` or `useStore.setState({ pins: data })` without a merge function.

### Pitfall 2: Missing deleted_at for Deletes
**What goes wrong:** Deleting a pin calls `supabase.from('pins').delete().eq('id', id)`. On another device, the pull-on-load fetches all pins and the deleted pin is gone — but if that other device had just edited that pin, the edit is silently lost.
**Why it happens:** Hard delete is the obvious implementation. Soft-delete requires a schema column and logic.
**How to avoid:** Never hard-delete from Supabase in v1. Set `deleted_at` via an upsert. The merge algorithm reads `deleted_at` and omits the pin from local state only if the remote `updated_at` is newer than the local `updatedAt`.
**Warning signs:** Any `.delete()` call on the pins table.

### Pitfall 3: camelCase/snake_case Mismatch
**What goes wrong:** `followUpDate` sent to Supabase as-is. Postgres column is `follow_up_date`. The upsert silently fails or stores `null`.
**Why it happens:** JS uses camelCase, Postgres convention is snake_case. Without an explicit mapping layer, fields silently misalign.
**How to avoid:** The `localToRemote` and `remoteToLocal` mapper functions in the sync hook are the single translation point. Map every field explicitly — no `...spread` shortcuts.
**Warning signs:** Any `followUpDate` appearing in an upsert payload without conversion.

### Pitfall 4: Supabase Client Imported in Server Component
**What goes wrong:** Next.js App Router renders Server Components by default. Importing `supabase.ts` in a Server Component causes a build error or runtime failure because `localStorage`/`window` dependencies resolve incorrectly.
**Why it happens:** The App Router makes Server Components the default. Any file without `'use client'` is a Server Component.
**How to avoid:** `app/lib/supabase.ts` does not need `'use client'` itself (it has no hooks), but it must only be imported from files that are client components. `usePinSync.ts` is a custom hook — it must have `'use client'` at the top.
**Warning signs:** Import of `supabase` in `layout.tsx`, `page.tsx` (unless that file is already `'use client'`), or any file without the directive.

### Pitfall 5: subscribe Selector Not Stable
**What goes wrong:** `useStore.subscribe((state) => state.pins, listener)` — if the selector creates a new reference each render, the subscription fires for every store update, not just pin changes.
**Why it happens:** Inline selectors can cause false positives if the subscribe call is inside a render function.
**How to avoid:** The `usePinSync` hook calls subscribe inside `useEffect([], [])` — runs once, not on re-render. The selector `(state) => state.pins` is a stable arrow function reference because it's in module scope or the effect closure. This is safe.

### Pitfall 6: RLS Blocks Anon Access
**What goes wrong:** Supabase project created, table created, but no RLS policies. All reads and writes return empty results or 403 errors with the anon key.
**Why it happens:** Supabase enables RLS by default (best practice). Without explicit policies, the anon role has no access.
**How to avoid:** The migration SQL must include RLS enable + `anon` policies for select, insert, and update (documented in Pattern 2). The planner task for schema setup must include these as part of the same migration, not as an afterthought.
**Warning signs:** Supabase API calls return empty arrays with no error, or `{code: '42501', message: 'new row violates row-level security policy'}`.

---

## Migration Path: Existing localStorage Pins

Pins already in `localStorage` from Phase 2 are the "local" side of the merge on first sync. The sequence is:

1. `useStore.persist.rehydrate()` → localStorage pins loaded into Zustand state
2. Supabase pull → fetches 0 rows (new account) or existing cloud pins (returning user)
3. Merge → local pins win (no remote data to conflict with, on first sync)
4. Debounced push → all local pins upserted to Supabase

No special "first-run migration" code is needed — the standard pull-merge-push flow handles it correctly. A user who has 20 pins in localStorage will see them appear in Supabase within 2 seconds of opening the app.

The one edge case: if the user clears localStorage but Supabase has their pins, the pull-on-load restores them. This is exactly the desired behavior.

---

## Code Examples

### Supabase Client Init
```typescript
// app/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Upsert (push pins to Supabase)
```typescript
// Source: https://supabase.com/docs/reference/javascript/upsert
const { error } = await supabase
  .from('pins')
  .upsert(rows, { onConflict: 'id' });
// onConflict: 'id' means: if a row with this id exists, UPDATE it; otherwise INSERT
```

### Soft Delete
```typescript
// Instead of .delete(), upsert with deleted_at set
await supabase
  .from('pins')
  .upsert(
    [{ id: pinId, updated_at: new Date().toISOString(), deleted_at: new Date().toISOString() }],
    { onConflict: 'id' }
  );
```

### Select All Pins (including soft-deleted, for merge)
```typescript
// Fetch ALL rows including deleted ones — merge algorithm handles filtering
const { data, error } = await supabase
  .from('pins')
  .select('*');
```

### Type for Remote Pin Row
```typescript
// Represents one row from Supabase (snake_case, with deleted_at)
interface RemotePin {
  id: string;
  title: string;
  address: string;
  status: string;
  lat: number;
  lng: number;
  contact: string;
  phone: string;
  follow_up_date: string;
  notes: Array<{ text: string; date: string }>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | v24.14.1 | — |
| `@supabase/supabase-js` | Sync hook | ✗ (not installed) | — | Run `npm install @supabase/supabase-js` in Wave 0 |
| Supabase project (cloud) | Schema migration | — | External | Requires human: create project at supabase.com, get URL + anon key |
| `NEXT_PUBLIC_SUPABASE_URL` | Client init | ✗ (not in .env.local) | — | Human provides after creating project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client init | ✗ (not in .env.local) | — | Human provides after creating project |

**Missing dependencies with no fallback (block execution):**
- Supabase project: a human must create the project at supabase.com and add credentials to `.env.local` before the sync hook can be tested. The planner should include a Wave 0 task that prompts for this.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars: required by `supabase.ts`.

**Missing dependencies with fallback:**
- `@supabase/supabase-js`: install via `npm install @supabase/supabase-js` in Wave 0.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test directories in project |
| Config file | None — Wave 0 gap |
| Quick run command | `npx vitest run --reporter=verbose` (after Wave 0 setup) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PINS-13 | merge algorithm: local newer wins | unit | `npx vitest run tests/pins/merge.test.ts -t "local newer wins"` | ❌ Wave 0 |
| PINS-13 | merge algorithm: remote newer wins | unit | `npx vitest run tests/pins/merge.test.ts -t "remote newer wins"` | ❌ Wave 0 |
| PINS-13 | merge algorithm: remote soft-delete newer removes pin | unit | `npx vitest run tests/pins/merge.test.ts -t "soft-delete"` | ❌ Wave 0 |
| PINS-13 | merge algorithm: remote soft-delete older keeps local pin | unit | `npx vitest run tests/pins/merge.test.ts -t "soft-delete older"` | ❌ Wave 0 |
| PINS-13 | localToRemote maps followUpDate to follow_up_date | unit | `npx vitest run tests/pins/sync-mappers.test.ts` | ❌ Wave 0 |
| PINS-13 | push to Supabase on pin mutation (debounced) | manual smoke | Open app, add pin, wait 2s, check Supabase dashboard | manual only |
| PINS-13 | cross-device merge: add on device A, load on device B | manual smoke | Add pin in tab A, open fresh tab B, verify pin appears | manual only |

**Note on merge algorithm tests:** The `mergePins` and `localToRemote`/`remoteToLocal` functions are pure functions with no side effects. They are the highest-value test targets in this phase — they're the logic that prevents data loss. Extract them to `app/features/pins/sync/merge.ts` so they can be unit-tested without Supabase credentials.

### Sampling Rate

- **Per task commit:** `npx vitest run tests/pins/merge.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest` and `@vitest/coverage-v8` — no test runner installed: `npm install -D vitest`
- [ ] `tests/pins/merge.test.ts` — covers merge algorithm (PINS-13 automated coverage)
- [ ] `tests/pins/sync-mappers.test.ts` — covers camelCase/snake_case mapping (PINS-13)
- [ ] `vitest.config.ts` — minimal config pointing to `tests/` directory

---

## Project Constraints (from CLAUDE.md)

- **DRY:** No repeated sync logic — single `usePinSync` hook, single `supabase.ts` singleton. Merge algorithm extracted to its own pure function module.
- **Feature-driven organization:** All sync code lives in `app/features/pins/sync/` — not in a generic `app/lib/sync/` folder.
- **Read Next.js docs:** Check `node_modules/next/dist/docs/` before writing any `'use client'` boundary or middleware patterns. This phase uses only client-side hooks — no server components, no middleware.
- **No deprecated patterns:** `@supabase/ssr` is not used (no auth). Supabase client is initialized with plain `createClient`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` (then drop entirely for no-auth) | Deprecated 2024 | Irrelevant for this phase — no auth |
| Global `supabase` created in component | Singleton in `app/lib/supabase.ts` | Supabase v2 docs recommendation | No reconnection overhead per render |
| Polling for sync | Pull-on-load + debounced push | Standard offline-capable pattern | No open sockets; works offline until push fires |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated in favor of `@supabase/ssr`. Irrelevant here — auth is out of scope entirely.
- `supabase.from('pins').delete().eq('id', id)`: Do not use for this phase. Soft-delete with `upsert + deleted_at` is required.

---

## Open Questions

1. **Soft-delete push path for `deletePin`**
   - What we know: `deletePin(id)` removes from local `pins[]`. A debounced push fires and upserts all current pins. Deleted pins are no longer in the array, so they don't get upserted — but they also don't get marked `deleted_at`.
   - What's unclear: Does the push loop notice the deletion and upsert with `deleted_at`, or does it rely on a separate immediate push at delete time?
   - Recommendation: Add a `softDeleteFromSupabase(id)` utility called synchronously inside `deletePin` (or as a separate action side-effect in the hook). This keeps `deletePin` fast and local while ensuring the remote record gets `deleted_at` set. The planner should decide which approach — augmenting the action vs. the hook detecting the delta.

2. **Pull frequency after initial load**
   - What we know: The spec says "pull-on-load." No mention of periodic polling.
   - What's unclear: Should the app re-pull when the tab regains focus (`visibilitychange` event)?
   - Recommendation: Implement focus-based re-pull (`document.addEventListener('visibilitychange', pullAndMerge)`) as it's a 2-line addition that significantly improves cross-device freshness without Realtime complexity. LOW confidence this is in scope — the planner should confirm against PINS-13.

---

## Sources

### Primary (HIGH confidence)
- [Supabase JS Reference — initializing](https://supabase.com/docs/reference/javascript/initializing) — `createClient` API verified
- [Supabase JS Reference — upsert](https://supabase.com/docs/reference/javascript/upsert) — `onConflict` parameter verified
- [Supabase RLS — anonymous access patterns](https://supabase.com/docs/guides/database/postgres/row-level-security) — `to anon using (true)` policy syntax verified
- [Supabase table schema guide](https://supabase.com/docs/guides/database/tables) — `timestamptz`, `jsonb`, `text primary key` types verified
- [PITFALLS.md Pitfall 4: Supabase Sync Clobbers Local Changes] — merge semantics, soft-delete requirement documented
- [STACK.md: @supabase/supabase-js] — version 2.101.1 confirmed; @supabase/ssr explicitly excluded for no-auth use case
- npm registry — `npm view @supabase/supabase-js version` returns `2.101.1` (2026-03-31)

### Secondary (MEDIUM confidence)
- Zustand v5 subscribe API (selector form) — verified against Zustand v5 changelog and existing project usage patterns

### Tertiary (LOW confidence)
- `beforeunload` flush for debounce — standard web pattern; not Supabase-specific; no dedicated doc source found

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — supabase-js version verified via npm; @supabase/ssr exclusion confirmed in STACK.md
- Architecture (merge algorithm): HIGH — pattern sourced from PITFALLS.md (project-specific documented decision) + standard LWW semantics
- Schema design: HIGH — column types verified against Supabase docs
- RLS policies: HIGH — anonymous policy syntax verified against Supabase RLS docs
- Pitfalls: HIGH — Pitfalls 1-3 from PITFALLS.md (pre-researched); Pitfalls 4-6 from standard Supabase/Next.js patterns
- Debounce/beforeunload pattern: MEDIUM — widely used pattern, no dedicated doc source

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (supabase-js v2 stable; no known breaking changes imminent)
