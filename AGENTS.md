<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Implementation Rules

These rules are mandatory for all frontend work in this repository.

1. Frontend architecture must follow Feature-Sliced Design (FSD): `layers -> slices -> segments`.
2. Organize by business domains, not by technical file-type buckets.
3. The Next.js App Router lives in `app/` and route files (`page.tsx`, `layout.tsx`) must stay thin and mostly compose/import FSD view modules.
4. FSD layers live under `app/` and must follow this hierarchy:
   1. `app/views`
   2. `app/widgets`
   3. `app/features`
   4. `app/entities`
   5. `app/shared`
5. Golden dependency rule: modules may only import from strictly lower layers; never upward.
6. Standard slice segments must be used — do not dump everything into a single file:
   1. `ui` — React components (JSX). No raw data arrays, no type-only files.
   2. `model` — Types, constants, and static data arrays (e.g., tab definitions, table rows, directory listings).
   3. `api` — Server-state hooks (TanStack Query wrappers).
   4. `lib` — Pure helper functions, animation presets, formatters.
   5. Rule of thumb: if a UI file exceeds ~300 lines, split data into `model/` and helpers into `lib/`.
7. RSC boundary guidance:
   1. `shared` and `entities` should default to Server Components and server-side data access.
   2. `features` and `widgets` are the preferred client boundary when interaction is required (`use client`).
8. Client/server decision rules:
   1. Default `views`, route `page.tsx`, and `layout.tsx` to Server Components.
   2. Do not add `use client` to an entire view/page when only part of it needs browser APIs, animation libraries, or hooks.
   3. Extract the smallest possible client island (for example `*.client.tsx` or a focused `ui` helper) and keep the parent composition server-rendered.
   4. Keep server-safe markup/data rendering in server files; keep `motion`, `useEffect`, and browser-only logic inside client islands.
9. Use React patterns for UI rendering and interactions. Avoid imperative DOM manipulation in React modules:
   1. Do not build UI with `document.createElement`, `innerHTML`, or manual `appendChild`.
   2. Do not wire UI interactions with `addEventListener` when React event props (`onClick`, etc.) can be used.
   3. When integrating imperative third-party APIs, isolate the imperative bridge and keep actual UI content React-rendered.
10. Separation of concerns is required, not optional:
   1. `ui` files must focus on rendering/composition and lightweight event wiring only.
   2. Move reusable or stateful behavior into `lib` hooks/helpers (`use-*.ts`, pure utilities).
   3. Move static config and tunable numbers (zoom levels, limits, labels, thresholds) into `model` constants.
11. Extraction triggers (must refactor before finishing the task):
   1. If a component mixes 3+ concerns (rendering + side effects + lifecycle integration + domain logic), extract.
   2. If a file grows beyond ~200 lines and includes business logic, split into segment files.
   3. If logic can be reused by another control/route/widget, extract immediately.
12. Pre-completion architecture check (required for frontend edits):
   1. Confirm each changed file belongs to the correct FSD layer and segment (`ui/model/api/lib`).
   2. Confirm no new "god file" was created; extract into focused modules before finalizing.
   3. In the final response, briefly list what was extracted and where.

# General Code Style Principles

This document outlines general coding principles that apply across all languages and frameworks used in this project.

## Readability

- Code should be easy to read and understand by humans.
- Avoid overly clever or obscure constructs.

## Consistency

- Follow existing patterns in the codebase.
- Maintain consistent formatting, naming, and structure.

## Simplicity

- Prefer simple solutions over complex ones.
- Break down complex problems into smaller, manageable parts.

## Maintainability

- Write code that is easy to modify and extend.
- Minimize dependencies and coupling.

## Documentation

- Document why something is done, not just what.
- Keep documentation up-to-date with code changes.

## Usage Guidelines

For AI Agents:

- Read this file before implementing any code.
- Follow all rules as written.
- Prefer the more restrictive interpretation when uncertain.
- Update this file when new non-obvious patterns are introduced.

### Code Quality & Style Rules

- Prioritize readability and maintainability over cleverness.
- Follow existing file/folder patterns before introducing new structures.
- Use `rg` for code discovery/search tasks.
- Frontend architecture:
  - Keep FSD layers and segment boundaries (`ui`, `model`, `api`, `lib`) intact.
  - Keep route files thin; compose view modules.
  - Avoid technical-type buckets like generic `components/`; place modules in `views/widgets/features/entities/shared` based on ownership.
- Accessibility:
  - Use semantic HTML where meaningful.

### Language-Specific Rules

- Treat TypeScript strictness as required:
  - Frontend runs in strict mode.
