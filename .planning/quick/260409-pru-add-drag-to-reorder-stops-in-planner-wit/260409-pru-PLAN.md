---
phase: quick
plan: 260409-pru
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/features/planner/model/planner.hooks.ts
  - src/app/features/planner/ui/PlannerStopItem.tsx
  - src/app/features/planner/ui/PlannerPanel.tsx
autonomous: true
requirements: [drag-reorder-planner-stops]

must_haves:
  truths:
    - "User can drag planner stops to reorder them on desktop and mobile"
    - "Reordered stops persist in planner store and survive page refresh"
    - "Route It sends stops in the user-arranged drag order"
  artifacts:
    - path: "src/app/features/planner/model/planner.hooks.ts"
      provides: "reorderPlannerStops exposed via usePlannerActions"
    - path: "src/app/features/planner/ui/PlannerStopItem.tsx"
      provides: "Sortable wrapper using useSortable with drag handle"
    - path: "src/app/features/planner/ui/PlannerPanel.tsx"
      provides: "DndContext + SortableContext wrapping stops list"
  key_links:
    - from: "PlannerPanel.tsx"
      to: "planner.store reorderPlannerStops"
      via: "handleDragEnd callback"
      pattern: "reorderPlannerStops.*activePlannerDate"
    - from: "PlannerPanel.tsx handleRouteIt"
      to: "route.store addStop"
      via: "day.stops.forEach — already iterates in array order"
      pattern: "day\\.stops\\.forEach"
---

<objective>
Add drag-to-reorder for planner stops using dnd-kit, reusing the exact pattern from RouteConfirmPanel.

Purpose: Sales reps need to arrange their daily stop order before routing. Currently stops are fixed in add-order.
Output: Draggable planner stop list with persisted order, mobile touch support, and Route It respecting user order.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/features/planner/ui/PlannerPanel.tsx
@src/app/features/planner/ui/PlannerStopItem.tsx
@src/app/features/planner/model/planner.hooks.ts
@src/app/features/planner/model/planner.store.ts
@src/app/features/planner/model/planner.types.ts
@src/app/features/route/ui/RouteConfirmPanel.tsx (reference pattern only)

<interfaces>
<!-- dnd-kit imports to reuse (already installed: @dnd-kit/core ^6.3.1, @dnd-kit/sortable ^10.0.0, @dnd-kit/utilities ^3.2.2) -->

From RouteConfirmPanel.tsx (reference pattern):
```typescript
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
```

From planner.store.ts (already exists, just not exported from hooks):
```typescript
reorderPlannerStops: (date: string, newStops: PlannerStop[]) => void;
```

