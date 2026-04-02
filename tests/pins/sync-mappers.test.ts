import { describe, it, expect } from 'vitest';
import { localToRemote, remoteToLocal } from '@/app/features/pins/sync/merge';
import type { Pin } from '@/app/types/pins.types';
import type { RemotePin } from '@/app/features/pins/sync/merge';

const basePin: Pin = {
  id: 'pin-abc',
  title: 'Acme Corp',
  address: '456 Oak Ave',
  status: 'active',
  lat: 34.0522,
  lng: -118.2437,
  contact: 'Jane Doe',
  phone: '555-1234',
  followUpDate: '2026-04-15',
  notes: [{ text: 'Initial meeting', date: '2026-03-01T00:00:00.000Z' }],
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-15T00:00:00.000Z',
};

const baseRemote: RemotePin = {
  id: 'pin-abc',
  title: 'Acme Corp',
  address: '456 Oak Ave',
  status: 'active',
  lat: 34.0522,
  lng: -118.2437,
  contact: 'Jane Doe',
  phone: '555-1234',
  follow_up_date: '2026-04-15',
  notes: [{ text: 'Initial meeting', date: '2026-03-01T00:00:00.000Z' }],
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-15T00:00:00.000Z',
  deleted_at: null,
};

describe('localToRemote', () => {
  it('maps followUpDate to follow_up_date', () => {
    const remote = localToRemote(basePin);
    expect(remote.follow_up_date).toBe('2026-04-15');
  });

  it('does not include a followUpDate key', () => {
    const remote = localToRemote(basePin);
    expect(remote).not.toHaveProperty('followUpDate');
  });

  it('maps createdAt to created_at', () => {
    const remote = localToRemote(basePin);
    expect(remote.created_at).toBe('2026-03-01T00:00:00.000Z');
  });

  it('maps updatedAt to updated_at', () => {
    const remote = localToRemote(basePin);
    expect(remote.updated_at).toBe('2026-03-15T00:00:00.000Z');
  });

  it('sets deleted_at to null for active pins', () => {
    const remote = localToRemote(basePin);
    expect(remote.deleted_at).toBeNull();
  });
});

describe('remoteToLocal', () => {
  it('maps follow_up_date to followUpDate', () => {
    const local = remoteToLocal(baseRemote);
    expect(local.followUpDate).toBe('2026-04-15');
  });

  it('does not include a follow_up_date key', () => {
    const local = remoteToLocal(baseRemote);
    expect(local).not.toHaveProperty('follow_up_date');
  });

  it('maps created_at to createdAt', () => {
    const local = remoteToLocal(baseRemote);
    expect(local.createdAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('maps updated_at to updatedAt', () => {
    const local = remoteToLocal(baseRemote);
    expect(local.updatedAt).toBe('2026-03-15T00:00:00.000Z');
  });

  it('round-trip: remoteToLocal(localToRemote(pin)) deep-equals original pin', () => {
    const remote = localToRemote(basePin);
    const backToLocal = remoteToLocal(remote);
    expect(backToLocal).toEqual(basePin);
  });
});
