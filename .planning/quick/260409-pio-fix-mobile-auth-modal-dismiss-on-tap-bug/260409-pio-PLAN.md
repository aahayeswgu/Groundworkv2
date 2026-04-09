---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/shared/ui/dialog.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Tapping input fields inside the auth modal on mobile does not dismiss the bottom sheet"
    - "Tapping the Radix Dialog overlay still closes the dialog itself"
    - "Tapping the Sheet backdrop (outside dialog) still closes the bottom sheet"
  artifacts:
    - path: "src/app/shared/ui/dialog.tsx"
      provides: "DialogOverlay with pointer event propagation stopped"
  key_links:
    - from: "src/app/shared/ui/dialog.tsx (DialogOverlay)"
      to: "src/app/shared/ui/mobile-bottom-sheet.tsx (Sheet.Backdrop onTap)"
      via: "pointer event propagation through stacked portals"
      pattern: "onPointerDown.*stopPropagation"
---

<objective>
Fix mobile auth modal dismiss-on-tap bug where tapping input fields inside the Radix Dialog (SidebarAccountModal) propagates pointer events through the DialogOverlay down to the MobileBottomSheet's Sheet.Backdrop onTap handler, causing the bottom sheet to close unexpectedly.

Purpose: Users cannot interact with the login/signup form on mobile without the sheet dismissing.
Output: Patched DialogOverlay that stops pointer event propagation so stacked portals don't interfere.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/shared/ui/dialog.tsx
@src/app/shared/ui/mobile-bottom-sheet.tsx
@src/app/widgets/sidebar/ui/SidebarAccountModal.tsx
@src/app/widgets/sidebar/ui/Sidebar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Stop pointer event propagation on DialogOverlay</name>
  <files>src/app/shared/ui/dialog.tsx</files>
  <action>
In the `DialogOverlay` component, add an `onPointerDownCapture` handler that calls `event.stopPropagation()`. This prevents pointer/tap events that land on the Radix Dialog overlay from propagating down through the DOM to the react-modal-sheet `Sheet.Backdrop` underneath, which listens for `onTap` (a Framer Motion gesture that fires on pointer events).

Use `onPointerDownCapture` (capture phase) rather than `onPointerDown` to ensure propagation is stopped before any bubbling occurs. This is safe because:
- Radix Dialog overlay handles its own close via `onPointerDown` on the overlay element itself (which still fires since we only stop propagation to parents, not the element itself).
- The Sheet.Backdrop `onTap` is a separate DOM subtree reached via propagation, which this blocks.

Do NOT add `onClick` or `onTouchStart` stopPropagation — `onPointerDownCapture` covers all input types (mouse, touch, pen).

Add the handler directly to the `DialogPrimitive.Overlay` JSX element, keeping it clean and minimal.
  </action>
  <verify>
    <automated>cd /home/wzrd/gwv2/gwv2 && npx next lint 2>&1 | tail -5</automated>
  </verify>
  <done>DialogOverlay stops pointer event propagation so that tapping inside any Dialog rendered over a MobileBottomSheet does not dismiss the sheet. Lint passes with no new errors.</done>
</task>

</tasks>

<verification>
1. `npx next lint` passes with no new errors
2. Manual mobile test: open sidebar bottom sheet -> open account modal -> tap email input field -> modal stays open, sheet stays open
3. Manual mobile test: tap outside the dialog content (on the dark overlay) -> dialog closes normally
4. Manual mobile test: with no dialog open, tap the sheet backdrop -> sheet closes normally
</verification>

<success_criteria>
- Tapping input fields in the auth modal on mobile no longer dismisses the bottom sheet
- All existing dialog close behaviors (overlay click, close button, escape key) continue to work
- No regressions on desktop dialog behavior
</success_criteria>

<output>
After completion, create `.planning/quick/260409-pio-fix-mobile-auth-modal-dismiss-on-tap-bug/260409-pio-SUMMARY.md`
</output>
