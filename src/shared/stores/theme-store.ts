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

const CONFIG_APPLIED_KEY = "smalux-theme-config-applied";

/**
 * Apply the runtime-config theme as the default when the user has never
 * chosen one themselves. Idempotent: only writes on the very first boot so
 * a later config change doesn't override an explicit user preference.
 */
export function initThemeFromConfig(configMode: ThemeMode) {
  if (typeof window === "undefined") return;
  let applied: boolean;
  try {
    applied = window.localStorage.getItem(CONFIG_APPLIED_KEY) === "1";
  } catch {
    return;
  }
  if (applied) return;
  // Only seed from config if there is no stored preference yet.
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
    // Theme persistence is best-effort; the in-memory store still updates below.
  }
}
