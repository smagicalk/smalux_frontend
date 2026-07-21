import { LayoutGrid, Server, TerminalSquare, Bell } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

import { cn } from "@/shared/lib/utils";
import { isNavActive } from "./navigation";

/**
 * Mobile bottom nav: only the four most-used destinations. The full sidebar
 * is desktop-only; mobile users get a compact dock plus the rest via search.
 */
const mobileNav = [
  { label: "总览", path: "/admin", icon: LayoutGrid },
  { label: "服务器", path: "/admin/servers", icon: Server },
  { label: "执行", path: "/admin/tasks", icon: TerminalSquare },
  { label: "通知", path: "/admin/notifications", icon: Bell }
];

export function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-border md:hidden">
      {mobileNav.map((item) => {
        const active = isNavActive(currentPath, item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {active ? (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
            ) : null}
            <Icon
              className={cn(
                "size-5 transition-all",
                active ? "text-primary drop-shadow-[0_0_4px_var(--primary)]" : ""
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
