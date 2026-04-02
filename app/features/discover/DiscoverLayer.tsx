"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MapContext } from "@/app/features/map/MapContext";
import { useStore } from "@/app/store";
import {
  createDiscoverMarkerElement,
  MARKER_Z_INDEX,
  type DiscoverMarkerState,
} from "./discover-marker";
import { buildQuickSavePin } from "./discover-info";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { DiscoverInfoWindowCard } from "./ui/DiscoverInfoWindowCard";

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
  const routeStops = useStore((s) => s.routeStops);
  const addStop = useStore((s) => s.addStop);

  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const infoWindowRoot = useRef<Root | null>(null);
  const openPlaceId = useRef<string | null>(null);

  const unmountInfoWindowContent = useCallback(() => {
    if (!infoWindowRoot.current) return;
    infoWindowRoot.current.unmount();
    infoWindowRoot.current = null;
  }, []);

  const closeInfoWindow = useCallback(() => {
    infoWindow.current?.close();
    openPlaceId.current = null;
    unmountInfoWindowContent();
  }, [unmountInfoWindowContent]);

  const renderInfoWindowContent = useCallback(
    (result: DiscoverResult): HTMLElement => {
      unmountInfoWindowContent();
      // Google Maps InfoWindow requires an HTMLElement; render React into this bridge node.
      const container = document.createElement("div");
      const root = createRoot(container);

      const currentPins = useStore.getState().pins;
      const alreadySaved = currentPins.some(
        (pin) =>
          pin.title.toLowerCase() === result.displayName.toLowerCase() ||
          (Math.abs(pin.lat - result.lat) < 0.001 && Math.abs(pin.lng - result.lng) < 0.001),
      );
      const isInRoute = routeStops.some((stop) => stop.id === `discover_${result.placeId}`);

      root.render(
        <DiscoverInfoWindowCard
          result={result}
          alreadySaved={alreadySaved}
          isInRoute={isInRoute}
          onSave={() => {
            const latestPins = useStore.getState().pins;
            const duplicate = latestPins.some(
              (pin) =>
                pin.title.toLowerCase() === result.displayName.toLowerCase() ||
                (Math.abs(pin.lat - result.lat) < 0.001 && Math.abs(pin.lng - result.lng) < 0.001),
            );
            if (!duplicate) {
              useStore.getState().addPin(buildQuickSavePin(result));
            }
          }}
          onAddToRoute={() => {
            const stop: RouteStop = {
              id: `discover_${result.placeId}`,
              label: result.displayName,
              address: result.address ?? "",
              lat: result.lat,
              lng: result.lng,
            };
            return addStop(stop);
          }}
        />,
      );

      infoWindowRoot.current = root;
      return container;
    },
    [addStop, routeStops, unmountInfoWindowContent],
  );

  useEffect(() => {
    if (!map) return;

    const resultIds = new Set(discoverResults.map((result) => result.placeId));

    for (const [placeId, marker] of markerPool.current.entries()) {
      if (!resultIds.has(placeId)) {
        marker.map = null;
        markerPool.current.delete(placeId);
        if (openPlaceId.current === placeId) {
          closeInfoWindow();
        }
      }
    }

    for (const result of discoverResults) {
      const state = getMarkerState(result.placeId, selectedDiscoverIds, hoveredDiscoverId);
      const existing = markerPool.current.get(result.placeId);

      if (existing) {
        const currentState = (existing.content as HTMLElement)?.dataset?.discoverState;
        if (currentState !== state) {
          existing.content = createDiscoverMarkerElement(state);
          (existing as google.maps.marker.AdvancedMarkerElement).zIndex = MARKER_Z_INDEX[state];
        }
        continue;
      }

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: result.lat, lng: result.lng },
        map,
        content: createDiscoverMarkerElement(state),
        title: result.displayName,
        zIndex: MARKER_Z_INDEX[state],
      });

      const capturedResult: DiscoverResult = result;
      marker.addListener("click", () => {
        if (!map) return;
        map.panTo({ lat: capturedResult.lat, lng: capturedResult.lng });
        if ((map.getZoom() ?? 0) < 15) {
          map.setZoom(15);
        }

        if (!infoWindow.current) {
          const nextInfoWindow = new google.maps.InfoWindow();
          nextInfoWindow.addListener("closeclick", () => {
            openPlaceId.current = null;
            unmountInfoWindowContent();
          });
          infoWindow.current = nextInfoWindow;
        }

        if (openPlaceId.current === capturedResult.placeId) {
          closeInfoWindow();
          return;
        }

        infoWindow.current.setContent(renderInfoWindowContent(capturedResult));
        infoWindow.current.open({ anchor: marker, map });
        openPlaceId.current = capturedResult.placeId;
      });

      markerPool.current.set(result.placeId, marker);
    }
  }, [
    closeInfoWindow,
    discoverResults,
    hoveredDiscoverId,
    map,
    renderInfoWindowContent,
    selectedDiscoverIds,
    unmountInfoWindowContent,
  ]);

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

  useEffect(() => {
    const markers = markerPool.current;
    return () => {
      for (const marker of markers.values()) {
        marker.map = null;
      }
      markers.clear();
      closeInfoWindow();
    };
  }, [closeInfoWindow]);

  return null;
}
