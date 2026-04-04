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
  const mapDiv = map.getDiv();
  const previousCursor = mapDiv.style.cursor;
  map.setOptions({ draggableCursor: "crosshair" });
  mapDiv.style.cursor = "crosshair";
  const clickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    void onDrop(event.latLng);
  });

  return () => {
    google.maps.event.removeListener(clickListener);
    map.setOptions({ draggableCursor: "" });
    mapDiv.style.cursor = previousCursor;
  };
}

export function startDiscoverDrawSession({
  map,
  onComplete,
}: StartDiscoverDrawSessionParams): DiscoverDrawSession {
  let didComplete = false;
  let areaRect: google.maps.Rectangle | null = null;
  const cleanupFns: Array<() => void> = [];
  const mapDiv = map.getDiv();
  const previousDraggable = map.get("draggable");
  const previousGestureHandling = map.get("gestureHandling") as google.maps.MapOptions["gestureHandling"] | undefined;
  const previousTouchAction = mapDiv.style.touchAction;
  const previousCursor = mapDiv.style.cursor;

  const clearArea = () => {
    if (!areaRect) return;
    areaRect.setMap(null);
    areaRect = null;
  };

  const stop = () => {
    map.setOptions({
      draggableCursor: "",
      draggable: typeof previousDraggable === "boolean" ? previousDraggable : true,
      gestureHandling: previousGestureHandling ?? "greedy",
    });
    mapDiv.style.touchAction = previousTouchAction;
    mapDiv.style.cursor = previousCursor;
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

  map.setOptions({
    draggableCursor: "crosshair",
    draggable: false,
    gestureHandling: "none",
  });
  mapDiv.style.touchAction = "none";
  mapDiv.style.cursor = "crosshair";

  if (isCoarsePointerEnvironment(map)) {
    let touchStarted = false;
    let startLatLng: google.maps.LatLng | null = null;
    let movedDuringGesture = false;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const projectedStart = projectClientPointToLatLng(map, touch.clientX, touch.clientY);
      if (!projectedStart) return;
      event.preventDefault();
      touchStarted = true;
      movedDuringGesture = false;
      startLatLng = projectedStart;
      clearArea();
      showSelectionRect(projectedStart, projectedStart);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchStarted) return;
      if (!startLatLng) return;
      const touch = event.touches[0];
      if (!touch) return;

      const currentLatLng = projectClientPointToLatLng(map, touch.clientX, touch.clientY);
      if (!currentLatLng) return;

      event.preventDefault();
      movedDuringGesture = true;
      showSelectionRect(startLatLng, currentLatLng);
    };

    const onTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      if (!touchStarted || !areaRect) {
        touchStarted = false;
        movedDuringGesture = false;
        startLatLng = null;
        clearArea();
        complete({ type: "cancelled" });
        return;
      }

      touchStarted = false;
      startLatLng = null;
      if (!movedDuringGesture) {
        movedDuringGesture = false;
        clearArea();
        complete({ type: "cancelled" });
        return;
      }
      movedDuringGesture = false;
      const currentBounds = areaRect.getBounds();
      if (!currentBounds) {
        clearArea();
        complete({ type: "cancelled" });
        return;
      }

      finalizeBounds(toDrawBounds(currentBounds));
    };

    const onTouchCancel = () => {
      touchStarted = false;
      movedDuringGesture = false;
      startLatLng = null;
      clearArea();
      complete({ type: "cancelled" });
    };

    mapDiv.addEventListener("touchstart", onTouchStart, { passive: false });
    mapDiv.addEventListener("touchmove", onTouchMove, { passive: false });
    mapDiv.addEventListener("touchend", onTouchEnd, { passive: false });
    mapDiv.addEventListener("touchcancel", onTouchCancel, { passive: false });
    cleanupFns.push(() => mapDiv.removeEventListener("touchstart", onTouchStart));
    cleanupFns.push(() => mapDiv.removeEventListener("touchmove", onTouchMove));
    cleanupFns.push(() => mapDiv.removeEventListener("touchend", onTouchEnd));
    cleanupFns.push(() => mapDiv.removeEventListener("touchcancel", onTouchCancel));
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
