import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const storageKey = "smalux-theme";

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const value = safeReadThemeMode();

  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export function resolveThemeMode(mode: ThemeMode): Exclude<ThemeMode, "system"> {
  if (mode !== "system") {
    return mode;
  }

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: readStoredMode(),
  setMode: (mode) => {
    safeWriteThemeMode(mode);
    set({ mode });
  }
}));

function safeReadThemeMode() {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function safeWriteThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // Theme persistence is best-effort; the in-memory store still updates below.
  }
}
