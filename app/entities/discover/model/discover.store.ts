import type { StateCreator } from "zustand";
import type { DiscoverResult } from "@/app/types/discover.types";

export interface DiscoverSlice {
  discoverResults: DiscoverResult[];
  selectedDiscoverIds: Set<string>;
  isDrawing: boolean;
  drawBounds: { swLat: number; swLng: number; neLat: number; neLng: number } | null;
  setDiscoverResults: (results: DiscoverResult[]) => void;
  setDrawBounds: (bounds: DiscoverSlice["drawBounds"]) => void;
  toggleDiscoverSelected: (placeId: string) => void;
  setIsDrawing: (drawing: boolean) => void;
  clearDiscover: () => void;
}

export const createDiscoverSlice: StateCreator<DiscoverSlice> = (set) => ({
  discoverResults: [],
  selectedDiscoverIds: new Set(),
  isDrawing: false,
  drawBounds: null,
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
    set({ discoverResults: [], selectedDiscoverIds: new Set(), drawBounds: null, isDrawing: false }),
});
