import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createPinsSlice } from "@/app/features/pins/model/pins.store";
import { createDiscoverSlice } from "@/app/features/discover/model/discover.store";
import { createRouteSlice } from "@/app/features/route/model/route.store";
import { createPlannerSlice } from "@/app/features/planner/model/planner.store";
import { createAuthSlice } from "@/app/features/auth/model/auth.store";
import {
  STORE_NAME,
  STORE_VERSION,
} from "@/app/shared/model/store-persist";
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
      name: STORE_NAME,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pins: state.pins,
        plannerDays: state.plannerDays,
        activePlannerDate: state.activePlannerDate,
        trackingEnabled: state.trackingEnabled,
      }),
      skipHydration: true,
      version: STORE_VERSION,
    }
  )
);
