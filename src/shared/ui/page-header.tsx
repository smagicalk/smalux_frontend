import type { ReactNode } from "react";

/**
 * Thin title bar: title + optional subtitle on the left, actions on the
 * right, separated by a hairline border below. No hero header, no card.
 */
export function PageHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="glass sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
      {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
      <div className="ml-auto">{action}</div>
    </div>
  );
}
