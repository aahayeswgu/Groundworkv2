"use client";

import { getOrCreateDay } from "@/app/features/planner/model/planner.store";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import {
  useActiveNotesPage,
  useActivePlannerDate,
  useCalendarOpen,
  useMonthViewOpen,
  usePlannerDays,
  usePlannerActions,
  useTrackingEnabled,
} from "@/app/features/planner/model/planner.hooks";
import { useRouteActions } from "@/app/features/route/model/route.hooks";
import { PlannerStopItem } from "@/app/features/planner/ui/PlannerStopItem";
import PlannerNotes from "@/app/features/planner/ui/PlannerNotes";
import PlannerActivityLog from "@/app/features/planner/ui/PlannerActivityLog";
import PlannerCalendar from "@/app/features/planner/ui/PlannerCalendar";
import type { PlannerStopStatus } from "@/app/features/planner/model/planner.types";
import type { RouteStop } from "@/app/features/route/model/route.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/shared/ui/dropdown-menu";
import { useIsMobile } from "@/app/shared/lib/use-is-mobile";
import { CheckCheck, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";

interface PlannerPanelProps {
  mobileSheetSnapIndex?: number | null;
  onRequestExpand?: () => void;
}

export default function PlannerPanel({
  mobileSheetSnapIndex = null,
  onRequestExpand,
}: PlannerPanelProps) {
  const isMobile = useIsMobile();
  const plannerDays = usePlannerDays();
  const activePlannerDate = useActivePlannerDate();
  const {
    setActivePlannerDate,
    setPlannerStopStatus,
    removePlannerStop,
    addActivityEntry,
    setNotesPage,
    addNotesPage,
    deleteNotesPage,
    setActiveNotesPage,
    markAllPlannerStopsVisited,
    resetPlannerStopsToPlanned,
    clearPlannerDay,
    clearAllPlanner,
    setTrackingEnabled,
    setCalendarOpen,
    setMonthViewOpen,
    reorderPlannerStops,
  } = usePlannerActions();
  const trackingEnabled = useTrackingEnabled();
  const activeNotesPage = useActiveNotesPage();
  const { addStop, clearRoute } = useRouteActions();
  const calendarOpen = useCalendarOpen();
  const monthViewOpen = useMonthViewOpen();
  const isCompactMobileSheet = isMobile && mobileSheetSnapIndex !== null && mobileSheetSnapIndex <= 1;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const day = getOrCreateDay(plannerDays, activePlannerDate);
  const currentNotesPage = activeNotesPage[activePlannerDate] ?? 0;
  const hasStops = day.stops.length > 0;
  const hasUnvisitedStops = day.stops.some((stop) => stop.status !== "visited");
  const hasNonPlannedStops = day.stops.some((stop) => stop.status !== "planned" || stop.visitedAt !== null);
  const hasPersistedDay = plannerDays[activePlannerDate] !== undefined;
  const hasDayData =
    hasPersistedDay ||
    day.stops.length > 0 ||
    day.activityLog.length > 0 ||
    day.notes.some((note) => note.trim().length > 0);
  const hasAnyPlannerData = Object.keys(plannerDays).length > 0 || Object.values(plannerDays).some(
    (plannerDay) =>
      plannerDay.stops.length > 0 ||
      plannerDay.activityLog.length > 0 ||
      plannerDay.notes.some((note) => note.trim().length > 0),
  );

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = day.stops.findIndex((s) => s.id === active.id);
    const newIndex = day.stops.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(day.stops, oldIndex, newIndex);
    reorderPlannerStops(activePlannerDate, newOrder);
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

  function handleRouteIt() {
    if (day.stops.length === 0) return;
    clearRoute();
    day.stops.forEach((ps) => {
      const routeStop: RouteStop = {
        id: ps.pinId ?? ps.id,
        label: ps.label,
        address: ps.address,
        lat: ps.lat,
        lng: ps.lng,
      };
      addStop(routeStop);
    });
    if (trackingEnabled) {
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      addActivityEntry({ time, text: `Route started with ${day.stops.length} stops` });
    }
  }

  function handleClearDay() {
    if (!hasDayData) return;
    const confirmed = window.confirm(
      `Clear planner data for ${displayDate}? This removes stops, notes, and activity for this day.`,
    );
    if (!confirmed) return;
    clearPlannerDay(activePlannerDate);
    toast.success(`Cleared planner for ${displayDate}`);
  }

  function handleMarkAllVisited() {
    if (!hasUnvisitedStops) return;
    markAllPlannerStopsVisited(activePlannerDate);
    if (trackingEnabled) {
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      addActivityEntry({ time, text: `Marked ${day.stops.length} stop${day.stops.length === 1 ? "" : "s"} as visited` });
    }
    toast.success("Marked all stops as visited");
  }

  function handleResetAllStopsPlanned() {
    if (!hasNonPlannedStops) return;
    resetPlannerStopsToPlanned(activePlannerDate);
    if (trackingEnabled) {
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      addActivityEntry({ time, text: `Reset ${day.stops.length} stop${day.stops.length === 1 ? "" : "s"} to planned` });
    }
    toast.success("Reset all stops to planned");
  }

  function handleClearAllPlanner() {
    if (!hasAnyPlannerData) return;
    const confirmed = window.confirm(
      "Clear all planner data across all days? This action cannot be undone.",
    );
    if (!confirmed) return;
    clearAllPlanner();
    toast.success("Cleared all planner data");
  }

  function handleCompactPrimaryAction() {
    if (hasStops) {
      handleRouteIt();
      return;
    }
    setCalendarOpen(true);
    onRequestExpand?.();
  }

  const visitedCount = day.stops.filter((stop) => stop.status === "visited").length;
  const notesWithContentCount = day.notes.filter((note) => note.trim().length > 0).length;

  if (isCompactMobileSheet) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-border bg-bg-card px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-bold text-text-primary">{displayDate}</div>
              <div className="text-xs text-text-muted">
                {day.stops.length} stops · {visitedCount} visited · {notesWithContentCount} notes
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRequestExpand?.()}
              className="h-8 rounded-md border border-white/12 bg-white/5 px-3 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/10 hover:text-white"
            >
              Expand
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={handleCompactPrimaryAction}
              className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-orange bg-orange px-3 text-[12px] font-semibold text-white transition-colors hover:bg-orange/90"
            >
              {hasStops ? `Route Day (${day.stops.length})` : "Open Calendar"}
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] font-semibold text-text-secondary">Drag up for full planner</div>
            <div className="mt-1 text-[12px] text-text-muted">
              {hasStops
                ? `${day.stops.length} stop${day.stops.length === 1 ? "" : "s"} ready for planning and notes`
                : "No stops planned for this day yet"}
            </div>
          </div>
        </div>
      </div>
    );
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
            className="font-heading flex-1 text-sm font-bold text-text-primary text-center hover:text-orange transition-colors"
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
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-orange border border-orange/30 hover:border-orange rounded px-1.5 py-0.5 transition-colors"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded text-text-muted transition-colors hover:text-orange"
                title="Planner options"
                aria-label="Planner options"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuLabel>Planner Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleMarkAllVisited} disabled={!hasStops || !hasUnvisitedStops}>
                <CheckCheck className="text-emerald-300" />
                Mark All as Visited
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleResetAllStopsPlanned} disabled={!hasStops || !hasNonPlannedStops}>
                <RotateCcw className="text-[#9EC1FF]" />
                Reset All to Planned
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleClearDay} disabled={!hasDayData}>
                <Trash2 className="text-text-muted" />
                Clear This Day
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleClearAllPlanner}
                disabled={!hasAnyPlannerData}
                variant="destructive"
              >
                <Trash2 />
                Clear All Planner Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Stops section */}
        <div className="border-b border-border">
          <div className="px-4 py-2 flex items-center justify-between bg-bg-secondary sticky top-0 z-10">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Stops {day.stops.length > 0 ? `(${day.stops.length})` : ""}
            </span>
            {day.stops.length > 0 && (
              <button
                onClick={handleRouteIt}
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-orange border border-orange/30 hover:border-orange hover:bg-orange-dim rounded px-2 py-1 transition-colors"
                title="Send to route and optimize"
              >
                Route It
              </button>
            )}
          </div>
          {day.stops.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              No stops planned.
              <br />
              <span className="text-[11px]">Add stops from a pin or the route panel.</span>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={day.stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {day.stops.map((stop, i) => (
                  <PlannerStopItem
                    key={stop.id}
                    stop={stop}
                    index={i}
                    onStatusChange={handleStatusChange}
                    onRemove={removePlannerStop}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
