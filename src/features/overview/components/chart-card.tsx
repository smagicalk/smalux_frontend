import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/shared/lib/utils";

/**
 * Standard panel wrapper for an overview chart: a title bar with an accent icon
 * chip + subtitle, then the chart body. When `to` is set it becomes a clickable
 * link card (with an extra primary glow on hover) that navigates to a module;
 * otherwise it's a plain hoverable card. The top hairline brightens on hover so
 * every card on the page shares one unified hover language.
 */
export function ChartCard({
  title,
  subtitle,
  className,
  icon,
  accent = "primary",
  to,
  children
}: {
  title: string;
  subtitle?: string;
  className?: string;
  icon?: ReactNode;
  accent?: "primary" | "danger" | "success" | "warning" | "violet";
  to?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const color =
    accent === "danger" ? "var(--danger)"
      : accent === "success" ? "var(--success)"
        : accent === "warning" ? "var(--warning)"
          : accent === "violet" ? "var(--violet)"
            : "var(--primary)";
  const inner = (
    <>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        {icon ? (
          <span
            className="flex size-5 items-center justify-center rounded"
            style={{ background: `color-mix(in oklch, ${color} 18%, transparent)`, color }}
          >
            {icon}
          </span>
        ) : null}
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        {subtitle ? <span className="ml-auto text-[11px] text-muted-foreground">{subtitle}</span> : null}
      </div>
      <div className="p-2">{children}</div>
    </>
  );
  // When `to` is set, render a hoverable link card with an accent top-hairline.
  if (to) {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={() => navigate({ to: to as never })}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate({ to: to as never }); } }}
        className={cn(
          "glass group relative cursor-pointer overflow-hidden rounded-md border border-border transition-all hover:border-primary/40 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4),0_0_20px_-8px_var(--primary)]",
          className
        )}
      >
        <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        {inner}
      </div>
    );
  }
  return (
    <div className={cn("glass group relative overflow-hidden rounded-md border border-border transition-all hover:border-primary/40 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]", className)}>
      <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      {inner}
    </div>
  );
}
