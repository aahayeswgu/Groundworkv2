"use client";

import { useEffect, useId, useState } from "react";
import {
  MOBILE_PRIMARY_TABS,
  MOBILE_QUICK_ACTIONS,
  type MobilePrimaryTab,
  type MobileQuickActionItem,
  type MobilePrimaryTabItem,
} from "@/app/widgets/mobile-navigation/model/mobile-navigation.model";
import {
  dispatchMapMobileAction,
  dispatchOpenMobileTab,
} from "@/app/shared/model/mobile-events";
import {
  useDiscoverMode,
  useIsDrawing,
} from "@/app/features/discover/model/discover.selectors";

interface MobileBottomBarProps {
  activeTab: MobilePrimaryTab;
  onSelectTab: (tab: MobilePrimaryTab) => void;
  onOpenSettings: () => void;
  onOpenEmail: () => void;
}

export default function MobileBottomBar({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenEmail,
}: MobileBottomBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const quickActionsId = useId();
  const discoverMode = useDiscoverMode();
  const isDrawing = useIsDrawing();

  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  function handlePrimaryTab(tab: MobilePrimaryTab) {
    setDrawerOpen(false);
    onSelectTab(tab);
  }

  function handleQuickAction(action: MobileQuickActionItem) {
    if (action.id === "discover" && discoverMode && !isDrawing) {
      dispatchOpenMobileTab("pins");
      setDrawerOpen(false);
      return;
    }

    if (action.id === "route") {
      dispatchOpenMobileTab("route");
      setDrawerOpen(false);
      return;
    }

    if (action.mapAction) {
      dispatchMapMobileAction(action.mapAction);
      setDrawerOpen(false);
      return;
    }

    if (action.id === "email") {
      onOpenEmail();
      setDrawerOpen(false);
      return;
    }

    if (action.id === "settings") {
      onOpenSettings();
      setDrawerOpen(false);
    }
  }

  return (
    <>
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close quick actions"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-[55] bg-black/45 lg:hidden"
        />
      )}

      {drawerOpen && (
        <div
          id={quickActionsId}
          role="dialog"
          aria-modal="true"
          aria-label="Quick actions"
          className="fixed inset-x-3 z-[65] rounded-3xl border border-border bg-bg-card/95 shadow-gw-lg backdrop-blur-md lg:hidden bottom-[var(--mobile-bottom-bar-offset)]"
        >
          <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-border" />
          <div className="px-4 pb-4 pt-3">
            <div className="mb-3 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action)}
                  className="flex items-start gap-2 rounded-2xl border border-border bg-bg-secondary/70 px-3 py-3 text-left transition-colors hover:border-orange/45 hover:bg-orange-dim"
                >
                  <span className="mt-0.5 shrink-0 text-orange">
                    <QuickActionIcon icon={action.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-heading block text-sm font-semibold text-text-primary">{action.label}</span>
                    <span className="block text-[11px] leading-4 text-text-secondary">{action.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary mobile navigation"
        className="mobile-bottom-bar fixed bottom-0 inset-x-0 z-[70] flex lg:hidden bg-bg-card/95 border-t border-border pb-[calc(6px+env(safe-area-inset-bottom,0px))] pt-1.5 shadow-[0_-2px_12px_rgba(0,0,0,0.15)]"
      >
        <div className="grid w-full grid-cols-4 items-stretch gap-0 px-2">
          {MOBILE_PRIMARY_TABS.map((tab) => (
            <MobileTabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => handlePrimaryTab(tab.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label={drawerOpen ? "Close quick actions" : "Open quick actions"}
            aria-expanded={drawerOpen}
            aria-controls={quickActionsId}
            aria-haspopup="dialog"
            className={`flex h-full w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors ${
              drawerOpen ? "text-orange" : "text-text-muted"
            }`}
          >
            <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
            More
          </button>
        </div>
      </nav>
    </>
  );
}

function MobileTabButton({
  tab,
  active,
  onClick,
}: {
  tab: MobilePrimaryTabItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className={`flex h-full w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors ${
        active ? "text-orange" : "text-text-muted"
      }`}
    >
      <span className={`rounded-xl px-2 py-1 transition-colors ${active ? "bg-orange-dim" : ""}`}>
        <PrimaryTabIcon icon={tab.icon} />
      </span>
      {tab.label}
    </button>
  );
}

function PrimaryTabIcon({ icon }: { icon: MobilePrimaryTabItem["icon"] }) {
  if (icon === "map") {
    return (
      <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }

  if (icon === "pins") {
    return (
      <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    );
  }

  return (
    <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function QuickActionIcon({ icon }: { icon: MobileQuickActionItem["icon"] }) {
  if (icon === "discover") {
    return (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    );
  }

  if (icon === "route") {
    return (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    );
  }

  if (icon === "drop-pin") {
    return (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  }

  if (icon === "voice-note") {
    return (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    );
  }

  if (icon === "email") {
    return (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="22,7 12,13 2,7" />
      </svg>
    );
  }

  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
