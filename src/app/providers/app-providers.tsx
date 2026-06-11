import type { ReactNode } from "react";
import { Toaster } from "sonner";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { RuntimeConfigProvider } from "@/app/providers/runtime-config-provider";
import { ThemeProvider } from "@/app/providers/theme-provider";

type AppProvidersProps = {
  runtimeConfig: RuntimeConfig;
  children: ReactNode;
};

export function AppProviders({ runtimeConfig, children }: AppProvidersProps) {
  return (
    <RuntimeConfigProvider runtimeConfig={runtimeConfig}>
      <ThemeProvider>
        {children}
        <Toaster richColors closeButton />
      </ThemeProvider>
    </RuntimeConfigProvider>
  );
}
