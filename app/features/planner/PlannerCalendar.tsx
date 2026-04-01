"use client";

import { useState, useEffect } from "react";
import type { DayPlan } from "@/app/types/planner.types";

interface PlannerCalendarProps {
  selectedDate: string;             // "YYYY-MM-DD" — the active planner date
  plannerDays: Record<string, DayPlan>;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

function dayHasData(plannerDays: Record<string, DayPlan>, dateStr: string): boolean {
  const day = plannerDays[dateStr];
  if (!day) return false;
  return (
    day.stops.length > 0 ||
    day.activityLog.length > 0 ||
    day.notes.some((n) => n.trim().length > 0)
  );
}

export default function PlannerCalendar({
  selectedDate,
  plannerDays,
  onSelectDate,
  onClose,
}: PlannerCalendarProps) {
  const [viewYear, setViewYear] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.getMonth(); // 0-11
  });

  // Sync viewed month when selectedDate changes (e.g. prev/next day nav outside calendar)
  useEffect(() => {
    const d = new Date(selectedDate + "T00:00:00");
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  const todayStr = new Date().toLocaleDateString("en-CA");

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  function toDateStr(day: number): string {
    return new Date(viewYear, viewMonth, day).toLocaleDateString("en-CA"); // "YYYY-MM-DD"
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0-6
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDayOfWeek + daysInMonth }, (_, i) => {
    if (i < firstDayOfWeek) return null; // empty leading cell
    return i - firstDayOfWeek + 1;      // day number 1..daysInMonth
  });

  return (
    <div className="select-none">
      {/* Month header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <button
          onClick={prevMonth}
          className="p-1 text-text-muted hover:text-orange transition-colors"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-text-primary">
          {new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 text-text-muted hover:text-orange transition-colors"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 text-center py-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-[10px] text-text-muted font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 text-center px-1 pb-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }
          const dateStr = toDateStr(day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const hasData = dayHasData(plannerDays, dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`
                relative flex flex-col items-center justify-center w-full aspect-square text-xs font-medium rounded
                transition-colors
                ${isSelected
                  ? "bg-orange text-white"
                  : isToday
                    ? "border border-orange text-orange hover:bg-orange-dim"
                    : "text-text-primary hover:bg-orange-dim"
                }
              `}
            >
              <span>{day}</span>
              {hasData && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-green-400"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border">
        <button
          onClick={() => onSelectDate(todayStr)}
          className="text-xs text-orange font-semibold hover:underline"
        >
          Today
        </button>
        <button
          onClick={onClose}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Close
        </button>
      </div>
    </div>
  );
}
