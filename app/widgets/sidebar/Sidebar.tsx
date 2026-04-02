"use client";

import PinList from "@/app/features/pins/PinList";
import { useTheme } from "@/app/shared/model/theme";

interface SidebarProps {
  onEditPin?: (pinId: string) => void;
}

export default function Sidebar({ onEditPin }: SidebarProps) {
  const { theme, cycleTheme } = useTheme();

  return (
    <div className="sidebar-wrap relative flex flex-col h-screen bg-bg-secondary border-r border-border z-20">
      {/* Collapse toggle */}
      <button
        className="sidebar-toggle absolute z-21 flex items-center justify-center cursor-pointer bg-bg-card border border-border text-text-secondary transition-all duration-200 hover:text-orange hover:bg-orange-dim"
        title="Toggle sidebar"
      >
        <svg className="sidebar-toggle-icon transition-transform duration-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange rounded-[7px] flex items-center justify-center font-extrabold text-white text-[15px] tracking-tight">
            G
          </div>
          <div className="text-lg font-bold text-text-primary tracking-tight">Groundwork</div>
        </div>
        <div className="flex gap-1.5 items-center">
          <button className="icon-btn-size w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-orange-dim hover:text-orange relative" title="Email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="22,7 12,13 2,7" />
            </svg>
          </button>
          <button
            className="icon-btn-size w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-orange-dim hover:text-orange"
            title={`Switch theme (current: ${theme})`}
            onClick={cycleTheme}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {theme === "light" ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              )}
            </svg>
          </button>
          <button className="icon-btn-size w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-orange-dim hover:text-orange" title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-bg-card cursor-pointer transition-colors duration-150 hover:bg-orange-dim">
        <div className="w-[38px] h-[38px] bg-orange rounded-[10px] flex items-center justify-center font-extrabold text-white text-[15px] shrink-0 bg-cover bg-center overflow-hidden">
          ?
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-primary truncate">Set up your profile</div>
          <div className="text-[11px] text-text-secondary mt-px">Tap to get started</div>
        </div>
        <div className="text-text-muted shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-border bg-bg-card">
        <button className="flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-wider text-orange border-b-2 border-orange text-center transition-all duration-200">
          Pins
        </button>
        <button className="flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-wider text-text-muted border-b-2 border-transparent text-center transition-all duration-200 hover:text-text-secondary">
          Planner
        </button>
      </div>

      {/* PinList — replaces static search, filters, pin list, and stats placeholder content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <PinList onEditPin={onEditPin ?? (() => {})} />
      </div>
    </div>
  );
}
