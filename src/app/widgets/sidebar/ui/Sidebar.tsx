"use client";

import { useCallback, useState } from "react";
import { Button } from "@/app/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/shared/ui/dropdown-menu";
import PinList from "@/app/features/pins/ui/PinList";
import { useStore } from "@/app/store";
import DiscoverPanel from "@/app/features/discover/DiscoverPanel";
import PlannerPanel from "@/app/features/planner/PlannerPanel";
import { useTheme } from "@/app/features/theme/model/theme-context";
import { supabase } from "@/app/lib/supabase";
import {
  type SidebarProfileFormValues,
  type SidebarTab,
} from "@/app/widgets/sidebar/model/sidebar.model";
import SidebarAccountModal from "@/app/widgets/sidebar/ui/SidebarAccountModal";
import SidebarSettingsPanel from "@/app/widgets/sidebar/ui/SidebarSettingsPanel";
import SidebarTabs from "@/app/widgets/sidebar/ui/SidebarTabs";

export interface SidebarProps {
  onEditPin?: (pinId: string) => void;
  mobileOpen?: boolean;
  mobileTab?: SidebarTab;
  onMobileClose?: () => void;
  onOpenEmail: () => void;
  settingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
}

export default function Sidebar({
  onEditPin,
  mobileOpen = false,
  mobileTab,
  onMobileClose,
  onOpenEmail,
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
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const activeTab = mobileTab ?? desktopActiveTab;
  const isCollapsed = collapsed && !mobileOpen;
  const accountInitials = (profile?.name?.[0] || user?.email?.[0] || "?").toUpperCase();
  const accountTriggerClassName = user
    ? "size-9 rounded-full bg-orange text-[11px] font-extrabold uppercase text-white hover:bg-orange-hover"
    : "size-9 rounded-full border border-orange/50 bg-bg-input text-orange hover:bg-orange-dim";

  const handleDesktopTabChange = useCallback((tab: SidebarTab) => {
    setDesktopActiveTab(tab);
    onSettingsClose();
  }, [onSettingsClose]);

  const handleToggleSettings = useCallback(() => {
    if (settingsOpen) {
      onSettingsClose();
      return;
    }

    onSettingsOpen();
  }, [onSettingsClose, onSettingsOpen, settingsOpen]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  function handleSaveProfile(values: SidebarProfileFormValues) {
    updateProfile(values);
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
          <div className="font-heading text-lg font-bold text-text-primary tracking-tight">Groundwork</div>
        </div>
        <div className="flex gap-1.5 items-center">
          <button
            onClick={onOpenEmail}
            className="icon-btn-size w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-orange-dim hover:text-orange relative"
            title="Email"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="22,7 12,13 2,7" />
            </svg>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon-lg"
                variant="ghost"
                aria-label={user ? "Open account menu" : "Open sign-in menu"}
                className={`shrink-0 ${accountTriggerClassName}`}
              >
                {user ? (
                  accountInitials
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21a8 8 0 00-16 0" />
                    <circle cx="12" cy="8" r="4" />
                  </svg>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-[190px]">
              <DropdownMenuItem onSelect={handleToggleSettings}>
                {settingsOpen ? "Close Settings" : "Open Settings"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAccountModalOpen(true)}>
                {user ? "Account Details" : "Sign In / Create Account"}
              </DropdownMenuItem>
              {user && (
                <DropdownMenuItem variant="destructive" onSelect={() => void handleSignOut()}>
                  Sign Out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SidebarTabs activeTab={activeTab} onSelectTab={handleDesktopTabChange} />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {settingsOpen ? (
          <SidebarSettingsPanel
            settingsToast={settingsToast}
            onSettingsClose={onSettingsClose}
            trackingEnabled={trackingEnabled}
            onToggleTracking={() => setTrackingEnabled(!trackingEnabled)}
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

      {accountModalOpen && (
        <SidebarAccountModal
          user={user}
          initialProfileValues={{
            name: profile?.name ?? "",
            company: profile?.company ?? "",
            homebase: profile?.homebase ?? "",
          }}
          onClose={() => setAccountModalOpen(false)}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </div>
  );
}
