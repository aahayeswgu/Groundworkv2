import { type DrawBounds, validateBounds } from "@/app/features/discover/discover-search";

export type DiscoverDrawResult =
  | { type: "bounds"; bounds: DrawBounds }
  | { type: "invalid"; error: string }
  | { type: "cancelled" };

export interface DiscoverDrawSession {
  stop: () => void;
  clearArea: () => void;
}

interface StartDropPinSessionParams {
  map: google.maps.Map;
  onDrop: (latLng: google.maps.LatLng) => void | Promise<void>;
}

interface StartDiscoverDrawSessionParams {
  map: google.maps.Map;
  onComplete: (result: DiscoverDrawResult) => void;
}

function buildBounds(start: google.maps.LatLng, end: google.maps.LatLng): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    { lat: Math.min(start.lat(), end.lat()), lng: Math.min(start.lng(), end.lng()) },
    { lat: Math.max(start.lat(), end.lat()), lng: Math.max(start.lng(), end.lng()) },
  );
}

function toDrawBounds(bounds: google.maps.LatLngBounds): DrawBounds {
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  return {
    swLat: southWest.lat(),
    swLng: southWest.lng(),
    neLat: northEast.lat(),
    neLng: northEast.lng(),
  };
}

function projectClientPointToLatLng(
  map: google.maps.Map,
  clientX: number,
  clientY: number,
): google.maps.LatLng | null {
  const mapBounds = map.getBounds();
  if (!mapBounds) return null;

  const northEast = mapBounds.getNorthEast();
  const southWest = mapBounds.getSouthWest();
  const mapRect = map.getDiv().getBoundingClientRect();
  const x = (clientX - mapRect.left) / mapRect.width;
  const y = (clientY - mapRect.top) / mapRect.height;
  const lat = northEast.lat() - y * (northEast.lat() - southWest.lat());
  const lng = southWest.lng() + x * (northEast.lng() - southWest.lng());
  return new google.maps.LatLng(lat, lng);
}

function isCoarsePointerEnvironment(map: google.maps.Map): boolean {
  const view = map.getDiv().ownerDocument.defaultView;
  if (!view?.matchMedia) return false;
  return view.matchMedia("(pointer: coarse)").matches;
}

export function startDropPinSession({
  map,
  onDrop,
}: StartDropPinSessionParams): () => void {
  map.setOptions({ draggableCursor: "crosshair" });
  const clickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    void onDrop(event.latLng);
  });

  return () => {
    google.maps.event.removeListener(clickListener);
    map.setOptions({ draggableCursor: "" });
  };
}

export function startDiscoverDrawSession({
  map,
  onComplete,
}: StartDiscoverDrawSessionParams): DiscoverDrawSession {
  let didComplete = false;
  let areaRect: google.maps.Rectangle | null = null;
  const cleanupFns: Array<() => void> = [];

  const clearArea = () => {
    if (!areaRect) return;
    areaRect.setMap(null);
    areaRect = null;
  };

  const stop = () => {
    map.setOptions({ draggableCursor: "", draggable: true });
    cleanupFns.forEach((cleanup) => cleanup());
    cleanupFns.length = 0;
  };

  const complete = (result: DiscoverDrawResult) => {
    if (didComplete) return;
    didComplete = true;
    stop();
    onComplete(result);
  };

  const showSelectionRect = (start: google.maps.LatLng, end: google.maps.LatLng) => {
    if (!areaRect) {
      areaRect = new google.maps.Rectangle({
        bounds: buildBounds(start, end),
        strokeColor: "#D4712A",
        strokeWeight: 2,
        fillColor: "#D4712A",
        fillOpacity: 0.08,
        map,
        editable: false,
        clickable: false,
      });
      return;
    }

    areaRect.setBounds(buildBounds(start, end));
  };

  const finalizeBounds = (bounds: DrawBounds) => {
    const validation = validateBounds(bounds);
    if (!validation.valid) {
      clearArea();
      complete({ type: "invalid", error: validation.error ?? "Invalid selection area." });
      return;
    }

    complete({ type: "bounds", bounds });
  };

  map.setOptions({ draggableCursor: "crosshair", draggable: false });

  if (isCoarsePointerEnvironment(map)) {
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let touchStarted = false;
    let startLatLng: google.maps.LatLng | null = null;
    let isSessionActive = true;

    const clearHoldTimer = () => {
      if (!holdTimer) return;
      clearTimeout(holdTimer);
      holdTimer = null;
    };
    cleanupFns.push(clearHoldTimer);
    cleanupFns.push(() => {
      isSessionActive = false;
    });

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const startX = touch.clientX;
      const startY = touch.clientY;

      holdTimer = setTimeout(() => {
        if (!isSessionActive) return;
        const projectedStart = projectClientPointToLatLng(map, startX, startY);
        if (!projectedStart) return;
        touchStarted = true;
        startLatLng = projectedStart;
        clearArea();
        showSelectionRect(projectedStart, projectedStart);
      }, 300);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchStarted) {
        clearHoldTimer();
        return;
      }

      if (!startLatLng) return;
      const touch = event.touches[0];
      if (!touch) return;

      const currentLatLng = projectClientPointToLatLng(map, touch.clientX, touch.clientY);
      if (!currentLatLng) return;

      event.preventDefault();
      showSelectionRect(startLatLng, currentLatLng);
    };

    const onTouchEnd = () => {
      clearHoldTimer();

      if (!touchStarted || !areaRect) {
        clearArea();
        complete({ type: "cancelled" });
        return;
      }

      touchStarted = false;
      const currentBounds = areaRect.getBounds();
      if (!currentBounds) {
        clearArea();
        complete({ type: "cancelled" });
        return;
      }

      finalizeBounds(toDrawBounds(currentBounds));
    };

    const mapDiv = map.getDiv();
    mapDiv.addEventListener("touchstart", onTouchStart, { passive: false });
    mapDiv.addEventListener("touchmove", onTouchMove, { passive: false });
    mapDiv.addEventListener("touchend", onTouchEnd, { passive: false });
    cleanupFns.push(() => mapDiv.removeEventListener("touchstart", onTouchStart));
    cleanupFns.push(() => mapDiv.removeEventListener("touchmove", onTouchMove));
    cleanupFns.push(() => mapDiv.removeEventListener("touchend", onTouchEnd));
  } else {
    const onMouseDown = (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) {
        clearArea();
        complete({ type: "cancelled" });
        return;
      }

      const startLatLng = event.latLng;
      clearArea();
      showSelectionRect(startLatLng, startLatLng);

      const moveListener = map.addListener("mousemove", (moveEvent: google.maps.MapMouseEvent) => {
        if (!moveEvent.latLng) return;
        showSelectionRect(startLatLng, moveEvent.latLng);
      });
      cleanupFns.push(() => google.maps.event.removeListener(moveListener));

      const upListener = google.maps.event.addListenerOnce(map, "mouseup", (upEvent: google.maps.MapMouseEvent) => {
        google.maps.event.removeListener(moveListener);
        if (!upEvent.latLng) {
          clearArea();
          complete({ type: "cancelled" });
          return;
        }

        const finalBounds = buildBounds(startLatLng, upEvent.latLng);
        finalizeBounds(toDrawBounds(finalBounds));
      });
      cleanupFns.push(() => google.maps.event.removeListener(upListener));
    };

    const downListener = google.maps.event.addListenerOnce(map, "mousedown", onMouseDown);
    cleanupFns.push(() => google.maps.event.removeListener(downListener));
  }

  return { stop, clearArea };
}
