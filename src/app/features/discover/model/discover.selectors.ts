import type { AppStore } from "@/app/store";
import { useStore } from "@/app/store";
import { useShallow } from "zustand/shallow";

export const selectDiscoverResults = (state: AppStore) => state.discoverResults;
export const selectSelectedDiscoverIds = (state: AppStore) => state.selectedDiscoverIds;
export const selectIsDrawing = (state: AppStore) => state.isDrawing;
export const selectDiscoverMode = (state: AppStore) => state.discoverMode;
export const selectHoveredDiscoverId = (state: AppStore) => state.hoveredDiscoverId;
export const selectSearchProgress = (state: AppStore) => state.searchProgress;
export const selectMarathonMode = (state: AppStore) => state.marathonMode;
export const selectMarathonZones = (state: AppStore) => state.marathonZones;
export const selectMarathonSearchCount = (state: AppStore) => state.marathonSearchCount;

export const selectDiscoverActions = (state: AppStore) => ({
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
});

export const useDiscoverResults = () => useStore(selectDiscoverResults);
export const useSelectedDiscoverIds = () => useStore(selectSelectedDiscoverIds);
export const useIsDrawing = () => useStore(selectIsDrawing);
export const useDiscoverMode = () => useStore(selectDiscoverMode);
export const useHoveredDiscoverId = () => useStore(selectHoveredDiscoverId);
export const useSearchProgress = () => useStore(selectSearchProgress);
export const useMarathonMode = () => useStore(selectMarathonMode);
export const useMarathonZones = () => useStore(selectMarathonZones);
export const useMarathonSearchCount = () => useStore(selectMarathonSearchCount);

export const useDiscoverActions = () => useStore(useShallow(selectDiscoverActions));
