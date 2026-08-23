import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Toast host (sonner). Mounted once in the app shell. Pages call
 * `toast.success(...)` / `toast.error(...)` after a mutation lands.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
    />
  );
}

export { toast };
