import * as React from "react";

import {
  initThemeFromConfig,
  resolveThemeMode,
  useThemeStore,
  type ThemeMode
} from "@/shared/stores/theme-store";

/**
 * Applies the resolved theme (light/dark) to <html> and reacts to system
 * preference changes when mode is "system". State lives in theme-store; this
 * component only syncs the DOM.
 */
export function ThemeProvider({
  children,
  initialMode
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const mode = useThemeStore((s) => s.mode);

  React.useEffect(() => {
    if (initialMode) {
      initThemeFromConfig(initialMode);
    }
  }, [initialMode]);

  React.useEffect(() => {
    const apply = () => {
      const resolved = resolveThemeMode(mode);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    apply();
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [mode, initialMode]);

  return <>{children}</>;
}
