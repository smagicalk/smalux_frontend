import { z } from "zod";

import { createWebSocketUrl } from "@/shared/api/url";
import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import { RpcError } from "./types";

// Keep timing policy in one place. Calls fail before a stale socket can leave a
// query pending forever; heartbeat detects half-open connections; reconnect is
// deliberately short because ensureConnected de-duplicates concurrent opens.
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
  /** Resolvers are stored by JSON-RPC id so one socket can multiplex calls. */
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

interface Subscription {
  method: string;
  /** Original registration params are retained for reconnect replay. */
  params: unknown;
  // Server notifications have no request id, so subscriptions are matched by
  // method name. Multiple local handlers may listen to the same method.
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
 * Single shared WebSocket connection multiplexing JSON-RPC calls by request id
 * and routing server-push notifications by method name.
 *
 * The socket connects lazily on the first call/subscription registration,
 * shares one in-flight connection promise among concurrent callers, rejects all
 * pending calls on disconnect, and schedules a reconnect. A periodic
 * `system.ping` closes half-open sockets so normal close/reconnect handling can
 * recover them. Every response and notification is schema-validated before it
 * reaches feature code.
 */
export class WsTransport implements Transport {
  private ws: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private pending = new Map<string, PendingRequest>();
  private subscriptions = new Map<string, Subscription>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private hasOpened = false;
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
      // Timeout owns removal from `pending`; a late response is then ignored.
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC ${method} timed out`));
      }, CALL_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: (value) => {
          // safeParse keeps validation failure on this request's promise and
          // does not disrupt unrelated requests sharing the same socket.
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
      params,
      handler: handler as NotificationHandler,
      schema: schema as z.ZodType
    });
    // Register interest with the server. This control request is best-effort:
    // some backends treat the stream as implicit, while others acknowledge the
    // `.start` method and then push notifications without an id.
    this.startSubscription(method, params);

    return () => {
      // Only local routing state is owned here. The current protocol has no
      // matching `.stop` contract, so cleanup intentionally sends no command.
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
      // All callers await the same socket open instead of creating parallel
      // WebSocket instances during an initial page render.
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
      let opened = false;
      ws.addEventListener("open", () => {
        opened = true;
        this.startHeartbeat();
        this.connectPromise = null;
        const shouldResumeSubscriptions = this.hasOpened;
        this.hasOpened = true;
        resolve();
        if (shouldResumeSubscriptions) {
          this.resumeSubscriptions();
        }
      });
      ws.addEventListener("error", () => {
        this.connectPromise = null;
        reject(new Error("WebSocket connection failed"));
      });
      ws.addEventListener("message", (event) => this.onMessage(event));
      ws.addEventListener("close", () => {
        this.onClose();
        // A close before open cannot be handled by pending-call rejection,
        // because call() is still awaiting this connection promise and has not
        // created its request entry yet. Reject it explicitly to avoid a leak.
        if (!opened) {
          reject(new Error("WebSocket closed before opening"));
        }
      });
    });
  }

  private onMessage(event: MessageEvent) {
    let payload: RpcResponse;
    try {
      payload = JSON.parse(event.data as string);
    } catch {
      // An invalid frame cannot be correlated safely. Ignore it without
      // terminating valid in-flight calls on the shared connection.
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
              // A malformed push is isolated to this handler; it must not tear
              // down the socket or block other subscribers.
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

    // A response can no longer arrive on this socket, so reject immediately
    // rather than waiting for every per-call timeout.
    for (const [, req] of this.pending) {
      clearTimeout(req.timeout);
      req.reject(new Error("WebSocket closed"));
    }
    this.pending.clear();

    if (this.disposed) return;
    // Reconnect restores transport availability. Local subscriptions remain in
    // the routing map, but `.start` is not replayed by the current protocol;
    // deployments that require replay should add an explicit resume contract.
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

  /**
   * Re-register every active local subscription after a socket reconnect.
   * The first connection is excluded because each subscribe() call is already
   * awaiting it and will send its own registration when the socket opens.
   */
  private resumeSubscriptions() {
    for (const subscription of this.subscriptions.values()) {
      this.startSubscription(subscription.method, subscription.params);
    }
  }

  /**
   * Send the protocol's best-effort stream registration command. Its response
   * is only an acknowledgement, so push payload validation remains exclusively
   * attached to the stored subscription schema in onMessage().
   */
  private startSubscription(method: string, params: unknown) {
    void this.call(`${method}.start`, params, z.unknown()).catch(() => {
      // The backend may register streams implicitly; a control-call failure
      // therefore does not remove the local handler or terminate the socket.
    });
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
    // Disposal is terminal: cancel timers, reject owned promises and prevent
    // onClose from scheduling another connection after application teardown.
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
