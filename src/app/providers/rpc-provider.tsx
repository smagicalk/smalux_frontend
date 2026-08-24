import * as React from "react";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { RpcClient } from "@/shared/api/transport/rpc-client";
import { RpcContext, type RpcContextValue } from "./rpc-context";

/**
 * 全局 RPC 依赖注入提供者（RpcProvider）
 * 
 * 在应用最顶层（main.tsx）接收启动时加载的 `RuntimeConfig`，
 * 实例化唯一的全局 `RpcClient` 并注入 React 上下文树，
 * 供全量 Feature Hook 与业务页面共享调用。
 */
export function RpcProvider({
  config,
  children
}: {
  config: RuntimeConfig;
  children: React.ReactNode;
}) {
  const value = React.useMemo<RpcContextValue>(() => {
    const client = new RpcClient(config);
    return { config, client };
  }, [config]);

  return <RpcContext.Provider value={value}>{children}</RpcContext.Provider>;
}
