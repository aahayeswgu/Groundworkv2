import type { MapsProvider } from "@/app/shared/model/maps-provider";

export type SidebarTab = "pins" | "discover" | "planner" | "route";

export interface SidebarTabItem {
  id: SidebarTab;
  label: string;
}

export const SIDEBAR_TABS: readonly SidebarTabItem[] = [
  { id: "pins", label: "Pins" },
  { id: "discover", label: "Discover" },
  { id: "planner", label: "Planner" },
  { id: "route", label: "Route" },
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

export interface SidebarMapProviderOption {
  value: MapsProvider;
  label: string;
}

export const SIDEBAR_MAP_PROVIDER_OPTIONS: readonly SidebarMapProviderOption[] = [
  { value: "google", label: "Google Maps" },
  { value: "apple", label: "Apple Maps" },
];

export interface SidebarProfileFormValues {
  name: string;
  company: string;
  homebase: string;
}
