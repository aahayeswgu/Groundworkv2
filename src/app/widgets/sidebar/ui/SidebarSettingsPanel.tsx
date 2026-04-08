"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/app/store";
import {
  SIDEBAR_MAP_PROVIDER_OPTIONS,
  SIDEBAR_THEME_OPTIONS,
  type SidebarTheme,
} from "@/app/widgets/sidebar/model/sidebar.model";
import type { MapsProvider } from "@/app/shared/model/maps-provider";
import { getMapsRuntimePlatform } from "@/app/shared/lib/maps-links";
import { useIsMobile } from "@/app/shared/lib/use-is-mobile";

interface SidebarSettingsPanelProps {
  settingsToast: string | null;
  onSettingsClose: () => void;
  trackingEnabled: boolean;
  onToggleTracking: () => void;
  mapsProvider: MapsProvider;
  onMapsProviderChange: (provider: MapsProvider) => void;
  theme: SidebarTheme;
  onThemeChange: (theme: SidebarTheme) => void;
  onReplayTutorial: () => void;
  onSignOut?: () => void;
  mobileSheetSnapIndex?: number | null;
  onRequestExpand?: () => void;
}

export default function SidebarSettingsPanel({
  settingsToast,
  onSettingsClose,
  trackingEnabled,
  onToggleTracking,
  mapsProvider,
  onMapsProviderChange,
  theme,
  onThemeChange,
  onReplayTutorial,
  onSignOut,
  mobileSheetSnapIndex = null,
  onRequestExpand,
}: SidebarSettingsPanelProps) {
  const isMobile = useIsMobile();
  const pins = useStore((s) => s.pins);
  const deletePin = useStore((s) => s.deletePin);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const mapsPlatform = useMemo(() => getMapsRuntimePlatform(), []);
  const appleMapsSelectable = mapsPlatform === "ios";
  const effectiveMapsProvider: MapsProvider =
    mapsProvider === "apple" && !appleMapsSelectable ? "google" : mapsProvider;
  const isCompactMobileSheet = isMobile && mobileSheetSnapIndex !== null && mobileSheetSnapIndex <= 1;

  const trackingToggleTrackClass = trackingEnabled
    ? "border-orange bg-orange"
    : "border-[#666] bg-[#555]";
  const trackingToggleThumbClass = trackingEnabled
    ? "translate-x-5 bg-white"
    : "bg-[#999]";
  const activeMapsProviderLabel =
    SIDEBAR_MAP_PROVIDER_OPTIONS.find((option) => option.value === effectiveMapsProvider)?.label ?? "Google Maps";
  const activeThemeLabel =
    SIDEBAR_THEME_OPTIONS.find((option) => option.value === theme)?.label ?? "Dark";
  const compactSecondaryActionLabel = appleMapsSelectable
    ? `Switch to ${effectiveMapsProvider === "google" ? "Apple Maps" : "Google Maps"}`
    : `Switch to ${theme === "dark" ? "Graphite Theme" : "Dark Theme"}`;

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

  if (isCompactMobileSheet) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-border bg-bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-text-primary">Settings</div>
              <div className="text-xs text-text-muted">Profile and preferences</div>
            </div>
            <button
              type="button"
              onClick={() => onRequestExpand?.()}
              className="h-8 rounded-md border border-white/12 bg-white/5 px-3 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/10 hover:text-white"
            >
              Expand
            </button>
          </div>

          {settingsToast ? (
            <div className="mt-2 rounded-md border border-orange/30 bg-orange-dim px-3 py-2 text-xs font-semibold text-orange">
              {settingsToast}
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-1 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">GPS Auto Check-in</div>
              <div className="mt-1 text-sm font-semibold text-text-primary">{trackingEnabled ? "Enabled" : "Disabled"}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">Maps App</div>
                <div className="mt-1 text-[12px] font-semibold text-text-primary">{activeMapsProviderLabel}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">Theme</div>
                <div className="mt-1 text-[12px] font-semibold text-text-primary">{activeThemeLabel}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={onToggleTracking}
              className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-white/12 bg-white/5 px-3 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/10 hover:text-white"
            >
              {trackingEnabled ? "Disable GPS Auto Check-in" : "Enable GPS Auto Check-in"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (appleMapsSelectable) {
                  onMapsProviderChange(effectiveMapsProvider === "google" ? "apple" : "google");
                  return;
                }
                onThemeChange(theme === "dark" ? "gray" : "dark");
              }}
              className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-white/12 bg-white/5 px-3 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/10 hover:text-white"
            >
              {compactSecondaryActionLabel}
            </button>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-text-secondary">
            Drag up for full settings controls
          </div>
        </div>
      </div>
    );
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

      {/* Maps App */}
      <div className="px-5 py-4 border-b border-border">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-1">Maps App</div>
        <div className="text-[11px] text-text-secondary mb-3">
          Used by all Open Maps buttons. Default is Google Maps.
          {!appleMapsSelectable ? " Apple Maps is only available on iOS." : ""}
        </div>
        <div className="flex gap-2">
          {SIDEBAR_MAP_PROVIDER_OPTIONS.map((option) => {
            const isAppleOption = option.value === "apple";
            const disabled = isAppleOption && !appleMapsSelectable;
            return (
            <button
              key={option.value}
              type="button"
              onClick={() => onMapsProviderChange(option.value)}
              disabled={disabled}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                disabled
                  ? "bg-bg-input text-text-muted opacity-50 cursor-not-allowed"
                  : effectiveMapsProvider === option.value
                    ? "bg-orange text-white"
                    : "bg-bg-input text-text-secondary hover:text-text-primary hover:bg-bg-card"
              }`}
            >
              {option.label}
            </button>
            );
          })}
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
