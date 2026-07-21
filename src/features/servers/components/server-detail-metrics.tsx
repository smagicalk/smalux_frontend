import { useMemo } from "react";

import { EChart } from "@/shared/charts/echart";
import { radarOption } from "@/shared/charts/chart-options";
import { formatBytes, formatPercent, formatRate, formatUptime } from "@/shared/lib/utils";
import type { ServerMetrics } from "@/shared/api/methods";

import { ChartCard, MetricCell, MonitoringOverlay } from "./server-detail-cards";

/**
 * A switchable metric (TCP/UDP/disk IO) cell with three display states:
 *   - no live metrics at all  → "-" (same as every other cell)
 *   - metrics present but the collection switch is off → "关闭统计"
 *   - switch on with a value → the formatted value.
 *
 * The earlier inline form collapsed the first two into "关闭统计", which
 * wrongly told an offline server "采集已关闭" — routing through here keeps
 * them distinct. Declared at module scope (not inside NodeProfile) so React
 * doesn't treat it as a freshly-created component on every render.
 */
function SwitchCell({
  label,
  on,
  value,
  metrics
}: {
  label: string;
  on: boolean;
  value: string | null;
  metrics: ServerMetrics | undefined;
}) {
  if (!metrics) return <MetricCell label={label} value="-" />;
  if (!on) return <MetricCell label={label} value="关闭统计" hint="采集已关闭" disabled />;
  return <MetricCell label={label} value={value ?? "-"} />;
}

/**
 * Node-shape radar (CPU · 内存 · 磁盘 · 负载 · 网络) + the live metric grid.
 * Each axis carries its real unit (CPU/内存/磁盘 as 0..1 ratios, 网络 as raw
 * bytes/s, 负载 as a raw 1m average); radarAxisLabel formats each by name.
 */
export function NodeProfile({ serverName, metrics }: { serverName: string; metrics: ServerMetrics | undefined }) {
  const memRatio = metrics && metrics.memTotal ? metrics.memUsed / metrics.memTotal : 0;
  const diskRatio = metrics && metrics.diskTotal ? metrics.diskUsed / metrics.diskTotal : 0;

  const radarOpt = useMemo(() => {
    if (!metrics) return null;
    return radarOption(
      [
        { name: "CPU", max: 1 },
        { name: "内存", max: 1 },
        { name: "磁盘", max: 1 },
        { name: "负载", max: 8 },
        { name: "网络", max: 8_388_608 }
      ],
      [
        {
          name: serverName,
          values: [
            metrics.cpuUsage,
            memRatio,
            diskRatio,
            metrics.loadOne ?? 0,
            (metrics.netRxSpeed ?? 0) + (metrics.netTxSpeed ?? 0)
          ]
        }
      ]
    );
  }, [metrics, serverName, memRatio, diskRatio]);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <ChartCard title="节点画像" subtitle="CPU · 内存 · 磁盘 · 负载 · 网络" className="lg:col-span-1">
        <MonitoringOverlay monitored={!!metrics}>
          {radarOpt ? <EChart option={radarOpt} height={210} /> : <div className="h-[210px]" />}
        </MonitoringOverlay>
      </ChartCard>
      <div className="lg:col-span-2">
        <div className="glass rounded-md border border-border">
          <div className="border-b border-border px-3 py-2 text-sm font-semibold">实时指标</div>
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            <MetricCell label="上行" value={metrics ? formatRate(metrics.netTxSpeed) : "-"} />
            <MetricCell label="下行" value={metrics ? formatRate(metrics.netRxSpeed) : "-"} />
            <MetricCell label="累计发送" value={metrics ? formatBytes(metrics.netTxTotal) : "-"} hint="总量" />
            <MetricCell label="累计接收" value={metrics ? formatBytes(metrics.netRxTotal) : "-"} hint="总量" />
            <MetricCell label="负载 (1m)" value={metrics?.loadOne?.toFixed(2) ?? "-"} />
            <MetricCell label="负载 (5m)" value={metrics?.loadFive?.toFixed(2) ?? "-"} />
            <MetricCell label="负载 (15m)" value={metrics?.loadFifteen?.toFixed(2) ?? "-"} />
            <MetricCell label="运行时长" value={metrics ? formatUptime(metrics.uptime) : "-"} />
            <MetricCell label="进程数" value={metrics ? String(metrics.processCount) : "-"} />
            <SwitchCell
              label="TCP 连接"
              on={!!metrics?.tcpEnabled && metrics?.tcpConnections != null}
              value={metrics?.tcpConnections != null ? String(metrics.tcpConnections) : null}
              metrics={metrics}
            />
            <SwitchCell
              label="UDP 连接"
              on={!!metrics?.udpEnabled && metrics?.udpConnections != null}
              value={metrics?.udpConnections != null ? String(metrics.udpConnections) : null}
              metrics={metrics}
            />
            <SwitchCell
              label="磁盘读速"
              on={!!metrics?.diskIoEnabled && !!metrics?.diskIo}
              value={metrics?.diskIo ? formatRate(metrics.diskIo.readSpeed) : null}
              metrics={metrics}
            />
            <SwitchCell
              label="磁盘写速"
              on={!!metrics?.diskIoEnabled && !!metrics?.diskIo}
              value={metrics?.diskIo ? formatRate(metrics.diskIo.writeSpeed) : null}
              metrics={metrics}
            />
            <MetricCell label="磁盘占用" value={metrics && metrics.diskTotal ? formatPercent(metrics.diskUsed / metrics.diskTotal) : "-"} />
            <MetricCell
              label="Swap"
              value={metrics && metrics.swapTotal ? formatPercent(metrics.swapUsed / metrics.swapTotal) : "-"}
              hint={metrics && metrics.swapTotal ? `${formatBytes(metrics.swapUsed)} / ${formatBytes(metrics.swapTotal)}` : "未启用"}
            />
            {/* Fifteen metrics leave one slot in the four-column final row.
                Fill it with the same card surface instead of exposing the
                grid's border-colored background as a dark empty block. */}
            <div className="bg-card" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
