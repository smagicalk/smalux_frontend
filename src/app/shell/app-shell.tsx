import { Monitor, Moon, Sun } from "lucide-react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Toaster } from "@/shared/ui/toaster";
import { useThemeStore, type ThemeMode } from "@/shared/stores/theme-store";
import { navItems, isNavActive } from "./navigation";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { NotificationCenter } from "./notification-center";

/**
 * Admin layout: a flat sidebar (module index, not brand cards) and a thin
 * top control bar (notifications + theme + session). Content pages
 * render in the Outlet. On mobile the sidebar collapses to a bottom nav.
 */
export function AppShell() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl md:flex">
        <div className="flex h-12 items-center gap-2 px-4 text-sm font-semibold text-sidebar-foreground">
          <span className="relative flex size-2.5 items-center justify-center">
            <span className="absolute size-2.5 animate-ping rounded-full bg-primary opacity-40" />
            <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          </span>
          <span className="tracking-tight">smalux</span>
          <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
            console
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const active = isNavActive(currentPath, item.path);
              const Icon = item.icon;
              return (
                <li key={item.path} className="relative">
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                  ) : null}
                  <Link
                    to={item.path}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-all",
                      active
                        ? "bg-primary/10 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-primary drop-shadow-[0_0_4px_var(--primary)]" : "text-muted-foreground/80 group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {active ? <span className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
      <Toaster />
    </div>
  );
}

function TopBar() {
  return (
    <header className="glass sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationCenter />
      </div>
    </header>
  );
}

function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const next: ThemeMode = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`主题：${mode}（切换至 ${next}）`}
      onClick={() => setMode(next)}
    >
      <Icon className="size-4" />
    </Button>
  );
}
