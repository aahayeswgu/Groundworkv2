"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createPinMarkerElement } from "@/app/features/pins/pin-marker";
import { PIN_STATUS_META } from "@/app/features/pins/pin-status";
import { useStore } from "@/app/store";
import type { Pin } from "@/app/types/pins.types";
import { MapContext } from "./MapContext";

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
    <div style={{ padding: 12, minWidth: 200, fontFamily: "inherit" }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{pin.title}</div>
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 12,
          background: PIN_STATUS_META[pin.status].color,
          color: "#fff",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {PIN_STATUS_META[pin.status].label}
      </span>

      {pin.address ? (
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{pin.address}</div>
      ) : null}

      {pin.contact ? (
        <div style={{ fontSize: 12, marginBottom: 2 }}>Contact: {pin.contact}</div>
      ) : null}

      {pin.phone ? (
        <div style={{ fontSize: 12, marginBottom: 8 }}>Phone: {pin.phone}</div>
      ) : null}

      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => onEditPin(pin.id)}
          style={{
            padding: "4px 12px",
            background: "#D4712A",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDeletePin(pin.id)}
          style={{
            padding: "4px 12px",
            background: "transparent",
            color: "#EF4444",
            border: "1px solid #EF4444",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Delete
        </button>
        <button
          type="button"
          disabled
          style={{
            padding: "4px 12px",
            background: "transparent",
            color: "#888",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 12,
            opacity: 0.6,
            cursor: "not-allowed",
          }}
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
        // Status unchanged — just update position
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
