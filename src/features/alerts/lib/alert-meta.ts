import type { AlertSeverity } from "@/shared/api/methods";

/** Alert severity → label + badge variant, shared by rules, history, and the create dialog. */
export const SEVERITY_META: Record<AlertSeverity, { label: string; variant: "neutral" | "warning" | "danger" }> = {
  info: { label: "信息", variant: "neutral" },
  warning: { label: "警告", variant: "warning" },
  critical: { label: "严重", variant: "danger" }
};

/** Filter keys for the alert history tab. */
export type HistFilter = "all" | "open" | "resolved" | "critical";

export const HIST_OPTS: ReadonlyArray<{ key: HistFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "open", label: "未恢复" },
  { key: "resolved", label: "已恢复" },
  { key: "critical", label: "严重" }
];

/** Format a rule/historical threshold: ratios below 1 render as a percent, raw values as-is. */
export function formatThreshold(v: number): string {
  return v < 1 ? formatRatio(v) : String(v);
}

/** Render a 0..1 ratio as an integer percent (e.g. 0.85 → "85%"). */
export function formatRatio(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}
