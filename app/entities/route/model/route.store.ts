import type { StateCreator } from "zustand";
import type { RouteStop, RouteResult } from "@/app/types/route.types";

export interface RouteSlice {
  routeStops: RouteStop[];
  routeResult: RouteResult | null;
  addStop: (stop: RouteStop) => void;
  removeStop: (id: string) => void;
  reorderStops: (orderedIndices: number[]) => void;
  setRouteResult: (result: RouteResult | null) => void;
  clearRoute: () => void;
}

export const createRouteSlice: StateCreator<RouteSlice> = (set) => ({
  routeStops: [],
  routeResult: null,
  addStop: (stop) => set((s) => ({ routeStops: [...s.routeStops, stop] })),
  removeStop: (id) => set((s) => ({ routeStops: s.routeStops.filter((stop) => stop.id !== id) })),
  reorderStops: (orderedIndices) =>
    set((s) => ({ routeStops: orderedIndices.map((i) => s.routeStops[i]) })),
  setRouteResult: (result) => set({ routeResult: result }),
  clearRoute: () => set({ routeStops: [], routeResult: null }),
});
