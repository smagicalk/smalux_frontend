import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Probe console data is short-lived; refetch on focus but keep it simple.
      staleTime: 10_000,
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
