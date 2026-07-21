import { type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/shared/ui/dialog";

/**
 * A modal that blows a small inline chart up to a readable size. Used by the
 * server-detail chart cards: the cards are compact sparklines; clicking one
 * opens this popout with the same series at a larger height + axes/crosshair
 * (the chart itself decides whether to render axes via its `detailed` prop).
 *
 * The content area is wider than the default form dialog (max-w-2xl) and
 * scroll-safe — a tall chart fits without clipping. `hideClose` is left off so
 * the ✕, Esc, and scrim-click all close it.
 */
export function ChartPopout({
  title,
  subtitle,
  value,
  open,
  onOpenChange,
  footer,
  children
}: {
  title: string;
  subtitle?: string;
  value?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Context line under the chart — e.g. sample count + covered span. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-baseline gap-2">
            <DialogTitle>{title}</DialogTitle>
            {value ? <span className="ml-auto text-sm font-semibold tabular-nums">{value}</span> : null}
          </div>
          {/* Radix wants a Description for a11y; show the subtitle as it when
              present, otherwise a visually-hidden fallback so no warning fires. */}
          <DialogDescription className={subtitle ? "text-[11px] text-muted-foreground" : "sr-only"}>
            {subtitle ?? `${title} 详情`}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-md border border-border bg-card/40 p-2">{children}</div>
        {footer ? <div className="px-1 pt-1 text-[11px] text-muted-foreground">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
