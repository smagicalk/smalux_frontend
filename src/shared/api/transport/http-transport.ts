import { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { joinUrl } from "@/shared/api/url";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import { RpcError } from "./types";

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
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Fallback transport: each call is one HTTP POST to the RPC endpoint.
 * Used when WebSocket is unavailable. Notifications/subscriptions are not
 * supported over HTTP — subscribe() is a no-op that returns immediately.
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

    if (!response.ok) {
      throw new Error(`RPC HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = rpcResponseSchema.parse(await response.json());
    if (payload.error) {
      throw new RpcError(payload.error.code, payload.error.message, payload.error.data);
    }
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
