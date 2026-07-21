import * as React from "react";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { RpcClient } from "@/shared/api/transport/rpc-client";
import { RpcContext, type RpcContextValue } from "./rpc-context";

/**
 * Builds the RpcClient from the already-loaded runtime config and provides
 * it to the tree. Config is loaded once in main.tsx so the router and the
 * client share the same value.
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
