import { describe, expect, it } from "vitest";

import { filterPingChecks } from "@/features/ping/model/ping-filters";
import type { PingCheck } from "@/features/ping/model/mock-ping";

const checks: PingCheck[] = [
  {
    id: "api",
    name: "后台 API",
    target: "https://api.smalux.local/health",
    protocol: "HTTP",
    status: "degraded",
    region: "Tokyo",
    intervalSec: 15,
    timeoutMs: 1800,
    retries: 3,
    latencyMs: 180,
    lossPercent: 1.2,
    availability: 98.7,
    enabled: true,
    alertPolicy: "核心 API 延迟",
    lastRunAt: "2026-06-09T09:58:10.000Z"
  },
  {
    id: "smtp",
    name: "SMTP",
    target: "mail.smalux.local:587",
    protocol: "TCP",
    status: "ok",
    region: "Frankfurt",
    intervalSec: 60,
    timeoutMs: 2200,
    retries: 2,
    latencyMs: 64,
    lossPercent: 0,
    availability: 99.91,
    enabled: true,
    alertPolicy: "通知通道不可达",
    lastRunAt: "2026-06-09T09:57:30.000Z"
  }
];

describe("filterPingChecks", () => {
  it("filters checks by query, status and protocol", () => {
    const result = filterPingChecks(checks, {
      query: "api",
      statusFilter: "degraded",
      protocolFilter: "HTTP"
    });

    expect(result.map((check) => check.id)).toEqual(["api"]);
  });

  it("returns all checks when filters are neutral", () => {
    const result = filterPingChecks(checks, {
      query: " ",
      statusFilter: "all",
      protocolFilter: "all"
    });

    expect(result).toHaveLength(2);
  });
});
