import type { RouteStop, RouteResult } from '@/app/types/route.types';

export interface RouteOrigin {
  address?: string;
  lat?: number;
  lng?: number;
}

/**
 * Calls google.maps.Route.computeRoutes with optimizeWaypointOrder: true.
 * Returns null on failure — callers should check and show user feedback.
 *
 * IMPORTANT: Uses Route class (routes library), NOT DirectionsService (deprecated Feb 2026).
 * Parameter is `optimizeWaypointOrder` NOT `optimizeWaypoints` (DirectionsService name —
 * using the wrong name causes silent failure with no optimization applied).
 */
export async function computeRoute(
  origin: RouteOrigin,
  stops: RouteStop[],
  returnToStart = false,
): Promise<RouteResult | null> {
  try {
    // Route class not yet in @types/google.maps@3.58.1 — types lag behind the runtime API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { Route } = (await google.maps.importLibrary('routes')) as any;

    const makeWaypoint = (pt: RouteOrigin) =>
      pt.address
        ? { address: pt.address }
        : { location: { latLng: { latitude: pt.lat!, longitude: pt.lng! } } };

    const destination = returnToStart
      ? makeWaypoint(origin)
      : makeWaypoint(stops[stops.length - 1]);
    const intermediates = returnToStart
      ? stops.map(makeWaypoint)
      : stops.slice(0, -1).map(makeWaypoint);

    const result = await new Route().computeRoutes({
      origin: makeWaypoint(origin),
      destination,
      intermediates,
      travelMode: 'DRIVING' as google.maps.TravelMode,
      optimizeWaypointOrder: true,
      fields: [
        'routes.distanceMeters',
        'routes.duration',
        'routes.optimizedIntermediateWaypointIndices',
        'routes.path',
      ],
    });

    const route = result?.routes?.[0];
    if (!route) return null;

    // Duration is proto3 Duration string: "3600s" — parse to integer seconds
    const totalDurationSeconds = parseInt(route.duration ?? '0', 10);
    const totalDistanceMeters = route.distanceMeters ?? 0;
    const optimizedOrder: number[] = route.optimizedIntermediateWaypointIndices ?? [];
    // route.path is Array<LatLngAltitude> — map to plain {lat, lng}
    const polylinePath = (route.path ?? []).map((p: { lat: number; lng: number }) => ({
      lat: p.lat,
      lng: p.lng,
    }));

    return { optimizedOrder, totalDistanceMeters, totalDurationSeconds, polylinePath };
  } catch (err) {
    console.error('[route-service] computeRoute failed:', err);
    return null;
  }
}
