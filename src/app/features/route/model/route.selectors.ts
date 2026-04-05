import type { AppStore } from "@/app/store";
import { useStore } from "@/app/store";

export const selectRouteStops = (state: AppStore) => state.routeStops;
export const selectRouteResult = (state: AppStore) => state.routeResult;
export const selectRouteActive = (state: AppStore) => state.routeActive;
export const selectStartMode = (state: AppStore) => state.startMode;
export const selectCustomStartAddress = (state: AppStore) => state.customStartAddress;
export const selectShareableUrl = (state: AppStore) => state.shareableUrl;

export const selectAddStop = (state: AppStore) => state.addStop;
export const selectRemoveStop = (state: AppStore) => state.removeStop;
export const selectReorderStops = (state: AppStore) => state.reorderStops;
export const selectClearRoute = (state: AppStore) => state.clearRoute;
export const selectSetRouteResult = (state: AppStore) => state.setRouteResult;
export const selectSetRouteActive = (state: AppStore) => state.setRouteActive;
export const selectSetStartMode = (state: AppStore) => state.setStartMode;
export const selectSetCustomStartAddress = (state: AppStore) => state.setCustomStartAddress;
export const selectSetShareableUrl = (state: AppStore) => state.setShareableUrl;

export const useRouteStops = () => useStore(selectRouteStops);
export const useRouteResult = () => useStore(selectRouteResult);
export const useRouteActive = () => useStore(selectRouteActive);
export const useStartMode = () => useStore(selectStartMode);
export const useCustomStartAddress = () => useStore(selectCustomStartAddress);
export const useShareableUrl = () => useStore(selectShareableUrl);

export const useAddStop = () => useStore(selectAddStop);
export const useRemoveStop = () => useStore(selectRemoveStop);
export const useReorderStops = () => useStore(selectReorderStops);
export const useClearRoute = () => useStore(selectClearRoute);
export const useSetRouteResult = () => useStore(selectSetRouteResult);
export const useSetRouteActive = () => useStore(selectSetRouteActive);
export const useSetStartMode = () => useStore(selectSetStartMode);
export const useSetCustomStartAddress = () => useStore(selectSetCustomStartAddress);
export const useSetShareableUrl = () => useStore(selectSetShareableUrl);

