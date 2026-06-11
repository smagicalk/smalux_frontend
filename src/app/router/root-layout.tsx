import { lazy, Suspense } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

const AdminRoot = lazy(() =>
  import("@/app/admin/admin-root").then((module) => ({
    default: module.AdminRoot
  }))
);

export function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });

  if (pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={<AdminShellFallback />}>
        <AdminRoot />
      </Suspense>
    );
  }

  return <Outlet />;
}

function AdminShellFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[256px_1fr]">
        <aside className="hidden border-r border-border bg-sidebar lg:block" />
        <div className="flex min-w-0 flex-col">
          <header className="h-16 border-b border-border bg-background" />
          <main className="flex flex-1 items-center justify-center p-6">
            <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              加载后台
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
