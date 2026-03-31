# Technology Stack

**Analysis Date:** 2026-03-31

## Languages

**Primary:**
- TypeScript ^5 - All application code (`app/**/*.tsx`, `app/**/*.ts`)

**Secondary:**
- CSS - Global styles and Tailwind theme configuration (`app/globals.css`)

## Runtime

**Environment:**
- Node.js v24.14.1

**Package Manager:**
- npm 11.11.0
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.2.1 - Full-stack React framework (App Router)
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering

**Styling:**
- Tailwind CSS ^4 - Utility-first CSS framework
- `@tailwindcss/postcss` ^4 - PostCSS integration for Tailwind
- PostCSS - CSS processing pipeline (`postcss.config.mjs`)

**Build/Dev:**
- TypeScript ^5 - Type checking and compilation (`tsconfig.json`)
- ESLint ^9 - Linting (`eslint.config.mjs`)
- `eslint-config-next` 16.2.1 - Next.js ESLint rules (core-web-vitals + typescript presets)

## Key Dependencies

**Critical:**
- `@googlemaps/js-api-loader` ^2.0.2 - Google Maps JavaScript API loader, used in `app/features/map/Map.tsx`
- `@types/google.maps` ^3.58.1 - TypeScript types for Google Maps API

**Infrastructure:**
- `@types/node` ^20 - Node.js type definitions
- `@types/react` ^19 - React type definitions
- `@types/react-dom` ^19 - React DOM type definitions

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ES2017
- Module resolution: bundler
- Strict mode: enabled
- Path alias: `@/*` maps to project root (`"./*"`)
- JSX: react-jsx
- Incremental compilation: enabled
- Next.js plugin included

**Environment:**
- `.env.local` present - contains environment configuration
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Required for Google Maps (referenced in `app/features/map/Map.tsx`)

**Build:**
- `next.config.ts` - Next.js configuration (currently empty/default)
- `postcss.config.mjs` - PostCSS with `@tailwindcss/postcss` plugin
- `eslint.config.mjs` - ESLint flat config with Next.js core-web-vitals and TypeScript presets

**Theming:**
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

```bash
npm run dev        # next dev - development server
npm run build      # next build - production build
npm run start      # next start - production server
npm run lint       # eslint - run linting
```

## Platform Requirements

**Development:**
- Node.js >= 24.x
- npm >= 11.x
- Google Maps API key (set as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`)

**Production:**
- Next.js compatible hosting (Vercel, Node.js server, Docker)
- No database or backend services detected yet

---

*Stack analysis: 2026-03-31*
