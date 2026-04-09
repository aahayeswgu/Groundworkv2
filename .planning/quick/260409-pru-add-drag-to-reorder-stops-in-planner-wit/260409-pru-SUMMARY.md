---
phase: quick
plan: 260409-pru
subsystem: planner
tags: [drag-reorder, dnd-kit, planner, stops]
dependency_graph:
  requires: []
  provides: [drag-reorder-planner-stops]
  affects: [planner, route]
tech_stack:
  added: []
  patterns: [useSortable drag handle, DndContext/SortableContext, PointerSensor with activation distance]
key_files:
  created: []
  modified:
    - src/app/features/planner/model/planner.hooks.ts
    - src/app/features/planner/ui/PlannerStopItem.tsx
    - src/app/features/planner/ui/PlannerPanel.tsx
decisions:
  - "Drag handle placed on index number circle (not a separate grip icon) — matches RouteConfirmPanel pattern and avoids adding a new UI element"
  - "8px PointerSensor activation distance prevents accidental drags during status badge taps on mobile"
  - "No wrapper div added — SortableContext children are the PlannerStopItem components directly"
metrics:
  duration: "10min"
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260409-pru: Add Drag-to-Reorder Stops in Planner Summary

**One-liner:** dnd-kit drag-to-reorder for planner stops reusing RouteConfirmPanel's useSortable/DndContext pattern, persisted via existing reorderPlannerStops store action.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Expose reorderPlannerStops and make PlannerStopItem sortable | 2311cf2 | planner.hooks.ts, PlannerStopItem.tsx |
| 2 | Wrap PlannerPanel stops list with DndContext and wire handleDragEnd | c553e3d | PlannerPanel.tsx |

## What Was Built

Sales reps can now drag planner stops to reorder them before routing. The index number circle on each stop is the drag activator. Dragging reorders the stop array in the Zustand store (persisted to localStorage via existing partialize). "Route It" already iterates `day.stops.forEach` in array order, so it naturally sends stops in the user-arranged sequence.

Key implementation details:
- `useSortable({ id: stop.id, disabled: dragDisabled })` added to `PlannerStopItem` with drag handle on the index circle button
- `DndContext` + `SortableContext` wrap the stops `.map()` in `PlannerPanel`
- `handleDragEnd` uses `arrayMove` then calls `reorderPlannerStops(activePlannerDate, newOrder)`
- `PointerSensor` with `{ activationConstraint: { distance: 8 } }` prevents drag activation during status badge taps
- Inline `style` on the outer div is limited to `{ transform, transition, opacity }` — the only acceptable runtime-computed values per CLAUDE.md

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check

- [x] src/app/features/planner/model/planner.hooks.ts — exists, reorderPlannerStops added
- [x] src/app/features/planner/ui/PlannerStopItem.tsx — exists, useSortable integrated
- [x] src/app/features/planner/ui/PlannerPanel.tsx — exists, DndContext/SortableContext wrapping stops list
- [x] Commit 2311cf2 exists
- [x] Commit c553e3d exists
- [x] TypeScript: no new errors introduced (pre-existing errors only)
- [x] ESLint: passes clean

## Self-Check: PASSED
