import type { AppTheme } from "@/app/shared/model/theme";

export function getMapColorScheme(theme: AppTheme): "LIGHT" | "DARK" {
  return theme === "dark" ? "DARK" : "LIGHT";
}
