import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { defaultRuntimeConfig } from "@/app/config/runtime-config";
import { createMockBackend, type MockBackend } from "@/shared/api/mock/mock-backend";
import {
  agentListResultSchema,
  agentRegisterParamsSchema,
  billingCycleSchema,
  serverMetricsSchema
} from "@/shared/api/methods";
import { createWebSocketUrl, isSafeRuntimeEndpoint, joinUrl } from "@/shared/api/url";
import { HttpTransport } from "./http-transport";
import { MockTransport } from "./mock-transport";
import { RpcClient } from "./rpc-client";
import { RpcError } from "./types";
import { WsTransport } from "./ws-transport";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  readyState = 0;
  sent: string[] = [];
  private listeners = new Map<string, Set<(event: MessageEvent) => void>>();

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void) {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.emit("open", new MessageEvent("open"));
  }

  error() {
    this.emit("error", new MessageEvent("error"));
  }

  message(payload: unknown) {
    this.emit("message", new MessageEvent("message", { data: JSON.stringify(payload) }));
  }

  rawMessage(payload: string) {
    this.emit("message", new MessageEvent("message", { data: payload }));
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.emit("close", new MessageEvent("close"));
  }

  private emit(type: string, event: MessageEvent) {
    for (const handler of this.listeners.get(type) ?? []) handler(event);
  }
}

const wsRuntimeConfig = { ...defaultRuntimeConfig, transport: "ws" as const };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("HttpTransport", () => {
  it("surfaces the HTTP status when the RPC endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Service Unavailable" })
    );

    const transport = new HttpTransport({ ...defaultRuntimeConfig, transport: "http" });

    await expect(transport.call("servers.list", {}, z.array(z.unknown()))).rejects.toThrow(
      "RPC HTTP 503: Service Unavailable"
    );

  });

  it("preserves JSON-RPC error code and data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: "2.0",
          id: "request-1",
          error: { code: -32001, message: "permission denied", data: { scope: "admin" } }
        })
      })
    );

    const transport = new HttpTransport({ ...defaultRuntimeConfig, transport: "http" });
    const error = await transport.call("servers.list", {}, z.array(z.unknown())).catch((value) => value);

    expect(error).toBeInstanceOf(RpcError);
    expect(error).toMatchObject({ code: -32001, message: "permission denied", data: { scope: "admin" } });
  });

  it("rejects a malformed JSON-RPC envelope before parsing the result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: "1.0", result: { ok: true } })
      })
    );
    const transport = new HttpTransport({ ...defaultRuntimeConfig, transport: "http" });

    await expect(
      transport.call("system.health", {}, z.object({ ok: z.boolean() }))
    ).rejects.toBeInstanceOf(z.ZodError);
  });

  it("rejects a valid envelope whose result violates the method schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: "2.0", id: "request-2", result: { ok: "yes" } })
      })
    );
    const transport = new HttpTransport({ ...defaultRuntimeConfig, transport: "http" });

    await expect(
      transport.call("system.health", {}, z.object({ ok: z.boolean() }))
    ).rejects.toBeInstanceOf(z.ZodError);
  });
});

describe("MockTransport", () => {
  it("validates calls through the same result contract as real transports", async () => {
    const backend: MockBackend = {
      handle: async () => ({ ok: "yes" }),
      subscribe: () => null
    };
    const transport = new MockTransport(defaultRuntimeConfig, backend);

    await expect(
      transport.call("system.health", {}, z.object({ ok: z.boolean() }))
    ).rejects.toBeInstanceOf(z.ZodError);

    transport.dispose();
  });

  it("delivers valid stream batches and stops after unsubscribe", async () => {
    vi.useFakeTimers();
    const backend: MockBackend = {
      handle: async () => ({ ok: true }),
      subscribe: () => ({
        intervalMs: 100,
        initialBatch: () => [{ cpu: 0.1 }, { cpu: "invalid" }],
        sampleBatch: () => [{ cpu: 0.2 }, { cpu: "invalid" }]
      })
    };
    const transport = new MockTransport(defaultRuntimeConfig, backend);
    const handler = vi.fn();

    const unsubscribe = transport.subscribe(
      "monitoring.sample",
      {},
      z.object({ cpu: z.number() }),
      handler
    );
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenLastCalledWith({ cpu: 0.1 });

    await vi.advanceTimersByTimeAsync(100);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith({ cpu: 0.2 });

    unsubscribe();
    await vi.advanceTimersByTimeAsync(200);
    expect(handler).toHaveBeenCalledTimes(2);

    transport.dispose();
  });
});

