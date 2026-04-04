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
}

export default function SidebarSettingsPanel({
  settingsToast,
  onSettingsClose,
  trackingEnabled,
  onToggleTracking,
  theme,
  onThemeChange,
}: SidebarSettingsPanelProps) {
  const trackingToggleTrackClass = trackingEnabled
    ? "border-orange bg-orange"
    : "border-[#666] bg-[#555]";
  const trackingToggleThumbClass = trackingEnabled
    ? "translate-x-5 bg-white"
    : "bg-[#999]";

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
        <span className="text-base font-bold text-text-primary">Settings</span>
      </div>

      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">GPS Auto Check-in</div>
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

      <div className="px-5 py-4 border-b border-border">
        <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">UI Theme</div>
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
    </div>
  );
}
