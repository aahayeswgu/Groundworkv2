import type { StateCreator } from "zustand";
import type { DiscoverResult } from "@/app/types/discover.types";

export interface DiscoverSlice {
  discoverResults: DiscoverResult[];
  selectedDiscoverIds: Set<string>;
  isDrawing: boolean;
  drawBounds: { swLat: number; swLng: number; neLat: number; neLng: number } | null;
  discoverMode: boolean;
  searchProgress: string;
  setDiscoverResults: (results: DiscoverResult[]) => void;
  setDrawBounds: (bounds: DiscoverSlice["drawBounds"]) => void;
  toggleDiscoverSelected: (placeId: string) => void;
  setIsDrawing: (drawing: boolean) => void;
  clearDiscover: () => void;
  setDiscoverMode: (active: boolean) => void;
  setSearchProgress: (msg: string) => void;
  selectAllDiscover: () => void;
}

export const createDiscoverSlice: StateCreator<DiscoverSlice> = (set) => ({
  discoverResults: [],
  selectedDiscoverIds: new Set(),
  isDrawing: false,
  drawBounds: null,
  discoverMode: false,
  searchProgress: '',
  setDiscoverResults: (results) => set({ discoverResults: results }),
  setDrawBounds: (bounds) => set({ drawBounds: bounds }),
  toggleDiscoverSelected: (placeId) =>
    set((s) => {
      const next = new Set(s.selectedDiscoverIds);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return { selectedDiscoverIds: next };
    }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  clearDiscover: () =>
    set({ discoverResults: [], selectedDiscoverIds: new Set(), drawBounds: null, isDrawing: false, discoverMode: false, searchProgress: '' }),
  setDiscoverMode: (active) => set({ discoverMode: active }),
  setSearchProgress: (msg) => set({ searchProgress: msg }),
  selectAllDiscover: () =>
    set((s) => {
      const max = Math.min(s.discoverResults.length, 20);
      const next = new Set(s.discoverResults.slice(0, max).map((r) => r.placeId));
      return { selectedDiscoverIds: next };
    }),
});
