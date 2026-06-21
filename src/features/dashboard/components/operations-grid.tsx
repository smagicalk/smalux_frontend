import { ControlPlaneCard } from "@/features/dashboard/components/control-plane-card";
import { OperationsExceptionCard } from "@/features/dashboard/components/operations-exception-card";
import { RecentEventsCard } from "@/features/dashboard/components/recent-events-card";
import { createOperationsSummaryItems } from "@/features/dashboard/model/operations";
import type { ExecutionRun } from "@/features/executions/model/mock-executions";
import type { LogEntry } from "@/features/logs/model/mock-logs";
import type { NotificationEvent } from "@/features/notifications/model/mock-notifications";
import type { PingCheck } from "@/features/ping/model/mock-ping";

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
  const summaryItems = createOperationsSummaryItems({
    failingPingChecks,
    failedRuns,
    notificationEvents,
    securityLogs
  });

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
      <OperationsExceptionCard items={summaryItems} />
      <RecentEventsCard logs={logs} />
      <ControlPlaneCard />
    </div>
  );
}
