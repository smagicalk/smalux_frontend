import { useState, useRef, useEffect } from "react";
import {
  Monitor,
  Moon,
  Sun,
  Search,
  Radio
} from "lucide-react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Toaster } from "@/shared/ui/toaster";
import { useThemeStore, type ThemeMode } from "@/shared/stores/theme-store";
import { navItems, isNavActive } from "./navigation";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { NotificationCenter } from "./notification-center";
import { CommandDialog } from "./command-dialog";

export function AppShell() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [commandOpen, setCommandOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Automatically scroll to top whenever pathname or search changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-full min-h-0 bg-background font-sans">
      {/* Modern Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border/60">
          <Link to="/admin/overview" className="flex items-center gap-2.5 group">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">smalux</span>
              <span className="text-[10px] text-muted-foreground font-mono leading-none">Console v0.2.0</span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
            <span className="size-1.5 rounded-full bg-emerald-500 pulse-dot" />
            Live
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-2.5 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              控制台工作流
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isNavActive(currentPath, item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer",
                      active
                        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                      )}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {active && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick System Status Card in Sidebar */}
          <div className="rounded-xl border border-sidebar-border/80 bg-muted/30 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Radio className="size-3 text-emerald-500 animate-pulse" />
                集群节点状态
              </span>
              <span className="text-[11px] font-mono text-emerald-500">100% 正常</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500 w-full" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/80 font-mono">
              <span>探针: 12 在线</span>
              <span>丢包: 0.0%</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border/60 p-3">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-sidebar-border/80 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Search className="size-3.5" />
              快速命令...
            </span>
            <kbd className="rounded border border-border/80 bg-muted px-1.5 py-0.5 text-[10px] font-mono">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenCommand={() => setCommandOpen(true)} />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0 bg-background/50">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} />
      <Toaster />
    </div>
  );
}

function TopBar({ onOpenCommand }: { onOpenCommand: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/80 transition-all cursor-pointer shadow-2xs"
        >
          <Search className="size-3.5" />
          <span>搜索功能、主机节点、命令...</span>
          <kbd className="ml-4 rounded border border-border/80 bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Ctrl + K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 pulse-dot" />
          <span className="text-[11px] font-mono">实时数据已同步</span>
        </div>

        <div className="h-4 w-px bg-border/80 mx-1 hidden sm:block" />

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
      className="text-muted-foreground hover:text-foreground"
    >
      <Icon className="size-4" />
    </Button>
  );
}
