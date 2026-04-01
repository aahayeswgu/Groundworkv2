"use client";

import { useStore } from "@/app/store";
import { getOrCreateDay } from "@/app/features/planner/planner.store";
import { PlannerStopItem } from "@/app/features/planner/PlannerStopItem";
import PlannerNotes from "@/app/features/planner/PlannerNotes";
import PlannerActivityLog from "@/app/features/planner/PlannerActivityLog";
import PlannerCalendar from "@/app/features/planner/PlannerCalendar";
import type { PlannerStopStatus } from "@/app/types/planner.types";

export default function PlannerPanel() {
  const plannerDays = useStore((s) => s.plannerDays);
  const activePlannerDate = useStore((s) => s.activePlannerDate);
  const setActivePlannerDate = useStore((s) => s.setActivePlannerDate);
  const setPlannerStopStatus = useStore((s) => s.setPlannerStopStatus);
  const removePlannerStop = useStore((s) => s.removePlannerStop);
  const addActivityEntry = useStore((s) => s.addActivityEntry);
  const trackingEnabled = useStore((s) => s.trackingEnabled);
  const activeNotesPage = useStore((s) => s.activeNotesPage);
  const setNotesPage = useStore((s) => s.setNotesPage);
  const addNotesPage = useStore((s) => s.addNotesPage);
  const deleteNotesPage = useStore((s) => s.deleteNotesPage);
  const setActiveNotesPage = useStore((s) => s.setActiveNotesPage);
  const setTrackingEnabled = useStore((s) => s.setTrackingEnabled);
  const calendarOpen = useStore((s) => s.calendarOpen);
  const monthViewOpen = useStore((s) => s.monthViewOpen);
  const setCalendarOpen = useStore((s) => s.setCalendarOpen);
  const setMonthViewOpen = useStore((s) => s.setMonthViewOpen);

  const day = getOrCreateDay(plannerDays, activePlannerDate);
  const currentNotesPage = activeNotesPage[activePlannerDate] ?? 0;

  // Stats — derived, not stored separately (per PLAN-08)
  const planned = day.stops.filter((s) => s.status === "planned").length;
  const visited = day.stops.filter((s) => s.status === "visited").length;
  const skipped = day.stops.filter((s) => s.status === "skipped").length;

  // Date navigation helpers (D-15)
  const todayStr = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD" in local time
  const isToday = activePlannerDate === todayStr;

  // Format date for display: "Mon, Apr 1" — append T00:00:00 to avoid UTC offset shifting date
  const displayDate = new Date(activePlannerDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  function navigateDay(offset: number) {
    const d = new Date(activePlannerDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    setActivePlannerDate(d.toLocaleDateString("en-CA")); // "YYYY-MM-DD"
  }

  function handleAddNotesPage() {
    addNotesPage();
    if (trackingEnabled) {
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      addActivityEntry({ time, text: "Added notes page" });
    }
  }

  function handleStatusChange(stopId: string, status: PlannerStopStatus) {
    const stop = day.stops.find((s) => s.id === stopId);
    setPlannerStopStatus(stopId, status);
    if (stop && trackingEnabled) {
      const label = stop.label;
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      if (status === "visited") addActivityEntry({ time, text: `Visited ${label}` });
      if (status === "skipped") addActivityEntry({ time, text: `Skipped ${label}` });
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Date header with navigation (D-15) */}
      <div className="px-4 py-3 border-b border-border bg-bg-card shrink-0">
        <div className="flex items-center gap-2">
          {/* Prev day */}
          <button
            onClick={() => navigateDay(-1)}
            className="p-1 text-text-muted hover:text-orange transition-colors"
            title="Previous day"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Date display — click to toggle calendar */}
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
            className="flex-1 text-sm font-bold text-text-primary text-center hover:text-orange transition-colors"
            title="Open calendar"
          >
            {displayDate}
          </button>

          {/* Next day */}
          <button
            onClick={() => navigateDay(1)}
            className="p-1 text-text-muted hover:text-orange transition-colors"
            title="Next day"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Today button — only visible when not on today */}
          {!isToday && (
            <button
              onClick={() => setActivePlannerDate(todayStr)}
              className="text-[10px] font-bold text-orange border border-orange/30 hover:border-orange rounded px-1.5 py-0.5 transition-colors"
              title="Go to today"
            >
              Today
            </button>
          )}

          {/* Month view toggle */}
          <button
            onClick={() => setMonthViewOpen(!monthViewOpen)}
            className={`p-1 rounded transition-colors ${monthViewOpen ? "text-orange bg-orange-dim" : "text-text-muted hover:text-orange"}`}
            title="Month view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>

        {/* Inline calendar picker (shown when calendarOpen) */}
        {calendarOpen && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden bg-bg-card">
            <PlannerCalendar
              selectedDate={activePlannerDate}
              plannerDays={plannerDays}
              onSelectDate={(date) => {
                setActivePlannerDate(date);
                setCalendarOpen(false);
              }}
              onClose={() => setCalendarOpen(false)}
            />
          </div>
        )}

        {/* Month view (shown when monthViewOpen) */}
        {monthViewOpen && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden bg-bg-card">
            <PlannerCalendar
              selectedDate={activePlannerDate}
              plannerDays={plannerDays}
              onSelectDate={(date) => {
                setActivePlannerDate(date);
                setMonthViewOpen(false);
              }}
              onClose={() => setMonthViewOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Stats bar (PLAN-08) */}
      <div className="flex items-center gap-0 px-4 py-2.5 border-b border-border bg-bg-secondary shrink-0">
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-text-primary">{planned + visited + skipped}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wide">Total</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-green-400">{visited}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wide">Visited</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-amber-400">{skipped}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wide">Skipped</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-blue-400">{planned}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wide">Planned</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Stops section */}
        <div className="border-b border-border">
          <div className="px-4 py-2 flex items-center justify-between bg-bg-secondary sticky top-0 z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Stops {day.stops.length > 0 ? `(${day.stops.length})` : ""}
            </span>
          </div>
          {day.stops.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              No stops planned.
              <br />
              <span className="text-[11px]">Add stops from a pin or the route panel.</span>
            </div>
          ) : (
            <div>
              {day.stops.map((stop, i) => (
                <PlannerStopItem
                  key={stop.id}
                  stop={stop}
                  index={i}
                  onStatusChange={handleStatusChange}
                  onRemove={removePlannerStop}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notes section */}
        <PlannerNotes
          notes={day.notes}
          activePage={currentNotesPage}
          onChangePage={(text) => setNotesPage(currentNotesPage, text)}
          onAddPage={handleAddNotesPage}
          onDeletePage={deleteNotesPage}
          onNavigatePage={(page) => setActiveNotesPage(activePlannerDate, page)}
        />

        {/* Activity log section */}
        <PlannerActivityLog
          entries={day.activityLog}
          trackingEnabled={trackingEnabled}
          onToggleTracking={setTrackingEnabled}
        />
      </div>
    </div>
  );
}
