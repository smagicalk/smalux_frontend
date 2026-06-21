import { describe, expect, it } from "vitest";

import { createNodeFilterOptions, filterNodes } from "@/features/nodes/model/node-filters";
import type { MonitorNode } from "@/shared/domain/node";

const nodes: MonitorNode[] = [
  {
    id: "node-1",
    name: "tyo-core-01",
    group: "core",
    region: "Tokyo",
    status: "online",
    cpu: 42,
    memory: 58,
    disk: 61,
    networkInMbps: 120,
    networkOutMbps: 88,
    latencyMs: 24,
    updatedAt: "2026-06-09T00:00:00.000Z"
  },
  {
    id: "node-2",
    name: "sin-cache-01",
    group: "cache",
    region: "Singapore",
    status: "offline",
    cpu: 0,
    memory: 0,
    disk: 30,
    networkInMbps: 0,
    networkOutMbps: 0,
    latencyMs: 0,
    updatedAt: "2026-06-09T00:00:00.000Z"
  },
  {
    id: "node-3",
    name: "fra-core-02",
    group: "core",
    region: "Frankfurt",
    status: "warning",
    cpu: 70,
    memory: 74,
    disk: 65,
    networkInMbps: 90,
    networkOutMbps: 55,
    latencyMs: 98,
    updatedAt: "2026-06-09T00:00:00.000Z"
  }
];

describe("node filters", () => {
  it("creates unique group options in data order", () => {
    expect(createNodeFilterOptions(nodes)).toEqual(["core", "cache"]);
  });

  it("filters nodes by query, status and group", () => {
    const result = filterNodes(nodes, {
      query: "fra",
      statusFilter: "warning",
      groupFilter: "core"
    });

    expect(result.map((node) => node.id)).toEqual(["node-3"]);
  });
});
