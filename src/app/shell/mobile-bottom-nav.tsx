import { LayoutDashboard, Server, Terminal, BellRing, Settings } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

import { cn } from "@/shared/lib/utils";
import { isNavActive } from "./navigation";

const mobileNav = [
  { label: "总览", path: "/admin/overview", icon: LayoutDashboard },
  { label: "基建", path: "/admin/infrastructure", icon: Server },
  { label: "运维", path: "/admin/automation", icon: Terminal },
  { label: "告警", path: "/admin/alerts", icon: BellRing },
  { label: "设置", path: "/admin/settings", icon: Settings }
];

export function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-border/80 md:hidden">
      {mobileNav.map((item) => {
        const active = isNavActive(currentPath, item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <span className="absolute top-0 h-0.5 w-6 rounded-full bg-primary" />
            )}
            <Icon className="size-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
