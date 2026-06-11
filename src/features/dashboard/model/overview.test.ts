import { describe, expect, it } from "vitest";

import { createOverview } from "@/features/dashboard/model/overview";
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
    status: "warning",
    cpu: 80,
    memory: 70,
    disk: 90,
    networkInMbps: 50,
    networkOutMbps: 10,
    latencyMs: 30,
    updatedAt: "2026-06-09T00:00:00.000Z"
  },
  {
    id: "node-3",
    name: "node-3",
    group: "cache",
    region: "sin",
    status: "offline",
    cpu: 0,
    memory: 0,
    disk: 20,
    networkInMbps: 0,
    networkOutMbps: 0,
    latencyMs: 0,
    updatedAt: "2026-06-09T00:00:00.000Z"
  }
];

describe("createOverview", () => {
  it("summarizes node status and resource averages", () => {
    expect(createOverview(nodes)).toEqual({
      total: 3,
      online: 1,
      warning: 1,
      offline: 1,
      averageCpu: 40,
      averageMemory: 40,
      traffic: 0.2
    });
  });

  it("returns zero metrics for an empty node list", () => {
    expect(createOverview([])).toEqual({
      total: 0,
      online: 0,
      warning: 0,
      offline: 0,
      averageCpu: 0,
      averageMemory: 0,
      traffic: 0
    });
  });
});
