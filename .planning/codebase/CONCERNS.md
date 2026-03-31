# Codebase Concerns

**Analysis Date:** 2026-03-31

## Tech Debt

**All UI is static / non-functional:**
- Issue: Every button, tab, filter, search input, and navigation element is purely presentational with no event handlers or state management. The sidebar toggle, dark mode toggle, nav tabs, filters, search, profile section, and mobile bottom bar do nothing.
- Files: `app/components/Sidebar.tsx`, `app/components/MobileBottomBar.tsx`, `app/features/map/Map.tsx`
- Impact: The entire UI is a shell. No feature works beyond map rendering and satellite toggle.
- Fix approach: Incrementally wire up interactivity feature by feature. Prioritize sidebar collapse toggle (CSS classes exist but no JS toggles them), then theme switching, then navigation.

**Inline SVG icon duplication:**
- Issue: SVG icons are hardcoded inline throughout components. The same satellite icon SVG appears in both the floating button and the bottom-left label in `Map.tsx`. Icon definitions in `MobileBottomBar.tsx` are embedded directly in the data array.
- Files: `app/features/map/Map.tsx` (lines 94-98 and 119-124), `app/components/MobileBottomBar.tsx` (lines 1-59), `app/components/Sidebar.tsx` (lines 9, 24-39, 53-56, 73-76, 128-130)
- Impact: Adding or changing icons requires finding and updating every inline occurrence. High duplication, error-prone.
- Fix approach: Create a shared `app/components/icons/` directory with reusable icon components, or adopt an icon library (e.g., `lucide-react` since all icons appear to be Lucide-style).

**Hardcoded map default location:**
- Issue: Map center defaults to Tampa, FL (`{ lat: 27.9506, lng: -82.4572 }`) with no mechanism to use the user's actual location or a saved preference.
- Files: `app/features/map/Map.tsx` (line 8)
- Impact: Every user sees the same initial location regardless of where they operate.
- Fix approach: Use the Geolocation API on first load with the hardcoded value as fallback. Store last-known position in localStorage.

**No state management architecture:**
- Issue: There is no shared state solution. Components cannot communicate (e.g., sidebar selection cannot highlight a map pin, theme toggle cannot update `data-theme`).
- Files: All component files
- Impact: Every cross-component feature will require introducing state management from scratch. The longer this is deferred, the more refactoring is needed.
- Fix approach: Introduce React Context for global concerns (theme, sidebar state, selected pin) or adopt Zustand for a lightweight store. Define this early before feature count grows.

**Missing PWA manifest:**
- Issue: `app/layout.tsx` references `/manifest.json` in metadata, but no `manifest.json` exists in `public/`.
- Files: `app/layout.tsx` (line 18), `public/` (missing file)
- Impact: PWA install prompt will fail. The `appleWebApp` configuration on lines 19-22 is incomplete without the manifest, icons, and service worker.
- Fix approach: Create `public/manifest.json` with proper PWA fields, add app icons in multiple sizes, and consider a service worker for offline support.

## Security Considerations

**API key exposure in client bundle:**
- Risk: The Google Maps API key is accessed via `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!` in a `"use client"` component, meaning it is embedded in the client-side JavaScript bundle.
- Files: `app/features/map/Map.tsx` (line 22)
- Current mitigation: Google Maps API keys are designed to be public, but must be restricted.
- Recommendations: Ensure the key has HTTP referrer restrictions in the Google Cloud Console. Restrict to only the Maps JavaScript API, Places API, and Geometry library. Set a daily quota cap to prevent abuse.

**No authentication or authorization:**
- Risk: The app is described as a "Field Sales CRM" but has zero auth. Any deployed instance is fully open.
- Files: All files (no auth middleware, no login page, no session management)
- Current mitigation: None
- Recommendations: Implement authentication before adding any data persistence. Consider NextAuth.js or a managed auth provider (Supabase Auth, Clerk, etc.).

