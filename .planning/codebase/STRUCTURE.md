# Codebase Structure

**Analysis Date:** 2026-03-31

## Directory Layout

```
gwv2/
├── app/                    # Next.js App Router root
│   ├── components/         # Shared UI components
│   │   ├── MobileBottomBar.tsx
│   │   └── Sidebar.tsx
│   ├── features/           # Feature-driven domain modules
│   │   └── map/            # Map feature
│   │       ├── Map.tsx
│   │       └── map-styles.ts
│   ├── globals.css         # Global styles, theme variables, Tailwind config
│   ├── layout.tsx          # Root layout (HTML shell, fonts, metadata)
│   ├── page.tsx            # Root page (main app composition)
│   └── favicon.ico
├── public/                 # Static assets served at /
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .planning/              # Planning and analysis documents
│   └── codebase/           # Codebase mapping documents
├── AGENTS.md               # Agent instructions (Next.js version warnings)
├── CLAUDE.md               # Project coding guidelines
├── eslint.config.mjs       # ESLint flat config (next/core-web-vitals + typescript)
├── next.config.ts          # Next.js configuration (currently empty)
├── package.json            # Dependencies and scripts
├── package-lock.json       # Dependency lockfile
├── postcss.config.mjs      # PostCSS with Tailwind v4 plugin
├── tsconfig.json           # TypeScript config (strict, bundler resolution)
└── .env.local              # Environment variables (Google Maps API key)
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router application code
- Contains: Pages, layouts, components, features, global styles
- Key files: `layout.tsx` (root layout), `page.tsx` (home page), `globals.css` (theme + Tailwind)

**`app/components/`:**
- Purpose: Shared UI components reusable across pages and features
- Contains: React components (`.tsx` files)
- Key files: `Sidebar.tsx` (main sidebar navigation), `MobileBottomBar.tsx` (mobile tab bar)

**`app/features/`:**
- Purpose: Feature-driven domain modules -- each subdirectory is a self-contained feature
- Contains: Feature directories, each with a primary component and supporting files
- Key files: `map/Map.tsx` (Google Maps integration), `map/map-styles.ts` (theme-aware map styles)

**`public/`:**
- Purpose: Static assets served directly by Next.js
- Contains: SVG icons (mostly Next.js defaults, not actively used)
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: Project planning and codebase analysis documentation
- Contains: Markdown analysis files
- Generated: By tooling/agents
- Committed: Yes

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout -- HTML shell, DM Sans font, metadata, viewport config
- `app/page.tsx`: Home page -- composes Sidebar + Map + MobileBottomBar

**Configuration:**
- `next.config.ts`: Next.js config (empty, no custom settings)
- `tsconfig.json`: TypeScript strict mode, `@/*` path alias mapped to project root
- `eslint.config.mjs`: ESLint with Next.js core-web-vitals and TypeScript rules
- `postcss.config.mjs`: Tailwind v4 via `@tailwindcss/postcss` plugin
- `.env.local`: Contains `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Core Logic:**
- `app/features/map/Map.tsx`: Google Maps initialization and floating controls (client component)
- `app/features/map/map-styles.ts`: Theme-aware Google Maps style definitions
- `app/components/Sidebar.tsx`: Sidebar with header, profile, nav tabs, search, filters, pin list, stats
- `app/components/MobileBottomBar.tsx`: Mobile-only bottom tab navigation

**Styles:**
- `app/globals.css`: All CSS -- theme variables (light/dark/gray), Tailwind `@theme inline` token mapping, base resets, sidebar animations, responsive breakpoints

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `Map.tsx`, `Sidebar.tsx`, `MobileBottomBar.tsx`)
- Non-component modules: `kebab-case.ts` (e.g., `map-styles.ts`)
- Next.js special files: `lowercase.tsx` (e.g., `layout.tsx`, `page.tsx`)
- Config files: `lowercase` with dots (e.g., `next.config.ts`, `eslint.config.mjs`)

**Directories:**
- Feature directories: `lowercase` single word (e.g., `map`)
- Shared directories: `lowercase` (e.g., `components`, `features`)

**Exports:**
- Components: default exports with PascalCase names
- Utilities/constants: named exports (e.g., `getStyleForTheme`, `DARK_MAP_STYLE`)

## Where to Add New Code

**New Feature (e.g., "contacts", "planner", "email"):**
- Create directory: `app/features/{feature-name}/`
- Primary component: `app/features/{feature-name}/{FeatureName}.tsx`
- Supporting files: `app/features/{feature-name}/{feature-name}-{purpose}.ts`
- Import from page: `app/page.tsx` or a new route page

**New Route/Page:**
- Create: `app/{route-name}/page.tsx`
- Layout (if needed): `app/{route-name}/layout.tsx`

**New Shared Component:**
- Create: `app/components/{ComponentName}.tsx`
- Use PascalCase for the filename

**New Utility/Helper within a feature:**
- Place alongside the feature: `app/features/{feature-name}/{feature-name}-{purpose}.ts`
- Use kebab-case for non-component files

**Shared Utilities (cross-feature):**
- Create: `app/lib/{utility-name}.ts` (directory does not exist yet -- create when needed)

**New Theme:**
- Add CSS variables block: `app/globals.css` under a new `[data-theme="{name}"]` selector
- Add map style: `app/features/map/map-styles.ts` with a new exported style array
- Update `getStyleForTheme()` in `app/features/map/map-styles.ts`

## Path Aliases

**`@/*`** maps to the project root (`./`). Use for imports outside the current directory:
```typescript
import Map from "@/app/features/map/Map";
import { getStyleForTheme } from "@/app/features/map/map-styles";
```

Currently, imports use relative paths (e.g., `./components/Sidebar`). Either approach works; prefer relative for same-feature imports, `@/` for cross-feature imports.

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `next dev` / `next build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`node_modules/next/dist/docs/`:**
- Purpose: Next.js 16 documentation (per AGENTS.md, read before writing Next.js code)
- Note: Consult this for Next.js 16 API changes that may differ from training data

---

*Structure analysis: 2026-03-31*
