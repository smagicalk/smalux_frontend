import { createContext, useContext } from "react";

import type { ApiClients } from "@/shared/api/api-clients";

export const ApiClientsContext = createContext<ApiClients | null>(null);

export function useApiClients() {
  const clients = useContext(ApiClientsContext);

  if (!clients) {
    throw new Error("ApiClientsProvider is required");
  }

  return clients;
}
