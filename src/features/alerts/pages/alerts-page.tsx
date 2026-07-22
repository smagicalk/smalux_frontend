import { useState } from "react";
import { Plus } from "lucide-react";

import { useAlerts } from "@/features/alerts/hooks/use-alerts";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { StatTile } from "@/shared/ui/layout";
import { cn } from "@/shared/lib/utils";

import { CreateAlertDialog } from "../components/create-alert-dialog";
import { AlertSkeleton } from "../components/alert-skeleton";
import { RulesList } from "../components/rules-list";
import { HistoryList } from "../components/history-list";
import {
  ChartPanel,
  ActiveRatioRing,
  ServerPolar,
  SeverityDonut,
  HistoryTrend
} from "../components/alert-charts";

/**
 * The alerts hub. This page owns the rules/history tab switch and renders the
 * KPI strip + four-chart band; the create dialog, the rule list, the history
 * list, and each chart each live in their own component.
 */
export function AlertsPage() {
  const { data, isLoading } = useAlerts();
  const [tab, setTab] = useState<"rules" | "history">("rules");
  const [createOpen, setCreateOpen] = useState(false);

  const active = (data?.history ?? []).filter((h) => h.resolvedAt == null);
  const history = data?.history ?? [];
  const rules = data?.rules ?? [];
  const sevBreakdown = {
    critical: history.filter((h) => h.severity === "critical" && h.resolvedAt == null).length,
    warning: history.filter((h) => h.severity === "warning" && h.resolvedAt == null).length,
    info: history.filter((h) => h.severity === "info" && h.resolvedAt == null).length
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="告警"
        tone="danger"
        subtitle={`${active.length} 未恢复`}
        action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5" />新建规则</Button>}
      />
      <CreateAlertDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatTile label="规则总数" value={rules.length} accent="magenta" />
          <StatTile label="启用中" value={rules.filter((r) => r.enabled).length} accent="success" progress={rules.length ? rules.filter((r) => r.enabled).length / rules.length : 0} />
          <StatTile label="严重·未恢复" value={sevBreakdown.critical} accent="danger" />
          <StatTile label="警告·未恢复" value={sevBreakdown.warning} accent="warning" />
          <StatTile label="已静默" value={rules.filter((r) => r.silenced).length} accent="violet" />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <ChartPanel title="严重程度分布" className="lg:col-span-1">
            <SeverityDonut rules={data?.rules ?? []} />
          </ChartPanel>
          <ChartPanel title="未恢复占比" subtitle="实时">
            <ActiveRatioRing active={active.length} resolved={(data?.history ?? []).filter((h) => h.resolvedAt != null).length} />
          </ChartPanel>
          <ChartPanel title="按服务器" subtitle="触发次数">
            <ServerPolar history={data?.history ?? []} />
          </ChartPanel>
          <ChartPanel title="近 24h 告警触发" className="lg:col-span-1">
            <HistoryTrend history={data?.history ?? []} />
          </ChartPanel>
        </div>

        <div className="flex items-center gap-1 border-b border-border px-1">
          {(
            [
              ["rules", `规则 ${data?.rules.length ?? 0}`],
              ["history", `历史 ${data?.history.length ?? 0}`]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "h-9 border-b-2 px-3 text-sm transition-colors",
                tab === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <AlertSkeleton />
        ) : tab === "rules" ? (
          <RulesList rules={rules} />
        ) : (
          <HistoryList history={history} />
        )}
      </div>
    </div>
  );
}
