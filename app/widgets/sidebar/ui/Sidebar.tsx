"use client";

import { useCallback, useRef, useState } from "react";
import PinList from "@/app/features/pins/ui/PinList";
import { useStore } from "@/app/store";
import DiscoverPanel from "@/app/features/discover/DiscoverPanel";
import PlannerPanel from "@/app/features/planner/PlannerPanel";
import AuthModal from "@/app/features/auth/AuthModal";
import { useTheme } from "@/app/features/theme/model/theme-context";
import { supabase } from "@/app/lib/supabase";
import { OPEN_EMAIL_EVENT } from "@/app/shared/model/mobile-events";
import { type SidebarTab } from "@/app/widgets/sidebar/model/sidebar.model";
import SidebarProfileCard from "@/app/widgets/sidebar/ui/SidebarProfileCard";
import SidebarSettingsPanel from "@/app/widgets/sidebar/ui/SidebarSettingsPanel";
import SidebarTabs from "@/app/widgets/sidebar/ui/SidebarTabs";

export interface SidebarProps {
  onEditPin?: (pinId: string) => void;
  mobileOpen?: boolean;
  mobileTab?: SidebarTab;
  onMobileClose?: () => void;
  settingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
}

export default function Sidebar({
  onEditPin,
  mobileOpen = false,
  mobileTab,
  onMobileClose,
  settingsOpen,
  onSettingsOpen,
  onSettingsClose,
}: SidebarProps) {
  const discoverMode = useStore((s) => s.discoverMode);
  const trackingEnabled = useStore((s) => s.trackingEnabled);
  const setTrackingEnabled = useStore((s) => s.setTrackingEnabled);
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [desktopActiveTab, setDesktopActiveTab] = useState<SidebarTab>("pins");
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const profileNameRef = useRef<HTMLInputElement>(null);
  const profileCompanyRef = useRef<HTMLInputElement>(null);
  const profileHomebaseRef = useRef<HTMLInputElement>(null);

  const activeTab = mobileTab ?? desktopActiveTab;
  const isCollapsed = collapsed && !mobileOpen;

  const openSettings = useCallback(() => {
    onSettingsOpen();
  }, [onSettingsOpen]);

  const toggleSettings = useCallback(() => {
    if (settingsOpen) {
      onSettingsClose();
      return;
    }
    openSettings();
  }, [openSettings, onSettingsClose, settingsOpen]);

  const handleDesktopTabChange = useCallback((tab: SidebarTab) => {
    setDesktopActiveTab(tab);
    onSettingsClose();
  }, [onSettingsClose]);

  function handleSaveProfile() {
    updateProfile({
      name: profileNameRef.current?.value ?? "",
      company: profileCompanyRef.current?.value ?? "",
      homebase: profileHomebaseRef.current?.value ?? "",
    });
    setSettingsToast("Profile saved");
    setTimeout(() => setSettingsToast(null), 2500);
  }

  return (
    <div className={`sidebar-wrap relative flex flex-col h-screen bg-bg-secondary border-r border-border z-20 ${isCollapsed ? "collapsed" : ""} ${mobileOpen ? "open" : ""}`}>
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="sidebar-toggle absolute z-21 flex items-center justify-center cursor-pointer bg-bg-card border border-border text-text-secondary transition-all duration-200 hover:text-orange hover:bg-orange-dim"
        title="Toggle sidebar"
      >
        <svg className="sidebar-toggle-icon transition-transform duration-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="lg:hidden flex items-center justify-center border-b border-border bg-bg-card py-2">
        <span className="h-1.5 w-12 rounded-full bg-border" />
      </div>

      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-card">
        <div className="flex items-center gap-2.5">
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="icon-btn-size mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-orange-dim hover:text-orange lg:hidden"
              title="Close drawer"
              aria-label="Close drawer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <div className="w-8 h-8 bg-orange rounded-[7px] flex items-center justify-center font-extrabold text-white text-[15px] tracking-tight">
            G
          </div>
          <div className="text-lg font-bold text-text-primary tracking-tight">Groundwork</div>
        </div>
        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_EMAIL_EVENT))}
            className="icon-btn-size w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-orange-dim hover:text-orange relative"
            title="Email"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="22,7 12,13 2,7" />
            </svg>
          </button>
          <button
            onClick={toggleSettings}
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

      {user ? (
        <SidebarProfileCard
          avatar={(profile?.name?.[0] || user.email?.[0] || "?").toUpperCase()}
          title={profile?.name || "Set up profile"}
          subtitle={profile?.company || user.email || ""}
          onClick={openSettings}
          trailing={(
            <button
              onClick={(event) => {
                event.stopPropagation();
                supabase.auth.signOut();
              }}
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

      <SidebarTabs activeTab={activeTab} onSelectTab={handleDesktopTabChange} />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {settingsOpen ? (
          <SidebarSettingsPanel
            settingsToast={settingsToast}
            onSettingsClose={onSettingsClose}
            trackingEnabled={trackingEnabled}
            onToggleTracking={() => setTrackingEnabled(!trackingEnabled)}
            showProfile={Boolean(user)}
            profileDefaults={{
              name: profile?.name ?? "",
              company: profile?.company ?? "",
              homebase: profile?.homebase ?? "",
            }}
            profileNameRef={profileNameRef}
            profileCompanyRef={profileCompanyRef}
            profileHomebaseRef={profileHomebaseRef}
            onSaveProfile={handleSaveProfile}
            theme={theme}
            onThemeChange={setTheme}
          />
        ) : discoverMode ? (
          <DiscoverPanel />
        ) : activeTab === "planner" ? (
          <PlannerPanel />
        ) : (
          <PinList onEditPin={onEditPin ?? (() => {})} />
        )}
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
