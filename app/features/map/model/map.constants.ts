import type { AppTheme } from "@/app/shared/model/theme";

export const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 27.9506, lng: -82.4572 };
export const DEFAULT_ZOOM = 12;
export const DEFAULT_MAP_ID = "DEMO_MAP_ID";

export type MapColorScheme = "LIGHT" | "DARK";

export const MAP_COLOR_SCHEME_BY_THEME: Record<AppTheme, MapColorScheme> = {
  light: "LIGHT",
  dark: "DARK",
};