describe("WsTransport", () => {
  it("waits for the socket and resolves a JSON-RPC response", async () => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", Object.assign(FakeWebSocket, { OPEN: 1, CLOSED: 3 }));
    const transport = new WsTransport(wsRuntimeConfig);

    const resultPromise = transport.call("system.health", {}, z.object({ ok: z.boolean() }));
    const socket = FakeWebSocket.instances[0];
    expect(socket.url).toBe("ws://localhost:3000/ws");
    expect(socket.sent).toEqual([]);

    socket.open();
    await Promise.resolve();
    expect(socket.sent).toHaveLength(1);
    const request = JSON.parse(socket.sent[0]) as { id: string };
    socket.message({ jsonrpc: "2.0", id: request.id, result: { ok: true } });

    await expect(resultPromise).resolves.toEqual({ ok: true });
    transport.dispose();
  });

  it("ignores malformed notifications without breaking later valid pushes", async () => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", Object.assign(FakeWebSocket, { OPEN: 1, CLOSED: 3 }));
    const transport = new WsTransport(wsRuntimeConfig);
    const handler = vi.fn();

    transport.subscribe("monitoring.sample", {}, z.object({ cpu: z.number() }), handler);
    const socket = FakeWebSocket.instances[0];
    socket.open();
    await Promise.resolve();

    socket.rawMessage("not-json");
    socket.message({ jsonrpc: "2.0", method: "monitoring.sample", params: { cpu: "high" } });
    expect(handler).not.toHaveBeenCalled();

    socket.message({ jsonrpc: "2.0", method: "monitoring.sample", params: { cpu: 0.42 } });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ cpu: 0.42 });

    transport.dispose();
  });

  it("rejects a call when the response result violates its schema", async () => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", Object.assign(FakeWebSocket, { OPEN: 1, CLOSED: 3 }));
    const transport = new WsTransport(wsRuntimeConfig);

    const resultPromise = transport.call("system.health", {}, z.object({ ok: z.boolean() }));
    const socket = FakeWebSocket.instances[0];
    socket.open();
    await Promise.resolve();
    const request = JSON.parse(socket.sent[0]) as { id: string };

    expect(() => {
      socket.message({ jsonrpc: "2.0", id: request.id, result: { ok: "yes" } });
    }).not.toThrow();
    await expect(resultPromise).rejects.toBeInstanceOf(z.ZodError);

    transport.dispose();
  });

  it("reconnects after an established socket closes", async () => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", Object.assign(FakeWebSocket, { OPEN: 1, CLOSED: 3 }));
    const transport = new WsTransport(wsRuntimeConfig);

    const resultPromise = transport.call("system.health", {}, z.object({ ok: z.boolean() }));
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();
    await Promise.resolve();
    const request = JSON.parse(firstSocket.sent[0]) as { id: string };
    firstSocket.message({ jsonrpc: "2.0", id: request.id, result: { ok: true } });
    await resultPromise;

    firstSocket.close();
    expect(transport.connected).toBe(false);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(FakeWebSocket.instances).toHaveLength(2);

    FakeWebSocket.instances[1].open();
    expect(transport.connected).toBe(true);

    transport.dispose();
  });

  it("restores active subscriptions after reconnecting", async () => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", Object.assign(FakeWebSocket, { OPEN: 1, CLOSED: 3 }));
    const transport = new WsTransport(wsRuntimeConfig);

    transport.subscribe(
      "monitoring.sample",
      { serverIds: ["server-1"] },
      z.object({ cpu: z.number() }),
      vi.fn()
    );
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();
    await Promise.resolve();
    expect(JSON.parse(firstSocket.sent[0])).toMatchObject({
      method: "monitoring.sample.start",
      params: { serverIds: ["server-1"] }
    });

    firstSocket.close();
    await vi.advanceTimersByTimeAsync(1_000);
    const secondSocket = FakeWebSocket.instances[1];
    secondSocket.open();
    await Promise.resolve();

    expect(secondSocket.sent.map((message) => JSON.parse(message))).toContainEqual(
      expect.objectContaining({
        method: "monitoring.sample.start",
        params: { serverIds: ["server-1"] }
      })
    );

    transport.dispose();
  });

  it("rejects a call when disposed before the initial socket opens", async () => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", Object.assign(FakeWebSocket, { OPEN: 1, CLOSED: 3 }));
    const transport = new WsTransport(wsRuntimeConfig);

    const resultPromise = transport.call("system.health", {}, z.unknown());
    transport.dispose();

    await expect(resultPromise).rejects.toThrow("WebSocket closed before opening");
  });
});

