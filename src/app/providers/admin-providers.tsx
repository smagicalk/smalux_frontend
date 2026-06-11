import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

import { useRuntimeConfig } from "@/app/providers/runtime-config-context";
import { ApiClientsProvider } from "@/app/providers/api-clients-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: false
    }
  }
});

type AdminProvidersProps = {
  children: ReactNode;
};

export function AdminProviders({ children }: AdminProvidersProps) {
  const runtimeConfig = useRuntimeConfig();

  return (
    <ApiClientsProvider runtimeConfig={runtimeConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={250}>
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </ApiClientsProvider>
  );
}
