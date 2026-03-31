@AGENTS.md
for this codebase should be pragmatic and it should follow dry coding principles focused on reusability, not repeating yourself and clean code.
This is a feature driven style, organize code by application domain or features.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Groundwork v2**

A construction field sales CRM for Gillman Services, rebuilt from a monolithic 12k-line HTML prototype into a modular Next.js application. Sales reps use it to manage business pins on a map, discover nearby construction-related businesses via Google Places, and create optimized multi-stop routes that export as shareable Google Maps navigation links. The codebase is structured to be fork-friendly for retrofitting to other industries.

**Core Value:** A sales rep can discover businesses in an area, pin the ones worth visiting, build an optimized route, and launch Google Maps navigation — all in one seamless flow.

### Constraints

- **Tech stack**: Next.js 16 + TypeScript + Tailwind CSS v4 — already established
- **Google API limits**: 25 waypoints max per Directions request, Places API quotas
- **Browser-first**: No native mobile app — must work well on mobile browsers
- **Fork-friendly**: Clean separation of business-specific config (queries, branding) from core logic
- **Feature-driven**: Code organized by domain feature, not technical layer (per CLAUDE.md)
- **DRY**: Reusable components and utilities — no duplicated logic across features
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ^5 - All application code (`app/**/*.tsx`, `app/**/*.ts`)
- CSS - Global styles and Tailwind theme configuration (`app/globals.css`)
## Runtime
- Node.js v24.14.1
- npm 11.11.0
- Lockfile: `package-lock.json` (present)
## Frameworks
- Next.js 16.2.1 - Full-stack React framework (App Router)
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering
- Tailwind CSS ^4 - Utility-first CSS framework
- `@tailwindcss/postcss` ^4 - PostCSS integration for Tailwind
- PostCSS - CSS processing pipeline (`postcss.config.mjs`)
- TypeScript ^5 - Type checking and compilation (`tsconfig.json`)
- ESLint ^9 - Linting (`eslint.config.mjs`)
- `eslint-config-next` 16.2.1 - Next.js ESLint rules (core-web-vitals + typescript presets)
## Key Dependencies
- `@googlemaps/js-api-loader` ^2.0.2 - Google Maps JavaScript API loader, used in `app/features/map/Map.tsx`
- `@types/google.maps` ^3.58.1 - TypeScript types for Google Maps API
- `@types/node` ^20 - Node.js type definitions
- `@types/react` ^19 - React type definitions
- `@types/react-dom` ^19 - React DOM type definitions
## Configuration
- Target: ES2017
- Module resolution: bundler
- Strict mode: enabled
- Path alias: `@/*` maps to project root (`"./*"`)
- JSX: react-jsx
- Incremental compilation: enabled
- Next.js plugin included
- `.env.local` present - contains environment configuration
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Required for Google Maps (referenced in `app/features/map/Map.tsx`)
- `next.config.ts` - Next.js configuration (currently empty/default)
- `postcss.config.mjs` - PostCSS with `@tailwindcss/postcss` plugin
- `eslint.config.mjs` - ESLint flat config with Next.js core-web-vitals and TypeScript presets
- CSS custom properties with `data-theme` attribute on `<body>` (`app/globals.css`)
- Three themes: light (default `:root`), `dark`, `gray`
- Theme tokens mapped to Tailwind via `@theme inline` block in `app/globals.css`
- Custom design tokens: `--orange`, `--bg-primary`, `--bg-card`, `--text-primary`, `--border`, etc.
## Fonts
- DM Sans (Google Fonts) - loaded via `next/font/google` in `app/layout.tsx`
- Weights: 300, 400, 500, 600, 700, 800
- CSS variable: `--font-dm-sans`
## PWA Support
- Metadata in `app/layout.tsx` references `/manifest.json` (file not yet present in `public/`)
- Apple Web App configuration: capable, black-translucent status bar, title "Groundwork"
- Viewport theme color: `#D4712A`
## NPM Scripts
## Platform Requirements
- Node.js >= 24.x
- npm >= 11.x
- Google Maps API key (set as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`)
- Next.js compatible hosting (Vercel, Node.js server, Docker)
- No database or backend services detected yet
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase (e.g., `app/components/Sidebar.tsx`, `app/features/map/Map.tsx`)
- Non-component modules: kebab-case (e.g., `app/features/map/map-styles.ts`)
- Follow this pattern: components get PascalCase filenames, utility/config modules get kebab-case
- React components: PascalCase (`MapButton`, `MobileBottomBar`, `Sidebar`)
- Helper/utility functions: camelCase (`getStyleForTheme`, `toggleSatellite`)
- Event handlers: camelCase with descriptive verb (`toggleSatellite`)
- Constants: UPPER_SNAKE_CASE for module-level constants (`DEFAULT_CENTER`, `DEFAULT_ZOOM`, `DARK_MAP_STYLE`)
- Local variables: camelCase (`mapInstance`, `satellite`)
- CSS custom properties: kebab-case with semantic prefix (`--bg-primary`, `--text-muted`, `--gw-green`)
- TypeScript strict mode is enabled (`tsconfig.json` has `"strict": true`)
- Inline type annotations preferred over separate interface files (see `MapButton` props in `app/features/map/Map.tsx` lines 132-139)
- Use `type` imports with `import type` syntax (see `app/layout.tsx` line 1)
## Code Style
- No Prettier config detected -- rely on editor defaults
- 2-space indentation (observed across all files)
- Double quotes for JSX attribute strings
- Semicolons at end of statements
- Trailing commas in multiline structures
- ESLint 9 with flat config: `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No custom rules added beyond Next.js defaults
- Run with: `npm run lint`
## Import Organization
- `@/*` maps to project root (defined in `tsconfig.json`)
- Currently not used in source files -- relative imports are used instead
- Prefer `@/` alias for cross-feature imports; use relative paths for same-feature imports
## Component Patterns
- Server Components are the default (no directive needed): `app/page.tsx`, `app/layout.tsx`, `app/components/Sidebar.tsx`, `app/components/MobileBottomBar.tsx`
- Client Components marked with `"use client"` only when browser APIs are needed: `app/features/map/Map.tsx`
- Keep `"use client"` boundary as narrow as possible
- One default export per component file for page-level/feature components
- Private helper components defined in same file below the main export (e.g., `MapButton` in `app/features/map/Map.tsx` line 131)
- Props typed inline in the function signature, not as separate interfaces
- Use `useRef` for DOM elements and mutable instances (`mapRef`, `mapInstance`)
- Use `useCallback` for stable references passed to effects or children
- Use `useEffect` for side effects like external library initialization
- Define static data as module-level constants outside components (see `tabs` array in `app/components/MobileBottomBar.tsx` line 1)
- Use `.map()` for rendering lists from data arrays (see filter chips in `app/components/Sidebar.tsx` line 99, stats footer line 148)
## Styling
- Utility-first Tailwind classes directly in JSX `className` attributes
- CSS custom properties for theme values defined in `app/globals.css`
- Tailwind theme tokens mapped via `@theme inline` block in `app/globals.css` (lines 50-68)
- Custom CSS only for things Tailwind cannot handle: scrollbar styling, sidebar collapse transitions, responsive sidebar behavior
- Three themes: light (`:root`), dark (`[data-theme="dark"]`), gray (`[data-theme="gray"]`)
- Theme switched via `data-theme` attribute on `<body>` element
- Use semantic color tokens (`bg-bg-primary`, `text-text-secondary`, `border-border`) -- never raw color values
- Brand color is `orange` (`#C4692A`)
- Mobile-first approach with Tailwind responsive prefixes (`max-md:`)
- Custom media queries in CSS only for sidebar layout changes
- Mobile bottom bar hidden by default, shown via CSS at `max-width: 768px`
- Sidebar width scales at breakpoints: 340px default, 380px at 1280px, 400px at 1440px, 420px at 1600px
- Template literals with ternary expressions for dynamic classes
- Pattern: `className={`base-classes ${condition ? "active-classes" : "inactive-classes"}`}`
- Use `!` prefix (Tailwind important modifier) for override states (e.g., `!bg-orange !text-white`)
## SVG Icons
- Standard viewBox: `0 0 24 24`
- Standard attributes: `fill="none" stroke="currentColor" strokeWidth="2"`
- Icons inherit color from parent text color via `currentColor`
- Reusable icon buttons use a wrapper component pattern (see `MapButton` in `app/features/map/Map.tsx`)
## Error Handling
- Non-null assertion (`!`) used for environment variables: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!`
- Guard clauses for null refs: `if (!mapRef.current) return;`
- No global error boundary detected yet
## Module Design
- Features live under `app/features/{feature-name}/`
- Shared UI components live under `app/components/`
- Feature modules contain their own styles/config (e.g., `app/features/map/map-styles.ts`)
- One default export per component file
- Named exports for constants and utility functions (`app/features/map/map-styles.ts`)
- No barrel files (`index.ts`) detected
## Comments
- Section dividers using `{/* Section Name */}` in JSX for visual structure
- CSS section headers using `/* --- Section Name --- */` format
- No JSDoc/TSDoc usage detected
## Environment Variables
- Client-side env vars prefixed with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- Accessed via `process.env.NEXT_PUBLIC_*` with non-null assertion
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Server-first rendering with selective `"use client"` directives for interactive components
- Feature-driven code organization (code grouped by domain feature, not technical layer)
- Single-route app: all UI renders on the root `/` route via `app/page.tsx`
- CSS theming via `data-theme` attribute on `<body>` with CSS custom properties
- No backend API routes, no database, no auth -- pure frontend at this stage
## Layers
- Purpose: App shell, global styles, fonts, metadata
- Location: `app/layout.tsx`, `app/globals.css`
- Contains: Root HTML structure, DM Sans font config, viewport/metadata exports, theme variable definitions
- Depends on: Nothing
- Used by: All pages (currently only one)
- Purpose: Compose features and shared components into pages
- Location: `app/page.tsx`
- Contains: The single Home page that assembles Sidebar, Map, and MobileBottomBar
- Depends on: `app/components/`, `app/features/`
- Used by: Next.js router (root route)
- Purpose: UI components used across multiple features or pages
- Location: `app/components/`
- Contains: `Sidebar.tsx`, `MobileBottomBar.tsx`
- Depends on: CSS theme variables from `globals.css`
- Used by: `app/page.tsx`
- Purpose: Self-contained domain features with their own components and utilities
- Location: `app/features/{feature-name}/`
- Contains: Feature component + supporting files (e.g., `Map.tsx` + `map-styles.ts`)
- Depends on: External SDKs (Google Maps), CSS theme variables
- Used by: `app/page.tsx`
## Data Flow
- Local component state only (`useState` in `Map.tsx` for satellite toggle)
- No global state management library
- No React Context providers
- Theme is stored as a DOM attribute, not React state
## Key Abstractions
- Purpose: Reusable floating action button for map controls
- Location: `app/features/map/Map.tsx` (defined as a local function component)
- Pattern: Accepts SVG children, renders a styled `<button>` with consistent hover/active states
- Purpose: Maps theme name to Google Maps style array
- Location: `app/features/map/map-styles.ts`
- Pattern: Pure function `getStyleForTheme(theme: string)` returns style config
- Purpose: Declarative tab definitions for mobile bottom bar
- Location: `app/components/MobileBottomBar.tsx`
- Pattern: Array of `{ label, active, icon }` objects rendered via `.map()`
## Entry Points
- Location: `app/layout.tsx`
- Triggers: Next.js App Router
- Responsibilities: HTML shell, font loading, global CSS, metadata
- Location: `app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Compose the main app view (sidebar + map + mobile nav)
- Location: `app/features/map/Map.tsx`
- Triggers: Component mount (`useEffect`)
- Responsibilities: Load Google Maps JS API, create map instance, apply theme styles
## Error Handling
- Non-null assertion on env var: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!`
- Guard clause: `if (!mapRef.current) return` before map initialization
- No error boundaries, no fallback UI, no error logging
## Cross-Cutting Concerns
## Architectural Decisions
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
