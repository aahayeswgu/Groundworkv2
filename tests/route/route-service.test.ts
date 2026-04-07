import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RouteStop } from '@/app/features/route/model/route.types';

const { computeRoute } = await import('@/app/features/route/api/route-service');

const makeStop = (id: string): RouteStop => ({
  id,
  label: `Stop ${id}`,
  address: '123 Main St',
  lat: 37.7749,
  lng: -122.4194,
});

// LatLng must be a real constructor (called with `new`)
class FakeLatLng {
  lat: number;
  lng: number;
  constructor(lat: number, lng: number) { this.lat = lat; this.lng = lng; }
}

function buildGoogleMock(computeRoutesImpl: unknown) {
  return {
    maps: {
      importLibrary: vi.fn().mockResolvedValue({
        Route: { computeRoutes: computeRoutesImpl },
      }),
      LatLng: FakeLatLng,
    },
  };
}

describe('computeRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns RouteResult with optimized order from Route.computeRoutes', async () => {
    const mockResponse = {
      routes: [{
        distanceMeters: 5000,
        durationMillis: 500000,
        optimizedIntermediateWaypointIndices: [1, 0],
        path: [
          { lat: () => 37.7749, lng: () => -122.4194 },
          { lat: () => 37.8, lng: () => -122.4 },
        ],
      }],
    };

    const computeRoutes = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('google', buildGoogleMock(computeRoutes));

    const origin = { address: 'Home' };
    const stops = [makeStop('a'), makeStop('b')];
    const result = await computeRoute(origin, stops);

    expect(result).not.toBeNull();
    expect(result!.optimizedOrder).toEqual([1, 0]);
    expect(result!.totalDistanceMeters).toBe(5000);
    expect(result!.totalDurationSeconds).toBe(500);
    expect(result!.polylinePath).toEqual([
      { lat: 37.7749, lng: -122.4194 },
      { lat: 37.8, lng: -122.4 },
    ]);
  });

  it('throws RouteComputeError when Route.computeRoutes fails', async () => {
    const computeRoutes = vi.fn().mockRejectedValue(new Error('API quota exceeded'));
    vi.stubGlobal('google', buildGoogleMock(computeRoutes));

    await expect(computeRoute({ address: 'Home' }, [makeStop('a')]))
      .rejects
      .toMatchObject({
        name: 'RouteComputeError',
        code: 'routes-request-failed',
      });
  });

  it('uses route-level durationMillis for total duration seconds', async () => {
    const mockResponse = {
      routes: [{
        distanceMeters: 10000,
        durationMillis: 3600000,
        optimizedIntermediateWaypointIndices: [],
        path: [
          { lat: () => 37.7749, lng: () => -122.4194 },
        ],
      }],
    };

    const computeRoutes = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('google', buildGoogleMock(computeRoutes));

    const result = await computeRoute({ address: 'Home' }, [makeStop('a')]);
    expect(result!.totalDurationSeconds).toBe(3600);
  });
});
