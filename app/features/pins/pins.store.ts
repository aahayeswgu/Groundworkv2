import type { StateCreator } from "zustand";
import type { Pin } from "@/app/types/pins.types";

export interface PinsSlice {
  pins: Pin[];
  selectedPinId: string | null;
  hoveredPinId: string | null;
  addPin: (pin: Pin) => void;
  updatePin: (id: string, patch: Partial<Pin>) => void;
  deletePin: (id: string) => void;
  selectPin: (id: string | null) => void;
  hoverPin: (id: string | null) => void;
}

export const createPinsSlice: StateCreator<PinsSlice> = (set) => ({
  pins: [],
  selectedPinId: null,
  hoveredPinId: null,
  addPin: (pin) => set((s) => ({ pins: [...s.pins, pin] })),
  updatePin: (id, patch) =>
    set((s) => ({ pins: s.pins.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  deletePin: (id) => set((s) => ({ pins: s.pins.filter((p) => p.id !== id) })),
  selectPin: (id) => set({ selectedPinId: id }),
  hoverPin: (id) => set({ hoveredPinId: id }),
});
