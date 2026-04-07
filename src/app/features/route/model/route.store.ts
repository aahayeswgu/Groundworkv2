import type { StateCreator } from "zustand";
import type { RouteStop, RouteResult, StartMode } from "@/app/features/route/model/route.types";

const MAX_STOPS = 25;

export interface RouteSlice {
  // State
  routeStops: RouteStop[];
  routeResult: RouteResult | null;
  routeActive: boolean;
  startMode: StartMode;
  customStartAddress: string;
  shareableUrl: string | null;

  // Stop management
  addStop: (stop: RouteStop) => boolean; // returns false if cap reached
  removeStop: (id: string) => void;
  reorderStops: (newStops: RouteStop[]) => void; // accepts full array (dnd-kit arrayMove output)
  clearRoute: () => void;

  // Result + state setters
  setRouteResult: (result: RouteResult | null) => void;
  setRouteActive: (active: boolean) => void;
  setStartMode: (mode: StartMode) => void;
  setCustomStartAddress: (address: string) => void;
  setShareableUrl: (url: string | null) => void;
}

export const createRouteSlice: StateCreator<RouteSlice> = (set, get) => ({
  routeStops: [],
  routeResult: null,
  routeActive: false,
  startMode: 'gps',
  customStartAddress: '',
  shareableUrl: null,

  addStop: (stop) => {
    const current = get().routeStops;
    if (current.length >= MAX_STOPS) return false;
    // Dedup by ID only — coordinate proximity was too aggressive
    if (current.some((s) => s.id === stop.id)) return true;
    set((s) => ({ routeStops: [...s.routeStops, stop] }));
    return true;
  },

  removeStop: (id) =>
    set((s) => ({ routeStops: s.routeStops.filter((stop) => stop.id !== id) })),

  reorderStops: (newStops) => set({ routeStops: newStops }),

  setRouteResult: (result) => set({ routeResult: result }),

  setRouteActive: (active) => set({ routeActive: active }),

  setStartMode: (mode) => set({ startMode: mode }),

  setCustomStartAddress: (address) => set({ customStartAddress: address }),

  setShareableUrl: (url) => set({ shareableUrl: url }),

  clearRoute: () => set({
    routeStops: [],
    routeResult: null,
    routeActive: false,
    shareableUrl: null,
  }),
});
