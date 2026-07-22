import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export type PageTone = "primary" | "cyan" | "violet" | "magenta" | "success" | "warning" | "danger";

const PAGE_TONE_CLASSES: Record<PageTone, { shell: string; title: string; rail: string }> = {
  primary: { shell: "border-primary/25 bg-primary/5", title: "text-primary", rail: "bg-primary" },
  cyan: { shell: "border-cyan/25 bg-cyan/5", title: "text-cyan", rail: "bg-cyan" },
  violet: { shell: "border-violet/25 bg-violet/5", title: "text-violet", rail: "bg-violet" },
  magenta: { shell: "border-magenta/25 bg-magenta/5", title: "text-magenta", rail: "bg-magenta" },
  success: { shell: "border-success/25 bg-success/5", title: "text-success", rail: "bg-success" },
  warning: { shell: "border-warning/25 bg-warning/5", title: "text-warning", rail: "bg-warning" },
  danger: { shell: "border-danger/25 bg-danger/5", title: "text-danger", rail: "bg-danger" }
};

/**
 * Thin title bar: title + optional subtitle on the left, actions on the
 * right, separated by a hairline border below. No hero header, no card.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  tone = "primary"
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Module-level semantic color; it identifies a page without changing layout. */
  tone?: PageTone;
}) {
  const colors = PAGE_TONE_CLASSES[tone];
  return (
    <div
      className={cn("glass sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b px-4", colors.shell)}
      data-page-tone={tone}
    >
      <span className={cn("h-5 w-1 shrink-0 rounded-full", colors.rail)} aria-hidden="true" />
      <h1 className={cn("text-sm font-semibold tracking-tight", colors.title)}>{title}</h1>
      {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
      <div className="ml-auto">{action}</div>
    </div>
  );
}
