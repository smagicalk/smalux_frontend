import { type ReactNode } from "react";
import { Maximize2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/** Glass card with a titled header — the common container for every detail panel.
 *  When `onExpand` is given, the header shows a hover-reveal expand affordance
 *  and the whole card is click-to-expand (opens a larger ChartPopout). */
export function ChartCard({
  title,
  value,
  subtitle,
  className,
  onExpand,
  children
}: {
  title: string;
  value?: string;
  subtitle?: string;
  className?: string;
  /** Open a larger view of this card's chart. Omit for non-expandable cards. */
  onExpand?: () => void;
  children: ReactNode;
}) {
  const expandable = !!onExpand;
  return (
    <div
      className={cn(
        "glass group overflow-hidden rounded-md border border-border transition-colors",
        expandable && "cursor-pointer hover:border-primary/50",
        className
      )}
      onClick={expandable ? onExpand : undefined}
      role={expandable ? "button" : undefined}
      tabIndex={expandable ? 0 : undefined}
      onKeyDown={expandable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onExpand!(); } } : undefined}
    >
      <div className="flex items-baseline gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        {subtitle ? <span className="text-[11px] text-muted-foreground">{subtitle}</span> : null}
        {value != null ? <span className="ml-auto text-sm font-semibold tabular-nums">{value}</span> : null}
        {expandable ? (
          <Maximize2 className={cn("size-3.5 shrink-0 text-muted-foreground transition-opacity", value ? "ml-1 opacity-0 group-hover:opacity-100" : "ml-auto opacity-0 group-hover:opacity-100")} />
        ) : null}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

/** One cell of the live-metric grid (label over value, optional sub-hint).
 *  `disabled` mutes the value — used when a metric's collection switch is
 *  off, so "关闭统计" reads as a disabled state rather than a live value. */
export function MetricCell({ label, value, hint, disabled }: { label: string; value: string; hint?: string; disabled?: boolean }) {
  return (
    <div className="bg-card px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-sm tabular-nums", disabled && "text-muted-foreground/60")}>{value}</div>
      {hint ? <div className="text-[10px] text-muted-foreground/70">{hint}</div> : null}
    </div>
  );
}

/**
 * Preserve a chart's geometry while making collection state unmistakable.
 * A missing listener is different from a valid zero, so the chart remains in
 * place under a semantic surface overlay instead of rendering a fake flat line.
 */
export function MonitoringOverlay({ monitored, children }: { monitored: boolean; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      {!monitored ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-card/80 text-sm font-medium text-muted-foreground backdrop-blur-[1px]"
          role="status"
        >
          未监听
        </div>
      ) : null}
    </div>
  );
}
