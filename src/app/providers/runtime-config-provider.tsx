import type { ReactNode } from "react";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { RuntimeConfigContext } from "@/app/providers/runtime-config-context";

type RuntimeConfigProviderProps = {
  runtimeConfig: RuntimeConfig;
  children: ReactNode;
};

export function RuntimeConfigProvider({
  runtimeConfig,
  children
}: RuntimeConfigProviderProps) {
  return (
    <RuntimeConfigContext.Provider value={runtimeConfig}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}
