import { z } from "zod";

import { isSafeRuntimeEndpoint } from "@/shared/api/url";

const runtimeEndpointSchema = z.string().min(1).refine(isSafeRuntimeEndpoint, {
  message: "Endpoint must be a relative path or http(s)/ws(s) URL"
});

const runtimeConfigSchema = z.object({
  appName: z.string().min(1).default("smalux"),
  apiBaseUrl: runtimeEndpointSchema.default("/api"),
  wsBaseUrl: runtimeEndpointSchema.default("/ws"),
  rpcBaseUrl: runtimeEndpointSchema.default("/rpc"),
  theme: z.enum(["light", "dark", "system"]).default("system")
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export const defaultRuntimeConfig: RuntimeConfig = {
  appName: "smalux",
  apiBaseUrl: "/api",
  wsBaseUrl: "/ws",
  rpcBaseUrl: "/rpc",
  theme: "system"
};

export async function loadRuntimeConfig(
  fetcher: typeof fetch = fetch
): Promise<RuntimeConfig> {
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
