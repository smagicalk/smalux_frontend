import { useServerHistory } from "@/features/servers/hooks/use-monitoring";
import { useMonitoringStore } from "@/features/servers/hooks/monitoring-store";
import { useServerPing } from "@/features/servers/hooks/use-server-ping";
import type { Server } from "@/shared/api/methods";

import { useServerDetailSeries } from "../hooks/use-server-detail-series";
import { DiskIoStrip, LiveStrip, NetworkSplit, PingStrip, ResourceStrip } from "./server-detail-charts";
import { ServerIdentityStrip } from "./server-identity-strip";
import { NodeProfile } from "./server-detail-metrics";

/**
 * The detail body: identity row, then the resource/live/network/profile strips.
 * Subscribes to this server's monitoring store slice + history and derives the
 * sparkline point arrays once. Each visual strip lives in its own component.
 */
export function ServerDetailBody({ server }: { server: Server }) {
  const metrics = useMonitoringStore((s) => s.latest.get(server.id));
  const history = useServerHistory(server.id);
  // Dedicated ping-latency stream for this server — separate from the resource
  // metrics so reachability has its own chart. Subscribed here (page owns the
  // lifecycle); the chart reads the rolling history / historical ranges itself.
  useServerPing([server.id]);

  const series = useServerDetailSeries(history);

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      <ServerIdentityStrip server={server} />

      <ResourceStrip metrics={metrics} />
      <DiskIoStrip metrics={metrics} read={series.diskRead} write={series.diskWrite} />
      <LiveStrip metrics={metrics} cpu={series.cpu} mem={series.memory} net={series.networkTotal} />
      <NodeProfile serverName={server.name} metrics={metrics} />
      <NetworkSplit metrics={metrics} tx={series.networkTx} rx={series.networkRx} />
      <PingStrip serverId={server.id} />
    </div>
  );
}
