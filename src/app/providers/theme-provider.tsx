import * as React from "react";

import {
  initThemeFromConfig,
  resolveThemeMode,
  useThemeStore,
  type ThemeMode
} from "@/shared/stores/theme-store";

export function ThemeProvider({
  children,
  initialMode
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);

  React.useEffect(() => {
    if (initialMode) {
      initThemeFromConfig(initialMode);
    }
  }, [initialMode]);

  React.useEffect(() => {
    const apply = () => {
      const resolved = resolveThemeMode(mode);
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.setAttribute("data-accent", accent);
    };
    apply();
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [mode, accent, initialMode]);

  return <>{children}</>;
}
