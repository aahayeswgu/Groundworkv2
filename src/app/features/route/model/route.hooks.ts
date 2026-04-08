import { useStore } from "@/app/store";
import { useShallow } from "zustand/shallow";

export const useRouteStops = () => useStore((state) => state.routeStops);
export const useRouteResult = () => useStore((state) => state.routeResult);
export const useRouteActive = () => useStore((state) => state.routeActive);
export const useStartMode = () => useStore((state) => state.startMode);
export const useCustomStartAddress = () => useStore((state) => state.customStartAddress);
export const useShareableUrl = () => useStore((state) => state.shareableUrl);
export const useOptimizeRoute = () => useStore((state) => state.optimizeRoute);

export const useRouteActions = () =>
  useStore(
    useShallow((state) => ({
      addStop: state.addStop,
      removeStop: state.removeStop,
      reorderStops: state.reorderStops,
      clearRoute: state.clearRoute,
      setRouteResult: state.setRouteResult,
      setRouteActive: state.setRouteActive,
      setStartMode: state.setStartMode,
      setCustomStartAddress: state.setCustomStartAddress,
      setShareableUrl: state.setShareableUrl,
      setOptimizeRoute: state.setOptimizeRoute,
    })),
  );
