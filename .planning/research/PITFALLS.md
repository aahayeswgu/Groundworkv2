# Pitfalls Research

**Domain:** Map-centric field sales CRM with route optimization and business discovery
**Researched:** 2026-03-31
**Confidence:** HIGH (Google API behavior verified via official docs + multiple sources; Supabase sync patterns verified via official and community sources)

---

## Critical Pitfalls

### Pitfall 1: Google Places Bounds Are Biases, Not Filters

**What goes wrong:**
The draw-to-search rectangle returns results that fall outside the drawn area. Google Places API treats `locationRestriction` and `locationBias` as ranking signals, not hard boundaries. A business 2 miles outside the drawn box can still appear if Google considers it sufficiently relevant.

**Why it happens:**
Developers see "location restriction" in the API name and assume it means strict containment. The API documentation acknowledges that "some results outside of the defined boundaries" may appear "due to biasing." This is especially pronounced for text-based searches where keyword relevance competes with geographic proximity.

**How to avoid:**
After receiving Places API results, always apply a client-side containment check using `google.maps.geometry.poly.containsLocation()` (or a manual lat/lng bounds check against the rectangle corners). Reject any result whose coordinates fall outside the drawn bounding box. This requires the `geometry` library to be loaded. The prototype's "strict bounds filtering" requirement must be implemented as a post-request filter layer, not as an API parameter.

**Warning signs:**
- Results appear outside the drawn rectangle on the map
- User reports "I searched a small area but got businesses from the next town"
- Place markers appearing well outside the orange rectangle overlay

**Phase to address:**
Discover feature phase — implement the containment filter as part of the Places API response handler before results ever reach the UI layer.

---

### Pitfall 2: The Google Maps Shareable URL Breaks on Mobile

**What goes wrong:**
The app generates a Google Maps URL for turn-by-turn navigation. On mobile browsers (the primary use case for a field sales rep), the Maps URL format supports a maximum of 3 waypoints. A 10-stop route generates a valid-looking URL that silently truncates or fails when opened on a phone.

**Why it happens:**
Google Maps URL spec lists waypoint limits per platform: desktop browsers support up to 9 waypoints, mobile browsers support only 3. This is a platform constraint in the Google Maps consumer app, not the API. Developers typically test on desktop during development and miss the mobile truncation entirely.

**How to avoid:**
- Warn users when their route has more than 3 stops and the target is mobile navigation
- Consider splitting routes into segments for long-stop routes (generate multiple linked URLs)
- Always encode addresses rather than coordinates in URLs (shorter, more readable, more reliable)
- Test URL generation on an actual mobile device against the Google Maps app, not just desktop

**Warning signs:**
- Route URL works perfectly in desktop testing but shows wrong stop count on mobile
- QA done entirely on desktop/laptop

**Phase to address:**
Route creation phase — build URL generation with mobile-awareness from day one, add a stop-count warning in the confirm panel.

---

### Pitfall 3: Places API New vs Legacy — Class-Level Breaking Change

**What goes wrong:**
As of March 1, 2025, new projects cannot enable legacy Places services. The new Places API (New) is not backward-compatible at the class level: `google.maps.places.PlacesService` (legacy) and `google.maps.places.Place` (new) are completely separate class hierarchies. Attempting to use legacy response fields (`place.name`, `place.photos[0].getUrl()`) with the new API returns `undefined` silently.

**Why it happens:**
The transition happened mid-2024 with a hard cutoff in March 2025. Tutorials, Stack Overflow answers, and community examples still predominantly show legacy API usage. The old prototype was written against the legacy API. A modular rebuild written in 2026 using copied patterns from the prototype will use deprecated classes without realizing it.

**How to avoid:**
- Explicitly target the Places API (New) — use `google.maps.places.Place` not `PlacesService`
- Use field masks (`fields` parameter) on every request — required by the new API
- Map old field names to new: `name` → `displayName.text`, `photos[0].getUrl()` → `photos[0].getURI()`
- Do not copy Places invocation patterns from the old prototype's `index.html`

**Warning signs:**
- `undefined` for business names, photos, or ratings in discover results
- Using `new google.maps.places.PlacesService(div)` constructor anywhere
- Copying search code from the old prototype verbatim

**Phase to address:**
Discover feature phase — build the Places integration fresh against the New API docs, do not reference the old prototype's search implementation.

---

### Pitfall 4: Supabase Sync Clobbers Local Changes

**What goes wrong:**
The app uses localStorage as the primary store with debounced Supabase cloud sync. When the app loads on a second device (or after a page refresh), the sync layer pulls from Supabase and overwrites in-progress local changes. A rep who added 3 new pins on their phone, then opened the app on a tablet, could see those unsaved pins disappear.

