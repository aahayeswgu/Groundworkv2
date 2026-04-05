import type { AppStore } from "@/app/store";
import { useStore } from "@/app/store";
import { useShallow } from "zustand/shallow";

export const selectRouteStops = (state: AppStore) => state.routeStops;
export const selectRouteResult = (state: AppStore) => state.routeResult;
export const selectRouteActive = (state: AppStore) => state.routeActive;
export const selectStartMode = (state: AppStore) => state.startMode;
export const selectCustomStartAddress = (state: AppStore) => state.customStartAddress;
export const selectShareableUrl = (state: AppStore) => state.shareableUrl;

export const selectRouteActions = (state: AppStore) => ({
  addStop: state.addStop,
  removeStop: state.removeStop,
  reorderStops: state.reorderStops,
  clearRoute: state.clearRoute,
  setRouteResult: state.setRouteResult,
  setRouteActive: state.setRouteActive,
  setStartMode: state.setStartMode,
  setCustomStartAddress: state.setCustomStartAddress,
  setShareableUrl: state.setShareableUrl,
});

export const useRouteStops = () => useStore(selectRouteStops);
export const useRouteResult = () => useStore(selectRouteResult);
export const useRouteActive = () => useStore(selectRouteActive);
export const useStartMode = () => useStore(selectStartMode);
export const useCustomStartAddress = () => useStore(selectCustomStartAddress);
export const useShareableUrl = () => useStore(selectShareableUrl);

export const useRouteActions = () => useStore(useShallow(selectRouteActions));
