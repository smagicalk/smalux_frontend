import {
  BellIcon,
  ClipboardListIcon,
  Globe2Icon,
  ShieldAlertIcon,
  SquareTerminalIcon,
  TimerIcon,
  WorkflowIcon
} from "lucide-react";

import type { ExecutionRun } from "@/features/executions/model/mock-executions";
import type { LogEntry } from "@/features/logs/model/mock-logs";
import type { NotificationEvent } from "@/features/notifications/model/mock-notifications";
import type { PingCheck } from "@/features/ping/model/mock-ping";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { InteractiveCardButton } from "@/shared/ui/card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

type OperationsGridProps = {
  pingChecks: PingCheck[];
  executionRuns: ExecutionRun[];
  notificationEvents: NotificationEvent[];
  logs: LogEntry[];
};

export function OperationsGrid({
  pingChecks,
  executionRuns,
  notificationEvents,
  logs
}: OperationsGridProps) {
  const failingPingChecks = pingChecks.filter((check) => check.status !== "ok");
  const failedRuns = executionRuns.filter((run) => run.status === "failed");
  const securityLogs = logs.filter((log) => log.kind === "audit" || log.result === "failed");

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card tone="strong">
        <CardHeader>
          <CardTitle>异常队列</CardTitle>
          <CardDescription>优先显示现在就要处理的对象，不把状态线索埋进说明文本里。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <OverviewItem
            icon={Globe2Icon}
            title="Ping 异常"
            badge={`${failingPingChecks.length}`}
            detail={failingPingChecks.map((check) => check.name).join(" / ") || "暂无异常"}
            onClick={() =>
              toast.info("Ping 异常", {
                description: failingPingChecks.map((check) => check.name).join(" / ") || "暂无异常"
              })
            }
          />
          <OverviewItem
            icon={ClipboardListIcon}
            title="执行失败"
            badge={`${failedRuns.length}`}
            detail={failedRuns.map((run) => run.target).join(" / ") || "暂无失败"}
            onClick={() =>
              toast.info("执行失败", {
                description: failedRuns.map((run) => run.target).join(" / ") || "暂无失败"
              })
            }
          />
          <OverviewItem
            icon={BellIcon}
            title="最近通知"
            badge={`${notificationEvents.length}`}
            detail={notificationEvents[0]?.detail ?? "暂无通知"}
            onClick={() =>
              toast.info("最近通知", {
                description: notificationEvents[0]?.detail ?? "暂无通知"
              })
            }
          />
          <OverviewItem
            icon={ShieldAlertIcon}
            title="审计关注"
            badge={`${securityLogs.length}`}
            detail={securityLogs[0]?.action ?? "暂无审计事件"}
            onClick={() =>
              toast.info("审计关注", {
                description: securityLogs[0]?.action ?? "暂无审计事件"
              })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近事件</CardTitle>
          <CardDescription>按时间顺序快速扫最近动态，而不是做成大卡片说明区。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {logs.slice(0, 4).map((log) => (
            <InteractiveCardButton
              key={log.id}
              tone="muted"
              padding="sm"
              onClick={() =>
                toast.info(log.action, {
                  description: `${log.kind} · ${log.result} · ${log.detail}`
                })
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={log.result === "failed" ? "danger" : "outline"}>{log.kind}</Badge>
                <span className="truncate text-sm font-semibold tracking-[-0.02em]">{log.action}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{log.detail}</p>
            </InteractiveCardButton>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>运维控制面</CardTitle>
          <CardDescription>对齐哪吒类后台的常见入口：计划任务、批量执行、Web 终端和审计回放。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <ControlPlaneItem
            icon={TimerIcon}
            title="计划任务"
            detail="定时执行、失败策略和执行窗口"
            badge="cron"
            onClick={() =>
              toast.info("计划任务", {
                description: "定时执行、失败策略和执行窗口"
              })
            }
          />
          <ControlPlaneItem
            icon={WorkflowIcon}
            title="批量动作"
            detail="节点刷新、探针重试和通知测试"
            badge="rpc"
            onClick={() =>
              toast.info("批量动作", {
                description: "节点刷新、探针重试和通知测试"
              })
            }
          />
          <ControlPlaneItem
            icon={SquareTerminalIcon}
            title="Web 终端"
            detail="高风险入口，必须绑定权限与审计"
            badge="guarded"
            onClick={() =>
              toast.info("Web 终端", {
                description: "高风险入口，必须绑定权限与审计"
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

type OverviewItemProps = {
  icon: typeof Globe2Icon;
  title: string;
  badge: string;
  detail: string;
  onClick: () => void;
};

function OverviewItem({ icon: Icon, title, badge, detail, onClick }: OverviewItemProps) {
  return (
    <InteractiveCardButton tone="muted" padding="sm" onClick={onClick}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-muted-foreground dark:bg-white/8">
            <Icon className="size-4" aria-hidden />
          </div>
          <p className="truncate text-sm font-semibold tracking-[-0.02em]">{title}</p>
        </div>
        <Badge variant="outline">{badge}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </InteractiveCardButton>
  );
}

type ControlPlaneItemProps = {
  icon: typeof TimerIcon;
  title: string;
  detail: string;
  badge: string;
  onClick: () => void;
};

function ControlPlaneItem({ icon: Icon, title, detail, badge, onClick }: ControlPlaneItemProps) {
  return (
    <InteractiveCardButton
      tone="muted"
      padding="sm"
      className="flex w-full items-center justify-between gap-3"
      onClick={onClick}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-muted-foreground dark:bg-white/8">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[-0.02em]">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
      <Badge variant="outline">{badge}</Badge>
    </InteractiveCardButton>
  );
}
