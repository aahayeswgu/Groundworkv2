export const THEME_VALUES = ["light", "dark"] as const;

export type AppTheme = (typeof THEME_VALUES)[number];
