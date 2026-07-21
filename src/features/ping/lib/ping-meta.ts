import type { PingProtocol, PingTarget } from "@/shared/api/methods";

export const PROTOCOL_LABEL: Record<PingProtocol, string> = {
  http: "HTTP", tcp: "TCP", icmp: "ICMP", wss: "WSS"
};

export const GROUP_LABEL: Record<PingTarget["group"], string> = {
  public: "公开", control: "控制面", notify: "通知", private: "私网"
};

export const GROUP_VARIANT = { public: "primary", control: "warning", notify: "neutral", private: "outline" } as const;

export type GroupFilter = "all" | PingTarget["group"];
export const GROUP_OPTS: ReadonlyArray<{ key: GroupFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "public", label: "公开" },
  { key: "control", label: "控制面" },
  { key: "notify", label: "通知" },
  { key: "private", label: "私网" }
];

export type SortKey = "status" | "latency" | "name";
export const SORT_OPTS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "status", label: "状态" },
  { key: "latency", label: "延迟" },
  { key: "name", label: "名称" }
];

/** Per-protocol "good" latency ceiling, so a row colors latency by what's
 *  actually healthy for that probe type, not a flat threshold. */
export const LATENCY_CEILING: Record<PingProtocol, number> = {
  icmp: 50,
  tcp: 100,
  http: 200,
  wss: 250
};

export function latencyTone(target: PingTarget): "good" | "warn" | "bad" | "unknown" {
  if (target.latencyMs == null) return "unknown";
  const ceil = LATENCY_CEILING[target.protocol];
  if (target.latencyMs <= ceil) return "good";
  if (target.latencyMs <= ceil * 2) return "warn";
  return "bad";
}
