import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";

import { useApproveTask, useTasks } from "@/features/tasks/hooks/use-tasks";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/layout";
import { EChart, chartPalette } from "@/shared/charts/echart";
import { ringProgressOption, stackedBarOption } from "@/shared/charts/chart-options";
import { toast } from "@/shared/ui/toaster";
import { cn } from "@/shared/lib/utils";

import { RISK_VARIANT, STATUS_META } from "../lib/task-meta";

/**
 * The approval queue: pending + approved high-risk tasks, plus a success-rate
 * ring and a 7-day outcome bar so the operator sees throughput alongside the
 * items waiting on them.
 */
export function ApprovalQueue({ onJumpToLog }: { onJumpToLog: () => void }) {
  const { data, isLoading } = useTasks();
  const approve = useApproveTask();
  const pending = useMemo(
    () => (data?.tasks ?? []).filter((t) => t.status === "pending" || t.status === "approved"),
    [data]
  );

  const totals = useMemo(() => {
    const all = data?.tasks ?? [];
    return {
      success: all.filter((t) => t.status === "success").length,
      failed: all.filter((t) => t.status === "failed" || t.status === "timeout").length
    };
  }, [data]);

  if (isLoading) return <EmptyState text="加载审批队列…" />;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="glass cornered relative overflow-hidden rounded-md border border-border p-2">
          <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--success), transparent)" }} />
          <div className="px-1 pb-1 text-xs text-muted-foreground">成功率</div>
          <SuccessRing success={totals.success} failed={totals.failed} />
        </div>
        <div className="glass cornered relative overflow-hidden rounded-md border border-border p-2 lg:col-span-3">
          <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
          <div className="px-1 pb-1 text-xs text-muted-foreground">近 7 日任务结果</div>
          <EChart
            option={stackedBarOption(
              ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
              [
                { name: "成功", values: [12, 18, 9, 22, 15, 6, 8] },
                { name: "执行中", values: [2, 1, 3, 1, 2, 0, 1] },
                { name: "失败", values: [1, 2, 0, 3, 1, 1, 0] }
              ]
            )}
            height={180}
          />
        </div>
      </div>

      {!pending.length ? (
        <EmptyState text="审批队列为空，没有待处理的高风险任务。" icon={<ShieldAlert className="size-8" />} />
      ) : (
        <ul className="space-y-2">
          {pending.map((t) => {
            const meta = STATUS_META[t.status];
            const risk = RISK_VARIANT[t.risk];
            const edgeColor = t.risk === "high" ? "var(--danger)" : t.risk === "medium" ? "var(--warning)" : "var(--success)";
            return (
              <li key={t.id} className="glass cornered group relative overflow-hidden rounded-md border border-border p-3 pl-4 transition-colors hover:border-primary/40">
                <span className="absolute inset-y-0 left-0 w-1" style={{ background: edgeColor, boxShadow: `0 0 10px ${edgeColor}` }} />
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldAlert className={cn("size-4", t.risk === "high" ? "text-danger" : "text-warning")} />
                  <span className="font-medium group-hover:text-primary">{t.serverName}</span>
                  <Badge variant={risk}>{t.risk}</Badge>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <code className="ml-auto max-w-[55%] truncate rounded bg-muted px-1.5 py-0.5 text-xs" title={t.command}>
                    {t.command}
                  </code>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>scope: {t.scope}</span>
                  {t.approver ? <span>· 审批人: {t.approver}</span> : null}
                  <div className="ml-auto flex gap-1.5">
                    {t.status === "pending" ? (
                      <Button
                        size="sm"
                        onClick={() => approve.mutate(t.id, {
                          onSuccess: () => toast.success("已批准，任务开始执行"),
                          onError: () => toast.error("批准失败")
                        })}
                        disabled={approve.isPending}
                      >
                        批准执行
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={onJumpToLog}>查看日志</Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Half-ring: task success rate over the (mock) 7-day window. */
function SuccessRing({ success, failed }: { success: number; failed: number }) {
  const palette = chartPalette();
  const total = success + failed;
  const ratio = total ? success / total : 0;
  const color = ratio > 0.9 ? palette.success : ratio > 0.7 ? palette.warning : palette.danger;
  const option = useMemo(
    () => ringProgressOption(ratio, "成功", color),
    [ratio, color]
  );
  return (
    <div className="flex flex-col items-center gap-1">
      <EChart option={option} height={150} />
      <span className="text-[11px] text-muted-foreground">{success} 成功 / {failed} 失败</span>
    </div>
  );
}
