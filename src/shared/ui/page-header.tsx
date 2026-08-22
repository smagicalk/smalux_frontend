import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: string;
  className?: string;
}

/**
 * Modern page header: clean hierarchy, subtle border bottom, no harsh neon bands.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  action,
  className
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/90 px-6 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-muted/50 text-foreground shadow-2xs">
            {icon}
          </div>
        )}
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-base font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
