import { z } from "zod";

import { isSafeRuntimeEndpoint } from "@/shared/api/url";

// Runtime endpoints are deployment inputs, not trusted build-time constants.
// Validate them before any transport constructs a URL or opens a connection.
const runtimeEndpointSchema = z.string().min(1).refine(isSafeRuntimeEndpoint, {
  message: "Endpoint must be a relative path or http(s)/ws(s) URL"
});

const transportSchema = z.enum(["mock", "ws", "http"]).default("mock");

// Defaults keep same-origin development functional when app-config.json omits
// optional fields, while an explicitly invalid field rejects the whole payload.
const runtimeConfigSchema = z.object({
  appName: z.string().min(1).default("smalux"),
  apiBaseUrl: runtimeEndpointSchema.default("/api"),
  wsBaseUrl: runtimeEndpointSchema.default("/ws"),
  rpcBaseUrl: runtimeEndpointSchema.default("/rpc"),
  transport: transportSchema,
  theme: z.enum(["light", "dark", "system"]).default("system")
});

export type TransportMode = z.infer<typeof transportSchema>;
export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export const defaultRuntimeConfig: RuntimeConfig = {
  appName: "smalux",
  apiBaseUrl: "/api",
  wsBaseUrl: "/ws",
  rpcBaseUrl: "/rpc",
  transport: "mock",
  theme: "system"
};

export async function loadRuntimeConfig(
  fetcher: typeof fetch = fetch
): Promise<RuntimeConfig> {
  // Configuration is fetched at startup with cache disabled so an operator can
  // redirect endpoints without rebuilding static assets. Any network, JSON or
  // schema failure falls back atomically to the known-safe same-origin config;
  // mixing partially valid deployment values would be harder to diagnose and
  // could route HTTP and WebSocket traffic to different environments.
  try {
    const response = await fetcher("/app-config.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      return defaultRuntimeConfig;
    }

    return runtimeConfigSchema.parse(await response.json());
  } catch {
    return defaultRuntimeConfig;
  }
}
