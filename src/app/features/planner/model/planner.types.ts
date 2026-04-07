export type PlannerStopStatus = "planned" | "visited" | "skipped";

export interface PlannerStop {
  id: string;               // crypto.randomUUID()
  pinId: string | null;     // linked pin id, null for ad-hoc
  label: string;
  address: string;
  lat: number;
  lng: number;
  status: PlannerStopStatus;
  addedAt: string;          // ISO datetime string — NOT Date object (per D-05)
  visitedAt: string | null; // ISO datetime string — NOT Date object (per D-05)
}

export interface ActivityEntry {
  time: string;   // "9:15 AM" — formatted for display
  text: string;   // e.g. "Visited Acme Corp"
}

export interface DayPlan {
  stops: PlannerStop[];
  notes: string[];          // index 0 = page 1; never empty array — always at least [""]
  activityLog: ActivityEntry[];
}

export interface PlannerSlice {
  // Persisted state
  plannerDays: Record<string, DayPlan>;    // keyed by "YYYY-MM-DD"
  activePlannerDate: string;               // ISO date string "YYYY-MM-DD"
  trackingEnabled: boolean;               // privacy toggle

  // Session-only UI state (not persisted)
  activeNotesPage: Record<string, number>; // current page per date
  calendarOpen: boolean;
  monthViewOpen: boolean;

  // Actions
  setActivePlannerDate: (date: string) => void;
  addPlannerStop: (stop: PlannerStop) => void;
  removePlannerStop: (id: string) => void;
  reorderPlannerStops: (date: string, newStops: PlannerStop[]) => void;
  setPlannerStopStatus: (stopId: string, status: PlannerStopStatus) => void;
  addNotesPage: () => void;
  deleteNotesPage: (pageIndex: number) => void;
  setNotesPage: (pageIndex: number, text: string) => void;
  setActiveNotesPage: (date: string, page: number) => void;
  addActivityEntry: (entry: ActivityEntry) => void;
  markAllPlannerStopsVisited: (date?: string) => void;
  resetPlannerStopsToPlanned: (date?: string) => void;
  clearPlannerDay: (date?: string) => void;
  clearAllPlanner: () => void;
  setTrackingEnabled: (enabled: boolean) => void;
  setCalendarOpen: (open: boolean) => void;
  setMonthViewOpen: (open: boolean) => void;
  purgeStaleDays: () => void;
}
