import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { defaultRuntimeConfig } from "@/app/config/runtime-config";
import { HttpTransport } from "./http-transport";
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