**Why it happens:**
Supabase has no native offline-first or conflict resolution layer. Developers implement "sync on load" as a simple overwrite: fetch remote data, set local state. This is a last-remote-wins strategy with no merge logic. It works fine for a single-device workflow but breaks immediately with multi-device or offline scenarios.

**How to avoid:**
- Implement a last-write-wins strategy using `updated_at` timestamps on every pin record
- On sync load: compare each remote record's `updated_at` against the local record's `updated_at` — keep whichever is newer
- Never overwrite the full local dataset on load; merge record-by-record
- For deletes, use soft-delete (`deleted_at` timestamp) not hard-delete, so the remote delete doesn't silently remove a local record the user just modified
- Debounce writes to Supabase with a 2–5 second delay, but trigger immediate sync on page unload via `beforeunload`

**Warning signs:**
- "Sync on load" code does `setLocalPins(remotePins)` without merging
- No `updated_at` timestamp on pin records in the Supabase schema
- A rep reports pins "disappearing" after opening app on a different device

**Phase to address:**
Pin persistence phase — design the schema and sync logic with merge semantics from the start. Retrofitting conflict resolution into a naive overwrite sync is painful.

---

### Pitfall 5: Google Maps Instance Surviving React Unmounts

**What goes wrong:**
The `google.maps.Map` instance is initialized in a `useEffect` and stored in a `useRef`. If the component unmounts and remounts (route change, Strict Mode double-invoke, or feature flag toggle), a second map instance initializes on a div that already has a map, or the old instance holds references to markers, listeners, and overlays that never get cleaned up. Memory usage grows; markers from previous sessions ghost onto the new map.

**Why it happens:**
Google Maps operates on an imperative model — you initialize it, attach objects, add listeners. React's declarative lifecycle doesn't match this. In React 18 Strict Mode, effects run twice in development. Without a cleanup function that explicitly calls `google.maps.event.clearInstanceListeners(mapRef.current)` and removes all overlays, the old instance stays in memory.

**How to avoid:**
- Always return a cleanup function from the `useEffect` that initializes the map
- Cleanup must: remove all event listeners from the map instance (`clearInstanceListeners`), remove all markers and overlays explicitly (call `.setMap(null)` on each), and null the ref
- Use a single map instance as a stable singleton — never recreate the map; instead update its properties
- Test with React Strict Mode enabled (it is by default in Next.js dev mode) — if the map appears twice or markers duplicate, cleanup is broken

**Warning signs:**
- Map renders twice during development
- Markers appear duplicated after navigating away and back
- Chrome DevTools memory profile shows growing heap on map interaction
- Event listener count increasing in DevTools

**Phase to address:**
Map foundation phase — establish correct initialization and cleanup patterns before any overlays or markers are added.

---

### Pitfall 6: 18 Concurrent Places Queries Exhausting API Quota

**What goes wrong:**
The discover feature fires 18 text search queries per draw event (one per construction category). Each query is billed as a separate Text Search API call. A single draw-to-search interaction consumes 18 API units. At Google's pricing, Text Search (New) costs $0.032/request. 18 queries per search = $0.576 per discovery session. A sales rep doing 10 searches per day is $5.76/day per user, or ~$1,700/month for a 10-rep team.

**Why it happens:**
The prototype fires all queries without any throttling, deduplication of in-flight requests, or cost awareness. In a single-user prototype this is unnoticeable. At team scale with multiple concurrent users, quota limits are hit and costs spike.

**How to avoid:**
- Batch or parallelize with a concurrency cap (max 3–4 in-flight requests at once) to avoid quota rate limits
- Cache results by `{queryType, boundsHash}` — if the rep draws the same or overlapping area again, return cached results within a 5-minute TTL
- Show a "Searching (3/18)..." progress indicator so the user doesn't spam re-draws while results load
- Set a daily quota cap in Google Cloud Console as a billing safeguard
- Consider restricting discover to once-per-draw (disable the draw button while results load)

**Warning signs:**
- No request caching layer exists
- Draw button remains enabled while search is in progress
- No API quota cap configured in Google Cloud Console
- Each query fires independently with no concurrency control

