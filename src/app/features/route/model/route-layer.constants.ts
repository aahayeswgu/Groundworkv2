export const ROUTE_BORDER_STYLE: Omit<google.maps.PolylineOptions, "map" | "path"> = {
  strokeColor: "#1A1A1A",
  strokeWeight: 10,
  strokeOpacity: 0.5,
  zIndex: 1,
};

export const ROUTE_LINE_STYLE: Omit<google.maps.PolylineOptions, "map" | "path"> = {
  strokeColor: "#D4712A",
  strokeWeight: 5,
  strokeOpacity: 0.9,
  zIndex: 2,
};

export const ROUTE_FIT_BOUNDS_PADDING: google.maps.Padding = {
  top: 60,
  right: 60,
  bottom: 60,
  left: 60,
};

export const ROUTE_MARKER_Z_INDEX_BASE = 1001;
