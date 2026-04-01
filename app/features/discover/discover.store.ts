import type { StateCreator } from "zustand";
import type { DiscoverResult } from "@/app/types/discover.types";
import type { MarathonZone } from "@/app/types/discover.types";

export interface DiscoverSlice {
  discoverResults: DiscoverResult[];
  selectedDiscoverIds: Set<string>;
  isDrawing: boolean;
  drawBounds: { swLat: number; swLng: number; neLat: number; neLng: number } | null;
  marathonMode: boolean;
  marathonZones: MarathonZone[];
  marathonSearchCount: number;
  setDiscoverResults: (results: DiscoverResult[]) => void;
  setDrawBounds: (bounds: DiscoverSlice["drawBounds"]) => void;
  toggleDiscoverSelected: (placeId: string) => void;
  setIsDrawing: (drawing: boolean) => void;
  clearDiscover: () => void;
  toggleMarathonMode: () => void;
  addMarathonZone: (zone: MarathonZone) => void;
  clearMarathonZone: (zoneId: string) => void;
  resetMarathon: () => void;
  incrementMarathonCount: () => void;
}

export const createDiscoverSlice: StateCreator<DiscoverSlice> = (set) => ({
  discoverResults: [],
  selectedDiscoverIds: new Set(),
  isDrawing: false,
  drawBounds: null,
  marathonMode: false,
  marathonZones: [],
  marathonSearchCount: 0,
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
    set({
      discoverResults: [],
      selectedDiscoverIds: new Set(),
      drawBounds: null,
      isDrawing: false,
      marathonMode: false,
      marathonZones: [],
      marathonSearchCount: 0,
    }),
  toggleMarathonMode: () => set((s) => ({ marathonMode: !s.marathonMode })),
  addMarathonZone: (zone) => set((s) => ({ marathonZones: [...s.marathonZones, zone] })),
  clearMarathonZone: (zoneId) =>
    set((s) => ({
      marathonZones: s.marathonZones.filter((z) => z.id !== zoneId),
      marathonSearchCount: Math.max(0, s.marathonSearchCount - 1),
    })),
  resetMarathon: () => set({ marathonZones: [], marathonSearchCount: 0 }),
  incrementMarathonCount: () => set((s) => ({ marathonSearchCount: s.marathonSearchCount + 1 })),
});
