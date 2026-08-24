import { createContext, useContext } from "react";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { RpcClient } from "@/shared/api/transport/rpc-client";

/**
 * 全局 RPC 上下文对象形态
 */
export interface RpcContextValue {
  /** 当前生效的运行时配置 */
  config: RuntimeConfig;
  /** 全局单例 RPC 客户端 */
  client: RpcClient;
}

export const RpcContext = createContext<RpcContextValue | null>(null);

/**
 * 获取全局 RPC 客户端与配置的 React Hook
 * 
 * 必须在 `<RpcProvider>` 组件树内部使用。
 * 
 * @example
 * ```ts
 * const { client } = useRpc();
 * const data = await client.call("agent.list", {}, schema);
 * ```
 */
export function useRpc(): RpcContextValue {
  const value = useContext(RpcContext);
  if (!value) {
    throw new Error("useRpc must be used within <RpcProvider>");
  }
  return value;
}