**Phase to address:**
Discover feature phase — design the query orchestration layer with caching and concurrency control before wiring up to the UI.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy Places search code from old prototype | Fast start | Silent use of legacy deprecated API; breaks on new API projects | Never — always write fresh against New API |
| `setLocalPins(remotePins)` sync on load | Simple 5-line implementation | Clobbers local changes on multi-device use | Never for production |
| Single `useEffect` for all map logic | Keeps map code co-located | One unmount bug breaks everything; massive effect is untestable | MVP only, refactor before adding overlays |
| No request caching on discover queries | No infrastructure needed | Quota exhaustion, billing spikes at team scale | Acceptable for single-user prototype, not for team deployment |
| Hardcode Tampa as map center | Simple default | Every non-Tampa user sees wrong initial location | Acceptable for prototype, fix before team rollout |
| No error boundary on map load failure | Less code | Blank page with no feedback when API key fails or quota exceeded | Never — add error boundary in map foundation phase |
| Global state via prop drilling | No state library needed | Cross-component sync (sidebar ↔ map hover) becomes impossible | Acceptable for 1-2 props; breaks at pin list + map sync |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Places API (New) | Using `PlacesService` constructor (legacy) | Use `google.maps.places.Place` class and `searchNearby`/`searchByText` static methods |
| Google Places API (New) | Requesting all fields without field mask | Specify only needed fields in `fields` array — required, affects billing |
| Google Places API (New) | Accessing `place.name` directly | Access `place.displayName` (object with `.text` property) — field names changed |
| Google Directions API | Treating `optimizeWaypoints: true` as TSP-optimal | It uses a heuristic — good enough but not guaranteed optimal above 10 stops |
| Google Directions API | Using Directions API in 2026 | Directions API is legacy; the Routes API replaced it March 2025 — check billing and availability |
| Google Maps URL | Generating URL with 10+ waypoints for mobile users | Mobile Google Maps app silently truncates at 3 waypoints; warn user or split the route |
| Supabase Realtime | Subscribing to table changes without cleanup | `channel.unsubscribe()` must be called on component unmount or subscriptions leak |
| Supabase sync | Using `upsert` without `updated_at` comparison | Newer local data gets overwritten by older remote data on next sync |
| Next.js App Router | Using `window` or `document` in module scope | Google Maps SDK accesses `window` — must be in `'use client'` component inside `useEffect` |
| Next.js App Router | Importing Google Maps loader in a Server Component | Script loading is client-side; any Google Maps initialization must be in a Client Component |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering the map component on every state change | Map flickers, pans to default on pin add | Store map instance in `useRef`, never in `useState`; use stable keys | Immediately when pins or discover results added to state |
| Creating new `Marker` objects instead of updating existing ones | Marker count doubles on re-render; old markers ghost on map | Maintain a `markerRegistry` Map keyed by pin id; update existing markers, create only when new | At ~20+ pins |
| Firing all 18 discover queries synchronously | Browser freezes briefly; quota rate limit errors | Concurrency cap of 3–4 simultaneous requests | Immediately with slow connections; at scale with billing |
| Loading `places` and `geometry` libraries eagerly on page load | +200–400ms to initial map load | Load libraries lazily via `google.maps.importLibrary("places")` only when discover is triggered | At every page load |
| Storing all pins as one blob in localStorage | Entire pin set serialized/deserialized on every change | Store pins as individual keyed entries or use IndexedDB for >100 pins | At ~200+ pins |
| Supabase subscription per pin | Hundreds of open WebSocket subscriptions for a large pin set | Subscribe to table-level changes, filter client-side | At ~50+ pins with individual subscriptions |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Unrestricted Google Maps API key | Key scraped from client bundle, used for expensive requests billed to the account | Add HTTP referrer restrictions and API restrictions in Google Cloud Console immediately |
| No daily quota cap on Maps/Places APIs | Runaway usage or abuse drains billing account | Set per-API daily limits in Google Cloud Console as a hard safeguard |
| Non-null assertion on `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!` | Cryptic runtime error instead of clear failure message | Runtime validation at app startup; throw descriptive error if key is missing |
| Open app with no auth before Supabase data persists | Any URL visitor can read/modify all pin data | Even if auth is out of scope for v1, lock Supabase tables with RLS from the first migration |
| Storing sensitive contact notes in localStorage | Accessible to other scripts on the same origin | Acceptable for v1 CRM notes; document risk and address before multi-tenant use |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Draw-to-search with no visual feedback during 18 queries | Rep thinks it's broken, draws again, fires 36 queries | Show progressive loading state: "Searching construction contacts (5/18)..." with a cancel option |
| Route confirm panel with no distance/time until Google responds | Rep doesn't know if the route is 10 miles or 100 | Show optimistic stop count immediately; populate distance/time once Directions API responds |
| Mobile map where click-to-place mode activates a single tap | Accidental pin drops while panning | Use long-press (300ms hold) on mobile for pin placement, same as draw-to-search |
| Sidebar losing scroll position when a pin updates | Rep loses place in long pin list every time they edit | Use `key` stability and virtualized list with preserved scroll offset |
| Info window that closes when the user taps outside on mobile | Frustrating tap-to-dismiss cycle on small screens | Use bottom sheet on mobile instead of map-overlay info window |
| No offline indicator | Rep in a building with bad signal doesn't know why sync failed | Show connectivity status badge; queue writes and sync when reconnected |

---

## "Looks Done But Isn't" Checklist

