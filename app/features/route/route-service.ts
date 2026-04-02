import { importLibrary } from "@googlemaps/js-api-loader";
import type { RouteStop, RouteResult } from '@/app/features/route/model/route.types';

export interface RouteOrigin {
  address?: string;
  lat?: number;
  lng?: number;
}

/**
 * Calls google.maps.DirectionsService with optimizeWaypoints: true.
 * Always treats origin as both start AND end (round trip).
 * ALL stops are waypoints with optimizeWaypoints: true — Google decides the best order.
 * Returns the optimized order so the UI list can reorder to match.
 * Returns null on failure — callers should check and show user feedback.
 */
export async function computeRoute(
  origin: RouteOrigin,
  stops: RouteStop[],
): Promise<RouteResult | null> {
  try {
    // Ensure routes library is loaded (provides DirectionsService)
    await importLibrary("routes");
    const directionsService = new google.maps.DirectionsService();

    // Support both address string and lat/lng coordinates
    const originPoint = origin.address
      ? origin.address
      : new google.maps.LatLng(origin.lat!, origin.lng!);

    // ALL stops are intermediate waypoints — Google optimizes the full order
    const waypoints = stops.map((s) => ({
      location: new google.maps.LatLng(s.lat, s.lng),
      stopover: true,
    }));

    const response = await directionsService.route({
      origin: originPoint,
      destination: originPoint, // round trip back to start
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    });

    const route = response.routes?.[0];
    if (!route) return null;

    let totalDistanceMeters = 0;
    let totalDurationSeconds = 0;
    for (const leg of route.legs) {
      totalDistanceMeters += leg.distance?.value ?? 0;
      totalDurationSeconds += leg.duration?.value ?? 0;
    }

    const optimizedOrder: number[] = route.waypoint_order ?? [];
    const polylinePath = route.overview_path.map((p) => ({
      lat: p.lat(),
      lng: p.lng(),
    }));

    return { optimizedOrder, totalDistanceMeters, totalDurationSeconds, polylinePath };
  } catch (err) {
    console.error('[route-service] computeRoute failed:', err);
    return null;
  }
}