**Non-null assertion on environment variable:**
- Risk: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!` uses TypeScript's non-null assertion. If the env var is missing, the app will silently pass `undefined` to the Google Maps loader, resulting in a cryptic runtime error.
- Files: `app/features/map/Map.tsx` (line 22)
- Current mitigation: None
- Recommendations: Add a runtime check that throws a clear error if the key is missing. Consider validating env vars at build time (e.g., with `@t3-oss/env-nextjs` or a simple validation module).

## Performance Bottlenecks

**Google Maps libraries loaded eagerly:**
- Problem: The `places` and `geometry` libraries are loaded on every page load even though neither is currently used.
- Files: `app/features/map/Map.tsx` (line 23)
- Cause: `libraries: ["places", "geometry"]` in `setOptions` loads these upfront.
- Improvement path: Remove unused libraries until they are actually needed. Load them lazily via `importLibrary("places")` only when the user triggers a search or geometry operation.

**No code splitting beyond Next.js defaults:**
- Problem: With only a single page (`app/page.tsx`), all components load together. As the app grows, the sidebar, map, and mobile bar will all be in one bundle.
- Files: `app/page.tsx`
- Cause: No dynamic imports or route-based splitting.
- Improvement path: Use `next/dynamic` for heavy components (especially the map). As features are added, use Next.js route groups and parallel routes to split by feature.

**CSS sidebar width repeated across breakpoints:**
- Problem: Sidebar width values (340px, 380px, 400px, 420px) and their negative collapsed transforms are duplicated across four media query blocks.
- Files: `app/globals.css` (lines 80-128)
- Cause: CSS custom properties for the sidebar width are not used; raw pixel values are repeated.
- Improvement path: Use a single CSS custom property `--sidebar-width` that changes per breakpoint, then reference it in `.sidebar-wrap` and `.sidebar-wrap.collapsed`.

## Fragile Areas

**Theme system relies on DOM attribute reading:**
- Files: `app/features/map/Map.tsx` (line 17), `app/layout.tsx` (line 33)
- Why fragile: The map component reads `data-theme` from `document.body` via direct DOM access. There is no reactive connection -- if the theme changes after map init, the map styles will not update. The `useEffect` dependency array includes `getTheme` but not the actual theme value, so theme changes will not trigger a re-render.
- Safe modification: When adding theme switching, ensure `mapInstance.current.setOptions({ styles: ... })` is called reactively. Use a theme context or state that triggers map style updates.
- Test coverage: None (no tests exist).

**Sidebar collapse CSS exists but has no JS driver:**
- Files: `app/globals.css` (lines 80-93), `app/components/Sidebar.tsx`
- Why fragile: CSS classes `.collapsed` and `.open` are defined but never toggled by JavaScript. The sidebar toggle button (line 5-12 of `Sidebar.tsx`) has no `onClick` handler.
- Safe modification: Add state to `Sidebar.tsx` (or lift to parent/context) and toggle the `collapsed`/`open` class on the wrapper div.
- Test coverage: None.

## Missing Critical Features

**No data layer:**
- Problem: There is no database, API, or even local storage. The app is a pure UI prototype.
- Blocks: All CRM functionality (pins, contacts, follow-ups, planner, email).

**No routing:**
- Problem: Single-page app with only `app/page.tsx`. No routes for settings, profile, pin details, planner, etc.
- Blocks: Any multi-view navigation. The sidebar tabs and mobile bottom bar tabs have no destinations.

**No error boundaries:**
- Problem: If the Google Maps API fails to load (network error, invalid key, quota exceeded), the entire page will show nothing with no error feedback.
- Files: `app/features/map/Map.tsx` -- the `.then()` on line 27 has no `.catch()` handler.
- Blocks: Any kind of graceful degradation or user feedback on failure.

## Test Coverage Gaps

**No tests whatsoever:**
- What's not tested: Everything. There are zero test files, no test framework configured, no test scripts in `package.json`.
- Files: All files in `app/`
- Risk: Any refactoring or feature addition has no safety net. Regressions will go unnoticed.
- Priority: High. At minimum, set up Vitest and add component render tests for `Map.tsx`, `Sidebar.tsx`, and `MobileBottomBar.tsx`. Add integration tests as data/state management is introduced.

## Dependencies at Risk

**Next.js 16.2.1 is bleeding edge:**
- Risk: Next.js 16 has breaking changes from prior versions. The `AGENTS.md` explicitly warns that APIs, conventions, and file structure may differ from training data. Documentation should be consulted from `node_modules/next/dist/docs/`.
- Impact: AI-assisted development and community resources may provide outdated patterns.
- Migration plan: Not applicable (already on latest), but be aware of stability and breaking changes with minor updates.

**Minimal dependency footprint (positive, but note):**
- The project has only 4 runtime dependencies. This is good for bundle size but means every capability (auth, state, data fetching, forms, validation) will need to be added.
- Plan dependency additions carefully to avoid bloat.

## Scaling Limits

**Google Maps API usage:**
- Current capacity: Free tier allows ~28,000 map loads/month.
- Limit: At scale with a sales team, map loads can spike quickly (each page refresh = 1 load).
- Scaling path: Implement map instance caching, avoid unnecessary re-renders, and consider the Maps Embed API for simpler views.

**Single-page architecture:**
- Current capacity: Fine for prototype.
- Limit: As features are added to one page, initial load time and JS bundle will grow linearly.
- Scaling path: Break into proper Next.js routes and use dynamic imports aggressively.

---

*Concerns audit: 2026-03-31*
