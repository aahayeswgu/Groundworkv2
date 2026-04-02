interface UpsertCurrentLocationMarkerParams {
  map: google.maps.Map;
  position: google.maps.LatLngLiteral;
  marker: google.maps.marker.AdvancedMarkerElement | null;
}

const CURRENT_LOCATION_MARKER_TITLE = "Your current location";

export function upsertCurrentLocationMarker({
  map,
  position,
  marker,
}: UpsertCurrentLocationMarkerParams): google.maps.marker.AdvancedMarkerElement {
  if (marker) {
    marker.position = position;
    marker.map = map;
    return marker;
  }

  return new google.maps.marker.AdvancedMarkerElement({
    map,
    position,
    title: CURRENT_LOCATION_MARKER_TITLE,
    zIndex: 1000,
  });
}
