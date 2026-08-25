import * as React from "react";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { RpcClient } from "@/shared/api/transport/rpc-client";
import { httpClient } from "@/shared/api/http/http-client";
import { RpcContext, type RpcContextValue } from "./rpc-context";

/**
 * 全局 RPC / HTTP 依赖注入提供者（RpcProvider）
 * 
 * 在应用最顶层（main.tsx）接收启动时加载的 `RuntimeConfig`，
 * 实例化唯一的全局 `RpcClient` 并同步更新 `httpClient` 配置。
 */
export function RpcProvider({
  config,
  children
}: {
  config: RuntimeConfig;
  children: React.ReactNode;
}) {
  const value = React.useMemo<RpcContextValue>(() => {
    httpClient.setBaseUrl(config.apiBaseUrl);
    const client = new RpcClient(config);
    return { config, client };
  }, [config]);

  return <RpcContext.Provider value={value}>{children}</RpcContext.Provider>;
}
