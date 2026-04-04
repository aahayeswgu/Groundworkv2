export type SidebarTab = "pins" | "planner";

export interface SidebarTabItem {
  id: SidebarTab;
  label: string;
}

export const SIDEBAR_TABS: readonly SidebarTabItem[] = [
  { id: "pins", label: "Pins" },
  { id: "planner", label: "Planner" },
];

export type SidebarTheme = "dark" | "gray";

export interface SidebarThemeOption {
  value: SidebarTheme;
  label: string;
}

export const SIDEBAR_THEME_OPTIONS: readonly SidebarThemeOption[] = [
  { value: "dark", label: "Dark" },
  { value: "gray", label: "Graphite" },
];

