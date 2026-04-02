import { MARKER_BOUNCE_DURATION_MS } from "../model/map.constants";

export function animatePinMarker(marker: google.maps.marker.AdvancedMarkerElement): () => void {
  const markerElement = marker.content;
  if (!(markerElement instanceof HTMLElement)) {
    return () => {};
  }

  markerElement.classList.remove("marker-bounce");
  void markerElement.offsetWidth;
  markerElement.classList.add("marker-bounce");

  const timeoutId = window.setTimeout(() => {
    markerElement.classList.remove("marker-bounce");
  }, MARKER_BOUNCE_DURATION_MS);

  return () => {
    window.clearTimeout(timeoutId);
    markerElement.classList.remove("marker-bounce");
  };
}
