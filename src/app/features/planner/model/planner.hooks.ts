import { useStore } from "@/app/store";
import { useShallow } from "zustand/shallow";

export const usePlannerDays = () => useStore((state) => state.plannerDays);
export const useActivePlannerDate = () => useStore((state) => state.activePlannerDate);
export const useTrackingEnabled = () => useStore((state) => state.trackingEnabled);
export const useMapsProvider = () => useStore((state) => state.mapsProvider);
export const useActiveNotesPage = () => useStore((state) => state.activeNotesPage);
export const useCalendarOpen = () => useStore((state) => state.calendarOpen);
export const useMonthViewOpen = () => useStore((state) => state.monthViewOpen);

export const usePlannerActions = () =>
  useStore(
    useShallow((state) => ({
      setActivePlannerDate: state.setActivePlannerDate,
      addPlannerStop: state.addPlannerStop,
      removePlannerStop: state.removePlannerStop,
      setPlannerStopStatus: state.setPlannerStopStatus,
      addNotesPage: state.addNotesPage,
      deleteNotesPage: state.deleteNotesPage,
      setNotesPage: state.setNotesPage,
      setActiveNotesPage: state.setActiveNotesPage,
      addActivityEntry: state.addActivityEntry,
      markAllPlannerStopsVisited: state.markAllPlannerStopsVisited,
      resetPlannerStopsToPlanned: state.resetPlannerStopsToPlanned,
      clearPlannerDay: state.clearPlannerDay,
      clearAllPlanner: state.clearAllPlanner,
      setTrackingEnabled: state.setTrackingEnabled,
      setMapsProvider: state.setMapsProvider,
      setCalendarOpen: state.setCalendarOpen,
      setMonthViewOpen: state.setMonthViewOpen,
    })),
  );
