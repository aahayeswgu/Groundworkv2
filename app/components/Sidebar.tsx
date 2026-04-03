"use client";

import { useState, type ReactNode } from "react";
import PinList from "@/app/features/pins/ui/PinList";
import { useStore } from "@/app/store";
import DiscoverPanel from "@/app/features/discover/DiscoverPanel";
import PlannerPanel from "@/app/features/planner/PlannerPanel";
import AuthModal from "@/app/features/auth/AuthModal";
import { useTheme } from "@/app/features/theme/model/theme-context";
import { supabase } from "@/app/lib/supabase";

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
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"pins" | "planner">("pins");
  const [profileName, setProfileName] = useState("");
  const [profileCompany, setProfileCompany] = useState("");
  const [profileHomebase, setProfileHomebase] = useState("");
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const trackingToggleTrackClass = trackingEnabled
    ? "border-orange bg-orange"
    : "border-[#666] bg-[#555]";
  const trackingToggleThumbClass = trackingEnabled
    ? "translate-x-5 bg-white"
    : "bg-[#999]";

  function openSettings() {
    if (profile) {
      setProfileName(profile.name ?? "");
      setProfileCompany(profile.company ?? "");
      setProfileHomebase(profile.homebase ?? "");
    }
    setSettingsOpen(true);
  }

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
            onClick={() => {
              if (settingsOpen) {
                setSettingsOpen(false);
              } else {
                openSettings();
              }
            }}
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
        <SidebarProfileCard
          avatar={(profile?.name?.[0] || user.email?.[0] || "?").toUpperCase()}
          title={profile?.name || "Set up profile"}
          subtitle={profile?.company || user.email || ""}
          onClick={openSettings}
          trailing={(
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
          )}
        />
      ) : (
        <SidebarProfileCard
          avatar="?"
          title="Sign in"
          subtitle="Tap to log in or create account"
          onClick={() => setAuthOpen(true)}
          trailing={(
            <div className="text-text-muted shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
          )}
        />
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
              <div className="mx-5 mt-3 rounded-lg bg-orange px-4 py-2 text-center text-sm font-semibold text-white animate-[fadeInOut_2.5s_ease]">
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
                  className={`relative h-6 w-11 rounded-full border transition-colors duration-200 ${trackingToggleTrackClass}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow transition-transform duration-200 ${trackingToggleThumbClass}`}
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
                    onClick={() => setTheme(value)}
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

interface SidebarProfileCardProps {
  avatar: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  trailing: ReactNode;
}

function SidebarProfileCard({
  avatar,
  title,
  subtitle,
  onClick,
  trailing,
}: SidebarProfileCardProps) {
  return (
    <div
      className="flex cursor-pointer items-center gap-3 border-b border-border bg-bg-card px-5 py-4 transition-colors duration-150 hover:bg-orange-dim"
      onClick={onClick}
    >
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-orange text-[15px] font-extrabold text-white">
        {avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-text-primary">{title}</div>
        <div className="mt-px truncate text-[11px] text-text-secondary">{subtitle}</div>
      </div>
      {trailing}
    </div>
  );
}
