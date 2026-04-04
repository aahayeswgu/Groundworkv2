import type { RouteStop, RouteResult } from '@/app/features/route/model/route.types';

export interface RouteOrigin {
  address?: string;
  lat?: number;
  lng?: number;
}

type RouteLocationInput =
  | string
  | google.maps.LatLng
  | google.maps.LatLngLiteral
  | google.maps.LatLngAltitudeLiteral;

interface RouteWaypoint {
  location: RouteLocationInput;
  via?: boolean;
}

interface ComputeRoutesRequest {
  origin: RouteLocationInput;
  destination: RouteLocationInput;
  intermediates?: RouteWaypoint[];
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  optimizeWaypointOrder?: boolean;
  fields: string[];
}

interface ComputeRoutesRoute {
  distanceMeters?: number;
  durationMillis?: number;
  path?: Array<google.maps.LatLngAltitude | google.maps.LatLng | google.maps.LatLngLiteral>;
  optimizedIntermediateWaypointIndices?: number[];
}

interface ComputeRoutesResponse {
  routes?: ComputeRoutesRoute[];
}

interface RoutesLibraryWithRouteClass {
  Route?: {
    computeRoutes?: (request: ComputeRoutesRequest) => Promise<ComputeRoutesResponse>;
  };
}

function getOriginPoint(origin: RouteOrigin): RouteLocationInput {
  if (origin.address) {
    return origin.address;
  }
  return { lat: origin.lat!, lng: origin.lng! };
}

function normalizePathPoint(
  point: google.maps.LatLngAltitude | google.maps.LatLng | google.maps.LatLngLiteral,
): { lat: number; lng: number } | null {
  if (point instanceof google.maps.LatLng) {
    return { lat: point.lat(), lng: point.lng() };
  }

  const maybePoint = point as {
    lat?: number | (() => number);
    lng?: number | (() => number);
  };

  if (typeof maybePoint.lat === 'number' && typeof maybePoint.lng === 'number') {
    return { lat: maybePoint.lat, lng: maybePoint.lng };
  }

  if (typeof maybePoint.lat === 'function' && typeof maybePoint.lng === 'function') {
    const lat = maybePoint.lat.call(point);
    const lng = maybePoint.lng.call(point);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

async function computeRouteWithRouteClass(
  origin: RouteOrigin,
  stops: RouteStop[],
): Promise<RouteResult | null> {
  try {
    const routesLibrary = await google.maps.importLibrary('routes') as unknown as RoutesLibraryWithRouteClass;
    const computeRoutes = routesLibrary.Route?.computeRoutes;
    if (!computeRoutes) return null;

    const originPoint = getOriginPoint(origin);
    const request: ComputeRoutesRequest = {
      origin: originPoint,
      destination: originPoint, // round trip back to start
      intermediates: stops.map((stop) => ({
        location: { lat: stop.lat, lng: stop.lng },
      })),
      travelMode: 'DRIVING',
      optimizeWaypointOrder: true,
      fields: [
        'distanceMeters',
        'durationMillis',
        'path',
        'optimizedIntermediateWaypointIndices',
      ],
    };

    const response = await computeRoutes(request);
    const route = response.routes?.[0];
    if (!route) return null;

    const optimizedOrder = route.optimizedIntermediateWaypointIndices ?? [];
    const totalDistanceMeters = route.distanceMeters ?? 0;
    const totalDurationSeconds = Number.isFinite(route.durationMillis)
      ? Math.round((route.durationMillis ?? 0) / 1000)
      : 0;

    const polylinePath = (route.path ?? [])
      .map(normalizePathPoint)
      .filter((point): point is { lat: number; lng: number } => point !== null);

    return { optimizedOrder, totalDistanceMeters, totalDurationSeconds, polylinePath };
  } catch (err) {
    console.warn('[route-service] Route.computeRoutes failed, falling back to DirectionsService.', err);
    return null;
  }
}

async function computeRouteWithDirectionsService(
  origin: RouteOrigin,
  stops: RouteStop[],
): Promise<RouteResult | null> {
  try {
    const directionsService = new google.maps.DirectionsService();
    const originPoint = getOriginPoint(origin);

    const waypoints = stops.map((stop) => ({
      location: new google.maps.LatLng(stop.lat, stop.lng),
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
    const polylinePath = route.overview_path.map((point) => ({
      lat: point.lat(),
      lng: point.lng(),
    }));

    return { optimizedOrder, totalDistanceMeters, totalDurationSeconds, polylinePath };
  } catch (err) {
    console.error('[route-service] DirectionsService fallback failed:', err);
    return null;
  }
}

/**
 * Calls Route.computeRoutes with optimizeWaypointOrder: true.
 * Always treats origin as both start AND end (round trip).
 * ALL stops are intermediate waypoints — Google decides the best order.
 * Returns the optimized order so the UI list can reorder to match.
 * Falls back to legacy DirectionsService only if Route.computeRoutes is unavailable/fails.
 */
export async function computeRoute(
  origin: RouteOrigin,
  stops: RouteStop[],
): Promise<RouteResult | null> {
  try {
    const routeFromRouteClass = await computeRouteWithRouteClass(origin, stops);
    if (routeFromRouteClass) {
      return routeFromRouteClass;
    }

    return await computeRouteWithDirectionsService(origin, stops);
  } catch (err) {
    console.error('[route-service] computeRoute failed:', err);
    return null;
  }
}
