# Phase 2: Pins - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 2-Pins
**Areas discussed:** Edit panel UX, Marker style, Info window, Notes model

---

## Edit Panel UX

| Option | Description | Selected |
|--------|-------------|----------|
| Slide-in panel | Slides in from right on desktop, bottom sheet on mobile — same as old app | |
| Modal overlay | Centered modal dialog over the map — simpler but blocks map view | ✓ |
| Inline in sidebar | Edit form replaces pin list inside sidebar | |
| You decide | Claude picks | |

**User's choice:** Modal overlay
**Notes:** None

---

## Marker Style

| Option | Description | Selected |
|--------|-------------|----------|
| 3D SVG (like old app) | Elaborate markers with radial gradients, 3D sphere head, metal shaft, ground shadow | |
| Flat colored pins | Clean flat pin shape with status color fill | |
| Colored dots | Simple colored circles | |
| You decide | Claude picks | |

**User's choice:** Custom — "small-ish pin with 3D elements such as a pin sticking from the map to the pin's head and the pin being 3D but lets be mindful to not design something that will make clutter feel bad"
**Notes:** Must be clearly distinguishable from default Google Maps pins. Compact size for density.

---

## Info Window

| Option | Description | Selected |
|--------|-------------|----------|
| Custom HTML overlay | Fully styled overlay matching app design language | |
| Google InfoWindow | Native Google Maps InfoWindow — simpler, limited styling | ✓ |
| You decide | Claude picks | |

**User's choice:** Google InfoWindow
**Notes:** None

---

## Notes Model

| Option | Description | Selected |
|--------|-------------|----------|
| Activity log | Array of {text, date} entries — timestamped history | |
| Single text field | One free-text notes field | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide
**Notes:** Claude recommends activity log pattern for sales rep use case.

---

## Claude's Discretion

- Notes model (activity log recommended)
- Modal component implementation details
- SVG marker design details (compact 3D, exact gradients/shadows)
- Reverse geocoding approach
- localStorage strategy
- Search and filter implementation
- Pin-drop mode UX

## Deferred Ideas

None
