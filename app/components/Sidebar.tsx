"use client";

import { useState, useEffect } from "react";
import PinList from "@/app/features/pins/PinList";
import { useStore } from "@/app/store/index";
import DiscoverPanel from "@/app/features/discover/DiscoverPanel";
import PlannerPanel from "@/app/features/planner/PlannerPanel";
import AuthModal from "@/app/features/auth/AuthModal";
import { supabase } from "@/app/lib/supabase";

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
  const trackingEnabled = useStore((s) => s.trackingEnabled);
  const setTrackingEnabled = useStore((s) => s.setTrackingEnabled);
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"pins" | "planner">("pins");
  const [profileName, setProfileName] = useState("");
  const [profileCompany, setProfileCompany] = useState("");
  const [profileHomebase, setProfileHomebase] = useState("");
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Hydrate theme from localStorage on mount
  useEffect(() => {
    const saved = getTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  // Sync profile fields when settings opens
  useEffect(() => {
    if (settingsOpen && profile) {
      setProfileName(profile.name ?? "");
      setProfileCompany(profile.company ?? "");
      setProfileHomebase(profile.homebase ?? "");
    }
  }, [settingsOpen, profile]);

  function handleSaveProfile() {
    updateProfile({ name: profileName, company: profileCompany, homebase: profileHomebase });
    setSettingsToast("Profile saved");
    setTimeout(() => setSettingsToast(null), 2500);
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
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("gw-open-email"))}
            className="icon-btn-size w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-orange-dim hover:text-orange relative"
            title="Email"
          >
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
      {user ? (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-bg-card cursor-pointer transition-colors duration-150 hover:bg-orange-dim"
          onClick={() => setSettingsOpen(true)}
        >
          <div className="w-[38px] h-[38px] bg-orange rounded-[10px] flex items-center justify-center font-extrabold text-white text-[15px] shrink-0">
            {(profile?.name?.[0] || user.email?.[0] || "?").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-text-primary truncate">{profile?.name || "Set up profile"}</div>
            <div className="text-[11px] text-text-secondary mt-px truncate">{profile?.company || user.email}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); supabase.auth.signOut(); }}
            className="text-text-muted hover:text-gw-red transition-colors shrink-0"
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-border bg-bg-card cursor-pointer transition-colors duration-150 hover:bg-orange-dim"
          onClick={() => setAuthOpen(true)}
        >
          <div className="w-[38px] h-[38px] bg-orange rounded-[10px] flex items-center justify-center font-extrabold text-white text-[15px] shrink-0">
            ?
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-text-primary truncate">Sign in</div>
            <div className="text-[11px] text-text-secondary mt-px">Tap to log in or create account</div>
          </div>
          <div className="text-text-muted shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
        </div>
      )}

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
            {/* Toast */}
            {settingsToast && (
              <div className="mx-5 mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white text-center" style={{ backgroundColor: "#C4692A", animation: "fadeInOut 2.5s ease" }}>
                {settingsToast}
              </div>
            )}

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

            {/* GPS Auto Check-in */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">GPS Auto Check-in</div>
                  <div className="text-[11px] text-text-secondary mt-1">Auto-mark stops visited when nearby (~200ft)</div>
                </div>
                <button
                  onClick={() => setTrackingEnabled(!trackingEnabled)}
                  style={{ backgroundColor: trackingEnabled ? "#C4692A" : "#555", borderColor: trackingEnabled ? "#C4692A" : "#666" }}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 border"
                >
                  <span
                    style={{ backgroundColor: trackingEnabled ? "#fff" : "#999" }}
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-200 ${trackingEnabled ? "translate-x-5" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Profile (only when logged in) */}
            {user && (
              <div className="px-5 py-4 border-b border-border">
                <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">Profile</div>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={profileCompany}
                    onChange={(e) => setProfileCompany(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
                  />
                  <input
                    type="text"
                    placeholder="Home base address"
                    value={profileHomebase}
                    onChange={(e) => setProfileHomebase(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="w-full py-2 rounded-lg bg-orange text-white font-bold text-sm hover:bg-orange-hover transition-colors"
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            )}

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

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
