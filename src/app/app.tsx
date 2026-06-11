import { RouterProvider } from "@tanstack/react-router";

import { AppProviders } from "@/app/providers/app-providers";
import { router } from "@/app/router/router";
import type { RuntimeConfig } from "@/app/config/runtime-config";

type AppProps = {
  runtimeConfig: RuntimeConfig;
};

export function App({ runtimeConfig }: AppProps) {
  return (
    <AppProviders runtimeConfig={runtimeConfig}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
