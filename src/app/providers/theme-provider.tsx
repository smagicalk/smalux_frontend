import { useEffect, type ReactNode } from "react";

import { resolveThemeMode, useThemeStore } from "@/shared/stores/theme-store";

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    const applyTheme = () => {
      const resolvedMode = resolveThemeMode(mode);
      document.documentElement.classList.toggle("dark", resolvedMode === "dark");
      document.documentElement.dataset.theme = mode;
    };

    applyTheme();

    if (mode !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [mode]);

  return children;
}
