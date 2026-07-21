import { useMemo } from "react";

import type { ServerMetrics } from "@/shared/api/methods";

export type DetailPoint = { ts: number; value: number | null };
export type DetailNamedSeries = { name: string; values: (number | null)[] };
export type DetailMultiSeries = { timestamps: number[]; series: DetailNamedSeries[] };

export interface ServerDetailSeries {
  cpu: DetailPoint[];
  memory: DetailPoint[];
  networkTotal: DetailPoint[];
  networkRx: DetailPoint[];
  networkTx: DetailPoint[];
  diskRead: DetailPoint[];
  diskWrite: DetailPoint[];
  tcpConnections: DetailPoint[];
  udpConnections: DetailPoint[];
  cpuCores: DetailMultiSeries;
  networkInterfacesTotal: DetailMultiSeries;
  networkInterfacesRx: DetailMultiSeries;
  networkInterfacesTx: DetailMultiSeries;
  diskDevicesRead: DetailMultiSeries;
  diskDevicesWrite: DetailMultiSeries;
}

/**
 * Align a changing set of named devices onto one timestamp axis. Names are
 * collected in first-seen order for a stable legend; a device missing from one
 * sample receives null so ECharts draws a gap instead of a false zero.
 */
function alignNamedSeries(
  history: ServerMetrics[],
  select: (metrics: ServerMetrics) => { name: string; value: number | null }[]
): DetailMultiSeries {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const metrics of history) {
    for (const item of select(metrics)) {
      if (!seen.has(item.name)) {
        seen.add(item.name);
        names.push(item.name);
      }
    }
  }

  return {
    timestamps: history.map((metrics) => metrics.ts),
    series: names.map((name) => ({
      name,
      values: history.map((metrics) => select(metrics).find((item) => item.name === name)?.value ?? null)
    }))
  };
}

/**
 * Derives all chart series for one server from the shared metrics history.
 * Keeping this transformation in a hook leaves the detail body responsible
 * only for subscriptions and layout, while chart components receive stable
 * and purpose-specific point arrays.
 */
export function useServerDetailSeries(history: ServerMetrics[]): ServerDetailSeries {
  return useMemo(
    () => ({
      cpu: history.map((m) => ({ ts: m.ts, value: m.cpuUsage })),
      memory: history.map((m) => ({
        ts: m.ts,
        value: m.memTotal ? m.memUsed / m.memTotal : 0
      })),
      networkTotal: history.map((m) => ({
        ts: m.ts,
        value: (m.netRxSpeed ?? 0) + (m.netTxSpeed ?? 0)
      })),
      networkRx: history.map((m) => ({ ts: m.ts, value: m.netRxSpeed })),
      networkTx: history.map((m) => ({ ts: m.ts, value: m.netTxSpeed })),
      diskRead: history.map((m) => ({ ts: m.ts, value: m.diskIo?.readSpeed ?? null })),
      diskWrite: history.map((m) => ({ ts: m.ts, value: m.diskIo?.writeSpeed ?? null })),
      tcpConnections: history.map((m) => ({
        ts: m.ts,
        value: m.tcpEnabled ? m.tcpConnections : null
      })),
      udpConnections: history.map((m) => ({
        ts: m.ts,
        value: m.udpEnabled ? m.udpConnections : null
      })),
      cpuCores: alignNamedSeries(history, (m) =>
        m.cpuCores.map((core) => ({ name: core.name, value: core.usage }))
      ),
      networkInterfacesTotal: alignNamedSeries(history, (m) =>
        m.networkInterfaces.map((item) => ({ name: item.name, value: item.rxSpeed + item.txSpeed }))
      ),
      networkInterfacesRx: alignNamedSeries(history, (m) =>
        m.networkInterfaces.map((item) => ({ name: item.name, value: item.rxSpeed }))
      ),
      networkInterfacesTx: alignNamedSeries(history, (m) =>
        m.networkInterfaces.map((item) => ({ name: item.name, value: item.txSpeed }))
      ),
      diskDevicesRead: alignNamedSeries(history, (m) =>
        m.disks.map((disk) => ({ name: `${disk.name} 读`, value: disk.readSpeed }))
      ),
      diskDevicesWrite: alignNamedSeries(history, (m) =>
        m.disks.map((disk) => ({ name: `${disk.name} 写`, value: disk.writeSpeed }))
      )
    }),
    [history]
  );
}
