import { describe, expect, it } from "vitest";

import { defaultRuntimeConfig, loadRuntimeConfig } from "@/app/config/runtime-config";

describe("loadRuntimeConfig", () => {
  it("loads runtime config from app-config.json", async () => {
    const config = await loadRuntimeConfig(async () => {
      return new Response(
        JSON.stringify({
          appName: "smalux-test",
          apiBaseUrl: "https://api.example.test",
          wsBaseUrl: "wss://api.example.test/ws",
          rpcBaseUrl: "https://api.example.test/rpc",
          transport: "ws",
          theme: "dark"
        }),
        {
          status: 200
        }
      );
    });

    expect(config).toEqual({
      appName: "smalux-test",
      apiBaseUrl: "https://api.example.test",
      wsBaseUrl: "wss://api.example.test/ws",
      rpcBaseUrl: "https://api.example.test/rpc",
      transport: "ws",
      theme: "dark"
    });
  });

  it("falls back when config is unavailable", async () => {
    const config = await loadRuntimeConfig(async () => {
      return new Response(null, {
        status: 404
      });
    });

    expect(config).toEqual(defaultRuntimeConfig);
  });

  it("falls back when endpoint schemes are unsafe", async () => {
    const config = await loadRuntimeConfig(async () => {
      return new Response(
        JSON.stringify({
          appName: "smalux-test",
          apiBaseUrl: "javascript:alert(1)",
          wsBaseUrl: "//evil.example/ws",
          rpcBaseUrl: "data:text/plain,unsafe",
          theme: "dark"
        }),
        {
          status: 200
        }
      );
    });

    expect(config).toEqual(defaultRuntimeConfig);
  });
});
