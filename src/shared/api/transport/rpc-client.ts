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
 * `ws` for real backends, and `http` for stateless request/response access.
 * A WS-configured client also owns an HTTP fallback, but uses it only when the
 * socket is unavailable and the failure is not an authoritative RpcError.
 * This keeps transport recovery out of feature hooks without retrying business
 * failures or potentially duplicating mutations.
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

  /**
   * Override transport selection for a test or an isolated host integration.
   * Once set, automatic HTTP fallback is disabled so injected test behavior is
   * deterministic and cannot accidentally reach a configured endpoint.
   */
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
      // Fall back only for an unavailable socket. Schema failures while the
      // socket is connected indicate a contract mismatch and must stay visible.
      // RpcError is an accepted server response and must never be replayed.
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
    // Subscriptions remain transport-specific: HTTP cannot emulate server push.
    // Hooks that support HTTP provide their own polling strategy.
    return this.transport.subscribe(method, params, schema, handler);
  }

  /** Release both the primary transport and any lazily usable fallback. */
  dispose() {
    this.transport.dispose();
    this.httpFallback?.dispose();
  }

  private buildTransport(): Transport {
    // Runtime config is the only production transport selection point. Keeping
    // this switch here prevents features from branching on deployment details.
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
