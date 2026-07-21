import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Toast host (sonner). Mounted once in the app shell. Pages call
 * `toast.success(...)` / `toast.error(...)` after a mutation lands.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          borderRadius: "0.5rem",
          border: "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--foreground)",
          fontSize: "0.8125rem"
        }
      }}
    />
  );
}

export { toast };
