import type { AppStore } from "@/app/store";
import { useStore } from "@/app/store";
import { useShallow } from "zustand/shallow";

export const selectPlannerDays = (state: AppStore) => state.plannerDays;
export const selectActivePlannerDate = (state: AppStore) => state.activePlannerDate;
export const selectTrackingEnabled = (state: AppStore) => state.trackingEnabled;
export const selectActiveNotesPage = (state: AppStore) => state.activeNotesPage;
export const selectCalendarOpen = (state: AppStore) => state.calendarOpen;
export const selectMonthViewOpen = (state: AppStore) => state.monthViewOpen;

export const selectPlannerActions = (state: AppStore) => ({
  setActivePlannerDate: state.setActivePlannerDate,
  addPlannerStop: state.addPlannerStop,
  removePlannerStop: state.removePlannerStop,
  setPlannerStopStatus: state.setPlannerStopStatus,
  addNotesPage: state.addNotesPage,
  deleteNotesPage: state.deleteNotesPage,
  setNotesPage: state.setNotesPage,
  setActiveNotesPage: state.setActiveNotesPage,
  addActivityEntry: state.addActivityEntry,
  setTrackingEnabled: state.setTrackingEnabled,
  setCalendarOpen: state.setCalendarOpen,
  setMonthViewOpen: state.setMonthViewOpen,
});

export const usePlannerDays = () => useStore(selectPlannerDays);
export const useActivePlannerDate = () => useStore(selectActivePlannerDate);
export const useTrackingEnabled = () => useStore(selectTrackingEnabled);
export const useActiveNotesPage = () => useStore(selectActiveNotesPage);
export const useCalendarOpen = () => useStore(selectCalendarOpen);
export const useMonthViewOpen = () => useStore(selectMonthViewOpen);

export const usePlannerActions = () => useStore(useShallow(selectPlannerActions));
