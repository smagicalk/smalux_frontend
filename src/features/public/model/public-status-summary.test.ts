import { describe, expect, it } from "vitest";

import { createPublicStatusSummary } from "@/features/public/model/public-status-summary";
import type { PingCheck } from "@/features/ping/model/mock-ping";
import type { MonitorNode } from "@/shared/domain/node";

const nodes: MonitorNode[] = [
  {
    id: "node-1",
    name: "node-1",
    group: "edge",
    region: "sfo",
    status: "online",
    cpu: 40,
    memory: 50,
    disk: 60,
    networkInMbps: 100,
    networkOutMbps: 40,
    latencyMs: 10,
    updatedAt: "2026-06-09T00:00:00.000Z"
  },
  {
    id: "node-2",
    name: "node-2",
    group: "core",
    region: "tyo",
    status: "online",
    cpu: 60,
    memory: 70,
    disk: 30,
    networkInMbps: 80,
    networkOutMbps: 30,
    latencyMs: 20,
    updatedAt: "2026-06-09T00:00:00.000Z"
  }
];

const checks: PingCheck[] = [
  {
    id: "ping-1",
    name: "public",
    target: "https://status.smalux.local",
    protocol: "HTTP",
    status: "ok",
    region: "Global",
    intervalSec: 30,
    timeoutMs: 2500,
    retries: 2,
    latencyMs: 50,
    lossPercent: 0,
    availability: 99.9,
    enabled: true,
    alertPolicy: "public down",
    lastRunAt: "2026-06-09T09:58:00.000Z"
  },
  {
    id: "ping-2",
    name: "api",
    target: "https://api.smalux.local/health",
    protocol: "HTTP",
    status: "ok",
    region: "Tokyo",
    intervalSec: 30,
    timeoutMs: 2500,
    retries: 2,
    latencyMs: 70,
    lossPercent: 0,
    availability: 99.7,
    enabled: true,
    alertPolicy: "api down",
    lastRunAt: "2026-06-09T09:58:00.000Z"
  }
];

describe("createPublicStatusSummary", () => {
  it("marks the public status as operational when all nodes and checks are healthy", () => {
    const summary = createPublicStatusSummary(nodes, checks);

    expect(summary.onlineNodes).toBe(2);
    expect(summary.totalNodes).toBe(2);
    expect(summary.isOperational).toBe(true);
    expect(summary.availability).toBeCloseTo(99.8);
    expect(summary.latency).toBe(60);
  });

  it("marks the public status as degraded when any check is not ok", () => {
    const degradedChecks: PingCheck[] = [{ ...checks[0]!, status: "degraded" }, checks[1]!];

    expect(createPublicStatusSummary(nodes, degradedChecks).isOperational).toBe(false);
  });
});
