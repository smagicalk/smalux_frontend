import { useMemo, useState } from "react";
import { Clock } from "lucide-react";

import { useCrons } from "@/features/cron/hooks/use-cron";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, FilterPills, StatTile } from "@/shared/ui/layout";
import { EChart } from "@/shared/charts/echart";
import { horizontalBarOption } from "@/shared/charts/chart-options";

import { CreateCronButton } from "../components/create-cron-dialog";
import { CronRow, CronSkeleton } from "../components/cron-list";
import { FILTER_OPTS, SORT_OPTS, type Filter, type SortKey } from "../lib/cron-meta";

/**
 * The cron page. Owns filter/sort/"now" state and renders the KPI strip +
 * next-run bar chart; the create dialog, each row, and the skeleton each live
 * in their own component.
 */
export function CronPage() {
  const { data, isLoading } = useCrons();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("next");
  // Stable "now" per mount so the "hours until next run" bars don't flicker
  // on every re-render, and we avoid Date.now() inside render.
  const [now] = useState(() => Date.now());

  const crons = useMemo(() => {
    const list = (data?.crons ?? []).filter((c) =>
      filter === "all" ? true : filter === "enabled" ? c.enabled : !c.enabled
    );
    const statusRank: Record<string, number> = { failed: 0, timeout: 1, running: 2, success: 3 };
    if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "lastStatus") {
      return list.sort((a, b) => (statusRank[a.lastStatus ?? ""] ?? 9) - (statusRank[b.lastStatus ?? ""] ?? 9) || a.name.localeCompare(b.name));
    }
    // next: soonest first, no next-run sinks to the bottom.
    return list.sort((a, b) => {
      if (!a.nextRunAt) return 1;
      if (!b.nextRunAt) return -1;
      return a.nextRunAt - b.nextRunAt;
    });
  }, [data, filter, sort]);

  const stats = useMemo(() => {
    const all = data?.crons ?? [];
    return {
      total: all.length,
      enabled: all.filter((c) => c.enabled).length,
      failed: all.filter((c) => c.lastStatus === "failed").length,
      success: all.filter((c) => c.lastStatus === "success").length,
      running: all.filter((c) => c.lastStatus === "running").length
    };
  }, [data]);

  const nextRunOption = useMemo(() => {
    const slice = (data?.crons ?? []).slice(0, 8);
    return horizontalBarOption(
      slice.map((c) => c.name),
      slice.map((c) => {
        if (!c.nextRunAt) return 0;
        const hours = Math.max(0, Math.round((c.nextRunAt - now) / 3_600_000));
        return Math.min(hours, 240);
      }),
      { unit: "h" }
    );
  }, [data, now]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="计划任务" subtitle={`${data?.total ?? 0} 条`} tone="magenta" action={<CreateCronButton />} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatTile label="任务总数" value={stats.total} accent="magenta" icon={<Clock className="size-4" />} />
          <StatTile label="启用中" value={stats.enabled} accent="success" progress={stats.total ? stats.enabled / stats.total : 0} />
          <StatTile label="最近成功" value={stats.success} accent="cyan" />
          <StatTile label="执行中" value={stats.running} accent="warning" />
          <StatTile label="最近失败" value={stats.failed} accent="danger" />
        </div>

        <div className="glass cornered relative overflow-hidden rounded-md border border-border p-2">
          <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
          <div className="px-1 pb-1 text-xs text-muted-foreground">距下次执行 (h) · 按任务</div>
          <EChart
            option={nextRunOption}
            height={Math.max(160, Math.min(crons.length, 8) * 32)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterPills options={FILTER_OPTS} value={filter} onChange={setFilter} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SORT_OPTS.map((o) => <option key={o.key} value={o.key}>按{o.label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <CronSkeleton />
        ) : !crons.length ? (
          <EmptyState text="没有匹配的计划任务。" icon={<Clock className="size-8" />} action={<CreateCronButton />} />
        ) : (
          <ul className="space-y-2">
            {crons.map((c) => <CronRow key={c.id} cron={c} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
