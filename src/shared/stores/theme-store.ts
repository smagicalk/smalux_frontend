import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "indigo" | "emerald" | "cyan" | "violet" | "rose";

type ThemeState = {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
};

const storageKey = "smalux-theme";
const accentStorageKey = "smalux-accent";

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

function readStoredAccent(): AccentColor {
  if (typeof window === "undefined") return "indigo";
  const val = window.localStorage.getItem(accentStorageKey) as AccentColor;
  if (val && ["indigo", "emerald", "cyan", "violet", "rose"].includes(val)) {
    return val;
  }
  return "indigo";
}

export function resolveThemeMode(mode: ThemeMode): Exclude<ThemeMode, "system"> {
  if (mode !== "system") {
    return mode;
  }
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: readStoredMode(),
  accent: readStoredAccent(),
  setMode: (mode) => {
    safeWriteThemeMode(mode);
    set({ mode });
  },
  setAccent: (accent) => {
    try {
      window.localStorage.setItem(accentStorageKey, accent);
    } catch {
      // best-effort
    }
    set({ accent });
  }
}));

const CONFIG_APPLIED_KEY = "smalux-theme-config-applied";

export function initThemeFromConfig(configMode: ThemeMode) {
  if (typeof window === "undefined") return;
  let applied: boolean;
  try {
    applied = window.localStorage.getItem(CONFIG_APPLIED_KEY) === "1";
  } catch {
    return;
  }
  if (applied) return;
  const stored = safeReadThemeMode();
  if (stored === null) {
    safeWriteThemeMode(configMode);
    useThemeStore.setState({ mode: configMode });
  }
  try {
    window.localStorage.setItem(CONFIG_APPLIED_KEY, "1");
  } catch {
    // best-effort
  }
}

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
    // best-effort
  }
}
