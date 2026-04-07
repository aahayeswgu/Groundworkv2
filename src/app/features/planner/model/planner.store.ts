import type { StateCreator } from "zustand";
import type { DayPlan, PlannerSlice, PlannerStop, PlannerStopStatus, ActivityEntry } from "@/app/features/planner/model/planner.types";

export function getOrCreateDay(days: Record<string, DayPlan>, date: string): DayPlan {
  return days[date] ?? { stops: [], notes: [""], activityLog: [] };
}

export const createPlannerSlice: StateCreator<PlannerSlice> = (set) => ({
  // Initial state
  plannerDays: {},
  activePlannerDate: new Date().toISOString().slice(0, 10),
  trackingEnabled: true,
  activeNotesPage: {},
  calendarOpen: false,
  monthViewOpen: false,

  // Actions
  setActivePlannerDate: (date) => set({ activePlannerDate: date }),

  addPlannerStop: (stop: PlannerStop) =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      // Dedup: skip if same pinId already exists for this date
      if (stop.pinId && day.stops.some((st) => st.pinId === stop.pinId)) return s;
      return {
        plannerDays: {
          ...s.plannerDays,
          [date]: { ...day, stops: [...day.stops, stop] },
        },
      };
    }),

  removePlannerStop: (id) =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      return {
        plannerDays: {
          ...s.plannerDays,
          [date]: { ...day, stops: day.stops.filter((st) => st.id !== id) },
        },
      };
    }),

  reorderPlannerStops: (date, newStops) =>
    set((s) => {
      const day = getOrCreateDay(s.plannerDays, date);
      return { plannerDays: { ...s.plannerDays, [date]: { ...day, stops: newStops } } };
    }),

  setPlannerStopStatus: (stopId: string, status: PlannerStopStatus) =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const stops = day.stops.map((st) =>
        st.id === stopId
          ? { ...st, status, visitedAt: status === "visited" ? new Date().toISOString() : st.visitedAt }
          : st
      );
      return {
        plannerDays: { ...s.plannerDays, [date]: { ...day, stops } },
      };
    }),

  // Notes actions (Pattern 5)
  addNotesPage: () =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const newDays = {
        ...s.plannerDays,
        [date]: { ...day, notes: [...day.notes, ""] },
      };
      const newPage = day.notes.length; // 0-indexed: new page is at index day.notes.length
      return {
        plannerDays: newDays,
        activeNotesPage: { ...s.activeNotesPage, [date]: newPage },
      };
    }),

  deleteNotesPage: (pageIndex: number) =>
    set((s) => {
      if (pageIndex === 0) return s;
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const newNotes = day.notes.filter((_, i) => i !== pageIndex);
      const goTo = Math.max(0, pageIndex - 1);
      return {
        plannerDays: { ...s.plannerDays, [date]: { ...day, notes: newNotes } },
        activeNotesPage: { ...s.activeNotesPage, [date]: goTo },
      };
    }),

  setNotesPage: (pageIndex: number, text: string) =>
    set((s) => {
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const notes = [...day.notes];
      notes[pageIndex] = text;
      return { plannerDays: { ...s.plannerDays, [date]: { ...day, notes } } };
    }),

  setActiveNotesPage: (date, page) =>
    set((s) => ({ activeNotesPage: { ...s.activeNotesPage, [date]: page } })),

  // Activity log (Pattern 7)
  addActivityEntry: (entry: ActivityEntry) =>
    set((s) => {
      if (!s.trackingEnabled) return s;
      const date = s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, date);
      const log = [...day.activityLog, entry].slice(-100);
      return { plannerDays: { ...s.plannerDays, [date]: { ...day, activityLog: log } } };
    }),

  markAllPlannerStopsVisited: (date) =>
    set((s) => {
      const targetDate = date ?? s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, targetDate);
      if (day.stops.length === 0) return s;

      const nowIso = new Date().toISOString();
      const nextStops = day.stops.map((stop) =>
        stop.status === "visited"
          ? stop
          : { ...stop, status: "visited" as const, visitedAt: nowIso },
      );

      const hasChanges = nextStops.some((stop, index) => stop !== day.stops[index]);
      if (!hasChanges) return s;

      return {
        plannerDays: {
          ...s.plannerDays,
          [targetDate]: {
            ...day,
            stops: nextStops,
          },
        },
      };
    }),

  resetPlannerStopsToPlanned: (date) =>
    set((s) => {
      const targetDate = date ?? s.activePlannerDate;
      const day = getOrCreateDay(s.plannerDays, targetDate);
      if (day.stops.length === 0) return s;

      const nextStops = day.stops.map((stop) =>
        stop.status === "planned" && stop.visitedAt === null
          ? stop
          : { ...stop, status: "planned" as const, visitedAt: null },
      );

      const hasChanges = nextStops.some((stop, index) => stop !== day.stops[index]);
      if (!hasChanges) return s;

      return {
        plannerDays: {
          ...s.plannerDays,
          [targetDate]: {
            ...day,
            stops: nextStops,
          },
        },
      };
    }),

  clearPlannerDay: (date) =>
    set((s) => {
      const targetDate = date ?? s.activePlannerDate;
      if (!s.plannerDays[targetDate] && s.activeNotesPage[targetDate] === undefined) {
        return s;
      }

      const plannerDays = { ...s.plannerDays };
      const activeNotesPage = { ...s.activeNotesPage };
      delete plannerDays[targetDate];
      delete activeNotesPage[targetDate];

      return { plannerDays, activeNotesPage };
    }),

  clearAllPlanner: () =>
    set((s) => {
      if (Object.keys(s.plannerDays).length === 0 && Object.keys(s.activeNotesPage).length === 0) {
        return s;
      }
      return {
        plannerDays: {},
        activeNotesPage: {},
      };
    }),

  setTrackingEnabled: (enabled) => set({ trackingEnabled: enabled }),

  setCalendarOpen: (open) => set({ calendarOpen: open }),
  setMonthViewOpen: (open) => set({ monthViewOpen: open }),

  // Purge days older than 30 days (Pattern 6)
  purgeStaleDays: () =>
    set((s) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const filtered = Object.fromEntries(
        Object.entries(s.plannerDays).filter(([date]) => date >= cutoffStr)
      );
      return { plannerDays: filtered };
    }),
});
