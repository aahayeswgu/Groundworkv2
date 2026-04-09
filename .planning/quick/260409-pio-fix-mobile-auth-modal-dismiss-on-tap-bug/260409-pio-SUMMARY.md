---
phase: quick
plan: 260409-pio
subsystem: shared/ui
tags: [bug-fix, mobile, dialog, bottom-sheet, pointer-events]
dependency_graph:
  requires: []
  provides: [dialog-overlay-propagation-guard]
  affects: [SidebarAccountModal, MobileBottomSheet]
tech_stack:
  added: []
  patterns: [onPointerDownCapture stopPropagation for stacked portal isolation]
key_files:
  modified:
    - src/app/shared/ui/dialog.tsx
decisions:
  - Used onPointerDownCapture (capture phase) not onPointerDown — stops propagation before bubbling reaches Sheet.Backdrop
  - Did not add onClick or onTouchStart stopPropagation — onPointerDownCapture covers all input types uniformly
metrics:
  duration: "< 5 min"
  completed: "2026-04-09"
  tasks: 1
  files_modified: 1
---

# Quick Fix 260409-pio: Fix Mobile Auth Modal Dismiss-on-Tap Bug

**One-liner:** Added `onPointerDownCapture` to `DialogOverlay` to stop pointer events from propagating through stacked portals and triggering `Sheet.Backdrop`'s `onTap` dismiss handler.

## Problem

When the auth modal (`SidebarAccountModal`, a Radix Dialog) is open over the sidebar `MobileBottomSheet`, tapping any input field on mobile dispatched a pointer event that propagated through the `DialogOverlay` DOM node down to the `Sheet.Backdrop` underneath. The `Sheet.Backdrop` has an `onTap` handler (Framer Motion gesture) that calls `onOpenChange(false)`, which closed the bottom sheet unexpectedly — making the form unusable on mobile.

## Fix

Added `onPointerDownCapture={(event) => event.stopPropagation()}` to the `DialogPrimitive.Overlay` element in `src/app/shared/ui/dialog.tsx`.

The capture phase ensures the stop fires before any bubbling, isolating the Dialog's pointer surface from the Sheet underneath. Radix Dialog's own close-on-overlay-click behavior is unaffected because it fires on the same element, not a parent.

## Tasks

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Stop pointer event propagation on DialogOverlay | e621a7c |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npm run lint` passes with no errors
- Manual mobile test required: open sidebar sheet → open account modal → tap email input — modal and sheet should both remain open
- Tap outside dialog (on overlay) should still close the dialog normally
- Sheet backdrop tap (with no dialog open) should still close the sheet normally

## Self-Check: PASSED

- `src/app/shared/ui/dialog.tsx` — modified, exists
- Commit `e621a7c` — verified present in git log
