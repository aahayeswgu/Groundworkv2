"use client";

import { useEffect, useRef, useCallback, useContext } from "react";
import { MapContext } from "./MapContext";
import { useStore } from "@/app/store";
import { createPinMarkerElement } from "@/app/features/pins/pin-marker";
import type { Pin } from "@/app/types/pins.types";
import type { RouteStop } from "@/app/types/route.types";

interface MarkerLayerProps {
  onEditPin: (pinId: string) => void;
}

export function MarkerLayer({ onEditPin }: MarkerLayerProps) {
  const map = useContext(MapContext);
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const deletePin = useStore((s) => s.deletePin);
  const addStop = useStore((s) => s.addStop);

  const markerPool = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const openPinId = useRef<string | null>(null);

  const buildInfoWindowContent = useCallback(
    (pin: Pin): HTMLElement => {
      const statusColors: Record<string, string> = {
        prospect: "#3B82F6",
        active: "#22C55E",
        "follow-up": "#F59E0B",
        lost: "#EF4444",
      };
      const statusLabels: Record<string, string> = {
        prospect: "Prospect",
        active: "Active",
        "follow-up": "Follow-Up",
        lost: "Lost",
      };

      const container = document.createElement("div");
      container.style.cssText = "padding:12px;min-width:200px;font-family:inherit";

      const title = document.createElement("div");
      title.style.cssText = "font-weight:bold;font-size:14px;margin-bottom:4px";
      title.textContent = pin.title;
      container.appendChild(title);

      const badge = document.createElement("span");
      badge.style.cssText = `display:inline-block;padding:2px 8px;border-radius:12px;background:${statusColors[pin.status]};color:white;font-size:11px;font-weight:600;margin-bottom:8px`;
      badge.textContent = statusLabels[pin.status] ?? pin.status;
      container.appendChild(badge);

      if (pin.address) {
        const address = document.createElement("div");
        address.style.cssText = "font-size:12px;color:#888;margin-bottom:4px";
        address.textContent = pin.address;
        container.appendChild(address);
      }

      if (pin.contact) {
        const contact = document.createElement("div");
        contact.style.cssText = "font-size:12px;margin-bottom:2px";
        contact.textContent = `\u{1F464} ${pin.contact}`;
        container.appendChild(contact);
      }

      if (pin.phone) {
        const phone = document.createElement("div");
        phone.style.cssText = "font-size:12px;margin-bottom:8px";
        phone.textContent = `\u{1F4DE} ${pin.phone}`;
        container.appendChild(phone);
      }

      const buttonRow = document.createElement("div");
      buttonRow.style.cssText = "display:flex;gap:6px";

      const editBtn = document.createElement("button");
      editBtn.dataset.action = "edit";
      editBtn.textContent = "Edit";
      editBtn.style.cssText =
        "padding:4px 12px;background:#D4712A;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px";

      const deleteBtn = document.createElement("button");
      deleteBtn.dataset.action = "delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.style.cssText =
        "padding:4px 12px;background:transparent;color:#EF4444;border:1px solid #EF4444;border-radius:6px;cursor:pointer;font-size:12px";

      const routeBtn = document.createElement("button");
      routeBtn.dataset.action = "route";
      routeBtn.textContent = "+ Route";
      routeBtn.style.cssText =
        "padding:4px 12px;background:transparent;color:#D4712A;border:1px solid #D4712A;border-radius:6px;cursor:pointer;font-size:12px";

      buttonRow.appendChild(editBtn);
      buttonRow.appendChild(deleteBtn);
      buttonRow.appendChild(routeBtn);
      container.appendChild(buttonRow);

      container.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const action = target.dataset.action;
        if (action === "edit") {
          infoWindow.current?.close();
          openPinId.current = null;
          onEditPin(pin.id);
        }
        if (action === "delete") {
          infoWindow.current?.close();
          openPinId.current = null;
          deletePin(pin.id);
        }
        if (action === "route") {
          const stop: RouteStop = {
            id: pin.id,
            label: pin.title,
            address: pin.address ?? "",
            lat: pin.lat,
            lng: pin.lng,
          };
          const added = addStop(stop);
          if (!added) {
            target.textContent = "Max 25";
            (target as HTMLButtonElement).disabled = true;
          } else {
            target.textContent = "✓ Added";
            (target as HTMLButtonElement).disabled = true;
          }
        }
      });

      return container;
    },
    [deletePin, onEditPin, addStop],
  );

  const handleMarkerClick = useCallback(
    (pin: Pin, marker: google.maps.marker.AdvancedMarkerElement) => {
      if (!map) return;
      if (!infoWindow.current) {
        infoWindow.current = new google.maps.InfoWindow();
        infoWindow.current.addListener("closeclick", () => {
          openPinId.current = null;
        });
      }
      // Toggle behavior (D-10)
      if (openPinId.current === pin.id) {
        infoWindow.current.close();
        openPinId.current = null;
        return;
      }
      infoWindow.current.setContent(buildInfoWindowContent(pin));
      infoWindow.current.open({ anchor: marker, map });
      openPinId.current = pin.id;
    },
    [map, buildInfoWindowContent],
  );

  // Main sync effect
  useEffect(() => {
    if (!map) return;

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

      marker.addListener("click", () => handleMarkerClick(pin, marker));
      markerPool.current.set(pin.id, marker);
    }

    // Close info window if open pin was deleted
    if (
      openPinId.current !== null &&
      !pins.some((p) => p.id === openPinId.current)
    ) {
      infoWindow.current?.close();
      openPinId.current = null;
    }
  }, [map, pins, activeStatusFilter, deletePin, onEditPin, handleMarkerClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const marker of markerPool.current.values()) {
        marker.map = null;
      }
      markerPool.current.clear();
      infoWindow.current?.close();
    };
  }, []);

  return null;
}

export default MarkerLayer;
