import type { BadgeVariant } from "@/shared/ui/badge";

import type { ExecutionRisk, ExecutionStatus } from "@/features/executions/model/mock-executions";

export const executionRiskMeta: Record<ExecutionRisk, { label: string; variant: BadgeVariant }> = {
  low: { label: "低风险", variant: "success" },
  medium: { label: "中风险", variant: "warning" },
  high: { label: "高风险", variant: "danger" }
};

export const executionStatusMeta: Record<
  ExecutionStatus,
  { label: string; variant: BadgeVariant }
> = {
  success: { label: "成功", variant: "success" },
  running: { label: "运行中", variant: "warning" },
  failed: { label: "失败", variant: "danger" },
  scheduled: { label: "已计划", variant: "secondary" }
};
