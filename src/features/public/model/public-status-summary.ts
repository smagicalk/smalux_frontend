import type { MonitorNode } from "@/shared/domain/node";
import type { PingCheck } from "@/features/ping/model/mock-ping";
import { createPingSummary } from "@/features/ping/model/mock-ping";

export const publicUptimeBars = [
  "success",
  "success",
  "success",
  "success",
  "warning",
  "success",
  "success",
  "success",
  "danger",
  "success",
  "success",
  "success",
  "success",
  "success"
] as const;

export function createPublicStatusSummary(nodes: readonly MonitorNode[], checks: readonly PingCheck[]) {
  const pingSummary = createPingSummary(checks);
  const onlineNodes = nodes.filter((node) => node.status === "online").length;
  const degradedChecks = checks.filter((check) => check.status !== "ok");

  return {
    onlineNodes,
    totalNodes: nodes.length,
    isOperational: degradedChecks.length === 0 && onlineNodes === nodes.length,
    availability: pingSummary.availability,
    latency: pingSummary.latency
  };
}
