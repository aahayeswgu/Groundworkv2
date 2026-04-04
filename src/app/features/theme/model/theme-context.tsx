"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Theme } from "./theme.types";

const THEME_STORAGE_KEY = "gw-theme";
const THEME_COOKIE_KEY = "gw-theme";
const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

interface ThemeProviderProps {
  initialTheme: Theme;
  children: React.ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ initialTheme, children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_COOKIE_KEY}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme }),
    [setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
