import { Link } from "@tanstack/react-router";

import {
  primaryMobileNavigationItems,
  secondaryMobileNavigationItems
} from "@/app/shell/navigation";

export function MobileBottomNav() {
  return (
    <nav
      aria-label="移动端主导航"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto mb-[calc(env(safe-area-inset-bottom)+0.5rem)] mt-2 w-[calc(100vw-1rem)] max-w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-panel)]">
        <div className="flex gap-1 overflow-x-auto p-2">
          {[...primaryMobileNavigationItems, ...secondaryMobileNavigationItems].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="flex h-14 min-w-[68px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className: "bg-accent text-accent-foreground"
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
