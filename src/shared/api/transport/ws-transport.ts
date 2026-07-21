import { z } from "zod";

import { createWebSocketUrl } from "@/shared/api/url";
import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import { RpcError } from "./types";

const HEARTBEAT_INTERVAL_MS = 30_000;
const CALL_TIMEOUT_MS = 10_000;
const RECONNECT_DELAY_MS = 1_000;

interface RpcResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  method?: string;
  params?: unknown;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

interface Subscription {
  method: string;
  // Loose match: server pushes a notification whose method equals the
  // subscribed method. We compare by method name only.
  handler: NotificationHandler;
  schema: z.ZodType;
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Single shared WebSocket connection multiplexing many JSON-RPC requests
 * via id, plus server-push notifications. Modeled on NodeGet's useWsConnection:
 * lazy connect, auto-reconnect, 30s heartbeat via a cheap `system.ping` call.
 */
export class WsTransport implements Transport {
  private ws: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private pending = new Map<string, PendingRequest>();
  private subscriptions = new Map<string, Subscription>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(private readonly runtimeConfig: RuntimeConfig) {}

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    await this.ensureConnected();
    return new Promise<TResult>((resolve, reject) => {
      const id = createId();
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC ${method} timed out`));
      }, CALL_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: (value) => {
          const parsed = schema.safeParse(value);
          if (parsed.success) {
            resolve(parsed.data);
          } else {
            reject(parsed.error);
          }
        },
        reject,
        timeout
      });

      this.send({ jsonrpc: "2.0", id, method, params });
    });
  }

  subscribe<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>,
    handler: NotificationHandler<TResult>
  ): Unsubscribe {
    const subId = createId();
    this.subscriptions.set(subId, {
      method,
      handler: handler as NotificationHandler,
      schema: schema as z.ZodType
    });
    // Register interest with the server. Fire-and-forget; server then pushes
    // notifications with `method` and no id.
    void this.call(`${method}.start`, params, schema).catch(() => {
      // Swallow: subscription registration is best-effort. Notifications may
      // still arrive if the server registers implicitly.
    });

    return () => {
      this.subscriptions.delete(subId);
    };
  }

  private ensureConnected(): Promise<void> {
    if (this.disposed) {
      return Promise.reject(new Error("transport disposed"));
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }
    this.connectPromise = this.connect();
    return this.connectPromise;
  }

  private connect(): Promise<void> {
    const url = createWebSocketUrl(this.runtimeConfig.wsBaseUrl, "");
    this.ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      const ws = this.ws!;
      ws.addEventListener("open", () => {
        this.startHeartbeat();
        this.connectPromise = null;
        resolve();
      });
      ws.addEventListener("error", () => {
        this.connectPromise = null;
        reject(new Error("WebSocket connection failed"));
      });
      ws.addEventListener("message", (event) => this.onMessage(event));
      ws.addEventListener("close", () => this.onClose());
    });
  }

  private onMessage(event: MessageEvent) {
    let payload: RpcResponse;
    try {
      payload = JSON.parse(event.data as string);
    } catch {
      return;
    }

    // Notification: server-pushed, no id.
    if (payload.id === undefined || payload.id === null) {
      if (payload.method) {
        for (const sub of this.subscriptions.values()) {
          if (sub.method === payload.method) {
            try {
              sub.handler(sub.schema.parse(payload.params));
            } catch {
              // Ignore parse failures on push; schema mismatch shouldn't
              // tear down other subscribers.
            }
          }
        }
      }
      return;
    }

    // Response to a request we sent.
    const pending = this.pending.get(String(payload.id));
    if (!pending) return;
    this.pending.delete(String(payload.id));
    clearTimeout(pending.timeout);

    if (payload.error) {
      pending.reject(
        new RpcError(payload.error.code, payload.error.message, payload.error.data)
      );
    } else {
      pending.resolve(payload.result);
    }
  }

  private onClose() {
    this.stopHeartbeat();
    this.ws = null;
    this.connectPromise = null;

    // Reject pending requests so callers can retry.
    for (const [, req] of this.pending) {
      clearTimeout(req.timeout);
      req.reject(new Error("WebSocket closed"));
    }
    this.pending.clear();

    if (this.disposed) return;
    // Schedule reconnect.
    this.reconnectTimer = setTimeout(() => {
      this.ensureConnected().catch(() => {
        // Reconnect failed; onClose will fire again if it ever opens then drops.
      });
    }, RECONNECT_DELAY_MS);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.stopHeartbeat();
        return;
      }
      // Cheap no-op call keeps the socket warm and detects silent drops.
      this.call("system.ping", [], z.unknown()).catch(() => {
        this.ws?.close();
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private send(message: unknown) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not open");
    }
    this.ws.send(JSON.stringify(message));
  }

  dispose() {
    this.disposed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    for (const [, req] of this.pending) {
      clearTimeout(req.timeout);
      req.reject(new Error("transport disposed"));
    }
    this.pending.clear();
    this.subscriptions.clear();
    this.ws?.close();
    this.ws = null;
  }
}
