import type { TaskStatus } from "@/shared/api/methods";

/** Task status → label + badge variant, shared by the queue, log, and dialogs. */
export const STATUS_META: Record<TaskStatus, { label: string; variant: "neutral" | "primary" | "warning" | "success" | "danger" }> = {
  pending: { label: "待审批", variant: "neutral" },
  approved: { label: "已批准", variant: "primary" },
  running: { label: "执行中", variant: "warning" },
  success: { label: "成功", variant: "success" },
  failed: { label: "失败", variant: "danger" },
  timeout: { label: "超时", variant: "danger" }
};

/** Risk level → badge variant. Reused by the queue rows, log rows, and templates. */
export const RISK_VARIANT = { low: "success", medium: "warning", high: "danger" } as const;

/** The four top-level tabs, in display order. */
export const TASK_TABS = [
  ["queue", "审批队列"],
  ["log", "任务日志"],
  ["dispatch", "下发"],
  ["templates", "模板"]
] as const;

export type TaskTab = (typeof TASK_TABS)[number][0];

/** The risk levels, in low→high order, with Chinese labels for the picker. */
export const RISK_LEVELS = [
  { key: "low", label: "低" },
  { key: "medium", label: "中" },
  { key: "high", label: "高" }
] as const;

export type DispatchPreset = { command: string; risk: "low" | "medium" | "high"; scope: string };
