import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import "@/app/styles/globals.css";
import { loadRuntimeConfig, type RuntimeConfig } from "@/app/config/runtime-config";
import { httpClient } from "@/shared/api/http/http-client";
import { createAppRouter } from "@/app/router/router";
import { RpcProvider } from "@/app/providers/rpc-provider";
import { QueryProvider } from "@/app/providers/query-provider";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { initThemeFromConfig, resolveThemeMode, useThemeStore } from "@/shared/stores/theme-store";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

/**
 * Boot: load runtime config first (it decides the transport), then mount.
 * Until config resolves we render a bare loader so the RpcClient / router
 * context are never created without the transport choice.
 */
loadRuntimeConfig().then((config: RuntimeConfig) => {
  // 💡 同步更新 HTTP Client 的 Mock 开关与 API 基础地址
  httpClient.updateConfig(config);

  // Apply the theme class on <html> BEFORE first render. Chart options read
  // CSS color tokens (oklch) during render to build canvas gradients; if the
  // .dark class only lands in an effect after paint, the first chartPalette()
  // call resolves the light-mode tokens and caches them — so charts render in
  // the wrong-theme colors. Applying synchronously here keeps the cache right
  // from the very first render.
  initThemeFromConfig(config.theme);
  const dark = resolveThemeMode(useThemeStore.getState().mode) === "dark";
  document.documentElement.classList.toggle("dark", dark);

  const router = createAppRouter({ config });

  createRoot(rootEl).render(
    <StrictMode>
      <RpcProvider config={config}>
        <QueryProvider>
          <ThemeProvider initialMode={config.theme}>
            <RouterProvider router={router} />
          </ThemeProvider>
        </QueryProvider>
      </RpcProvider>
    </StrictMode>
  );
});
