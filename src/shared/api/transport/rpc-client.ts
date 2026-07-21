import type { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import { RpcError } from "./types";
import { WsTransport } from "./ws-transport";
import { HttpTransport } from "./http-transport";
import { MockTransport } from "./mock-transport";
import { createMockBackend } from "@/shared/api/mock/mock-backend";

/**
 * The single RPC entry point for the whole frontend. Hooks call
 * `rpcClient.call(method, params, schema)` and `rpcClient.subscribe(...)`.
 *
 * The transport is chosen from runtime config: `mock` for development,
 * `ws` for real backends, `http` as fallback. Because all transports share
 * the Transport interface, swapping is a config change, not a code change.
 */
export class RpcClient {
  private transport: Transport;
  private explicit: Transport | null = null;
  private readonly httpFallback: HttpTransport | null;

  constructor(private readonly runtimeConfig: RuntimeConfig) {
    this.transport = this.buildTransport();
    this.httpFallback = runtimeConfig.transport === "ws"
      ? new HttpTransport(runtimeConfig)
      : null;
  }

  /** Override the transport (used in tests). */
  setTransport(transport: Transport) {
    this.explicit = transport;
    this.transport = transport;
  }

  get connected(): boolean {
    return this.transport.connected;
  }

  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    try {
      return await this.transport.call(method, params, schema);
    } catch (error) {
      const canFallback =
        this.explicit === null &&
        this.httpFallback !== null &&
        !this.transport.connected &&
        !(error instanceof RpcError);
      if (!canFallback) throw error;
      return this.httpFallback.call(method, params, schema);
    }
  }

  subscribe<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>,
    handler: NotificationHandler<TResult>
  ): Unsubscribe {
    return this.transport.subscribe(method, params, schema, handler);
  }

  dispose() {
    this.transport.dispose();
    this.httpFallback?.dispose();
  }

  private buildTransport(): Transport {
    switch (this.runtimeConfig.transport) {
      case "ws":
        return new WsTransport(this.runtimeConfig);
      case "http":
        return new HttpTransport(this.runtimeConfig);
      case "mock":
      default:
        return new MockTransport(this.runtimeConfig, createMockBackend());
    }
  }
}
