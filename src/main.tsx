import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/app";
import { loadRuntimeConfig } from "@/app/config/runtime-config";
import "@/app/styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

const runtimeConfig = await loadRuntimeConfig();

createRoot(rootElement).render(
  <StrictMode>
    <App runtimeConfig={runtimeConfig} />
  </StrictMode>
);
