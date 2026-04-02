"use client";

import { useState, useEffect } from "react";
import PinList from "@/app/features/pins/PinList";
import { useStore } from "@/app/store/index";
import DiscoverPanel from "@/app/features/discover/DiscoverPanel";
import PlannerPanel from "@/app/features/planner/PlannerPanel";

type Theme = "dark" | "gray";

function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("gw-theme");
  return saved === "gray" ? "gray" : "dark";
}

function applyTheme(theme: Theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("gw-theme", theme);
}

interface SidebarProps {
  onEditPin?: (pinId: string) => void;
}

export default function Sidebar({ onEditPin }: SidebarProps) {
  const discoverMode = useStore((s) => s.discoverMode);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"pins" | "planner">("pins");
  const [theme, setTheme] = useState<Theme>("dark");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState<"light" | "dark" | "graphite">("light");

  // Hydrate theme + map style from localStorage on mount
  useEffect(() => {
    const saved = getTheme();
    setTheme(saved);
    applyTheme(saved);
    const savedMap = localStorage.getItem("gw-map-style") as "light" | "dark" | "graphite" | null;
    if (savedMap) {
      setMapStyle(savedMap);
      window.dispatchEvent(new CustomEvent("gw-map-style", { detail: savedMap }));
    }
  }, []);

  function setMapStyleAndDispatch(value: "light" | "dark" | "graphite") {
    setMapStyle(value);
    localStorage.setItem("gw-map-style", value);
    window.dispatchEvent(new CustomEvent("gw-map-style", { detail: value }));
  }

  return (
    <div className={`sidebar-wrap relative flex flex-col h-screen bg-bg-secondary border-r border-border z-20 ${collapsed ? "collapsed" : ""}`}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
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
            onClick={() => setSettingsOpen((v) => !v)}
            className={`icon-btn-size w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-orange-dim hover:text-orange ${settingsOpen ? "text-orange bg-orange-dim" : "text-text-secondary"}`}
            title="Settings"
          >
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
        <button
          onClick={() => setActiveTab("pins")}
          className={`flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-wider text-center transition-all duration-200 ${activeTab === "pins" ? "text-orange border-b-2 border-orange" : "text-text-muted border-b-2 border-transparent hover:text-text-secondary"}`}
        >
          Pins
        </button>
        <button
          onClick={() => setActiveTab("planner")}
          className={`flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-wider text-center transition-all duration-200 ${activeTab === "planner" ? "text-orange border-b-2 border-orange" : "text-text-muted border-b-2 border-transparent hover:text-text-secondary"}`}
        >
          Planner
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {settingsOpen ? (
          <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
            {/* Settings header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-orange-dim hover:text-orange transition-all duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <span className="text-base font-bold text-text-primary">Settings</span>
            </div>

            {/* Map Style */}
            <div className="px-5 py-4 border-b border-border">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Map Style</div>
              <div className="flex gap-2">
                {([["light", "Light"], ["dark", "Dark"], ["graphite", "Graphite"]] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setMapStyleAndDispatch(value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${mapStyle === value ? "bg-orange text-white" : "bg-bg-input text-text-secondary hover:text-text-primary hover:bg-bg-card"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* UI Theme */}
            <div className="px-5 py-4 border-b border-border">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">UI Theme</div>
              <div className="flex gap-2">
                {([["dark", "Dark"], ["gray", "Graphite"]] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setTheme(value); applyTheme(value); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${theme === value ? "bg-orange text-white" : "bg-bg-input text-text-secondary hover:text-text-primary hover:bg-bg-card"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : discoverMode
          ? <DiscoverPanel />
          : activeTab === "planner"
            ? <PlannerPanel />
            : <PinList onEditPin={onEditPin ?? (() => {})} />
        }
      </div>
    </div>
  );
}
