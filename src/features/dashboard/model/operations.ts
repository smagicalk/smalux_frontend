import {
  BellIcon,
  ClipboardListIcon,
  Globe2Icon,
  ShieldAlertIcon,
  SquareTerminalIcon,
  TimerIcon,
  WorkflowIcon,
  type LucideIcon
} from "lucide-react";

import type { ExecutionRun } from "@/features/executions/model/mock-executions";
import type { LogEntry } from "@/features/logs/model/mock-logs";
import type { NotificationEvent } from "@/features/notifications/model/mock-notifications";
import type { PingCheck } from "@/features/ping/model/mock-ping";

export type OperationsSummaryItem = {
  icon: LucideIcon;
  title: string;
  badge: string;
  detail: string;
};

export type ControlPlaneAction = {
  icon: LucideIcon;
  title: string;
  detail: string;
  badge: string;
};

export const controlPlaneActions: readonly ControlPlaneAction[] = [
  {
    icon: TimerIcon,
    title: "计划任务",
    detail: "定时执行、失败策略和执行窗口",
    badge: "cron"
  },
  {
    icon: WorkflowIcon,
    title: "批量动作",
    detail: "节点刷新、探针重试和通知测试",
    badge: "rpc"
  },
  {
    icon: SquareTerminalIcon,
    title: "Web 终端",
    detail: "高风险入口，必须绑定权限与审计",
    badge: "guarded"
  }
];

type CreateOperationsSummaryInput = {
  failingPingChecks: readonly PingCheck[];
  failedRuns: readonly ExecutionRun[];
  notificationEvents: readonly NotificationEvent[];
  securityLogs: readonly LogEntry[];
};

export function createOperationsSummaryItems({
  failingPingChecks,
  failedRuns,
  notificationEvents,
  securityLogs
}: CreateOperationsSummaryInput): OperationsSummaryItem[] {
  return [
    {
      icon: Globe2Icon,
      title: "Ping 异常",
      badge: `${failingPingChecks.length}`,
      detail: failingPingChecks.map((check) => check.name).join(" / ") || "暂无异常"
    },
    {
      icon: ClipboardListIcon,
      title: "执行失败",
      badge: `${failedRuns.length}`,
      detail: failedRuns.map((run) => run.target).join(" / ") || "暂无失败"
    },
    {
      icon: BellIcon,
      title: "最近通知",
      badge: `${notificationEvents.length}`,
      detail: notificationEvents[0]?.detail ?? "暂无通知"
    },
    {
      icon: ShieldAlertIcon,
      title: "审计关注",
      badge: `${securityLogs.length}`,
      detail: securityLogs[0]?.action ?? "暂无审计事件"
    }
  ];
}
