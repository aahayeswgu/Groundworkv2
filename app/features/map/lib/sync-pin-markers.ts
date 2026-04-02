import { createPinMarkerElement } from "@/app/features/pins/pin-marker";
import type { Pin, PinStatus } from "@/app/features/pins/model/pin.types";

interface SyncPinMarkersParams {
  map: google.maps.Map;
  pins: Pin[];
  pinsVisible: boolean;
  activeStatusFilter: Set<PinStatus>;
  markerPool: Map<string, google.maps.marker.AdvancedMarkerElement>;
  pinsById: Map<string, Pin>;
  openPinId: { current: string | null };
  closeInfoWindow: () => void;
  handleMarkerClick: (pin: Pin, marker: google.maps.marker.AdvancedMarkerElement) => void;
}

export function syncPinMarkers({
  map,
  pins,
  pinsVisible,
  activeStatusFilter,
  markerPool,
  pinsById,
  openPinId,
  closeInfoWindow,
  handleMarkerClick,
}: SyncPinMarkersParams): void {
  const visiblePins = pinsVisible ? pins.filter((pin) => activeStatusFilter.has(pin.status)) : [];
  const visibleIds = new Set(visiblePins.map((pin) => pin.id));

  for (const [pinId, marker] of markerPool.entries()) {
    if (!visibleIds.has(pinId)) {
      marker.map = null;
      markerPool.delete(pinId);
    }
  }

  for (const pin of visiblePins) {
    const existing = markerPool.get(pin.id);
    const existingElement = existing?.content as HTMLElement | undefined;

    if (existing && existingElement?.dataset?.status === pin.status) {
      existing.position = { lat: pin.lat, lng: pin.lng };
      existing.title = pin.title;
      continue;
    }

    if (existing) {
      existing.map = null;
      markerPool.delete(pin.id);
    }

    const markerElement = createPinMarkerElement(pin.status);
    markerElement.dataset.status = pin.status;
    markerElement.dataset.pinId = pin.id;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat: pin.lat, lng: pin.lng },
      map,
      content: markerElement,
      title: pin.title,
    });

    marker.addListener("click", () => {
      const latestPin = pinsById.get(pin.id);
      if (!latestPin) return;
      handleMarkerClick(latestPin, marker);
    });

    markerPool.set(pin.id, marker);
  }

  if (openPinId.current !== null && !pinsById.has(openPinId.current)) {
    closeInfoWindow();
  }
}

export function clearPinMarkers(
  markerPool: Map<string, google.maps.marker.AdvancedMarkerElement>,
): void {
  for (const marker of markerPool.values()) {
    marker.map = null;
  }

  markerPool.clear();
}
