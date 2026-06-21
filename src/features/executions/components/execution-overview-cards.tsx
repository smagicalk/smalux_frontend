import {
  CalendarClockIcon,
  ClipboardListIcon,
  ShieldAlertIcon,
  TerminalSquareIcon
} from "lucide-react";

import { StatCard } from "@/shared/ui/stat-card";

type ExecutionOverviewCardsProps = {
  templateCount: number;
  scheduledCount: number;
  runCount: number;
  failedRunCount: number;
};

export function ExecutionOverviewCards({
  templateCount,
  scheduledCount,
  runCount,
  failedRunCount
}: ExecutionOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="命令模板"
        value={`${templateCount}`}
        description="模板先决定能力边界，再决定谁能执行。"
        icon={TerminalSquareIcon}
        tone="primary"
      />
      <StatCard
        label="定时任务"
        value={`${scheduledCount}`}
        description="cron、并发、超时和失败策略都属于同一组控制面。"
        icon={CalendarClockIcon}
        tone="info"
      />
      <StatCard
        label="执行记录"
        value={`${runCount}`}
        description={`${failedRunCount} 条失败，需要回溯命令、目标和审批链。`}
        icon={ClipboardListIcon}
        tone={failedRunCount > 0 ? "warning" : "success"}
      />
      <StatCard
        label="二次确认"
        value="强制"
        description="高风险命令和写操作必须经确认或审批。"
        icon={ShieldAlertIcon}
        tone="danger"
      />
    </div>
  );
}
