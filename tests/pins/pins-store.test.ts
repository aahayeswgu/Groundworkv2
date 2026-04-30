import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createPinsSlice, type PinsSlice } from '@/app/features/pins/model/pins.store';
import type { Pin } from '@/app/features/pins/model/pin.types';

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

describe('PinsSlice tombstones', () => {
  it('deletePin removes pin from list and records tombstone', () => {
    const useTestStore = create<PinsSlice>()(createPinsSlice);
    useTestStore.setState({
      pins: [makePin({ id: 'a' }), makePin({ id: 'b' })],
      deletedPinIds: [],
    });

    useTestStore.getState().deletePin('a');

    const state = useTestStore.getState();
    expect(state.pins.map((p) => p.id)).toEqual(['b']);
    expect(state.deletedPinIds).toEqual(['a']);
  });

  it('deletePin is idempotent: deleting same id twice does not duplicate tombstone', () => {
    const useTestStore = create<PinsSlice>()(createPinsSlice);
    useTestStore.setState({
      pins: [makePin({ id: 'a' })],
      deletedPinIds: ['a'],
    });

    useTestStore.getState().deletePin('a');

    expect(useTestStore.getState().deletedPinIds).toEqual(['a']);
  });

  it('deletePin appends to existing tombstone queue', () => {
    const useTestStore = create<PinsSlice>()(createPinsSlice);
    useTestStore.setState({
      pins: [makePin({ id: 'a' }), makePin({ id: 'b' })],
      deletedPinIds: ['old-pin'],
    });

    useTestStore.getState().deletePin('a');
    useTestStore.getState().deletePin('b');

    expect(useTestStore.getState().deletedPinIds).toEqual(['old-pin', 'a', 'b']);
  });

  it('initial deletedPinIds is empty', () => {
    const useTestStore = create<PinsSlice>()(createPinsSlice);
    expect(useTestStore.getState().deletedPinIds).toEqual([]);
  });
});
