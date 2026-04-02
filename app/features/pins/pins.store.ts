import type { StateCreator } from "zustand";
import type { Pin, PinStatus } from "@/app/features/pins/model/pin.types";

export interface PinsSlice {
  pins: Pin[];
  selectedPinId: string | null;
  selectedPinNonce: number;
  hoveredPinId: string | null;
  activeStatusFilter: Set<PinStatus>;
  pinsVisible: boolean;
  addPin: (pin: Pin) => void;
  updatePin: (id: string, patch: Partial<Pin>) => void;
  deletePin: (id: string) => void;
  selectPin: (id: string | null) => void;
  focusPin: (id: string) => void;
  hoverPin: (id: string | null) => void;
  setActiveStatusFilter: (statuses: Set<PinStatus>) => void;
  togglePinVisibility: () => void;
}

export const createPinsSlice: StateCreator<PinsSlice> = (set) => ({
  pins: [],
  selectedPinId: null,
  selectedPinNonce: 0,
  hoveredPinId: null,
  activeStatusFilter: new Set<PinStatus>(["prospect", "active", "follow-up", "lost"]),
  pinsVisible: true,
  addPin: (pin) => set((s) => ({ pins: [...s.pins, pin] })),
  updatePin: (id, patch) =>
    set((s) => ({ pins: s.pins.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  deletePin: (id) => set((s) => ({ pins: s.pins.filter((p) => p.id !== id) })),
  selectPin: (id) => set({ selectedPinId: id }),
  focusPin: (id) => set((s) => ({ selectedPinId: id, selectedPinNonce: s.selectedPinNonce + 1 })),
  hoverPin: (id) => set({ hoveredPinId: id }),
  setActiveStatusFilter: (statuses) => set({ activeStatusFilter: statuses }),
  togglePinVisibility: () => set((s) => ({ pinsVisible: !s.pinsVisible })),
});
