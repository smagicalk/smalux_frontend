import { Link, Outlet } from "@tanstack/react-router";
import {
  ActivityIcon,
  BellIcon,
  ExternalLinkIcon,
  LockKeyholeIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { MobileBottomNav } from "@/app/shell/mobile-bottom-nav";
import { navigationSections } from "@/app/shell/navigation";
import { QuickSearch } from "@/app/shell/quick-search";
import { useThemeStore, type ThemeMode } from "@/shared/stores/theme-store";

const themeModes: Array<{
  mode: ThemeMode;
  label: string;
  icon: typeof SunIcon;
}> = [
  {
    mode: "light",
    label: "浅色",
    icon: SunIcon
  },
  {
    mode: "dark",
    label: "深色",
    icon: MoonIcon
  },
  {
    mode: "system",
    label: "跟随系统",
    icon: MonitorIcon
  }
];

export function AppShell() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-white/30 bg-[color:var(--surface-nav)] lg:flex lg:flex-col dark:border-white/8">
          <div className="border-b border-white/25 px-4 py-3 dark:border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ActivityIcon aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[-0.03em]">smalux</p>
                <p className="truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  probe console
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-2.5 py-3">
            {navigationSections.map((section) => (
              <div key={section.label} className="grid gap-0.5">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {section.label}
                </p>
                <div className="grid gap-px">
                  {section.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      activeOptions={{ exact: true }}
                      className="group flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition hover:bg-white/35 hover:text-foreground dark:hover:bg-white/6"
                      activeProps={{
                        className: "bg-[color:var(--surface-nav-active)] text-accent-foreground"
                      }}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="grid gap-1 border-t border-white/25 px-3 py-2.5 text-[11px] text-muted-foreground dark:border-white/8">
            <span>session: HttpOnly</span>
            <span>transport: HTTPS / WSS</span>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 border-b border-white/30 bg-background/84 px-4 py-2 backdrop-blur-xl md:px-5 dark:border-white/8">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/30 bg-white/55 px-3 py-2 shadow-[var(--shadow-soft)] dark:border-white/8 dark:bg-white/6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground lg:hidden">
                  <ActivityIcon aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    monitor console
                  </p>
                  <p className="truncate text-sm font-semibold tracking-[-0.03em]">后台监控</p>
                </div>
              </div>

              <QuickSearch className="hidden max-w-2xl flex-1 md:block" />

              <div className="flex items-center gap-1.5">
                <Link
                  to="/"
                  className="hidden h-8 items-center gap-2 rounded-md border border-white/30 bg-white/45 px-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground dark:border-white/8 dark:bg-white/6 sm:flex"
                >
                  <ExternalLinkIcon className="size-4" aria-hidden />
                  状态页
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-md"
                  aria-label="通知"
                  onClick={() =>
                    toast.info("通知中心", {
                      description: "mock: 2 条高风险审批、1 条通知投递失败。"
                    })
                  }
                >
                  <BellIcon aria-hidden />
                </Button>
                {themeModes.map((item) => (
                  <Button
                    key={item.mode}
                    variant={mode === item.mode ? "secondary" : "ghost"}
                    size="icon"
                    className="size-8 rounded-md"
                    aria-label={item.label}
                    onClick={() => {
                      setMode(item.mode);
                      toast.info("主题已切换", {
                        description: item.label
                      });
                    }}
                  >
                    <item.icon className="size-4" aria-hidden />
                  </Button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden">
              <Badge variant="outline">probe-first</Badge>
              <div className="flex items-center gap-2 rounded-full bg-[color:var(--surface-muted)] px-3 py-1.5 dark:bg-white/6">
                <LockKeyholeIcon className="size-3.5" aria-hidden />
                会话隔离
              </div>
              <Badge variant="outline">WSS-only</Badge>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-5 lg:pb-6">
            <div className={cn("mx-auto flex w-full max-w-[1480px] flex-col gap-4")}>
              <QuickSearch className="md:hidden" compact />
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
