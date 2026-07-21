import { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { joinUrl } from "@/shared/api/url";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import { RpcError } from "./types";

// Validate the JSON-RPC envelope before a method-specific schema validates
// `result`. This separates protocol corruption from domain contract failures.
const rpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional()
    })
    .optional()
});

function createId(): string {
  // randomUUID is preferred for traceability. The fallback only needs to be
  // unique enough to correlate a stateless request with its response.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Stateless transport: each call is one HTTP POST to the configured RPC
 * endpoint. It is used directly in HTTP mode and as the WS client's restricted
 * fallback when the socket is unavailable.
 *
 * `connected` is always true because fetch has no persistent connection to
 * inspect. It does not claim that the remote service is healthy; call failures
 * still reject normally. Notifications are unsupported, so subscribe() returns
 * a no-op cleanup and real-time hooks must use polling when appropriate.
 */
export class HttpTransport implements Transport {
  readonly connected = true;

  constructor(private readonly runtimeConfig: RuntimeConfig) {}

  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    const url = joinUrl(this.runtimeConfig.rpcBaseUrl, "");
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: createId(), method, params })
    });

    // HTTP failures are transport errors. A valid JSON-RPC error below is an
    // RpcError so callers can distinguish server decisions from connectivity.
    if (!response.ok) {
      throw new Error(`RPC HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = rpcResponseSchema.parse(await response.json());
    if (payload.error) {
      throw new RpcError(payload.error.code, payload.error.message, payload.error.data);
    }
    // Never let an unvalidated API result enter the query cache.
    return schema.parse(payload.result);
  }

  subscribe<TResult>(
    _method: string,
    _params: unknown,
    _schema: z.ZodType<TResult>,
    _handler: NotificationHandler<TResult>
  ): Unsubscribe {
    // HTTP cannot receive server pushes. Real-time data requires the WS
    // transport; over HTTP the UI falls back to polling at the hook layer.
    return () => {};
  }

  dispose() {
    // Nothing to release for fetch-based transport.
  }
}
