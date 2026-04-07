import { useStore } from "@/app/store";
import { useShallow } from "zustand/shallow";

export const useDiscoverResults = () => useStore((state) => state.discoverResults);
export const useSelectedDiscoverIds = () => useStore((state) => state.selectedDiscoverIds);
export const useIsDrawing = () => useStore((state) => state.isDrawing);
export const useDiscoverMode = () => useStore((state) => state.discoverMode);
export const useHoveredDiscoverId = () => useStore((state) => state.hoveredDiscoverId);
export const useSearchProgress = () => useStore((state) => state.searchProgress);
export const useMarathonMode = () => useStore((state) => state.marathonMode);
export const useMarathonZones = () => useStore((state) => state.marathonZones);
export const useMarathonSearchCount = () => useStore((state) => state.marathonSearchCount);

export const useDiscoverActions = () =>
  useStore(
    useShallow((state) => ({
      setDiscoverResults: state.setDiscoverResults,
      toggleDiscoverSelected: state.toggleDiscoverSelected,
      selectAllDiscover: state.selectAllDiscover,
      setIsDrawing: state.setIsDrawing,
      setDiscoverMode: state.setDiscoverMode,
      setHoveredDiscoverId: state.setHoveredDiscoverId,
      setSearchProgress: state.setSearchProgress,
      clearDiscover: state.clearDiscover,
      toggleMarathonMode: state.toggleMarathonMode,
      addMarathonZone: state.addMarathonZone,
      clearMarathonZone: state.clearMarathonZone,
      incrementMarathonCount: state.incrementMarathonCount,
    })),
  );

