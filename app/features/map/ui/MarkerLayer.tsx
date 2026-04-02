"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MapContext } from "../MapContext";
import { useStore } from "@/app/store";
import type { Pin } from "@/app/features/pins/model/pin.types";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { animatePinMarker } from "../lib/animate-pin-marker";
import { clearPinMarkers, syncPinMarkers } from "../lib/sync-pin-markers";
import { MIN_PIN_FOCUS_ZOOM } from "../model/map.constants";
import { PinInfoWindowCard } from "./PinInfoWindowCard";

interface MarkerLayerProps {
  onEditPin: (pinId: string) => void;
}

export function MarkerLayer({ onEditPin }: MarkerLayerProps) {
  const map = useContext(MapContext);
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const pinsVisible = useStore((s) => s.pinsVisible);
  const deletePin = useStore((s) => s.deletePin);
  const addStop = useStore((s) => s.addStop);
  const routeStops = useStore((s) => s.routeStops);
  const addPlannerStop = useStore((s) => s.addPlannerStop);
  const plannerDays = useStore((s) => s.plannerDays);
  const setActivePlannerDate = useStore((s) => s.setActivePlannerDate);
  const selectedPinId = useStore((s) => s.selectedPinId);
  const selectedPinNonce = useStore((s) => s.selectedPinNonce);

  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const pinsById = useRef<Map<string, Pin>>(new Map());
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const infoWindowRoot = useRef<Root | null>(null);
  const openPinId = useRef<string | null>(null);

  const unmountInfoWindowContent = useCallback(() => {
    if (!infoWindowRoot.current) return;
    infoWindowRoot.current.unmount();
    infoWindowRoot.current = null;
  }, []);

  const closeInfoWindow = useCallback(() => {
    infoWindow.current?.close();
    openPinId.current = null;
    unmountInfoWindowContent();
  }, [unmountInfoWindowContent]);

  const renderInfoWindowContent = useCallback(
    (pin: Pin): HTMLElement => {
      unmountInfoWindowContent();

      // Google Maps InfoWindow requires an HTMLElement; render React into this bridge node.
      const container = document.createElement("div");
      const root = createRoot(container);

      const today = new Date().toISOString().slice(0, 10);
      const todayStops = plannerDays[today]?.stops ?? [];
      const isInRoute = routeStops.some((stop) => stop.id === pin.id);
      const isPlanned = todayStops.some((stop) => stop.pinId === pin.id);

      root.render(
        <PinInfoWindowCard
          pin={pin}
          isInRoute={isInRoute}
          isPlanned={isPlanned}
          onEditPin={(pinId) => {
            closeInfoWindow();
            onEditPin(pinId);
          }}
          onDeletePin={(pinId) => {
            closeInfoWindow();
            deletePin(pinId);
          }}
          onAddRouteStop={(nextPin) => {
            if (routeStops.some((stop) => stop.id === nextPin.id)) {
              return "already";
            }

            const stop: RouteStop = {
              id: nextPin.id,
              label: nextPin.title,
              address: nextPin.address ?? "",
              lat: nextPin.lat,
              lng: nextPin.lng,
            };

            return addStop(stop) ? "added" : "full";
          }}
          onPlanPin={(nextPin) => {
            if (todayStops.some((stop) => stop.pinId === nextPin.id)) return;
            setActivePlannerDate(today);
            addPlannerStop({
              id: crypto.randomUUID(),
              pinId: nextPin.id,
              label: nextPin.title,
              address: nextPin.address ?? "",
              lat: nextPin.lat,
              lng: nextPin.lng,
              status: "planned",
              addedAt: new Date().toISOString(),
              visitedAt: null,
            });
          }}
        />,
      );

      infoWindowRoot.current = root;
      return container;
    },
    [
      addPlannerStop,
      addStop,
      closeInfoWindow,
      deletePin,
      onEditPin,
      plannerDays,
      routeStops,
      setActivePlannerDate,
      unmountInfoWindowContent,
    ],
  );

  const handleMarkerClick = useCallback(
    (pin: Pin, marker: google.maps.marker.AdvancedMarkerElement) => {
      if (!map) return;

      if (!infoWindow.current) {
        const nextInfoWindow = new google.maps.InfoWindow();
        nextInfoWindow.addListener("closeclick", () => {
          openPinId.current = null;
          unmountInfoWindowContent();
        });
        infoWindow.current = nextInfoWindow;
      }

      if (openPinId.current === pin.id) {
        closeInfoWindow();
        return;
      }

      infoWindow.current.setContent(renderInfoWindowContent(pin));
      infoWindow.current.open({ anchor: marker, map });
      openPinId.current = pin.id;
    },
    [closeInfoWindow, map, renderInfoWindowContent, unmountInfoWindowContent],
  );

  useEffect(() => {
    if (!map) return;

    pinsById.current = new Map(pins.map((pin) => [pin.id, pin]));
    syncPinMarkers({
      map,
      pins,
      pinsVisible,
      activeStatusFilter,
      markerPool: markerPool.current,
      pinsById: pinsById.current,
      openPinId,
      closeInfoWindow,
      handleMarkerClick,
    });
  }, [activeStatusFilter, closeInfoWindow, handleMarkerClick, map, pins, pinsVisible]);

  useEffect(() => {
    if (!selectedPinId || !map) return;

    const pin = pinsById.current.get(selectedPinId);
    const marker = markerPool.current.get(selectedPinId);
    if (!pin || !marker) return;

    map.panTo({ lat: pin.lat, lng: pin.lng });
    const currentZoom = map.getZoom() ?? 12;
    if (currentZoom < MIN_PIN_FOCUS_ZOOM) {
      map.setZoom(MIN_PIN_FOCUS_ZOOM);
    }

    animatePinMarker(marker);
    handleMarkerClick(pin, marker);
  }, [handleMarkerClick, map, selectedPinId, selectedPinNonce]);

  useEffect(() => {
    const markers = markerPool.current;
    return () => {
      clearPinMarkers(markers);
      closeInfoWindow();
    };
  }, [closeInfoWindow]);

  return null;
}

export default MarkerLayer;
