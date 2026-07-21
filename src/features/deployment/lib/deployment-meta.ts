import type { DeploymentMode, DeploymentTarget } from "@/shared/api/methods";

/** Delivery mode → short label, shared by the header badge, the rows, and the radar. */
export const MODE_LABEL: Record<DeploymentMode, string> = {
  static: "纯静态",
  nginx: "Nginx 反代",
  "rust-embed": "Rust 内置 embed"
};

/** Longer one-liner shown under each deployment row. */
export const MODE_DESC: Record<DeploymentMode, string> = {
  static: "构建为静态资源，由 CDN / 对象存储托管。最轻量，无服务端运行时。",
  nginx: "Nginx 托管静态文件并反代 API。兼顾性能与可控性，需独立 Nginx 进程。",
  "rust-embed": "前端被打进 Rust 二进制，与后端同进程交付。单体部署，无额外静态服务。"
};

/** Build-target status → label + badge variant. */
export const STATUS_META: Record<DeploymentTarget["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  ready: { label: "就绪", variant: "success" },
  building: { label: "构建中", variant: "warning" },
  failed: { label: "失败", variant: "danger" }
};

/** Complexity → badge variant (used on the per-target complexity chip). */
export const COMPLEXITY_VARIANT = { low: "success", medium: "warning", high: "danger" } as const;

/** complexity → 0..10 score for the comparison radar. */
export const COMPLEXITY_SCORE: Record<DeploymentTarget["complexity"], number> = { low: 2, medium: 5, high: 9 };
