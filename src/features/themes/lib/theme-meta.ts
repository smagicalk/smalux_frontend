import type { Theme } from "@/shared/api/methods";

/** Theme status → label + badge variant, shared by the cards and the funnel. */
export const STATUS_META: Record<Theme["status"], { label: string; variant: "neutral" | "success" | "warning" }> = {
  draft: { label: "草稿", variant: "neutral" },
  published: { label: "已发布", variant: "success" },
  archived: { label: "已归档", variant: "warning" }
};

export type StatusFilter = "all" | Theme["status"];
export const STATUS_OPTS: ReadonlyArray<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "published", label: "已发布" },
  { key: "draft", label: "草稿" },
  { key: "archived", label: "已归档" }
];

export type SortKey = "updated" | "name";
export const SORT_OPTS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "updated", label: "更新时间" },
  { key: "name", label: "名称" }
];

/** CSS-token swatches shown across the top of each theme card. */
export const SWATCHES = ["--primary", "--cyan", "--violet", "--magenta", "--success", "--warning", "--danger"] as const;
