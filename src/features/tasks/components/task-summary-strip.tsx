import { useMemo } from "react";
import { Play, ShieldAlert, TerminalSquare } from "lucide-react";

import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { StatTile } from "@/shared/ui/layout";

/**
 * Page-level fleet summary, shown above the tabs so the operator keeps the
 * big picture while drilling into any tab. Pulled once from the unfiltered
 * task list; cheap because it's a single query the tabs already depend on.
 */
export function TaskSummaryStrip() {
  const { data, isLoading } = useTasks();
  const totals = useMemo(() => {
    const all = data?.tasks ?? [];
    return {
      total: all.length,
      pending: all.filter((t) => t.status === "pending").length,
      running: all.filter((t) => t.status === "running" || t.status === "approved").length,
      success: all.filter((t) => t.status === "success").length,
      failed: all.filter((t) => t.status === "failed" || t.status === "timeout").length
    };
  }, [data]);

  if (isLoading && !data) {
    return <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 shimmer rounded-md border border-border" />)}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-5">
      <StatTile label="任务总数" value={totals.total} accent="primary" icon={<TerminalSquare className="size-4" />} />
      <StatTile label="待审批" value={totals.pending} accent="warning" icon={<ShieldAlert className="size-4" />} />
      <StatTile label="执行中" value={totals.running} accent="primary" icon={<Play className="size-4" />} />
      <StatTile label="成功" value={totals.success} accent="success" />
      <StatTile label="失败/超时" value={totals.failed} accent="danger" />
    </div>
  );
}
