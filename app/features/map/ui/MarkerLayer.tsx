"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { MapContext } from "../MapContext";
import { useStore } from "@/app/store";
import type { Pin } from "@/app/features/pins/model/pin.types";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { animatePinMarker } from "../lib/animate-pin-marker";
import { buildPinInfoWindowContent } from "../lib/build-pin-info-window-content";
import { clearPinMarkers, syncPinMarkers } from "../lib/sync-pin-markers";
import { MIN_PIN_FOCUS_ZOOM } from "../model/map.constants";

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
  const addPlannerStop = useStore((s) => s.addPlannerStop);
  const setActivePlannerDate = useStore((s) => s.setActivePlannerDate);

  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const pinsById = useRef<Map<string, Pin>>(new Map());
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const openPinId = useRef<string | null>(null);

  const closeInfoWindow = useCallback(() => {
    infoWindow.current?.close();
    openPinId.current = null;
  }, []);

  const handleMarkerClick = useCallback(
    (pin: Pin, marker: google.maps.marker.AdvancedMarkerElement) => {
      if (!map) return;

      if (!infoWindow.current) {
        infoWindow.current = new google.maps.InfoWindow();
        infoWindow.current.addListener("closeclick", () => {
          openPinId.current = null;
        });
      }

      if (openPinId.current === pin.id) {
        closeInfoWindow();
        return;
      }

      const content = buildPinInfoWindowContent({
        pin,
        onEditPin: (pinId) => {
          closeInfoWindow();
          onEditPin(pinId);
        },
        onDeletePin: (pinId) => {
          closeInfoWindow();
          deletePin(pinId);
        },
        onAddRouteStop: (nextPin, button) => {
          const stop: RouteStop = {
            id: nextPin.id,
            label: nextPin.title,
            address: nextPin.address ?? "",
            lat: nextPin.lat,
            lng: nextPin.lng,
          };

          const added = addStop(stop);
          if (!added) {
            button.textContent = "Max 25";
            button.disabled = true;
            return;
          }

          button.textContent = "✓ Added";
          button.disabled = true;
        },
        onPlanPin: (nextPin, button) => {
          const today = new Date().toISOString().slice(0, 10);
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
          button.textContent = "✓ Planned";
          button.disabled = true;
        },
      });

      infoWindow.current.setContent(content);
      infoWindow.current.open({ anchor: marker, map });
      openPinId.current = pin.id;
    },
    [addPlannerStop, addStop, closeInfoWindow, deletePin, map, onEditPin, setActivePlannerDate],
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
    function handleOpenPinInfo(event: Event) {
      const pinId = (event as CustomEvent).detail?.pinId;
      if (!pinId || !map) return;

      const pin = pinsById.current.get(pinId);
      const marker = markerPool.current.get(pinId);
      if (!pin || !marker) return;

      map.panTo({ lat: pin.lat, lng: pin.lng });
      const currentZoom = map.getZoom() ?? 12;
      if (currentZoom < MIN_PIN_FOCUS_ZOOM) {
        map.setZoom(MIN_PIN_FOCUS_ZOOM);
      }

      animatePinMarker(marker);
      handleMarkerClick(pin, marker);
    }

    window.addEventListener("open-pin-info", handleOpenPinInfo);
    return () => window.removeEventListener("open-pin-info", handleOpenPinInfo);
  }, [handleMarkerClick, map]);

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
