"use client";

import { useState } from "react";
import { useStore } from "@/app/store";
import {
  SIDEBAR_THEME_OPTIONS,
  type SidebarTheme,
} from "@/app/widgets/sidebar/model/sidebar.model";

interface SidebarSettingsPanelProps {
  settingsToast: string | null;
  onSettingsClose: () => void;
  trackingEnabled: boolean;
  onToggleTracking: () => void;
  theme: SidebarTheme;
  onThemeChange: (theme: SidebarTheme) => void;
  onReplayTutorial: () => void;
  onSignOut?: () => void;
}

export default function SidebarSettingsPanel({
  settingsToast,
  onSettingsClose,
  trackingEnabled,
  onToggleTracking,
  theme,
  onThemeChange,
  onReplayTutorial,
  onSignOut,
}: SidebarSettingsPanelProps) {
  const pins = useStore((s) => s.pins);
  const deletePin = useStore((s) => s.deletePin);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const trackingToggleTrackClass = trackingEnabled
    ? "border-orange bg-orange"
    : "border-[#666] bg-[#555]";
  const trackingToggleThumbClass = trackingEnabled
    ? "translate-x-5 bg-white"
    : "bg-[#999]";

  function handleDeleteAllPins() {
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true);
      return;
    }
    const pinIds = pins.map((p) => p.id);
    for (const id of pinIds) {
      deletePin(id);
    }
    setConfirmDeleteAll(false);
  }

  function handleBugReport() {
    const subject = encodeURIComponent("Groundwork Bug Report");
    const body = encodeURIComponent(
      `Describe the bug:\n\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\n\nDevice/Browser: ${navigator.userAgent}\n`,
    );
    window.open(`mailto:support@groundwork.app?subject=${subject}&body=${body}`, "_blank");
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
      {settingsToast && (
        <div className="mx-5 mt-3 rounded-lg bg-orange px-4 py-2 text-center text-sm font-semibold text-white animate-[fadeInOut_2.5s_ease]">
          {settingsToast}
        </div>
      )}

      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button
          onClick={onSettingsClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-orange-dim hover:text-orange transition-all duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="font-heading text-base font-bold text-text-primary">Settings</span>
      </div>

      {/* GPS Auto Check-in */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">GPS Auto Check-in</div>
            <div className="text-[11px] text-text-secondary mt-1">Auto-mark stops visited when nearby (~200ft)</div>
          </div>
          <button
            onClick={onToggleTracking}
            className={`relative h-6 w-11 rounded-full border transition-colors duration-200 ${trackingToggleTrackClass}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow transition-transform duration-200 ${trackingToggleThumbClass}`}
            />
          </button>
        </div>
      </div>

      {/* UI Theme */}
      <div className="px-5 py-4 border-b border-border">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-3">UI Theme</div>
        <div className="flex gap-2">
          {SIDEBAR_THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onThemeChange(option.value)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                theme === option.value
                  ? "bg-orange text-white"
                  : "bg-bg-input text-text-secondary hover:text-text-primary hover:bg-bg-card"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Replay Tutorial */}
      <div className="px-5 py-4 border-b border-border">
        <button
          onClick={() => {
            onSettingsClose();
            onReplayTutorial();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-orange-dim hover:text-orange"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
          Replay App Tutorial
        </button>
      </div>

      {/* Delete All Pins */}
      <div className="px-5 py-4 border-b border-border">
        <button
          onClick={handleDeleteAllPins}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            confirmDeleteAll
              ? "bg-gw-red/10 text-gw-red"
              : "text-text-primary hover:bg-gw-red/10 hover:text-gw-red"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
          {confirmDeleteAll
            ? `Tap again to delete ${pins.length} pin${pins.length !== 1 ? "s" : ""}`
            : `Delete All Pins (${pins.length})`}
        </button>
        {confirmDeleteAll && (
          <button
            onClick={() => setConfirmDeleteAll(false)}
            className="mt-1 w-full text-center text-xs text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Bug Report */}
      <div className="px-5 py-4 border-b border-border">
        <button
          onClick={handleBugReport}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-orange-dim hover:text-orange"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2l1.88 1.88" />
            <path d="M14.12 3.88L16 2" />
            <path d="M9 7.13v-1a3.003 3.003 0 116 0v1" />
            <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6" />
            <path d="M12 20v-9" />
            <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
            <path d="M6 13H2" />
            <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
            <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
            <path d="M22 13h-4" />
            <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
          </svg>
          Report a Bug
        </button>
      </div>

      {/* Sign Out */}
      {onSignOut && (
        <div className="px-5 py-4 border-b border-border">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gw-red transition-colors hover:bg-gw-red/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
