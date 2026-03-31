# Architecture

**Analysis Date:** 2026-03-31

## Pattern Overview

**Overall:** Next.js 16 App Router single-page application with feature-driven organization

**Key Characteristics:**
- Server-first rendering with selective `"use client"` directives for interactive components
- Feature-driven code organization (code grouped by domain feature, not technical layer)
- Single-route app: all UI renders on the root `/` route via `app/page.tsx`
- CSS theming via `data-theme` attribute on `<body>` with CSS custom properties
- No backend API routes, no database, no auth -- pure frontend at this stage

## Layers

**Layout Layer:**
- Purpose: App shell, global styles, fonts, metadata
- Location: `app/layout.tsx`, `app/globals.css`
- Contains: Root HTML structure, DM Sans font config, viewport/metadata exports, theme variable definitions
- Depends on: Nothing
- Used by: All pages (currently only one)

**Page Layer:**
- Purpose: Compose features and shared components into pages
- Location: `app/page.tsx`
- Contains: The single Home page that assembles Sidebar, Map, and MobileBottomBar
- Depends on: `app/components/`, `app/features/`
- Used by: Next.js router (root route)

**Shared Components:**
- Purpose: UI components used across multiple features or pages
- Location: `app/components/`
- Contains: `Sidebar.tsx`, `MobileBottomBar.tsx`
- Depends on: CSS theme variables from `globals.css`
- Used by: `app/page.tsx`

**Feature Modules:**
- Purpose: Self-contained domain features with their own components and utilities
- Location: `app/features/{feature-name}/`
- Contains: Feature component + supporting files (e.g., `Map.tsx` + `map-styles.ts`)
- Depends on: External SDKs (Google Maps), CSS theme variables
- Used by: `app/page.tsx`

## Data Flow

**Rendering Flow:**

1. `app/layout.tsx` renders the root HTML with DM Sans font and dark theme
2. `app/page.tsx` (server component) composes `Sidebar`, `Map`, and `MobileBottomBar`
3. `Map` (client component) initializes Google Maps via `@googlemaps/js-api-loader` in a `useEffect`
4. `Sidebar` and `MobileBottomBar` render static UI shells (no interactivity wired yet)

**Theme Flow:**

1. `<body data-theme="dark">` is set in `app/layout.tsx`
2. CSS custom properties in `app/globals.css` switch values based on `[data-theme]` selector
3. Tailwind `@theme inline` block maps CSS variables to Tailwind color tokens
4. `app/features/map/map-styles.ts` exports Google Maps style arrays per theme
5. `Map.tsx` reads `data-theme` from DOM to select the correct map style

**State Management:**
- Local component state only (`useState` in `Map.tsx` for satellite toggle)
- No global state management library
- No React Context providers
- Theme is stored as a DOM attribute, not React state

## Key Abstractions

**MapButton:**
- Purpose: Reusable floating action button for map controls
- Location: `app/features/map/Map.tsx` (defined as a local function component)
- Pattern: Accepts SVG children, renders a styled `<button>` with consistent hover/active states

**Theme Style Resolver:**
- Purpose: Maps theme name to Google Maps style array
- Location: `app/features/map/map-styles.ts`
- Pattern: Pure function `getStyleForTheme(theme: string)` returns style config

**Tab Configuration:**
- Purpose: Declarative tab definitions for mobile bottom bar
- Location: `app/components/MobileBottomBar.tsx`
- Pattern: Array of `{ label, active, icon }` objects rendered via `.map()`

## Entry Points

**Application Entry:**
- Location: `app/layout.tsx`
- Triggers: Next.js App Router
- Responsibilities: HTML shell, font loading, global CSS, metadata

**Root Page:**
- Location: `app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Compose the main app view (sidebar + map + mobile nav)

**Google Maps Initialization:**
- Location: `app/features/map/Map.tsx`
- Triggers: Component mount (`useEffect`)
- Responsibilities: Load Google Maps JS API, create map instance, apply theme styles

## Error Handling

**Strategy:** Minimal -- early-stage codebase with no error boundaries or try/catch blocks

**Patterns:**
- Non-null assertion on env var: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!`
- Guard clause: `if (!mapRef.current) return` before map initialization
- No error boundaries, no fallback UI, no error logging

## Cross-Cutting Concerns

**Logging:** None implemented
**Validation:** None implemented
**Authentication:** None implemented
**Routing:** Single route (`/`) -- Next.js App Router with no additional routes defined
**Responsive Design:** CSS media queries in `app/globals.css` handle mobile (sidebar becomes overlay, bottom bar appears at <= 768px)
**Theming:** Three themes defined (light/default, dark, gray) via CSS custom properties; dark is the default

## Architectural Decisions

1. **Feature-driven organization** (`app/features/map/`) over technical grouping -- aligns with CLAUDE.md instruction for domain-based code organization
2. **No state management library** -- local state only, appropriate for current scope
3. **Google Maps via `@googlemaps/js-api-loader`** using `importLibrary()` for tree-shakeable loading instead of a React wrapper like `@react-google-maps/api`
4. **Inline SVG icons** throughout instead of an icon library -- every icon is hand-written SVG markup
5. **CSS-driven sidebar collapse** -- animation handled via CSS classes (`.collapsed`, `.open`) rather than React state-driven transitions
6. **Tailwind v4** with `@theme inline` for design token bridging from CSS custom properties

---

*Architecture analysis: 2026-03-31*