describe("RpcClient", () => {
  it("falls back to HTTP when the WebSocket connection fails", async () => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", Object.assign(FakeWebSocket, { OPEN: 1, CLOSED: 3 }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: "http-1", result: { ok: true } })
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new RpcClient(wsRuntimeConfig);

    const resultPromise = client.call("system.health", {}, z.object({ ok: z.boolean() }));
    FakeWebSocket.instances[0].error();

    await expect(resultPromise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/rpc",
      expect.objectContaining({ method: "POST" })
    );

    client.dispose();
  });

  it("does not hide a WebSocket JSON-RPC error behind HTTP fallback", async () => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", Object.assign(FakeWebSocket, { OPEN: 1, CLOSED: 3 }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const client = new RpcClient(wsRuntimeConfig);

    const resultPromise = client.call("servers.delete", { id: "server-1" }, z.unknown());
    const socket = FakeWebSocket.instances[0];
    socket.open();
    await Promise.resolve();
    const request = JSON.parse(socket.sent[0]) as { id: string };
    socket.message({
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32001, message: "permission denied" }
    });

    await expect(resultPromise).rejects.toMatchObject({
      name: "RpcError",
      code: -32001,
      message: "permission denied"
    });
    expect(fetchMock).not.toHaveBeenCalled();

    client.dispose();
  });
});

describe("RPC endpoint URLs", () => {
  it("accepts supported endpoints and rejects unsafe schemes", () => {
    expect(isSafeRuntimeEndpoint("/rpc")).toBe(true);
    expect(isSafeRuntimeEndpoint("https://api.example.com/rpc")).toBe(true);
    expect(isSafeRuntimeEndpoint("wss://api.example.com/ws")).toBe(true);
    expect(isSafeRuntimeEndpoint("//untrusted.example.com/rpc")).toBe(false);
    expect(isSafeRuntimeEndpoint("javascript:alert(1)")).toBe(false);
    expect(isSafeRuntimeEndpoint("data:text/plain,rpc")).toBe(false);
  });

  it("joins endpoint paths without duplicate separators", () => {
    expect(joinUrl("https://api.example.com/", "/rpc")).toBe(
      "https://api.example.com/rpc"
    );
    expect(joinUrl("", "")).toBe("/");
  });

  it("upgrades HTTP origins to their WebSocket equivalents", () => {
    expect(createWebSocketUrl("https://api.example.com/", "/ws")).toBe(
      "wss://api.example.com/ws"
    );
    expect(createWebSocketUrl("http://api.example.com", "stream")).toBe(
      "ws://api.example.com/stream"
    );
  });
});

