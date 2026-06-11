import { AdminProviders } from "@/app/providers/admin-providers";
import { AppShell } from "@/app/shell/app-shell";

export function AdminRoot() {
  return (
    <AdminProviders>
      <AppShell />
    </AdminProviders>
  );
}
