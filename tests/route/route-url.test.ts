import { describe, it, expect } from 'vitest';
// RED: route-url.ts does not exist yet — import will fail until Plan 02
import { buildGoogleMapsUrl } from '@/app/features/route/route-url';
import type { RouteStop } from '@/app/features/route/model/route.types';

const makeStop = (overrides: Partial<RouteStop> = {}): RouteStop => ({
  id: 'stop-1',
  label: 'Test Stop',
  address: '123 Main St',
  lat: 37.7749,
  lng: -122.4194,
  ...overrides,
});

describe('buildGoogleMapsUrl', () => {
  it('includes api=1, origin, and destination for 1-stop route', () => {
    const origin = makeStop({ id: 'origin', label: 'Home', address: 'Home Base' });
    const stops = [makeStop({ id: 'dest', label: 'Dest', address: '456 Oak Ave' })];
    const url = buildGoogleMapsUrl(origin, stops);
    expect(url).toContain('api=1');
    expect(url).toContain('origin=');
    expect(url).toContain('destination=');
    expect(url).toContain('travelmode=driving');
  });

  it('includes pipe-separated waypoints for 3-stop route', () => {
    const origin = makeStop({ id: 'o', address: 'Start' });
    const stops = [
      makeStop({ id: 'a', address: 'Stop A' }),
      makeStop({ id: 'b', address: 'Stop B' }),
      makeStop({ id: 'c', address: 'Stop C' }),
    ];
    const url = buildGoogleMapsUrl(origin, stops);
    // 2 intermediates (stops A and B) + destination (stop C)
    expect(url).toContain('waypoints=');
    // Both intermediate addresses present in URL
    expect(url).toContain('Stop%20A');
    expect(url).toContain('Stop%20B');
  });

  it('falls back to lat,lng when stop address is empty', () => {
    const origin = makeStop({ id: 'o', address: '' });
    const stops = [makeStop({ id: 'd', address: '', lat: 40.7128, lng: -74.006 })];
    const url = buildGoogleMapsUrl(origin, stops);
    expect(url).toContain('40.7128');
    expect(url).toContain('-74.006');
  });

  it('returns empty string when stops array is empty', () => {
    const origin = makeStop({ id: 'o', address: 'Home' });
    const url = buildGoogleMapsUrl(origin, []);
    expect(url).toBe('');
  });
});
