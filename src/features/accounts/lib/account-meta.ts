import type { Account } from "@/shared/api/methods";

export const ROLE_LABEL: Record<Account["role"], string> = {
  admin: "管理员", operator: "运维", viewer: "只读", auditor: "审计"
};

export const ROLE_VARIANT = { admin: "danger", operator: "primary", viewer: "neutral", auditor: "warning" } as const;

export const STATUS_META: Record<Account["status"], { label: string; variant: "success" | "danger" | "warning" }> = {
  active: { label: "正常", variant: "success" },
  locked: { label: "锁定", variant: "danger" },
  invited: { label: "待接受", variant: "warning" }
};

export type RoleFilter = "all" | Account["role"];
export const ROLE_OPTS: ReadonlyArray<{ key: RoleFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "admin", label: "管理员" },
  { key: "operator", label: "运维" },
  { key: "viewer", label: "只读" },
  { key: "auditor", label: "审计" }
];
