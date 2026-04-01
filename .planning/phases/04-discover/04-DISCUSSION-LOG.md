# Phase 4: Discover - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 4-Discover
**Areas discussed:** Full audit of old app's discover tool for 1:1 port

---

## Approach

**User's choice:** 1:1 port from old Groundwork prototype. "Its almost perfect I think and I don't want anything to change on it."

**Audit findings:**
- ~95% of logic transfers directly (filters, dedup, classification, drawing, selection, UI flow)
- Two mandatory changes: legacy Places API → Places New, google.maps.Marker → AdvancedMarkerElement
- Info bubble must use DOM nodes (not string onclick) to prevent recursion/global scope issues

**User emphasis:** "lets make sure the info bubble is good and there is no recursion"
- Single shared InfoWindow instance (no stacking)
- Marker click and checkbox selection are separate code paths
- Quick-save updates button DOM in-place rather than rebuilding entire bubble

---

## Claude's Discretion

- Component decomposition
- InfoWindow sharing between pin and discover layers
- DiscoverSlice state shape
- CSS/styling details
- Query batching vs sequential

## Deferred Ideas

- Marathon mode — v2
- AI research (Gemini) — v2
- Query parallelization — future optimization
