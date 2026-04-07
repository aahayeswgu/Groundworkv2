import type { RouteStop } from '@/app/features/route/model/route.types';

function stopAddress(stop: RouteStop): string {
  return stop.address?.trim() ? stop.address.trim() : `${stop.lat},${stop.lng}`;
}

function appendWaypoints(base: string, intermediates: RouteStop[]): string {
  if (intermediates.length === 0) return base;

  // Encode each address individually; join with pipe per Google Maps API docs.
  const waypoints = intermediates
    .map((stop) => encodeURIComponent(stopAddress(stop)))
    .join('|');

  return `${base}&waypoints=${waypoints}`;
}

/**
 * Builds the official Google Maps directions URL.
 * Format: https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=A|B|C&travelmode=driving
 *
 * NOTE: D-05 specifies path format (/maps/dir/{stop1}/...) from the old app.
 * Research recommends the official ?api=1 format instead — it is documented, stable,
 * and correctly handles percent-encoding via URLSearchParams. The path format is
 * undocumented and not guaranteed stable. Using api=1 format per research recommendation.
 *
 * Mobile browsers support only 3 waypoints (intermediates) — 5 total stops.
 * Callers should show a warning when stops.length > 3 (per D-08).
 * This function generates the full URL regardless of stop count.
 *
 * @param origin  Start point for the route
 * @param stops   Ordered stops including final destination (last element = destination)
 */
export function buildGoogleMapsUrl(origin: RouteStop, stops: RouteStop[]): string {
  if (stops.length === 0) return '';

  const destination = stops[stops.length - 1];
  const intermediates = stops.slice(0, -1);

  const params = new URLSearchParams({
    api: '1',
    origin: stopAddress(origin),
    destination: stopAddress(destination),
    travelmode: 'driving',
  });

  // Build base URL — waypoints appended separately to preserve literal pipe separators
  // (URLSearchParams would encode '|' to '%7C'; Google Maps expects literal or encoded pipe)
  const base = `https://www.google.com/maps/dir/?${params.toString()}`;

  return appendWaypoints(base, intermediates);
}

/**
 * Builds Google Maps directions URL without an explicit origin.
 * Google Maps can then attempt to use current device location.
 *
 * @param stops  Ordered stops including final destination (last element = destination)
 */
export function buildGoogleMapsUrlWithoutOrigin(stops: RouteStop[]): string {
  if (stops.length === 0) return '';

  const destination = stops[stops.length - 1];
  const intermediates = stops.slice(0, -1);

  const params = new URLSearchParams({
    api: '1',
    destination: stopAddress(destination),
    travelmode: 'driving',
  });

  const base = `https://www.google.com/maps/dir/?${params.toString()}`;

  return appendWaypoints(base, intermediates);
}
