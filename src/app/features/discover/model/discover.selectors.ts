import type { AppStore } from "@/app/store";
import { useStore } from "@/app/store";

export const selectDiscoverResults = (state: AppStore) => state.discoverResults;
export const selectSelectedDiscoverIds = (state: AppStore) => state.selectedDiscoverIds;
export const selectIsDrawing = (state: AppStore) => state.isDrawing;
export const selectDiscoverMode = (state: AppStore) => state.discoverMode;
export const selectHoveredDiscoverId = (state: AppStore) => state.hoveredDiscoverId;
export const selectSearchProgress = (state: AppStore) => state.searchProgress;
export const selectMarathonMode = (state: AppStore) => state.marathonMode;
export const selectMarathonZones = (state: AppStore) => state.marathonZones;
export const selectMarathonSearchCount = (state: AppStore) => state.marathonSearchCount;

export const selectSetDiscoverResults = (state: AppStore) => state.setDiscoverResults;
export const selectToggleDiscoverSelected = (state: AppStore) => state.toggleDiscoverSelected;
export const selectSelectAllDiscover = (state: AppStore) => state.selectAllDiscover;
export const selectSetIsDrawing = (state: AppStore) => state.setIsDrawing;
export const selectSetDiscoverMode = (state: AppStore) => state.setDiscoverMode;
export const selectSetHoveredDiscoverId = (state: AppStore) => state.setHoveredDiscoverId;
export const selectSetSearchProgress = (state: AppStore) => state.setSearchProgress;
export const selectClearDiscover = (state: AppStore) => state.clearDiscover;
export const selectToggleMarathonMode = (state: AppStore) => state.toggleMarathonMode;
export const selectAddMarathonZone = (state: AppStore) => state.addMarathonZone;
export const selectClearMarathonZone = (state: AppStore) => state.clearMarathonZone;
export const selectIncrementMarathonCount = (state: AppStore) => state.incrementMarathonCount;

export const useDiscoverResults = () => useStore(selectDiscoverResults);
export const useSelectedDiscoverIds = () => useStore(selectSelectedDiscoverIds);
export const useIsDrawing = () => useStore(selectIsDrawing);
export const useDiscoverMode = () => useStore(selectDiscoverMode);
export const useHoveredDiscoverId = () => useStore(selectHoveredDiscoverId);
export const useSearchProgress = () => useStore(selectSearchProgress);
export const useMarathonMode = () => useStore(selectMarathonMode);
export const useMarathonZones = () => useStore(selectMarathonZones);
export const useMarathonSearchCount = () => useStore(selectMarathonSearchCount);

export const useSetDiscoverResults = () => useStore(selectSetDiscoverResults);
export const useToggleDiscoverSelected = () => useStore(selectToggleDiscoverSelected);
export const useSelectAllDiscover = () => useStore(selectSelectAllDiscover);
export const useSetIsDrawing = () => useStore(selectSetIsDrawing);
export const useSetDiscoverMode = () => useStore(selectSetDiscoverMode);
export const useSetHoveredDiscoverId = () => useStore(selectSetHoveredDiscoverId);
export const useSetSearchProgress = () => useStore(selectSetSearchProgress);
export const useClearDiscover = () => useStore(selectClearDiscover);
export const useToggleMarathonMode = () => useStore(selectToggleMarathonMode);
export const useAddMarathonZone = () => useStore(selectAddMarathonZone);
export const useClearMarathonZone = () => useStore(selectClearMarathonZone);
export const useIncrementMarathonCount = () => useStore(selectIncrementMarathonCount);

