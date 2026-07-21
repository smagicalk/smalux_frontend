import type { z } from "zod";

/**
 * A subscription to a server-push stream. Cancel it to stop receiving
 * notifications for this method.
 */
export type Unsubscribe = () => void;

/**
 * Handler invoked when the server pushes a notification (JSON-RPC request
 * without an id) matching the subscribed method.
 */
export type NotificationHandler<T = unknown> = (params: T) => void;

/**
 * Transport is the single abstraction the RPC client talks to. It hides
 * whether we are on a real WebSocket, an HTTP fallback, or a mock.
 *
 * - call(): request/response. Resolves with the parsed `result`.
 * - subscribe(): server-pushed notifications. Returns an unsubscribe fn.
 *
 * Mock and real transports implement the same surface, so switching from
 * mock to the real backend is a config change, not a code change.
 */
export interface Transport {
  /**
   * Execute one JSON-RPC request and validate its `result` before returning it.
   *
   * Implementations must reject transport failures, JSON-RPC errors and schema
   * mismatches instead of returning partially trusted data to feature hooks.
   */
  call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult>;

  /**
   * Register a handler for a server-push method.
   *
   * The returned function only owns this local subscription. Calling it must
   * be idempotent so React effect cleanup remains safe during Strict Mode.
   * Transports without push support may return a no-op cleanup function.
   */
  subscribe<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>,
    handler: NotificationHandler<TResult>
  ): Unsubscribe;

  /**
   * Whether the transport is currently usable for calls. For WebSocket this
   * reflects socket state; for stateless HTTP it describes capability rather
   * than a preflight health check.
   */
  readonly connected: boolean;

  /** Release any underlying connection (sockets, timers). */
  dispose(): void;
}

/**
 * A business/protocol error returned by the JSON-RPC server.
 *
 * This is deliberately distinct from network and decoding errors. RpcClient
 * must not retry it through another transport because doing so could execute
 * a failed mutation twice or hide an authoritative server response.
 */
export class RpcError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.data = data;
  }
}
