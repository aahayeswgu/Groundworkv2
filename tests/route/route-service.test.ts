import { describe, it, expect, vi, beforeEach } from 'vitest';
// RED: route-service.ts does not exist yet
import { computeRoute } from '@/app/features/route/route-service';
import type { RouteStop } from '@/app/types/route.types';

// Mock google.maps global — not available in test environment
vi.stubGlobal('google', {
  maps: {
    importLibrary: vi.fn(),
  },
});

const makeStop = (id: string): RouteStop => ({
  id,
  label: `Stop ${id}`,
  address: '123 Main St',
  lat: 37.7749,
  lng: -122.4194,
});

describe('computeRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns RouteResult with optimizedOrder from Route.computeRoutes', async () => {
    const mockRoute = {
      computeRoutes: vi.fn().mockResolvedValue({
        routes: [{
          distanceMeters: 5000,
          duration: '600s',
          optimizedIntermediateWaypointIndices: [1, 0],
          path: [{ lat: 37.7749, lng: -122.4194 }, { lat: 37.8, lng: -122.4 }],
        }],
      }),
    };
    const MockRoute = vi.fn(() => mockRoute);
    vi.mocked(google.maps.importLibrary).mockResolvedValue({ Route: MockRoute } as never);

    const origin = { address: 'Home' };
    const stops = [makeStop('a'), makeStop('b')];
    const result = await computeRoute(origin, stops);

    expect(result).not.toBeNull();
    expect(result!.optimizedOrder).toEqual([1, 0]);
    expect(result!.totalDistanceMeters).toBe(5000);
  });

  it('returns null when Route.computeRoutes throws', async () => {
    const mockRoute = {
      computeRoutes: vi.fn().mockRejectedValue(new Error('API quota exceeded')),
    };
    const MockRoute = vi.fn(() => mockRoute);
    vi.mocked(google.maps.importLibrary).mockResolvedValue({ Route: MockRoute } as never);

    const result = await computeRoute({ address: 'Home' }, [makeStop('a')]);
    expect(result).toBeNull();
  });

  it('parses duration string "3600s" to integer 3600', async () => {
    const mockRoute = {
      computeRoutes: vi.fn().mockResolvedValue({
        routes: [{
          distanceMeters: 10000,
          duration: '3600s',
          optimizedIntermediateWaypointIndices: [],
          path: [{ lat: 37.7749, lng: -122.4194 }],
        }],
      }),
    };
    const MockRoute = vi.fn(() => mockRoute);
    vi.mocked(google.maps.importLibrary).mockResolvedValue({ Route: MockRoute } as never);

    const result = await computeRoute({ address: 'Home' }, [makeStop('a')]);
    expect(result!.totalDurationSeconds).toBe(3600);
  });
});
