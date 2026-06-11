import { z } from "zod";

const runtimeConfigSchema = z.object({
  appName: z.string().min(1).default("smalux"),
  apiBaseUrl: z.string().min(1).default("/api"),
  wsBaseUrl: z.string().min(1).default("/ws"),
  rpcBaseUrl: z.string().min(1).default("/rpc"),
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
