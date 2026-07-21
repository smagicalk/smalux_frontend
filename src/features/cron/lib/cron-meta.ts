import type { TaskStatus } from "@/shared/api/methods";

export const LAST_STATUS_META: Partial<Record<TaskStatus, { label: string; variant: "success" | "danger" | "neutral" }>> = {
  success: { label: "成功", variant: "success" },
  failed: { label: "失败", variant: "danger" },
  timeout: { label: "超时", variant: "danger" },
  running: { label: "执行中", variant: "neutral" }
};

export type Filter = "all" | "enabled" | "disabled";
export const FILTER_OPTS: ReadonlyArray<{ key: Filter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "enabled", label: "启用" },
  { key: "disabled", label: "停用" }
];

export type SortKey = "next" | "lastStatus" | "name";
export const SORT_OPTS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "next", label: "下次执行" },
  { key: "lastStatus", label: "上次状态" },
  { key: "name", label: "名称" }
];

/** ms → "2h 15m" / "45m" / "12s", flagged urgent under 10 minutes. */
export function formatCountdown(ms: number): { text: string; urgent: boolean } {
  if (ms <= 0) return { text: "即将执行", urgent: true };
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const urgent = ms < 10 * 60_000;
  if (h > 0) return { text: `${h}h ${m}m`, urgent };
  if (m > 0) return { text: `${m}m ${sec}s`, urgent };
  return { text: `${sec}s`, urgent };
}
