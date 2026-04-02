export type StartMode = 'home' | 'gps' | 'custom';

/**
 * A single stop in the route.
 * id: For pin-sourced stops use the pin.id.
 *     For discover-sourced stops (not yet saved as pin) use `discover_${placeId}`.
 * label: Display name (pin.title or discover result displayName).
 * address: Preferred for Google Maps URL; falls back to `${lat},${lng}`.
 * lat/lng: Always present — used for polyline and numbered marker placement.
 */
export interface RouteStop {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Result from a successful computeRoutes call.
 * optimizedOrder: Indices into routeStops[] in the order Google recommends.
 * polylinePath: Decoded lat/lng path for drawing the Polyline.
 * totalDurationSeconds: Parsed from Route API duration string ("3600s" → 3600).
 */
export interface RouteResult {
  optimizedOrder: number[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  polylinePath: Array<{ lat: number; lng: number }>;
}
