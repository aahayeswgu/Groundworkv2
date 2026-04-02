import { describe, it, expect } from 'vitest';
// RED: route.store.ts exists as skeleton but createRouteSlice may not export correctly yet
import { createRouteSlice } from '@/app/features/route/route.store';
import type { RouteStop } from '@/app/types/route.types';

// Build a minimal store around just the RouteSlice for testing
function makeStore() {
  const get = () => store;
  const set = (updater: ((s: typeof store) => Partial<typeof store>) | Partial<typeof store>) => {
    if (typeof updater === 'function') {
      Object.assign(store, updater(store));
    } else {
      Object.assign(store, updater);
    }
  };
  // @ts-expect-error minimal StateCreator test harness
  const store = createRouteSlice(set, get, {} as never);
  return store;
}

const makeStop = (id: string): RouteStop => ({
  id,
  label: `Stop ${id}`,
  address: '123 Main St',
  lat: 37.7749,
  lng: -122.4194,
});

describe('RouteSlice addStop', () => {
  it('adds a stop and returns true when under the 25-stop cap', () => {
    const store = makeStore();
    const result = store.addStop(makeStop('a'));
    expect(result).toBe(true);
    expect(store.routeStops).toHaveLength(1);
  });

  it('returns false and does NOT add when at cap (25 stops)', () => {
    const store = makeStore();
    // Fill to cap
    for (let i = 0; i < 25; i++) {
      store.addStop(makeStop(`stop-${i}`));
    }
    expect(store.routeStops).toHaveLength(25);
    const result = store.addStop(makeStop('overflow'));
    expect(result).toBe(false);
    expect(store.routeStops).toHaveLength(25);
  });
});

describe('RouteSlice clearRoute', () => {
  it('resets routeStops, routeResult, routeActive, shareableUrl', () => {
    const store = makeStore();
    store.addStop(makeStop('a'));
    store.setRouteActive(true);
    store.setShareableUrl('https://maps.google.com/test');
    store.clearRoute();
    expect(store.routeStops).toHaveLength(0);
    expect(store.routeResult).toBeNull();
    expect(store.routeActive).toBe(false);
    expect(store.shareableUrl).toBeNull();
  });

  it('does NOT reset startMode or customStartAddress on clearRoute', () => {
    const store = makeStore();
    store.setStartMode('custom');
    store.setCustomStartAddress('123 Home Ave');
    store.clearRoute();
    expect(store.startMode).toBe('custom');
    expect(store.customStartAddress).toBe('123 Home Ave');
  });
});
