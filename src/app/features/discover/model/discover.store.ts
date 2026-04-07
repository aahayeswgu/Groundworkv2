import type { StateCreator } from "zustand";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import type { MarathonZone } from "@/app/features/discover/model/discover.types";
import type { DiscoverSearchMetrics } from "@/app/features/discover/model/discover.types";

export interface DiscoverSlice {
  discoverResults: DiscoverResult[];
  selectedDiscoverIds: Set<string>;
  isDrawing: boolean;
  drawBounds: { swLat: number; swLng: number; neLat: number; neLng: number } | null;
  discoverMode: boolean;
  hoveredDiscoverId: string | null;
  searchProgress: string | null;
  discoverSearchMetrics: DiscoverSearchMetrics | null;
  marathonMode: boolean;
  marathonZones: MarathonZone[];
  marathonSearchCount: number;
  setDiscoverResults: (results: DiscoverResult[]) => void;
  setDrawBounds: (bounds: DiscoverSlice["drawBounds"]) => void;
  toggleDiscoverSelected: (placeId: string) => void;
  selectAllDiscover: () => void;
  setIsDrawing: (drawing: boolean) => void;
  setDiscoverMode: (mode: boolean) => void;
  setHoveredDiscoverId: (id: string | null) => void;
  setSearchProgress: (progress: string | null) => void;
  setDiscoverSearchMetrics: (metrics: DiscoverSearchMetrics | null) => void;
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
  discoverMode: false,
  hoveredDiscoverId: null,
  searchProgress: null,
  discoverSearchMetrics: null,
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
  selectAllDiscover: () =>
    set((s) => {
      const selectable = s.discoverResults.slice(0, 20);
      const allSelected = s.selectedDiscoverIds.size === selectable.length && selectable.length > 0;
      return { selectedDiscoverIds: allSelected ? new Set() : new Set(selectable.map((r) => r.placeId)) };
    }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setDiscoverMode: (mode) => set({ discoverMode: mode }),
  setHoveredDiscoverId: (id) => set({ hoveredDiscoverId: id }),
  setSearchProgress: (progress) => set({ searchProgress: progress }),
  setDiscoverSearchMetrics: (metrics) => set({ discoverSearchMetrics: metrics }),
  clearDiscover: () =>
    set({
      discoverResults: [],
      selectedDiscoverIds: new Set(),
      drawBounds: null,
      isDrawing: false,
      discoverMode: false,
      searchProgress: null,
      discoverSearchMetrics: null,
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
