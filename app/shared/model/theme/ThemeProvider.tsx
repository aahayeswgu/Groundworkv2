"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { THEME_VALUES, type AppTheme } from "./theme.types";

const THEME_STORAGE_KEY = "groundwork-theme";
const DEFAULT_THEME: AppTheme = "dark";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isAppTheme(value: string | null): value is AppTheme {
  return value !== null && THEME_VALUES.includes(value as AppTheme);
}

function getNextTheme(theme: AppTheme): AppTheme {
  const index = THEME_VALUES.indexOf(theme);
  const nextIndex = (index + 1) % THEME_VALUES.length;
  return THEME_VALUES[nextIndex];
}

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isAppTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => getNextTheme(prev));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
