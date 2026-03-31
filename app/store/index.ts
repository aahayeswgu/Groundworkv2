import { create } from "zustand";
import { createPinsSlice } from "@/app/features/pins/pins.store";
import { createDiscoverSlice } from "@/app/features/discover/discover.store";
import { createRouteSlice } from "@/app/features/route/route.store";
import type { PinsSlice } from "@/app/features/pins/pins.store";
import type { DiscoverSlice } from "@/app/features/discover/discover.store";
import type { RouteSlice } from "@/app/features/route/route.store";

export type AppStore = PinsSlice & DiscoverSlice & RouteSlice;

export const useStore = create<AppStore>((...a) => ({
  ...createPinsSlice(...a),
  ...createDiscoverSlice(...a),
  ...createRouteSlice(...a),
}));
