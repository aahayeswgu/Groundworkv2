# External Integrations

**Analysis Date:** 2026-03-31

## APIs & External Services

**Mapping:**
- Google Maps JavaScript API - Core map rendering and interaction
  - SDK/Client: `@googlemaps/js-api-loader` ^2.0.2
  - Auth: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side env var)
  - Libraries loaded: `places`, `geometry`
  - Usage: `app/features/map/Map.tsx` - `setOptions()` and `importLibrary("maps")`
  - Features used: Map rendering, custom styling, satellite/road toggle, zoom controls
  - Types: `@types/google.maps` ^3.58.1

**Google Fonts:**
- DM Sans font loaded via `next/font/google` in `app/layout.tsx`
  - Self-hosted by Next.js at build time (no runtime external request)

## Data Storage

**Databases:**
- None detected - no database client, ORM, or connection configuration present

**File Storage:**
- Local filesystem only (static assets in `public/`)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- None detected - no auth library, session management, or identity provider configured
- UI shows placeholder profile ("Set up your profile" in `app/components/Sidebar.tsx`)

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- None detected (no logging library or structured logging)

## CI/CD & Deployment

**Hosting:**
- Not configured - default Vercel SVG assets suggest Vercel as intended target
- PWA metadata configured in `app/layout.tsx` (manifest, apple-web-app)

**CI Pipeline:**
- None detected (no `.github/workflows/`, no CI config files)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key (client-side, referenced in `app/features/map/Map.tsx`)

**Env files:**
- `.env.local` - Present, contains local environment variables

**Secrets location:**
- `.env.local` (gitignored by Next.js default)

## Webhooks & Callbacks

**Incoming:**
- None detected (no API routes exist)

**Outgoing:**
- None detected

## Integration Notes

This is an early-stage application. The only external integration is Google Maps. The app description ("Field Sales CRM for Construction Staffing Teams" per `app/layout.tsx` metadata) suggests future integrations will likely include:
- Database (user data, pins, CRM records)
- Authentication provider
- Possibly email service (Email tab exists in `app/components/MobileBottomBar.tsx`)
- Possibly calendar/planner service (Planner tab exists)

---

*Integration audit: 2026-03-31*
