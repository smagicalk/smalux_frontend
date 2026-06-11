import { useMemo, type ReactNode } from "react";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { ApiClientsContext } from "@/app/providers/api-clients-context";
import { createApiClients } from "@/shared/api/api-clients";

type ApiClientsProviderProps = {
  runtimeConfig: RuntimeConfig;
  children: ReactNode;
};

export function ApiClientsProvider({
  runtimeConfig,
  children
}: ApiClientsProviderProps) {
  const clients = useMemo(() => createApiClients(runtimeConfig), [runtimeConfig]);

  return (
    <ApiClientsContext.Provider value={clients}>
      {children}
    </ApiClientsContext.Provider>
  );
}
