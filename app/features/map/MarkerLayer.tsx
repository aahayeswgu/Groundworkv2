"use client";

import { useEffect, useRef, useCallback, useContext } from "react";
import { MapContext } from "./MapContext";
import { useStore } from "@/app/store";
import { createPinMarkerElement } from "@/app/features/pins/pin-marker";
import { fetchAiBrief } from "@/app/lib/ask-ai";
import type { Pin } from "@/app/types/pins.types";
import type { RouteStop } from "@/app/types/route.types";

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
      container.style.cssText = "min-width:280px;font-family:DM Sans,sans-serif";

      // Photo (if available from discover quick-save)
      if (pin.photoUrl) {
        const photo = document.createElement("div");
        photo.style.cssText = `height:140px;background:url('${pin.photoUrl}') center/cover no-repeat;border-radius:12px 12px 0 0`;
        container.appendChild(photo);
      }

      const body = document.createElement("div");
      body.style.cssText = `padding:${pin.photoUrl ? "12px 16px 14px" : "14px 16px"}`;

      const title = document.createElement("div");
      title.style.cssText = "font-weight:700;font-size:15px;margin-bottom:4px;line-height:1.3;color:#1A1A1A";
      title.textContent = pin.title;
      body.appendChild(title);

      const badge = document.createElement("span");
      badge.style.cssText = `display:inline-block;padding:2px 8px;border-radius:12px;background:${statusColors[pin.status]};color:white;font-size:11px;font-weight:600;margin-bottom:8px`;
      badge.textContent = statusLabels[pin.status] ?? pin.status;
      body.appendChild(badge);

      // Rating — clickable link to Google reviews
      if (pin.rating) {
        const ratingEl = document.createElement("div");
        ratingEl.style.cssText = "font-size:12px;margin-bottom:6px";
        const stars = "\u2605".repeat(Math.round(pin.rating)) + "\u2606".repeat(5 - Math.round(pin.rating));
        if (pin.placeId) {
          const ratingLink = document.createElement("a");
          ratingLink.href = `https://www.google.com/maps/place/?q=place_id:${pin.placeId}`;
          ratingLink.target = "_blank";
          ratingLink.rel = "noopener";
          ratingLink.style.cssText = "text-decoration:none;cursor:pointer";
          ratingLink.innerHTML = `<span style="color:#F59E0B;letter-spacing:1px">${stars}</span> <span style="color:#1A1A1A;font-weight:700">${pin.rating}</span>${pin.ratingCount ? ` <span style="color:#888">(${pin.ratingCount} reviews)</span>` : ""}`;
          ratingEl.appendChild(ratingLink);
        } else {
          ratingEl.innerHTML = `<span style="color:#F59E0B;letter-spacing:1px">${stars}</span> <span style="color:#1A1A1A;font-weight:700">${pin.rating}</span>${pin.ratingCount ? ` <span style="color:#888">(${pin.ratingCount})</span>` : ""}`;
        }
        body.appendChild(ratingEl);
      }

      if (pin.address) {
        const address = document.createElement("div");
        address.style.cssText = "font-size:12px;color:#555;margin-bottom:4px;line-height:1.4";
        address.textContent = pin.address;
        body.appendChild(address);
      }

      if (pin.contact) {
        const contact = document.createElement("div");
        contact.style.cssText = "font-size:12px;color:#333;margin-bottom:2px";
        contact.textContent = `\u{1F464} ${pin.contact}`;
        body.appendChild(contact);
      }

      if (pin.phone) {
        const phone = document.createElement("div");
        phone.style.cssText = "font-size:12px;color:#333;margin-bottom:8px";
        phone.textContent = `\u{1F4DE} ${pin.phone}`;
        body.appendChild(phone);
      }

      // Google Maps link (if placeId available)
      if (pin.placeId) {
        const gmapsRow = document.createElement("div");
        gmapsRow.style.cssText = "margin-bottom:8px";
        const gmapsLink = document.createElement("a");
        gmapsLink.href = `https://www.google.com/maps/place/?q=place_id:${pin.placeId}`;
        gmapsLink.target = "_blank";
        gmapsLink.rel = "noopener";
        gmapsLink.style.cssText = "display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#4285F4;font-weight:600;text-decoration:none";
        gmapsLink.textContent = "View on Google Maps";
        gmapsRow.appendChild(gmapsLink);
        body.appendChild(gmapsRow);
      }

      const buttonRow = document.createElement("div");
      buttonRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";

      const editBtn = document.createElement("button");
      editBtn.dataset.action = "edit";
      editBtn.textContent = "Edit";
      editBtn.style.cssText =
        "padding:6px 14px;background:#C4692A;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700";

      const deleteBtn = document.createElement("button");
      deleteBtn.dataset.action = "delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.style.cssText =
        "padding:6px 14px;background:#EF4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700";

      const routeBtn = document.createElement("button");
      routeBtn.dataset.action = "route";
      routeBtn.textContent = "+ Route";
      routeBtn.style.cssText =
        "padding:6px 14px;background:#C4692A;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700";

      const planBtn = document.createElement("button");
      planBtn.dataset.action = "plan";
      planBtn.textContent = "Add to Planner";
      planBtn.style.cssText =
        "padding:6px 14px;background:#3B8CB5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700";

      buttonRow.appendChild(editBtn);
      buttonRow.appendChild(deleteBtn);
      buttonRow.appendChild(routeBtn);
      buttonRow.appendChild(planBtn);
      body.appendChild(buttonRow);

      // Ask AI button (only for pins with placeId — discovered businesses)
      if (pin.placeId) {
        const aiBtn = document.createElement("button");
        aiBtn.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:transparent;color:#4285F4;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px";
        aiBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Ask AI';

        const aiContainer = document.createElement("div");
        aiContainer.style.cssText = "display:none;margin-top:8px;padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #e0e0e0;font-size:13px;line-height:1.6;color:#1A1A1A;max-height:300px;overflow-y:auto";

        let briefText = "";
        let briefLoaded = false;
        let detailedLoaded = false;

        function renderMd(text: string): string {
          return text
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/^(\s*)\*\s+/gm, "$1• ")
            .replace(/^(\s*)[-–]\s+/gm, "$1• ")
            .replace(/\n{2,}/g, "<br><br>")
            .replace(/\n/g, "<br>");
        }

        aiBtn.addEventListener("click", async () => {
          if (detailedLoaded) {
            aiContainer.style.display = aiContainer.style.display === "none" ? "block" : "none";
            aiBtn.textContent = aiContainer.style.display === "none" ? "Show AI Brief" : "Hide AI Brief";
            return;
          }
          if (briefLoaded) {
            aiBtn.innerHTML = "Digging deeper...";
            aiBtn.style.opacity = "0.7";
            try {
              const detailed = await fetchAiBrief(pin.placeId!, pin.title, pin.address, pin.status, "detailed", briefText);
              aiContainer.innerHTML = renderMd(briefText + "\n\n---\n\n" + detailed);
              detailedLoaded = true;
              aiBtn.textContent = "Hide AI Brief";
              aiBtn.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:#4285F4;color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px";
              aiBtn.style.opacity = "1";
            } catch {
              aiBtn.innerHTML = "Learn More (retry)";
              aiBtn.style.opacity = "1";
            }
            return;
          }
          aiBtn.innerHTML = "Generating...";
          aiBtn.style.opacity = "0.7";
          try {
            briefText = await fetchAiBrief(pin.placeId!, pin.title, pin.address, pin.status, "brief");
            aiContainer.style.display = "block";
            aiContainer.innerHTML = renderMd(briefText);
            briefLoaded = true;
            aiBtn.innerHTML = "Learn More";
            aiBtn.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:#4285F4;color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px";
            aiBtn.style.opacity = "1";
          } catch {
            aiBtn.innerHTML = "Ask AI (retry)";
            aiBtn.style.opacity = "1";
          }
        });

        body.appendChild(aiBtn);
        body.appendChild(aiContainer);
      }

      container.appendChild(body);

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
        if (action === "plan") {
          const today = new Date().toISOString().slice(0, 10);
          setActivePlannerDate(today);
          addPlannerStop({
            id: crypto.randomUUID(),
            pinId: pin.id,
            label: pin.title,
            address: pin.address ?? "",
            lat: pin.lat,
            lng: pin.lng,
            status: "planned",
            addedAt: new Date().toISOString(),
            visitedAt: null,
          });
          // Mutate in-place — DO NOT call infoWindow.setContent()
          target.textContent = "✓ Planned";
          (target as HTMLButtonElement).disabled = true;
        }
      });

      return container;
    },
    [deletePin, onEditPin, addStop, addPlannerStop, setActivePlannerDate],
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

    const visiblePins = pinsVisible ? pins.filter((p) => activeStatusFilter.has(p.status)) : [];
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
  }, [map, pins, activeStatusFilter, pinsVisible, deletePin, onEditPin, handleMarkerClick]);

  // Listen for sidebar pin clicks to pan, bounce, and open InfoWindow
  useEffect(() => {
    function handleOpenPinInfo(e: Event) {
      const pinId = (e as CustomEvent).detail?.pinId;
      if (!pinId || !map) return;
      const pin = pins.find((p) => p.id === pinId);
      const marker = markerPool.current.get(pinId);
      if (pin && marker) {
        // Smooth pan to pin
        map.panTo({ lat: pin.lat, lng: pin.lng });
        const currentZoom = map.getZoom() ?? 12;
        if (currentZoom < 14) map.setZoom(14);
        // Bounce the marker
        const el = marker.content as HTMLElement;
        if (el) {
          el.classList.add("marker-bounce");
          setTimeout(() => el.classList.remove("marker-bounce"), 700);
        }
        // Open InfoWindow
        handleMarkerClick(pin, marker);
      }
    }
    window.addEventListener("open-pin-info", handleOpenPinInfo);
    return () => window.removeEventListener("open-pin-info", handleOpenPinInfo);
  }, [map, pins, handleMarkerClick]);

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
