<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Implementation Rules

These rules are mandatory for all frontend work in this repository.

1. Frontend architecture must follow Feature-Sliced Design (FSD): `layers -> slices -> segments`.
2. Organize by business domains, not by technical file-type buckets.
3. The Next.js App Router lives in `src/app/` and route files (`page.tsx`, `layout.tsx`) must stay thin and mostly compose/import FSD view modules.
4. FSD layers live under `src/app/` and must follow this hierarchy:
   1. `src/app/views`
   2. `src/app/widgets`
   3. `src/app/features`
   4. `src/app/entities`
   5. `src/app/shared`
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
10. Styling policy (enforced):
   1. Prefer Tailwind utility classes and theme tokens (`bg-orange`, `text-text-secondary`, etc.) over inline `style={{...}}`.
   2. Inline styles are allowed only for truly dynamic runtime values that cannot be represented with classes (for example computed `backgroundImage`, map coordinates, or per-item computed colors).
   3. If a color/spacing/size value is reused, move it into the slice `model/` (constants) or shared theme tokens instead of repeating literals in JSX.
   4. Never introduce `<style>` or `<style jsx>` blocks in feature code unless explicitly requested for a one-off prototype.
11. Duplicate markup policy (enforced):
   1. If a JSX block is repeated more than once (same structure with small text/icon differences), extract it into a reusable component in the correct FSD layer.
   2. Keep extracted reusable UI in `ui/`, static variants/config in `model/`, and pure transformers/helpers in `lib/`.
   3. Prefer narrow, explicit props over boolean-heavy “god components”.
   4. Avoid copy-pasting near-identical `div` trees across tabs/panels/cards; compose shared primitives instead.
12. External script loading policy (strictly enforced):
   1. Do not inject scripts imperatively with `document.createElement("script")`, `appendChild`, or `removeChild` in React components.
   2. Do not load third-party SDKs via manual DOM mutation inside `useEffect`.
   3. Use framework-native loading mechanisms (for Next.js: `next/script`) or server-safe integration points.
   4. Any exception requires explicit user approval in the same task.
13. Unsafe HTML injection policy (strictly enforced):
   1. `dangerouslySetInnerHTML` is prohibited in this repository.
   2. Do not pass raw HTML strings into the DOM from APIs, SDKs, or user input.
   3. Prefer plain text rendering or explicitly modeled/sanitized render pipelines that do not require `dangerouslySetInnerHTML`.
   4. Any exception requires explicit user approval in the same task.
14. DOM HTML API policy (strictly enforced):
   1. Do not read or write `innerHTML` / `outerHTML` in app code.
   2. Do not use `insertAdjacentHTML` or `document.write`.
   3. In form handlers, do not pull markup from `e.currentTarget.innerHTML`; use controlled state, refs, or typed values instead.
   4. Any exception requires explicit user approval in the same task.
15. CSS specificity policy (strictly enforced):
   1. Do not use CSS `!important`.
   2. Do not use Tailwind `!` modifier utilities (for example `!bg-*`, `!text-*`, `!border-*`).
   3. Fix the underlying cascade/layer issue instead of forcing specificity.
   4. Any exception requires explicit user approval in the same task.

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
- Frontend cleanup guardrails (required before finalizing frontend edits):
  - Run `rg -n 'style=\\{\\{' src/app --glob '*.tsx' --glob '*.ts'` and justify any remaining inline styles in the PR/summary.
  - Run `rg -n 'document\\.createElement\\(\\s*[\"\\x27]script[\"\\x27]\\s*\\)|\\.appendChild\\(|\\.removeChild\\(' src/app --glob '*.tsx' --glob '*.ts'` and remove violations.
  - Run `rg -n 'dangerouslySetInnerHTML' src/app --glob '*.tsx' --glob '*.ts'` and remove all matches.
  - Run `rg -n '\\b(innerHTML|outerHTML|insertAdjacentHTML|document\\.write)\\b' src/app --glob '*.tsx' --glob '*.ts'` and remove all matches.
  - Run `rg -n '!important|className=.*![A-Za-z\\[]' src/app --glob '*.tsx' --glob '*.ts' --glob '*.css'` and remove all matches.
  - Remove duplicated JSX blocks introduced during the change by extracting reusable components.
  - If a file grows beyond ~300 lines, split static data to `model/` and helpers to `lib/`.

### Language-Specific Rules

- Treat TypeScript strictness as required:
  - Frontend runs in strict mode.
