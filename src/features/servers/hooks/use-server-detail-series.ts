import { useMemo } from "react";

import type { ServerMetrics } from "@/shared/api/methods";

export type DetailPoint = { ts: number; value: number | null };

export interface ServerDetailSeries {
  cpu: DetailPoint[];
  memory: DetailPoint[];
  networkTotal: DetailPoint[];
  networkRx: DetailPoint[];
  networkTx: DetailPoint[];
  diskRead: DetailPoint[];
  diskWrite: DetailPoint[];
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
      diskWrite: history.map((m) => ({ ts: m.ts, value: m.diskIo?.writeSpeed ?? null }))
    }),
    [history]
  );
}
