import { useMemo, useState } from "react";
import { Activity, Plus } from "lucide-react";

import { usePingTargets } from "@/features/ping/hooks/use-ping";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { FilterPills, StatTile } from "@/shared/ui/layout";

import { CreatePingDialog } from "../components/create-ping-dialog";
import { PingTargetList } from "../components/ping-target-list";
import { ChartPanel, UptimeRing, LatencyChart, ProtocolDonut } from "../components/ping-charts";
import { GROUP_OPTS, SORT_OPTS, type GroupFilter, type SortKey } from "../lib/ping-meta";
import { buildPingOverview } from "../lib/ping-overview";

/**
 * The service-monitoring page. Owns the group filter + sort and derives the KPI
 * strip; the create dialog, each table row, and each chart each live in their
 * own component so a tick only re-renders what actually changed.
 */
export function PingPage() {
  const { data, isLoading } = usePingTargets();
  const [group, setGroup] = useState<GroupFilter>("all");
  const [sort, setSort] = useState<SortKey>("status");
  const [createOpen, setCreateOpen] = useState(false);

  const { visibleTargets, stats } = useMemo(
    () => buildPingOverview(data?.targets ?? [], group, sort),
    [data, group, sort]
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="服务监控"
        subtitle={`${stats.ok}/${stats.total} 健康`}
        action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5" />添加目标</Button>}
      />
      <CreatePingDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatTile label="目标总数" value={stats.total} icon={<Activity className="size-4" />} />
          <StatTile label="健康" value={stats.ok} accent="success" progress={stats.total ? stats.ok / stats.total : 0} />
          <StatTile label="异常" value={stats.down} accent="danger" />
          <StatTile label="平均延迟" value={`${stats.avgLatency}ms`} accent={stats.avgLatency > 80 ? "warning" : "neutral"} />
          <StatTile label="最差延迟" value={`${stats.worstLatency}ms`} accent={stats.worstLatency > 200 ? "danger" : "warning"} />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <ChartPanel title="平均可用率" subtitle="实时">
            <UptimeRing uptime={stats.avgUptime} />
          </ChartPanel>
          <ChartPanel title="延迟 Top 10 (ms)" className="lg:col-span-2">
            <LatencyChart targets={data?.targets ?? []} />
          </ChartPanel>
          <ChartPanel title="协议分布">
            <ProtocolDonut targets={data?.targets ?? []} />
          </ChartPanel>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterPills options={GROUP_OPTS} value={group} onChange={setGroup} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SORT_OPTS.map((o) => <option key={o.key} value={o.key}>按{o.label}</option>)}
          </select>
        </div>

        <PingTargetList
          targets={visibleTargets}
          isLoading={isLoading}
          onCreate={() => setCreateOpen(true)}
        />
      </div>
    </div>
  );
}
