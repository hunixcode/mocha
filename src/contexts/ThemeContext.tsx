import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = "mocha" | "latte" | "espresso" | "matcha" | "midnight" | "caramel";

const STORAGE_KEY = "mocha_theme";
const DEFAULT_THEME: ThemeName = "mocha";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  themeNames: { value: ThemeName; label: string }[];
}

const THEME_NAMES: { value: ThemeName; label: string }[] = [
  { value: "mocha", label: "Mocha" },
  { value: "latte", label: "Latte" },
  { value: "espresso", label: "Espresso" },
  { value: "matcha", label: "Matcha" },
  { value: "midnight", label: "Midnight" },
  { value: "caramel", label: "Caramel" },
];

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEME_NAMES.some((t) => t.value === stored)) return stored as ThemeName;
    return DEFAULT_THEME;
  });

  function setTheme(t: ThemeName) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeNames: THEME_NAMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
