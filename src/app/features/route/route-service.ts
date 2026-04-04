import type { RouteStop, RouteResult } from '@/app/features/route/model/route.types';

export interface RouteOrigin {
  address?: string;
  lat?: number;
  lng?: number;
}

export type RouteComputeErrorCode =
  | 'routes-permission-denied'
  | 'routes-library-unavailable'
  | 'routes-no-result'
  | 'routes-request-failed';

export class RouteComputeError extends Error {
  code: RouteComputeErrorCode;

  constructor(code: RouteComputeErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'RouteComputeError';
    this.code = code;
    this.cause = cause;
  }
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

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isPermissionDeniedError(message: string): boolean {
  const normalized = message.toUpperCase();
  return (
    normalized.includes('PERMISSION_DENIED')
    || normalized.includes('REQUEST_DENIED')
    || normalized.includes('ARE BLOCKED')
    || normalized.includes('API_NOT_ACTIVATED')
    || normalized.includes('API KEY')
  );
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
): Promise<RouteResult> {
  try {
    const routesLibrary = await google.maps.importLibrary('routes') as unknown as RoutesLibraryWithRouteClass;
    const computeRoutes = routesLibrary.Route?.computeRoutes;
    if (!computeRoutes) {
      throw new RouteComputeError(
        'routes-library-unavailable',
        'Google Maps Routes library is unavailable.',
      );
    }

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
    if (!route) {
      throw new RouteComputeError('routes-no-result', 'Routes API returned no route.');
    }

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
    if (err instanceof RouteComputeError) {
      throw err;
    }

    const errorMessage = getErrorMessage(err);
    if (isPermissionDeniedError(errorMessage)) {
      throw new RouteComputeError(
        'routes-permission-denied',
        'Routes API permission denied for this key/project.',
        err,
      );
    }

    throw new RouteComputeError(
      'routes-request-failed',
      'Routes API request failed.',
      err,
    );
  }
}

/**
 * Calls Route.computeRoutes with optimizeWaypointOrder: true.
 * Always treats origin as both start AND end (round trip).
 * ALL stops are intermediate waypoints — Google decides the best order.
 * Returns the optimized order so the UI list can reorder to match.
 * Throws RouteComputeError when Route.computeRoutes is unavailable or fails.
 */
export async function computeRoute(
  origin: RouteOrigin,
  stops: RouteStop[],
): Promise<RouteResult> {
  return await computeRouteWithRouteClass(origin, stops);
}
