import { useMemo, useState } from "react";
import { Bell, Plus } from "lucide-react";

import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { StatTile } from "@/shared/ui/layout";
import { cn } from "@/shared/lib/utils";

import { CreateChannelDialog } from "../components/create-channel-dialog";
import { ChannelsList, NotifSkeleton } from "../components/channels-list";
import { DeliveryLog } from "../components/delivery-log";
import { ChartPanel, SuccessRing, DeliveryTrendChart } from "../components/notification-charts";

/**
 * The notifications hub. Owns the channels/log tab switch and renders the KPI
 * strip + two-chart band; the create dialog, the channel grid, the delivery
 * log, and each chart each live in their own component.
 */
export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const [tab, setTab] = useState<"channels" | "log">("channels");
  const [createOpen, setCreateOpen] = useState(false);

  const stats = useMemo(() => {
    const events = data?.events ?? [];
    const channels = data?.channels ?? [];
    const ok = events.filter((e) => e.ok).length;
    const failing = channels.filter((c) => c.lastOk === false).length;
    return {
      channels: channels.length,
      enabled: channels.filter((c) => c.enabled).length,
      failing,
      delivered: events.length,
      successRate: events.length ? ok / events.length : 0
    };
  }, [data]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="通知"
        tone="warning"
        action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5" />添加渠道</Button>}
      />
      <CreateChannelDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatTile label="渠道总数" value={stats.channels} accent="violet" icon={<Bell className="size-4" />} />
          <StatTile label="启用中" value={stats.enabled} accent="success" progress={stats.channels ? stats.enabled / stats.channels : 0} />
          <StatTile label="投递失败渠道" value={stats.failing} accent="danger" />
          <StatTile label="投递总数" value={stats.delivered} accent="cyan" />
          <StatTile label="投递成功率" value={`${(stats.successRate * 100).toFixed(0)}%`} accent={stats.successRate > 0.9 ? "success" : "warning"} />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <ChartPanel title="投递成功率" subtitle="实时">
            <SuccessRing rate={stats.successRate} />
          </ChartPanel>
          <div className="glass cornered relative overflow-hidden rounded-md border border-border p-2 lg:col-span-3">
            <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
            <div className="px-1 pb-1 text-xs text-muted-foreground">近 7 日按严重程度投递</div>
            <DeliveryTrendChart />
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-border px-1">
          {(
            [
              ["channels", `渠道 ${data?.channels.length ?? 0}`],
              ["log", `投递记录 ${data?.events.length ?? 0}`]
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
          <NotifSkeleton />
        ) : tab === "channels" ? (
          <ChannelsList channels={data?.channels ?? []} />
        ) : (
          <DeliveryLog events={data?.events ?? []} />
        )}
      </div>
    </div>
  );
}
