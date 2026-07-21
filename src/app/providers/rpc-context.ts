import { createContext, useContext } from "react";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { RpcClient } from "@/shared/api/transport/rpc-client";

export interface RpcContextValue {
  config: RuntimeConfig;
  client: RpcClient;
}

export const RpcContext = createContext<RpcContextValue | null>(null);

export function useRpc(): RpcContextValue {
  const value = useContext(RpcContext);
  if (!value) {
    throw new Error("useRpc must be used within <RpcProvider>");
  }
  return value;
}
