import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Globe2, Plus, XCircle } from "lucide-react";

import { useServers } from "@/features/servers/hooks/use-servers";
import { useMonitoring } from "@/features/servers/hooks/use-monitoring";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, StatTile } from "@/shared/ui/layout";
import type { ServerStatus } from "@/shared/api/methods";

import { type SortKey } from "../lib/server-meta";
import { useSortedServers } from "../hooks/use-sorted-servers";
import { AddServerDialog } from "../components/add-server-dialog";
import { DistributionRow } from "../components/distribution-row";
import { ServerFilterBar } from "../components/server-filter-bar";
import { ServerGrid } from "../components/server-grid";
import { SkeletonGrid } from "../components/server-skeleton";

/**
 * The fleet list. This page owns the search/status/sort filters and the live
 * metric subscription for the visible servers; the distribution band, the grid
 * rows, and the add dialog each live in their own component. Sorting by a live
 * metric re-reads the store on every tick so the order tracks the stream.
 */
export function ServersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ServerStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [addOpen, setAddOpen] = useState(false);
  const { data, isLoading, error } = useServers({ search, status: status === "all" ? undefined : status });

  // Subscribe to live metrics for whatever servers we currently see.
  const serverIds = useMemo(() => (data?.servers ?? []).map((s) => s.id), [data]);
  useMonitoring(serverIds);

  const counts = useMemo(() => {
    const all = data?.servers ?? [];
    return {
      total: all.length,
      online: all.filter((s) => s.status === "online").length,
      warning: all.filter((s) => s.status === "warning").length,
      offline: all.filter((s) => s.status === "offline").length
    };
  }, [data]);

  const sorted = useSortedServers(data?.servers ?? [], sort);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="服务器"
        subtitle={`${data?.total ?? 0} 台`}
        action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-3.5" />添加服务器</Button>}
      />
      <AddServerDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Whole body scrolls together — stats + distribution + filter bar + list —
          so the fleet isn't squeezed below a fixed distribution band. The filter
          bar is sticky within the scroller so it stays reachable while scrolling. */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-2 px-4 pt-3 sm:grid-cols-4">
          <StatTile label="总数" value={counts.total} />
          <StatTile label="在线" value={counts.online} accent="success" icon={<CheckCircle2 className="size-4" />} progress={counts.total ? counts.online / counts.total : 0} />
          <StatTile label="预警" value={counts.warning} accent="warning" icon={<AlertTriangle className="size-4" />} />
          <StatTile label="离线" value={counts.offline} accent="danger" icon={<XCircle className="size-4" />} />
        </div>

        <DistributionRow servers={data?.servers ?? []} serverIds={serverIds} />

        <ServerFilterBar
          search={search}
          status={status}
          sort={sort}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onSortChange={setSort}
          onClear={() => { setSearch(""); setStatus("all"); }}
        />

        <div className="px-4 pt-3">
          {isLoading ? (
            <SkeletonGrid />
          ) : error ? (
            <EmptyState icon={<XCircle className="size-8" />} text="加载失败，请检查后端连接。" />
          ) : !sorted.length ? (
            <EmptyState icon={<Globe2 className="size-8" />} text="没有匹配的服务器。" action={
              <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setStatus("all"); }}>清除筛选</Button>
            } />
          ) : (
            <ServerGrid servers={sorted} />
          )}
        </div>
      </div>
    </div>
  );
}
