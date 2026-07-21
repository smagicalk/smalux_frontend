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
  call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult>;

  subscribe<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>,
    handler: NotificationHandler<TResult>
  ): Unsubscribe;

  /** Whether the transport is currently connected/usable. */
  readonly connected: boolean;

  /** Release any underlying connection (sockets, timers). */
  dispose(): void;
}

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
