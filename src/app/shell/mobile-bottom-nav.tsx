import { Link } from "@tanstack/react-router";

import {
  primaryMobileNavigationItems,
  secondaryMobileNavigationItems
} from "@/app/shell/navigation";

export function MobileBottomNav() {
  return (
    <nav
      aria-label="移动端主导航"
      className="fixed inset-x-0 bottom-0 z-20 overflow-hidden border-t border-white/45 bg-background/84 backdrop-blur-xl lg:hidden dark:border-white/8"
    >
      <div className="mx-auto mb-[calc(env(safe-area-inset-bottom)+0.5rem)] mt-2 w-[calc(100vw-1rem)] max-w-full overflow-hidden rounded-[1.4rem] border border-white/55 bg-white/70 shadow-[var(--shadow-soft)] dark:border-white/8 dark:bg-white/6">
        <div className="flex gap-1 overflow-x-auto p-2">
          {[...primaryMobileNavigationItems, ...secondaryMobileNavigationItems].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="flex h-14 min-w-[68px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold tracking-[-0.02em] text-muted-foreground transition hover:bg-[color:var(--surface-muted)] hover:text-foreground"
              activeProps={{
                className: "bg-[color:var(--surface-nav-active)] text-accent-foreground"
              }}
            >
              <item.icon aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
