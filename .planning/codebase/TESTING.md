# Testing Patterns

**Analysis Date:** 2026-03-31

## Current State

**No tests exist in this codebase.**

There are no test files, no test framework configured, and no test-related scripts in `package.json`. The project has no unit, integration, or end-to-end tests.

## Test Framework

**Runner:** None installed
- No Jest, Vitest, or any other test runner in `package.json` dependencies
- No test configuration files (`jest.config.*`, `vitest.config.*`, `playwright.config.*`) present

**Assertion Library:** None

**Run Commands:**
```bash
npm run lint              # Only quality check available (ESLint)
```

## What Should Be Tested

**Priority targets when tests are introduced:**

1. **Utility functions** (easiest to test first):
   - `getStyleForTheme()` in `app/features/map/map-styles.ts` -- pure function, returns style arrays based on theme string

2. **Component rendering:**
   - `app/components/Sidebar.tsx` -- static layout, filter chips, stats footer
   - `app/components/MobileBottomBar.tsx` -- tab rendering, active state
   - `app/features/map/Map.tsx` -- requires mocking Google Maps API

3. **Integration concerns:**
   - Google Maps initialization flow in `app/features/map/Map.tsx`
   - Theme switching via `data-theme` attribute

## Recommended Setup

Given the Next.js 16 + React 19 stack, the recommended test setup:

**Unit/Component Tests:**
- Vitest (fast, ESM-native, compatible with Next.js)
- React Testing Library for component tests
- Config file: `vitest.config.ts` at project root

**E2E Tests (future):**
- Playwright (official Next.js recommendation)
- Config file: `playwright.config.ts` at project root

**Suggested `package.json` scripts:**
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

## Test File Organization

**Recommended pattern (co-located):**
```
app/
  features/
    map/
      Map.tsx
      Map.test.tsx          # Component test
      map-styles.ts
      map-styles.test.ts    # Unit test
  components/
    Sidebar.tsx
    Sidebar.test.tsx
```

**Naming convention:** `{filename}.test.{ext}` co-located with source files.

## CI/CD

**No CI/CD pipeline detected.**
- No `.github/workflows/` directory
- No `Makefile`, `Dockerfile`, or deployment configuration
- Only local development scripts: `dev`, `build`, `start`, `lint`

## Coverage

**No coverage tooling configured.**
- No coverage thresholds set
- No coverage reports generated

---

*Testing analysis: 2026-03-31*
