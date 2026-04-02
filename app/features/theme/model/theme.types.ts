export type Theme = "dark" | "gray";

export function isTheme(value: string | undefined): value is Theme {
  return value === "dark" || value === "gray";
}
