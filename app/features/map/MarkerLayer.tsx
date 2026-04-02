"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PIN_STATUS_META } from "@/app/entities/pin/model/pin-status";
import { createPinMarkerElement } from "@/app/entities/pin/lib/pin-marker";
import { MapContext } from "@/app/shared/lib/map/MapContext";
import { useStore } from "@/app/shared/store";
import type { Pin } from "@/app/types/pins.types";

interface MarkerLayerProps {
  onEditPin: (pinId: string) => void;
}

interface InfoWindowPinCardProps {
  pin: Pin;
  onEditPin: (pinId: string) => void;
  onDeletePin: (pinId: string) => void;
}

function InfoWindowPinCard({ pin, onEditPin, onDeletePin }: InfoWindowPinCardProps) {
  return (
    <div className="p-3 min-w-[200px] font-[inherit]">
      <div className="mb-1 text-sm font-bold text-text-primary">{pin.title}</div>
      <span
        className={`inline-block px-2 py-0.5 rounded-full mb-2 text-[11px] font-semibold ${PIN_STATUS_META[pin.status].badgeClassName}`}
      >
        {PIN_STATUS_META[pin.status].label}
      </span>

      {pin.address ? (
        <div className="mb-1 text-xs text-text-muted">{pin.address}</div>
      ) : null}

      {pin.contact ? (
        <div className="mb-0.5 text-xs text-text-primary">Contact: {pin.contact}</div>
      ) : null}

      {pin.phone ? (
        <div className="mb-2 text-xs text-text-primary">Phone: {pin.phone}</div>
      ) : null}

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onEditPin(pin.id)}
          className="px-3 py-1 rounded-md text-xs bg-orange text-white hover:bg-orange-hover transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDeletePin(pin.id)}
          className="px-3 py-1 rounded-md text-xs bg-transparent text-gw-red border border-gw-red hover:bg-red-500/10 transition-colors"
        >
          Delete
        </button>
        <button
          type="button"
          disabled
          className="px-3 py-1 rounded-md text-xs bg-transparent text-text-muted border border-border opacity-60 cursor-not-allowed"
        >
          + Route
        </button>
      </div>
    </div>
  );
}

export function MarkerLayer({ onEditPin }: MarkerLayerProps) {
  const map = useContext(MapContext);
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const selectedPinId = useStore((s) => s.selectedPinId);
  const selectedPinNonce = useStore((s) => s.selectedPinNonce);
  const deletePin = useStore((s) => s.deletePin);

  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const infoWindowRoot = useRef<Root | null>(null);
  const pinsById = useRef<Map<string, Pin>>(new Map());
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

  const handleEditPinFromInfoWindow = useCallback(
    (pinId: string) => {
      closeInfoWindow();
      onEditPin(pinId);
    },
    [closeInfoWindow, onEditPin],
  );

  const handleDeletePinFromInfoWindow = useCallback(
    (pinId: string) => {
      closeInfoWindow();
      deletePin(pinId);
    },
    [closeInfoWindow, deletePin],
  );

  const renderInfoWindowContent = useCallback(
    (pin: Pin): HTMLElement => {
      unmountInfoWindowContent();
      // Google Maps InfoWindow expects an HTMLElement; mount a React root into this bridge node.
      const container = document.createElement("div");
      const root = createRoot(container);

      root.render(
        <InfoWindowPinCard
          pin={pin}
          onEditPin={handleEditPinFromInfoWindow}
          onDeletePin={handleDeletePinFromInfoWindow}
        />,
      );

      infoWindowRoot.current = root;
      return container;
    },
    [handleDeletePinFromInfoWindow, handleEditPinFromInfoWindow, unmountInfoWindowContent],
  );

  const ensureInfoWindow = useCallback(() => {
    if (!infoWindow.current) {
      const nextInfoWindow = new google.maps.InfoWindow();
      nextInfoWindow.addListener("closeclick", () => {
        openPinId.current = null;
        unmountInfoWindowContent();
      });
      infoWindow.current = nextInfoWindow;
    }
    return infoWindow.current;
  }, [unmountInfoWindowContent]);

  const handleMarkerClick = useCallback(
    (pin: Pin, marker: google.maps.marker.AdvancedMarkerElement) => {
      if (!map) return;
      const infoWindowInstance = ensureInfoWindow();
      // Toggle behavior (D-10)
      if (openPinId.current === pin.id) {
        closeInfoWindow();
        return;
      }
      infoWindowInstance.setContent(renderInfoWindowContent(pin));
      infoWindowInstance.open({ anchor: marker, map });
      openPinId.current = pin.id;
    },
    [closeInfoWindow, ensureInfoWindow, map, renderInfoWindowContent],
  );

  // Main sync effect
  useEffect(() => {
    if (!map) return;
    pinsById.current = new Map(pins.map((pin) => [pin.id, pin]));

    const visiblePins = pins.filter((p) => activeStatusFilter.has(p.status));
    const visibleIds = new Set(visiblePins.map((p) => p.id));

    // Remove stale markers
    for (const [id, marker] of markerPool.current.entries()) {
      if (!visibleIds.has(id)) {
        marker.map = null;
        markerPool.current.delete(id);
      }
    }

    // Upsert visible markers
    for (const pin of visiblePins) {
      const existing = markerPool.current.get(pin.id);
      const existingEl = existing?.content as HTMLElement | undefined;

      if (existing && existingEl?.dataset?.status === pin.status) {
        // Keep pooled markers attached when map instance is recreated (e.g. theme switch).
        existing.map = map;
        // Status unchanged — just update position/title
        existing.position = { lat: pin.lat, lng: pin.lng };
        existing.title = pin.title;
        continue;
      }

      // Status changed or new marker — remove old if present
      if (existing) {
        existing.map = null;
        markerPool.current.delete(pin.id);
      }

      const el = createPinMarkerElement(pin.status);
      el.dataset.status = pin.status;
      el.dataset.pinId = pin.id;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: pin.lat, lng: pin.lng },
        map,
        content: el,
        title: pin.title,
      });

      marker.addListener("click", () => {
        const latestPin = pinsById.current.get(pin.id);
        if (!latestPin) return;
        handleMarkerClick(latestPin, marker);
      });
      markerPool.current.set(pin.id, marker);
    }

    // Close info window if open pin was deleted
    if (openPinId.current !== null && !pinsById.current.has(openPinId.current)) {
      closeInfoWindow();
    }
  }, [activeStatusFilter, closeInfoWindow, handleMarkerClick, map, pins]);

  useEffect(() => {
    if (!selectedPinId) return;
    const marker = markerPool.current.get(selectedPinId);
    const markerEl = marker?.content;
    if (!(markerEl instanceof HTMLElement)) return;

    // Reset/restart animation so repeated selections on the same pin still pulse.
    markerEl.classList.remove("marker-bounce");
    void markerEl.offsetWidth;
    markerEl.classList.add("marker-bounce");

    const timeoutId = window.setTimeout(() => {
      markerEl.classList.remove("marker-bounce");
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
      markerEl.classList.remove("marker-bounce");
    };
  }, [selectedPinId, selectedPinNonce]);

  // Cleanup on unmount
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

export default MarkerLayer;
