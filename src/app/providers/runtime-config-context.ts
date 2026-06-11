import { createContext, useContext } from "react";

import type { RuntimeConfig } from "@/app/config/runtime-config";

export const RuntimeConfigContext = createContext<RuntimeConfig | null>(null);

export function useRuntimeConfig() {
  const runtimeConfig = useContext(RuntimeConfigContext);

  if (!runtimeConfig) {
    throw new Error("RuntimeConfigProvider is required");
  }

  return runtimeConfig;
}
