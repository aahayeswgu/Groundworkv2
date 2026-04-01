# Phase 5: Route - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-01
**Phase:** 5-Route
**Areas discussed:** Overall approach

---

## Approach

**User's choice:** 1:1 port from old app, but "lets make sure we are using Google routing with no added logic, just let google maps do the heavy lifting"

**Interpretation:** No custom TSP/nearest-neighbor/clustering algorithms. Send stops to Google Directions API with optimizeWaypoints, get back optimized order, display it. Shareable link opens Google Maps for navigation.

---

## Claude's Discretion

- Route confirm panel design
- Numbered marker SVG
- Drag-to-reorder implementation
- DirectionsService vs Route class decision
- RouteSlice state shape
- Integration wiring for Add to Route buttons

## Deferred Ideas

- Marathon mode — future milestone
- GPS tracking — v2
- Route saving/loading — v2
