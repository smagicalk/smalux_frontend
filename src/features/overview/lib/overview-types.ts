import type { AlertSeverity } from "@/shared/api/methods";

/** A timestamped scalar series — the shape sparklines and trend charts plot. */
export type AggSeries = { ts: number; value: number }[];

/** Cluster-aggregate series bundle produced by useClusterAggregate. */
export interface ClusterAggregate {
  timestamps: number[];
  cpu: AggSeries;
  flow: AggSeries;
  flowRx: AggSeries;
  flowTx: AggSeries;
  live: AggSeries;
}

export const EMPTY_AGGREGATE: ClusterAggregate = {
  timestamps: [],
  cpu: [],
  flow: [],
  flowRx: [],
  flowTx: [],
  live: []
};

/** Severity → label + accent color, shared by the event stream and exception rows. */
export const SEVERITY_META: Record<AlertSeverity, { label: string; color: string }> = {
  info: { label: "信息", color: "var(--primary)" },
  warning: { label: "预警", color: "var(--warning)" },
  critical: { label: "严重", color: "var(--danger)" }
};
