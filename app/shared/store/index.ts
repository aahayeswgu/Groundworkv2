import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createDiscoverSlice } from "@/app/entities/discover/model/discover.store";
import { createPinsSlice } from "@/app/entities/pin/model/pins.store";
import { createRouteSlice } from "@/app/entities/route/model/route.store";
import type { DiscoverSlice } from "@/app/entities/discover/model/discover.store";
import type { PinsSlice } from "@/app/entities/pin/model/pins.store";
import type { RouteSlice } from "@/app/entities/route/model/route.store";

export type AppStore = PinsSlice & DiscoverSlice & RouteSlice;

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createPinsSlice(...a),
      ...createDiscoverSlice(...a),
      ...createRouteSlice(...a),
    }),
    {
      name: "groundwork-pins-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ pins: state.pins }),
      skipHydration: true,
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) {
          const s = persisted as { pins?: Array<{ notes: unknown }> };
          s.pins?.forEach((p) => {
            if (typeof p.notes === "string") {
              p.notes = p.notes ? [{ text: p.notes, date: new Date().toISOString() }] : [];
            }
          });
        }
        return persisted as AppStore;
      },
    }
  )
);
