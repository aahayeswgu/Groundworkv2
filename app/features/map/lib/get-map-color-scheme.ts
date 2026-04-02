import type { AppTheme } from "@/app/shared/model/theme";
import { MAP_COLOR_SCHEME_BY_THEME, type MapColorScheme } from "../model/map.constants";

export function getMapColorScheme(theme: AppTheme): MapColorScheme {
  return MAP_COLOR_SCHEME_BY_THEME[theme];
}
