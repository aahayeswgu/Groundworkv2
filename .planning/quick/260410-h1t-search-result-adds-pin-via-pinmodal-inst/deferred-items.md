# Deferred Items — Quick Task 260410-h1t

Pre-existing lint issues in `src/app/widgets/sidebar/ui/Sidebar.tsx` not introduced by this task (out of scope per GSD deviation rules):

1. **Error** `src/app/widgets/sidebar/ui/Sidebar.tsx:91` — `react-hooks/set-state-in-effect`
   - `openAccountModal()` called synchronously inside `useEffect` body.
2. **Warning** `src/app/widgets/sidebar/ui/Sidebar.tsx:151` — `@typescript-eslint/no-unused-vars`
   - `handleToggleSettings` assigned but never used.

Both pre-date this task; `Map.tsx` (the only file modified) lints clean.
