# Groundwork v2

Groundwork v2 is a map-first field sales CRM UI built with Next.js (App Router), React, TypeScript, and Zustand.

This README is written for contributors who are new to React/Next.js and need a clear map of where code lives, why it is organized this way, and how to make changes without turning the app into a monolith.

## What This App Does

- Shows a Google Map with business pins.
- Lets users drop pins, edit pin details, filter/search pins, and view pin stats.
- Persists pins in local storage via Zustand.
- Uses a sidebar + map layout on desktop and a bottom bar on mobile.

## Tech Stack

- Next.js `16.2.1` (App Router)
- React `19`
- TypeScript (strict mode)
- Zustand (state management + persistence)
- Tailwind CSS v4
- Vitest + Testing Library
- Google Maps JS API

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

At repo root, add:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
NEXT_PUBLIC_GOOGLE_MAP_ID=your_map_id_here
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands You Will Use

```bash
npm run dev        # start local dev server
npm run build      # production build
npm run start      # run production server
npm run lint       # lint checks
npm run test       # run tests once
npm run test:watch # watch mode tests
```

## Project Principles (Important)

This repo follows **Feature-Sliced Design (FSD)** and App Router best practices.

### FSD layers (high -> low)

1. `app/views`
2. `app/widgets`
3. `app/features`
4. `app/entities`
5. `app/shared`

### Golden dependency rule

A higher layer can import lower layers only.

- Allowed: `features -> entities`, `widgets -> features`
- Not allowed: `entities -> features`, `shared -> widgets`

### App Router rule

- `app/page.tsx` and `app/layout.tsx` should stay thin.
- Route files should compose/import from FSD modules, not contain big implementation blocks.

### Segment rule (inside each slice)

Use these segments when work grows:

- `ui` for React components
- `model` for types/constants/static data
- `api` for server-state hooks (TanStack Query style)
- `lib` for pure helpers

If a UI file gets large (roughly 300+ lines), split data/helpers out of UI files.

## Current Codebase Map

```text
app/
  layout.tsx                      # root layout + theme provider
  page.tsx                        # route entry, composes Home view
  globals.css                     # design tokens + responsive rules

  views/
    home/
      HomeView.client.tsx         # top-level client composition for home screen

  widgets/
    sidebar/Sidebar.tsx           # left panel shell + PinList mount point
    mobile-bottom-bar/MobileBottomBar.tsx

  features/
    map/
      Map.tsx                     # Google map, controls, drop-pin flow
      MarkerLayer.tsx             # marker rendering + info window behavior
      map-styles.ts
    pins/
      PinList.tsx                 # search/filter/list/stats UI
      PinListItem.tsx
      PinModal.tsx                # create/edit pin modal

  entities/
    pin/
      model/pin-status.ts         # pin status metadata
      model/pins.store.ts         # pin slice of Zustand store
      lib/pin-marker.ts           # marker element creation helper
    discover/model/discover.store.ts
    route/model/route.store.ts

  shared/
    store/index.ts                # combined Zustand store + persistence config
    store/StoreHydration.tsx      # client hydration trigger
    model/theme/ThemeProvider.tsx # theme context + localStorage sync
    lib/geocoding.ts              # reverse geocode helper
    lib/map/MapContext.ts         # map instance context
    ui/MapButton.tsx              # reusable map control button

  types/
    pins.types.ts
    route.types.ts
    discover.types.ts
```

## How Data Flows (Mental Model)

1. `app/page.tsx` renders `HomeView.client.tsx`.
2. `HomeView.client.tsx` composes `Sidebar`, `Map`, and `PinModal`.
3. `Map.tsx` and `PinList.tsx` both read/write the same Zustand store (`app/shared/store/index.ts`).
4. Dropping a pin on the map creates a draft (lat/lng/address), then opens `PinModal`.
5. Saving in `PinModal` updates the store.
6. Store updates automatically refresh map markers (`MarkerLayer.tsx`) and list items (`PinList.tsx`).
7. Pins persist in localStorage (`groundwork-pins-v1`) and are rehydrated on load.

## Server vs Client Components

- Next.js pages/layouts are server components by default.
- Use `"use client"` only where interaction/browser APIs are required.
- In this codebase:
  - `app/page.tsx` is thin and server-safe.
  - `app/views/home/HomeView.client.tsx` is the client boundary for interactive map/list behavior.

Rule of thumb: keep the client boundary as small as possible.

## Where To Put New Code

### If you are adding...

- A screen-level composition: put it in `app/views/...`
- A reusable section of a screen (sidebar/topbar/panel): `app/widgets/...`
- User-facing behavior/action (drop pin, modal flow, filters): `app/features/...`
- Domain data/rules (status metadata, entity slice logic): `app/entities/...`
- Shared infrastructure/helpers/theme/store utilities: `app/shared/...`

### Do not do this

- Do not create a generic `components/` dumping folder.
- Do not put long business logic directly into `page.tsx`.
- Do not import upward across FSD layers.

## Safe Change Workflow (For Beginners)

1. Find the smallest existing module that already does something similar.
2. Make a focused change in that module first.
3. If file size or complexity grows, split constants/types/helpers into `model`/`lib`.
4. Keep route files (`page.tsx`, `layout.tsx`) mostly composition-only.
5. Run checks before pushing:

```bash
npm run lint
npm run test
```

## Common Tasks

### Add a new field to pins

Update these areas together:

- `app/types/pins.types.ts`
- `app/features/pins/PinModal.tsx`
- `app/entities/pin/model/pins.store.ts` (if behavior changes)
- Any UI that displays the field (`PinListItem`, marker info card)

### Add or change pin statuses

Update:

- `app/types/pins.types.ts` (`PinStatus` union)
- `app/entities/pin/model/pin-status.ts` (labels/colors/options/order)
- UI surfaces that render status chips/badges

### Add map behavior

Start in:

- `app/features/map/Map.tsx` for controls and map events
- `app/features/map/MarkerLayer.tsx` for marker/info-window behavior
- `app/shared/lib/geocoding.ts` for geocode helpers

## Testing

Current tests live in:

- `app/shared/model/theme/ThemeProvider.test.tsx`
- `app/widgets/sidebar/Sidebar.test.tsx`

Testing stack:

- Vitest (`vitest.config.ts`)
- Testing Library (`vitest.setup.ts`)
- JSDOM environment

## Definition of Done for Any PR

- Architecture follows FSD layers and dependency direction.
- Route files remain thin.
- New interactive logic is in proper client islands.
- No giant monolithic files when split is appropriate.
- Lint and tests pass locally.
- PR description explains both **what changed** and **why this location/layer was chosen**.

## Notes

- This project intentionally favors maintainability and predictable structure over quick hacks.
- If unsure where something belongs, choose the more specific domain slice first, not a shared dumping area.
