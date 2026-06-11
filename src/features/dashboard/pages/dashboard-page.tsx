import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { mockExecutionRuns } from "@/features/executions/model/mock-executions";
import { mockLogs } from "@/features/logs/model/mock-logs";
import { mockNodes } from "@/features/nodes/model/mock-nodes";
import { mockNotificationEvents } from "@/features/notifications/model/mock-notifications";
import { mockPingChecks } from "@/features/ping/model/mock-ping";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";
import { OverviewMetrics } from "@/features/dashboard/components/overview-metrics";
import { OperationsGrid } from "@/features/dashboard/components/operations-grid";
import { RuntimeStatusStrip } from "@/features/dashboard/components/runtime-status-strip";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Command Surface"
        title="监控总览"
        description="这里只保留首页真正该看的内容：当前状态、异常队列和关键趋势。其他模块去各自页面看。"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success("总览视图已刷新", {
                description: `${mockNodes.length} 台节点、${mockPingChecks.length} 个监测目标、${mockLogs.length} 条审计日志已重新汇总。`
              })
            }
          >
            <RefreshCwIcon data-icon="inline-start" aria-hidden />
            刷新视图
          </Button>
        }
      />
      <RuntimeStatusStrip />
      <OverviewMetrics nodes={mockNodes} />
      <OperationsGrid
        pingChecks={mockPingChecks}
        executionRuns={mockExecutionRuns}
        notificationEvents={mockNotificationEvents}
        logs={mockLogs}
      />
      <DashboardCharts />
    </>
  );
}
