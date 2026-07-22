import { useMemo } from "react";
import { Layers, Siren, TrendingUp, Zap } from "lucide-react";

import { useServers } from "@/features/servers/hooks/use-servers";
import { useMonitoring } from "@/features/servers/hooks/use-monitoring";
import { PageHeader } from "@/shared/ui/page-header";
import { EChart } from "@/shared/charts/echart";
import { funnelOption } from "@/shared/charts/chart-options";

import { useClusterAggregate } from "../hooks/use-cluster-aggregate";
import { ChartCard } from "../components/chart-card";
import { ChartsSection } from "../components/charts-section";
import { EventStream } from "../components/event-stream";
import { ExceptionQueue } from "../components/exception-queue";
import { HeartbeatBar } from "../components/heartbeat-bar";
import { KpiStrip } from "../components/kpi-strip";
import { QuickEntries } from "../components/quick-entries";
import { EmptyFleet, OverviewSkeleton } from "../components/overview-states";
import { SectionTitle } from "../components/section-title";

/**
 * Duty console: current fleet status, the exception queue, and a key trend
 * strip. This page only orchestrates the sections — each block (KPI strip,
 * chart grid, exception queue, event stream) lives in its own component under
 * components/, and the cluster aggregate wiring lives in hooks/. It does not
 * duplicate the server list or per-server detail (those live on /admin/servers).
 */
export function OverviewPage() {
  const { data, isLoading } = useServers();
  const servers = useMemo(() => data?.servers ?? [], [data]);
  const serverIds = useMemo(() => servers.map((s) => s.id), [servers]);
  useMonitoring(serverIds);

  const counts = useMemo(() => {
    const online = servers.filter((s) => s.status === "online").length;
    const warning = servers.filter((s) => s.status === "warning").length;
    const offline = servers.filter((s) => s.status === "offline").length;
    return { online, warning, offline, total: servers.length };
  }, [servers]);

  const exceptions = servers.filter((s) => s.status !== "online");
  const agg = useClusterAggregate(serverIds);
  const empty = !isLoading && servers.length === 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="总览" subtitle="值班台" tone="cyan" />

      <HeartbeatBar online={counts.online} total={counts.total} />

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {/* ── 区 1:舰队态势 ── KPI + 资源水位 + 流量,首屏全景 */}
        <section className="space-y-3">
          <SectionTitle icon={<Layers className="size-4" />} title="舰队态势" hint="实时聚合" />
          <KpiStrip counts={counts} agg={agg} />
          {isLoading && servers.length === 0 ? (
            <OverviewSkeleton />
          ) : empty ? (
            <EmptyFleet />
          ) : (
            <ChartsSection servers={servers} serverIds={serverIds} />
          )}
        </section>

        {/* ── 区 2:异常与告警 ── 行动项前置,首屏可见 */}
        <section className="space-y-3">
          <SectionTitle icon={<Siren className="size-4" />} title="异常与告警" hint="需关注" accent="danger" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ExceptionQueue servers={exceptions} isLoading={isLoading} />
            <ChartCard
              title="告警流水线"
              subtitle="触发 → 通知 → 恢复"
              icon={<TrendingUp className="size-3.5" />}
              accent="primary"
              to="/admin/alerts"
            >
              <EChart option={funnelOption([
                { name: "告警触发", value: 42 },
                { name: "已通知", value: 38 },
                { name: "已确认", value: 25 },
                { name: "已恢复", value: 18 }
              ])} height={220} />
            </ChartCard>
          </div>
        </section>

        {/* ── 区 3:快捷入口 + 实时事件流 ── 导航加速 + 时序回放 */}
        <section className="space-y-3">
          <SectionTitle icon={<Zap className="size-4" />} title="导航与事件" hint="直达 / 回溯" accent="warning" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <QuickEntries counts={counts} />
            <div className="lg:col-span-2">
              <EventStream servers={servers} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
