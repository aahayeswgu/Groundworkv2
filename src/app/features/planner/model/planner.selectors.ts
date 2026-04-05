import type { AppStore } from "@/app/store";
import { useStore } from "@/app/store";

export const selectPlannerDays = (state: AppStore) => state.plannerDays;
export const selectActivePlannerDate = (state: AppStore) => state.activePlannerDate;
export const selectTrackingEnabled = (state: AppStore) => state.trackingEnabled;
export const selectActiveNotesPage = (state: AppStore) => state.activeNotesPage;
export const selectCalendarOpen = (state: AppStore) => state.calendarOpen;
export const selectMonthViewOpen = (state: AppStore) => state.monthViewOpen;

export const selectSetActivePlannerDate = (state: AppStore) => state.setActivePlannerDate;
export const selectAddPlannerStop = (state: AppStore) => state.addPlannerStop;
export const selectRemovePlannerStop = (state: AppStore) => state.removePlannerStop;
export const selectSetPlannerStopStatus = (state: AppStore) => state.setPlannerStopStatus;
export const selectAddNotesPage = (state: AppStore) => state.addNotesPage;
export const selectDeleteNotesPage = (state: AppStore) => state.deleteNotesPage;
export const selectSetNotesPage = (state: AppStore) => state.setNotesPage;
export const selectSetActiveNotesPage = (state: AppStore) => state.setActiveNotesPage;
export const selectAddActivityEntry = (state: AppStore) => state.addActivityEntry;
export const selectSetTrackingEnabled = (state: AppStore) => state.setTrackingEnabled;
export const selectSetCalendarOpen = (state: AppStore) => state.setCalendarOpen;
export const selectSetMonthViewOpen = (state: AppStore) => state.setMonthViewOpen;

export const usePlannerDays = () => useStore(selectPlannerDays);
export const useActivePlannerDate = () => useStore(selectActivePlannerDate);
export const useTrackingEnabled = () => useStore(selectTrackingEnabled);
export const useActiveNotesPage = () => useStore(selectActiveNotesPage);
export const useCalendarOpen = () => useStore(selectCalendarOpen);
export const useMonthViewOpen = () => useStore(selectMonthViewOpen);

export const useSetActivePlannerDate = () => useStore(selectSetActivePlannerDate);
export const useAddPlannerStop = () => useStore(selectAddPlannerStop);
export const useRemovePlannerStop = () => useStore(selectRemovePlannerStop);
export const useSetPlannerStopStatus = () => useStore(selectSetPlannerStopStatus);
export const useAddNotesPage = () => useStore(selectAddNotesPage);
export const useDeleteNotesPage = () => useStore(selectDeleteNotesPage);
export const useSetNotesPage = () => useStore(selectSetNotesPage);
export const useSetActiveNotesPage = () => useStore(selectSetActiveNotesPage);
export const useAddActivityEntry = () => useStore(selectAddActivityEntry);
export const useSetTrackingEnabled = () => useStore(selectSetTrackingEnabled);
export const useSetCalendarOpen = () => useStore(selectSetCalendarOpen);
export const useSetMonthViewOpen = () => useStore(selectSetMonthViewOpen);

