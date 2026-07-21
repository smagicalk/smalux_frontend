import type { ServerStatus } from "@/shared/api/methods";

/** Server status → label + badge variant, shared by the grid rows and detail. */
export const STATUS_META: Record<ServerStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  online: { label: "在线", variant: "success" },
  warning: { label: "预警", variant: "warning" },
  offline: { label: "离线", variant: "danger" }
};

/** Sort keys for the server list. name/region are static; cpu/mem/disk are live. */
export type SortKey = "name" | "region" | "cpu" | "mem" | "disk";

/** Accent color for a status — drives the row's edge, dot, and hover hairline. */
export function statusColor(status: ServerStatus): string {
  if (status === "online") return "var(--success)";
  if (status === "warning") return "var(--warning)";
  return "var(--danger)";
}
