import { describe, expect, it } from "vitest";

import type { PingTarget } from "@/shared/api/methods";
import { buildPingOverview } from "./ping-overview";

const targets: PingTarget[] = [
  {
    id: "healthy",
    name: "Healthy",
    address: "https://healthy.test",
    protocol: "http",
    group: "public",
    enabled: true,
    latencyMs: 20,
    uptime: 0.99,
    lastOk: true
  },
  {
    id: "down",
    name: "Down",
    address: "https://down.test",
    protocol: "http",
    group: "private",
    enabled: true,
    latencyMs: 120,
    uptime: 0.8,
    lastOk: false
  }
];

describe("buildPingOverview", () => {
  it("puts unhealthy targets first for status sorting", () => {
    const overview = buildPingOverview(targets, "all", "status");

    expect(overview.visibleTargets.map((target) => target.id)).toEqual(["down", "healthy"]);
  });

  it("keeps fleet statistics independent from the active group filter", () => {
    const overview = buildPingOverview(targets, "public", "name");

    expect(overview.visibleTargets.map((target) => target.id)).toEqual(["healthy"]);
    expect(overview.stats).toMatchObject({ total: 2, ok: 1, down: 1, avgLatency: 70 });
  });
});
