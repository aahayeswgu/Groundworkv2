import { describe, it, expect } from 'vitest';
import { mergePins } from '@/app/features/pins/sync/merge';
import type { Pin } from '@/app/types/pins.types';
import type { RemotePin } from '@/app/features/pins/sync/merge';

const makePin = (overrides: Partial<Pin> = {}): Pin => ({
  id: 'pin-1',
  title: 'Test Pin',
  address: '123 Main St',
  status: 'prospect',
  lat: 40.7128,
  lng: -74.0060,
  contact: '',
  phone: '',
  followUpDate: '',
  notes: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeRemote = (overrides: Partial<RemotePin> = {}): RemotePin => ({
  id: 'pin-1',
  title: 'Test Pin',
  address: '123 Main St',
  status: 'prospect',
  lat: 40.7128,
  lng: -74.0060,
  contact: '',
  phone: '',
  follow_up_date: '',
  notes: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
  ...overrides,
});

describe('mergePins', () => {
  it('local newer wins: keeps local when local updatedAt is later', () => {
    const local = makePin({ updatedAt: '2026-03-02T00:00:00.000Z', title: 'Local Title' });
    const remote = makeRemote({ updated_at: '2026-03-01T00:00:00.000Z', title: 'Remote Title' });

    const result = mergePins([local], [remote]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Local Title');
  });

  it('remote newer wins: replaces local when remote updated_at is later', () => {
    const local = makePin({ updatedAt: '2026-03-01T00:00:00.000Z', title: 'Local Title' });
    const remote = makeRemote({ updated_at: '2026-03-02T00:00:00.000Z', title: 'Remote Title' });

    const result = mergePins([local], [remote]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Remote Title');
  });

  it('remote only: adds remote pin when not present locally', () => {
    const remote = makeRemote({ id: 'new-pin', title: 'New Remote Pin', deleted_at: null });

    const result = mergePins([], [remote]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('new-pin');
  });

  it('local only: keeps local pin when not present remotely', () => {
    const local = makePin({ id: 'local-only' });

    const result = mergePins([local], []);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('local-only');
  });

  it('soft-delete newer: removes pin when remote deleted_at is newer than local updatedAt', () => {
    const local = makePin({ updatedAt: '2026-03-01T00:00:00.000Z' });
    const remote = makeRemote({
      updated_at: '2026-03-02T00:00:00.000Z',
      deleted_at: '2026-03-02T00:00:00.000Z',
    });

    const result = mergePins([local], [remote]);

    expect(result).toHaveLength(0);
  });

  it('soft-delete older: keeps local pin when remote deleted_at is older than local updatedAt', () => {
    const local = makePin({ updatedAt: '2026-03-02T00:00:00.000Z', title: 'Saved Local Edit' });
    const remote = makeRemote({
      updated_at: '2026-03-01T00:00:00.000Z',
      deleted_at: '2026-03-01T00:00:00.000Z',
    });

    const result = mergePins([local], [remote]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Saved Local Edit');
  });

  it('soft-delete no local: omits deleted remote pin that has no local counterpart', () => {
    const remote = makeRemote({
      id: 'ghost-pin',
      deleted_at: '2026-03-01T00:00:00.000Z',
      updated_at: '2026-03-01T00:00:00.000Z',
    });

    const result = mergePins([], [remote]);

    expect(result).toHaveLength(0);
  });
});
