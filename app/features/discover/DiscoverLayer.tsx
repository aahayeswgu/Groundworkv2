"use client";

import { useEffect, useRef, useContext } from "react";
import { MapContext } from "@/app/features/map/MapContext";
import { useStore } from "@/app/store";
import {
  createDiscoverMarkerElement,
  MARKER_Z_INDEX,
  type DiscoverMarkerState,
} from "./discover-marker";
import {
  buildDiscoverInfoContent,
  buildQuickSavePin,
} from "./discover-info";
import type { DiscoverResult } from "@/app/types/discover.types";

function getMarkerState(
  placeId: string,
  selectedIds: Set<string>,
  hoverId: string | null,
): DiscoverMarkerState {
  if (selectedIds.has(placeId)) return "selected";
  if (hoverId === placeId) return "hover";
  return "default";
}

export default function DiscoverLayer() {
  const map = useContext(MapContext);
  const discoverResults = useStore((s) => s.discoverResults);
  const selectedDiscoverIds = useStore((s) => s.selectedDiscoverIds);
  const hoveredDiscoverId = useStore((s) => s.hoveredDiscoverId);

  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const openPlaceId = useRef<string | null>(null);

  // Main sync effect — create/remove/update markers when results or selection changes
  useEffect(() => {
    if (!map) return;

    const resultIds = new Set(discoverResults.map((r) => r.placeId));

    // Remove stale markers
    for (const [placeId, marker] of markerPool.current.entries()) {
      if (!resultIds.has(placeId)) {
        marker.map = null;
        markerPool.current.delete(placeId);
        if (openPlaceId.current === placeId) {
          infoWindow.current?.close();
          openPlaceId.current = null;
        }
      }
    }

    // Upsert markers
    for (const result of discoverResults) {
      const state = getMarkerState(result.placeId, selectedDiscoverIds, hoveredDiscoverId);
      const existing = markerPool.current.get(result.placeId);

      if (existing) {
        const currentState = (existing.content as HTMLElement)?.dataset?.discoverState;
        if (currentState !== state) {
          // State changed — update in-place (no new marker, no listener re-attachment)
          existing.content = createDiscoverMarkerElement(state);
          (existing as google.maps.marker.AdvancedMarkerElement).zIndex = MARKER_Z_INDEX[state];
        }
        continue;
      }

      // New marker
      const el = createDiscoverMarkerElement(state);
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: result.lat, lng: result.lng },
        map,
        content: el,
        title: result.displayName,
        zIndex: MARKER_Z_INDEX[state],
      });

      // Capture result for closure
      const capturedResult: DiscoverResult = result;

      marker.addListener("click", () => {
        if (!map) return;
        map.panTo({ lat: capturedResult.lat, lng: capturedResult.lng });
        if ((map.getZoom() ?? 0) < 15) map.setZoom(15);

        if (!infoWindow.current) {
          infoWindow.current = new google.maps.InfoWindow();
          infoWindow.current.addListener("closeclick", () => {
            openPlaceId.current = null;
          });
        }

        // Toggle: clicking the same marker closes the InfoWindow
        if (openPlaceId.current === capturedResult.placeId) {
          infoWindow.current.close();
          openPlaceId.current = null;
          return;
        }

        const currentPins = useStore.getState().pins;
        const alreadySaved = currentPins.some(
          (p) =>
            p.title.toLowerCase() === capturedResult.displayName.toLowerCase() ||
            (Math.abs(p.lat - capturedResult.lat) < 0.001 &&
              Math.abs(p.lng - capturedResult.lng) < 0.001),
        );

        const content = buildDiscoverInfoContent({
          result: capturedResult,
          alreadySaved,
          onSave: () => {
            // Dedup check at save time (per D-21)
            const latestPins = useStore.getState().pins;
            const duplicate = latestPins.some(
              (p) =>
                p.title.toLowerCase() === capturedResult.displayName.toLowerCase() ||
                (Math.abs(p.lat - capturedResult.lat) < 0.001 &&
                  Math.abs(p.lng - capturedResult.lng) < 0.001),
            );
            if (!duplicate) {
              useStore.getState().addPin(buildQuickSavePin(capturedResult));
            }
            // Button text updated in-place by buildDiscoverInfoContent — no setContent call needed
          },
        });

        infoWindow.current.setContent(content);
        infoWindow.current.open({ anchor: marker, map });
        openPlaceId.current = capturedResult.placeId;
      });

      markerPool.current.set(result.placeId, marker);
    }
  }, [map, discoverResults, selectedDiscoverIds]);

  // Hover sync effect — update visual state when hovered ID changes
  useEffect(() => {
    for (const [placeId, marker] of markerPool.current.entries()) {
      const state = getMarkerState(placeId, selectedDiscoverIds, hoveredDiscoverId);
      const currentState = (marker.content as HTMLElement)?.dataset?.discoverState;
      if (currentState !== state) {
        marker.content = createDiscoverMarkerElement(state);
        (marker as google.maps.marker.AdvancedMarkerElement).zIndex = MARKER_Z_INDEX[state];
      }
    }
  }, [hoveredDiscoverId, selectedDiscoverIds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const m of markerPool.current.values()) {
        m.map = null;
      }
      markerPool.current.clear();
      infoWindow.current?.close();
    };
  }, []);

  return null;
}
