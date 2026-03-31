# Coding Conventions

**Analysis Date:** 2026-03-31

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `app/components/Sidebar.tsx`, `app/features/map/Map.tsx`)
- Non-component modules: kebab-case (e.g., `app/features/map/map-styles.ts`)
- Follow this pattern: components get PascalCase filenames, utility/config modules get kebab-case

**Functions:**
- React components: PascalCase (`MapButton`, `MobileBottomBar`, `Sidebar`)
- Helper/utility functions: camelCase (`getStyleForTheme`, `toggleSatellite`)
- Event handlers: camelCase with descriptive verb (`toggleSatellite`)

**Variables:**
- Constants: UPPER_SNAKE_CASE for module-level constants (`DEFAULT_CENTER`, `DEFAULT_ZOOM`, `DARK_MAP_STYLE`)
- Local variables: camelCase (`mapInstance`, `satellite`)
- CSS custom properties: kebab-case with semantic prefix (`--bg-primary`, `--text-muted`, `--gw-green`)

**Types:**
- TypeScript strict mode is enabled (`tsconfig.json` has `"strict": true`)
- Inline type annotations preferred over separate interface files (see `MapButton` props in `app/features/map/Map.tsx` lines 132-139)
- Use `type` imports with `import type` syntax (see `app/layout.tsx` line 1)

## Code Style

**Formatting:**
- No Prettier config detected -- rely on editor defaults
- 2-space indentation (observed across all files)
- Double quotes for JSX attribute strings
- Semicolons at end of statements
- Trailing commas in multiline structures

**Linting:**
- ESLint 9 with flat config: `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No custom rules added beyond Next.js defaults
- Run with: `npm run lint`

## Import Organization

**Order:**
1. React/framework imports (`react`, `next/*`)
2. Third-party libraries (`@googlemaps/js-api-loader`)
3. Local/relative imports (`./map-styles`, `./components/Sidebar`)

**Path Aliases:**
- `@/*` maps to project root (defined in `tsconfig.json`)
- Currently not used in source files -- relative imports are used instead
- Prefer `@/` alias for cross-feature imports; use relative paths for same-feature imports

## Component Patterns

**Client vs Server Components:**
- Server Components are the default (no directive needed): `app/page.tsx`, `app/layout.tsx`, `app/components/Sidebar.tsx`, `app/components/MobileBottomBar.tsx`
- Client Components marked with `"use client"` only when browser APIs are needed: `app/features/map/Map.tsx`
- Keep `"use client"` boundary as narrow as possible

**Component Structure:**
- One default export per component file for page-level/feature components
- Private helper components defined in same file below the main export (e.g., `MapButton` in `app/features/map/Map.tsx` line 131)
- Props typed inline in the function signature, not as separate interfaces

**Hooks:**
- Use `useRef` for DOM elements and mutable instances (`mapRef`, `mapInstance`)
- Use `useCallback` for stable references passed to effects or children
- Use `useEffect` for side effects like external library initialization

**Data/Config Arrays:**
- Define static data as module-level constants outside components (see `tabs` array in `app/components/MobileBottomBar.tsx` line 1)
- Use `.map()` for rendering lists from data arrays (see filter chips in `app/components/Sidebar.tsx` line 99, stats footer line 148)

## Styling

**Framework:** Tailwind CSS v4 via PostCSS (`postcss.config.mjs`)

**Approach:**
- Utility-first Tailwind classes directly in JSX `className` attributes
- CSS custom properties for theme values defined in `app/globals.css`
- Tailwind theme tokens mapped via `@theme inline` block in `app/globals.css` (lines 50-68)
- Custom CSS only for things Tailwind cannot handle: scrollbar styling, sidebar collapse transitions, responsive sidebar behavior

**Theming:**
- Three themes: light (`:root`), dark (`[data-theme="dark"]`), gray (`[data-theme="gray"]`)
- Theme switched via `data-theme` attribute on `<body>` element
- Use semantic color tokens (`bg-bg-primary`, `text-text-secondary`, `border-border`) -- never raw color values
- Brand color is `orange` (`#C4692A`)

**Responsive Design:**
- Mobile-first approach with Tailwind responsive prefixes (`max-md:`)
- Custom media queries in CSS only for sidebar layout changes
- Mobile bottom bar hidden by default, shown via CSS at `max-width: 768px`
- Sidebar width scales at breakpoints: 340px default, 380px at 1280px, 400px at 1440px, 420px at 1600px

**Conditional Classes:**
- Template literals with ternary expressions for dynamic classes
- Pattern: `className={`base-classes ${condition ? "active-classes" : "inactive-classes"}`}`
- Use `!` prefix (Tailwind important modifier) for override states (e.g., `!bg-orange !text-white`)

## SVG Icons

**Approach:** Inline SVGs directly in JSX, not an icon library
- Standard viewBox: `0 0 24 24`
- Standard attributes: `fill="none" stroke="currentColor" strokeWidth="2"`
- Icons inherit color from parent text color via `currentColor`
- Reusable icon buttons use a wrapper component pattern (see `MapButton` in `app/features/map/Map.tsx`)

## Error Handling

**Patterns:**
- Non-null assertion (`!`) used for environment variables: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!`
- Guard clauses for null refs: `if (!mapRef.current) return;`
- No global error boundary detected yet

## Module Design

**Feature-Driven Organization:**
- Features live under `app/features/{feature-name}/`
- Shared UI components live under `app/components/`
- Feature modules contain their own styles/config (e.g., `app/features/map/map-styles.ts`)

**Exports:**
- One default export per component file
- Named exports for constants and utility functions (`app/features/map/map-styles.ts`)
- No barrel files (`index.ts`) detected

## Comments

**When to Comment:**
- Section dividers using `{/* Section Name */}` in JSX for visual structure
- CSS section headers using `/* --- Section Name --- */` format
- No JSDoc/TSDoc usage detected

## Environment Variables

**Convention:**
- Client-side env vars prefixed with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- Accessed via `process.env.NEXT_PUBLIC_*` with non-null assertion

---

*Convention analysis: 2026-03-31*
