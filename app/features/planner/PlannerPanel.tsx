"use client";

import { useStore } from "@/app/store";
import { getOrCreateDay } from "@/app/features/planner/planner.store";
import { PlannerStopItem } from "@/app/features/planner/PlannerStopItem";
import PlannerNotes from "@/app/features/planner/PlannerNotes";
import PlannerActivityLog from "@/app/features/planner/PlannerActivityLog";
import type { PlannerStopStatus } from "@/app/types/planner.types";

export default function PlannerPanel() {
  const plannerDays = useStore((s) => s.plannerDays);
  const activePlannerDate = useStore((s) => s.activePlannerDate);
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

  const day = getOrCreateDay(plannerDays, activePlannerDate);
  const currentNotesPage = activeNotesPage[activePlannerDate] ?? 0;

  // Stats — derived, not stored separately (per PLAN-08)
  const planned = day.stops.filter((s) => s.status === "planned").length;
  const visited = day.stops.filter((s) => s.status === "visited").length;
  const skipped = day.stops.filter((s) => s.status === "skipped").length;

  // Format date for display: "Mon, Apr 1" — append T00:00:00 to avoid UTC offset shifting date
  const displayDate = new Date(activePlannerDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
      {/* Date header — navigation controls added in 06-04 */}
      <div className="px-4 py-3 border-b border-border bg-bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-text-primary">{displayDate}</div>
          {/* Date nav placeholder — wired in 06-04 */}
        </div>
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

        {/* Date navigation and calendar — added in 06-04 */}
      </div>
    </div>
  );
}