- [ ] **Discover bounds filtering:** Markers appear inside the rectangle — verify that places 5+ miles outside the drawn area are also being rejected (API bias may still return them)
- [ ] **Route navigation URL:** Link works on desktop — verify on an actual mobile device with 10 stops; check that Google Maps app opens (not browser) and all stops are present
- [ ] **Supabase sync:** Pins save on one device — verify that adding pins on device A and loading on device B does not clobber device A's unsaved changes
- [ ] **Pin markers:** Markers show on map — verify that adding 50+ pins does not create duplicate markers after a state update (check for leaked marker objects)
- [ ] **Places API (New):** Business names display correctly — verify `displayName.text` not `name`; verify photos load via `getURI()` not `getUrl()`
- [ ] **Map cleanup:** Map renders correctly — verify in React Strict Mode (development) that the map does not initialize twice or markers double
- [ ] **Google Maps URL:** Route link encodes all stops — verify URL length stays under 2,048 characters for a 25-stop route using full addresses

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Legacy Places API used throughout discover | HIGH | Audit all Places API call sites; replace `PlacesService` with `Place` class; remap all field accesses; retest all discover paths |
| Naive overwrite sync already shipped to users | HIGH | Add `updated_at` to schema via migration; build merge logic; replay all historical records to add timestamps; communicate sync improvement to users |
| Mobile URL truncation discovered post-launch | MEDIUM | Add stop-count warning in route confirm panel; generate segment URLs for >3 stops; no data migration needed |
| Map instance memory leak at 100+ pins | MEDIUM | Audit `useEffect` cleanup; implement `markerRegistry` pattern; clear markers on unmount; no schema changes needed |
| Quota exhaustion from uncached discover queries | MEDIUM | Add request cache layer; implement concurrency cap; set Google Cloud quota limits immediately; no data migration |
| Google Maps API key unrestricted and exposed | LOW-MEDIUM | Add referrer and API restrictions in Google Cloud Console immediately (5 minutes); rotate key if abused |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Places bounds are biases not filters | Discover feature phase | Draw a rectangle and confirm no result markers appear outside it |
| Mobile URL waypoint truncation | Route creation phase | Open a 10-stop URL on a physical mobile device and count stops in Google Maps |
| Places API New vs Legacy class mismatch | Discover feature phase | Business names, ratings, and photos all render correctly from first integration |
| Supabase sync clobbers local changes | Pin persistence phase | Add pins on device A, open app on device B, verify device A pins survive |
| Map instance survival across React unmounts | Map foundation phase | Enable React Strict Mode; verify single map render, no duplicate markers |
| 18 concurrent queries exhausting quota | Discover feature phase | Monitor Google Cloud Console usage after 5 discovery sessions; confirm no rate limit errors |
| Marker recreation on every state update | Pin list + map phase | Add 30 pins; check Chrome DevTools for increasing number of map overlay objects |
| No error boundary on map load | Map foundation phase | Test with invalid API key; verify user sees an error message not a blank page |
| State management deferred too long | State architecture phase (early) | Sidebar hover highlights matching map marker without prop-drilling through 4 components |

---

## Sources

- [Google Places API — locationRestriction biasing behavior](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Google Places API — legacy vs new migration](https://developers.google.com/maps/documentation/javascript/legacy/places-migration-overview)
- [Google Maps Platform — March 2025 billing and API changes](https://developers.google.com/maps/billing-and-pricing/march-2025)
- [Google Maps URLs — waypoint limits per platform](https://developers.google.com/maps/documentation/urls/get-started)
- [Google Maps Places API — usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Supabase Realtime — troubleshooting and offline patterns](https://supabase.com/docs/guides/realtime/troubleshooting)
- [Supabase — offline-first sync discussion](https://github.com/orgs/supabase/discussions/357)
- [RxDB — downsides of offline-first apps (conflict patterns)](https://rxdb.info/downsides-of-offline-first.html)
- [Google Maps JS API — best practices](https://developers.google.com/maps/documentation/javascript/best-practices)
- [Google Maps JS API — error messages reference](https://developers.google.com/maps/documentation/javascript/error-messages)
- [visgl/react-google-maps — React integration library](https://visgl.github.io/react-google-maps/docs)
- [LogRocket — memory leaks in React applications](https://blog.logrocket.com/memory-leaks-in-react-applications/)
- [Google Maps deprecations timeline](https://developers.google.com/maps/deprecations)
- [Google Maps Platform — Routes API replacing Directions API March 2025](https://masterconcept.ai/news/google-maps-api-changes-2025-migration-guide-for-directions-api-distance-matrix-api/)

---
*Pitfalls research for: map-centric field sales CRM with route optimization and business discovery (Groundwork v2)*
*Researched: 2026-03-31*
