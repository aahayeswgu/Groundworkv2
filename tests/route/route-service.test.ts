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

function buildGoogleMock(directionsServiceImpl: unknown) {
  return {
    maps: {
      DirectionsService: directionsServiceImpl,
      LatLng: FakeLatLng,
      TravelMode: { DRIVING: 'DRIVING' },
    },
  };
}

describe('computeRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns RouteResult with optimizedOrder from DirectionsService', async () => {
    const mockResponse = {
      routes: [{
        legs: [
          { distance: { value: 3000 }, duration: { value: 300 } },
          { distance: { value: 2000 }, duration: { value: 200 } },
        ],
        waypoint_order: [1, 0],
        overview_path: [
          { lat: () => 37.7749, lng: () => -122.4194 },
          { lat: () => 37.8, lng: () => -122.4 },
        ],
      }],
    } as unknown as google.maps.DirectionsResult;

    const FakeDS = vi.fn(function () {
      return { route: vi.fn().mockResolvedValue(mockResponse) };
    });
    vi.stubGlobal('google', buildGoogleMock(FakeDS));

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

  it('returns null when DirectionsService.route throws', async () => {
    const FakeDS = vi.fn(function () {
      return { route: vi.fn().mockRejectedValue(new Error('API quota exceeded')) };
    });
    vi.stubGlobal('google', buildGoogleMock(FakeDS));

    const result = await computeRoute({ address: 'Home' }, [makeStop('a')]);
    expect(result).toBeNull();
  });

  it('sums duration across all legs correctly', async () => {
    const mockResponse = {
      routes: [{
        legs: [
          { distance: { value: 5000 }, duration: { value: 1800 } },
          { distance: { value: 5000 }, duration: { value: 1800 } },
        ],
        waypoint_order: [],
        overview_path: [
          { lat: () => 37.7749, lng: () => -122.4194 },
        ],
      }],
    } as unknown as google.maps.DirectionsResult;

    const FakeDS = vi.fn(function () {
      return { route: vi.fn().mockResolvedValue(mockResponse) };
    });
    vi.stubGlobal('google', buildGoogleMock(FakeDS));

    const result = await computeRoute({ address: 'Home' }, [makeStop('a')]);
    expect(result!.totalDurationSeconds).toBe(3600);
  });
});