From planner.types.ts:
```typescript
export interface PlannerStop {
  id: string;
  pinId: string | null;
  label: string;
  address: string;
  lat: number;
  lng: number;
  status: PlannerStopStatus;
  addedAt: string;
  visitedAt: string | null;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Expose reorderPlannerStops and make PlannerStopItem sortable</name>
  <files>src/app/features/planner/model/planner.hooks.ts, src/app/features/planner/ui/PlannerStopItem.tsx</files>
  <action>
**planner.hooks.ts** — Add `reorderPlannerStops` to the `usePlannerActions` hook's `useShallow` selector object (line ~18 area, alongside the other actions). The store action already exists at planner.store.ts:47-51, it just needs to be surfaced through the hook.

**PlannerStopItem.tsx** — Convert to a sortable drag item following the RouteConfirmPanel SortableStopRow pattern:

1. Add dnd-kit imports: `useSortable` from `@dnd-kit/sortable`, `CSS` from `@dnd-kit/utilities`.

2. Add a new optional prop `dragDisabled?: boolean` (default false) to PlannerStopItemProps.

3. Inside the component, call `useSortable({ id: stop.id, disabled: dragDisabled })` and destructure `{ attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging }`.

4. Build drag handle props: `const dragHandleProps = dragDisabled ? {} : { ...attributes, ...listeners };`

5. Compute inline style for the outer div: `{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }`. This is the only acceptable use of inline style (dynamic runtime transform values per CLAUDE.md exception).

6. Apply `ref={setNodeRef}` and `style={style}` to the outer `<div>`. Add `touch-pan-y` to its className.

7. Convert the index number circle (the `<span>` at line 39) into a `<button>` element that serves as the drag activator handle:
   - Add `ref={setActivatorNodeRef}` and spread `{...dragHandleProps}`
   - Add classes: `cursor-grab active:cursor-grabbing touch-none` (when not disabled), `select-none`
   - Keep the existing visual styling (rounded-full, bg-orange/15, text-orange, etc.)
   - Add `aria-label={`Drag to reorder ${stop.label}`}`

8. Keep all existing functionality (status cycling, remove button) unchanged. The remove button already has `e.stopPropagation()`.
  </action>
  <verify>
    <automated>cd /home/wzrd/gwv2/gwv2 && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>reorderPlannerStops available from usePlannerActions hook; PlannerStopItem renders with useSortable integration and drag handle on the index circle; TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Wrap PlannerPanel stops list with DndContext and wire handleDragEnd</name>
  <files>src/app/features/planner/ui/PlannerPanel.tsx</files>
  <action>
1. Add dnd-kit imports at the top of PlannerPanel.tsx:
   ```typescript
   import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
   import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
   ```

2. Add `reorderPlannerStops` to the destructured result from `usePlannerActions()` (line ~48 area).

3. Create sensors with activation constraint for mobile touch tolerance (prevents accidental drags during status taps):
   ```typescript
   const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
   ```
   Place this near the other hooks at the top of the component body.

4. Create `handleDragEnd` callback:
   ```typescript
   function handleDragEnd(event: DragEndEvent) {
     const { active, over } = event;
     if (!over || active.id === over.id) return;
     const oldIndex = day.stops.findIndex((s) => s.id === active.id);
     const newIndex = day.stops.findIndex((s) => s.id === over.id);
     if (oldIndex === -1 || newIndex === -1) return;
     const newOrder = arrayMove(day.stops, oldIndex, newIndex);
     reorderPlannerStops(activePlannerDate, newOrder);
   }
   ```

5. In the JSX, wrap the stops list (the `<div>` at line 388 containing the `.map()`) with DndContext and SortableContext. Replace lines 388-398:
   ```tsx
   <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
     <SortableContext items={day.stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
       {day.stops.map((stop, i) => (
         <PlannerStopItem
           key={stop.id}
           stop={stop}
           index={i}
           onStatusChange={handleStatusChange}
           onRemove={removePlannerStop}
         />
       ))}
     </SortableContext>
   </DndContext>
   ```

6. Do NOT modify the `handleRouteIt` function — it already iterates `day.stops.forEach` which will naturally use the reordered array from the store.

7. Do NOT modify the compact mobile sheet view (isCompactMobileSheet return) — it has no stops list.
  </action>
  <verify>
    <automated>cd /home/wzrd/gwv2/gwv2 && npx tsc --noEmit 2>&1 | head -30 && npm run lint 2>&1 | tail -10</automated>
  </verify>
  <done>Planner stops list is wrapped in DndContext/SortableContext; dragging a stop reorders via store; Route It sends stops in user-arranged order; no lint errors; TypeScript compiles clean.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero errors
2. `npm run lint` — zero errors
3. Manual: Open planner with 3+ stops, drag index circle to reorder, confirm new order persists after page refresh
4. Manual: Reorder stops then tap "Route It" — confirm route panel shows stops in the reordered sequence
5. Manual: On mobile/touch, confirm drag works with index circle and status tap still cycles without triggering drag
</verification>

<success_criteria>
- Planner stops can be reordered by dragging the index number circle
- Reordered stops persist in Zustand store (localStorage via existing partialize)
- Route It sends stops in the user-arranged order
- Mobile touch works without interfering with status badge taps (8px activation distance)
- No new dependencies added (dnd-kit already installed)
- TypeScript and ESLint pass clean
</success_criteria>

<output>
After completion, create `.planning/quick/260409-pru-add-drag-to-reorder-stops-in-planner-wit/260409-pru-SUMMARY.md`
</output>
