import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor =
  | "indigo"
  | "emerald"
  | "cyan"
  | "violet"
  | "rose"
  | "amber"
  | "teal"
  | "blue"
  | "fuchsia"
  | "orange";

export const ACCENT_PRESETS: Array<{ key: AccentColor; label: string; bg: string; dotClass: string }> = [
  { key: "indigo", label: "科技蓝 (Indigo)", bg: "bg-indigo-500", dotClass: "bg-indigo-500" },
  { key: "emerald", label: "极客绿 (Emerald)", bg: "bg-emerald-500", dotClass: "bg-emerald-500" },
  { key: "cyan", label: "天际青 (Cyan)", bg: "bg-cyan-500", dotClass: "bg-cyan-500" },
  { key: "violet", label: "星云紫 (Violet)", bg: "bg-purple-500", dotClass: "bg-purple-500" },
  { key: "rose", label: "烈焰红 (Rose)", bg: "bg-rose-500", dotClass: "bg-rose-500" },
  { key: "amber", label: "琥珀金 (Amber)", bg: "bg-amber-500", dotClass: "bg-amber-500" },
  { key: "teal", label: "碧海青 (Teal)", bg: "bg-teal-500", dotClass: "bg-teal-500" },
  { key: "blue", label: "群青蓝 (Royal Blue)", bg: "bg-blue-600", dotClass: "bg-blue-600" },
  { key: "fuchsia", label: "赛博粉 (Fuchsia)", bg: "bg-fuchsia-500", dotClass: "bg-fuchsia-500" },
  { key: "orange", label: "烈阳橙 (Orange)", bg: "bg-orange-500", dotClass: "bg-orange-500" }
];

type ThemeState = {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  cycleAccent: () => void;
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

const VALID_ACCENTS: AccentColor[] = [
  "indigo",
  "emerald",
  "cyan",
  "violet",
  "rose",
  "amber",
  "teal",
  "blue",
  "fuchsia",
  "orange"
];

function readStoredAccent(): AccentColor {
  if (typeof window === "undefined") return "indigo";
  const val = window.localStorage.getItem(accentStorageKey) as AccentColor;
  if (val && VALID_ACCENTS.includes(val)) {
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

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: readStoredMode(),
  accent: readStoredAccent(),
  setMode: (mode) => {
    safeWriteThemeMode(mode);
    set({ mode });
  },
  setAccent: (accent) => {
    try {
      window.localStorage.setItem(accentStorageKey, accent);
      document.documentElement.setAttribute("data-accent", accent);
    } catch {
      // best-effort
    }
    set({ accent });
  },
  cycleAccent: () => {
    const current = get().accent;
    const idx = VALID_ACCENTS.indexOf(current);
    const next = VALID_ACCENTS[(idx + 1) % VALID_ACCENTS.length];
    get().setAccent(next);
  }
}));

function safeReadThemeMode(): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function safeWriteThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // ignore
  }
}

/**
 * Initialize theme and accent DOM attributes from local storage or runtime config
 */
export function initThemeFromConfig(initialMode?: ThemeMode): void {
  if (typeof window === "undefined") return;

  const stored = safeReadThemeMode();
  if (!stored && initialMode) {
    useThemeStore.getState().setMode(initialMode);
  }

  const currentAccent = readStoredAccent();
  document.documentElement.setAttribute("data-accent", currentAccent);
}
