import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createPinsSlice } from "@/app/features/pins/model/pins.store";
import { createDiscoverSlice } from "@/app/features/discover/model/discover.store";
import { createRouteSlice } from "@/app/features/route/model/route.store";
import { createPlannerSlice } from "@/app/features/planner/model/planner.store";
import { createAuthSlice } from "@/app/features/auth/model/auth.store";
import type { PinsSlice } from "@/app/features/pins/model/pins.store";
import type { DiscoverSlice } from "@/app/features/discover/model/discover.store";
import type { RouteSlice } from "@/app/features/route/model/route.store";
import type { PlannerSlice } from "@/app/features/planner/model/planner.types";
import type { AuthSlice } from "@/app/features/auth/model/auth.store";

export type AppStore = PinsSlice & DiscoverSlice & RouteSlice & PlannerSlice & AuthSlice;

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createPinsSlice(...a),
      ...createDiscoverSlice(...a),
      ...createRouteSlice(...a),
      ...createPlannerSlice(...a),
      ...createAuthSlice(...a),
    }),
    {
      name: "groundwork-pins-v1",   // DO NOT change this name — would lose all pin data
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pins: state.pins,
        planner: {
          plannerDays: state.plannerDays,
          activePlannerDate: state.activePlannerDate,
          trackingEnabled: state.trackingEnabled,
        },
      }),
      skipHydration: true,
      version: 2,
      migrate: (persisted, version) => {
        if (version === 0) {
          const s = persisted as { pins?: Array<{ notes: unknown }> };
          s.pins?.forEach((p) => {
            if (typeof p.notes === "string") {
              p.notes = p.notes ? [{ text: p.notes, date: new Date().toISOString() }] : [];
            }
          });
        }
        if (version < 2) {
          // planner key didn't exist in v0 or v1 — initialize it
          const s = persisted as Record<string, unknown>;
          s.planner = {
            plannerDays: {},
            activePlannerDate: new Date().toISOString().slice(0, 10),
            trackingEnabled: true,
          };
        }
        return persisted as AppStore;
      },
    }
  )
);