describe("Server registration contract", () => {
  it("registers a server without operator-supplied discovery metadata", async () => {
    // Region, IP, OS and architecture are discovered by the Agent rather than
    // operator input. Keeping this request minimal prevents stale guessed
    // metadata from becoming part of the server's initial identity.
    const params = agentRegisterParamsSchema.parse({
      name: "fresh-node",
      note: "edge worker",
      tags: ["edge"]
    });
    const backend = createMockBackend();

    await expect(backend.handle("agent.register", params)).resolves.toEqual({ ok: true });
    const result = agentListResultSchema.parse(
      await backend.handle("agent.list", { search: "fresh-node" })
    );

    expect(result.servers).toHaveLength(1);
    expect(result.servers[0]).toMatchObject({
      name: "fresh-node",
      region: "未分组",
      note: "edge worker",
      tags: ["edge"]
    });
    expect(result.servers[0].ipv4).toBeUndefined();
    expect(result.servers[0].os).toBeUndefined();
    expect(result.servers[0].arch).toBeUndefined();
  });

  it("persists multi-year server billing metadata through the update command", async () => {
    const backend = createMockBackend();
    const expiresAt = Date.UTC(2027, 0, 31);

    await expect(backend.handle("agent.update", {
      serverId: "srv-hkg-01",
      price: 45,
      currency: "CNY",
      expiresAt,
      billingCycle: "biennial"
    })).resolves.toEqual({ ok: true });

    const result = agentListResultSchema.parse(
      await backend.handle("agent.list", { search: "edge-hkg-01" })
    );
    expect(result.servers[0]).toMatchObject({
      price: 45,
      currency: "CNY",
      expiresAt,
      billingCycle: "biennial"
    });

    // Three-year billing must use the same shared schema as RPC responses and
    // form values, otherwise the select can render an option the API rejects.
    expect(billingCycleSchema.parse("triennial")).toBe("triennial");
  });
});

describe("Server metric breakdown contract", () => {
  it("keeps older aggregate-only agent samples compatible", () => {
    const metrics = serverMetricsSchema.parse({
      serverId: "legacy-server",
      cpuUsage: 0.25,
      memUsed: 1024,
      memTotal: 4096,
      ts: 1
    });

    expect(metrics.cpuCores).toEqual([]);
    expect(metrics.networkInterfaces).toEqual([]);
    expect(metrics.disks).toEqual([]);
    expect(metrics.processesEnabled).toBe(false);
    expect(metrics.processes).toEqual([]);
  });

  it("produces mock device breakdowns that add up to their totals", () => {
    const backend = createMockBackend();
    const stream = backend.subscribe("agent.summary.subscribe", { serverIds: ["srv-hkg-01"] });
    const metrics = serverMetricsSchema.parse(stream?.sampleBatch?.()[0]);

    expect(metrics.cpuCores.length).toBeGreaterThan(0);
    expect(metrics.processesEnabled).toBe(true);
    expect(metrics.processes.length).toBeGreaterThan(0);
    expect(metrics.cpuCores.reduce((sum, core) => sum + core.usage, 0) / metrics.cpuCores.length)
      .toBeCloseTo(metrics.cpuUsage);
    expect(metrics.networkInterfaces.reduce((sum, item) => sum + item.rxSpeed, 0))
      .toBeCloseTo(metrics.netRxSpeed);
    expect(metrics.networkInterfaces.reduce((sum, item) => sum + item.txSpeed, 0))
      .toBeCloseTo(metrics.netTxSpeed);
    expect(metrics.disks.reduce((sum, disk) => sum + disk.used, 0))
      .toBeCloseTo(metrics.diskUsed);
    expect(metrics.disks.reduce((sum, disk) => sum + disk.total, 0))
      .toBeCloseTo(metrics.diskTotal);
    expect(metrics.disks.reduce((sum, disk) => sum + (disk.readSpeed ?? 0), 0))
      .toBeCloseTo(metrics.diskIo?.readSpeed ?? 0);
    expect(metrics.disks.reduce((sum, disk) => sum + (disk.writeSpeed ?? 0), 0))
      .toBeCloseTo(metrics.diskIo?.writeSpeed ?? 0);
  });
});
