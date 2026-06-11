import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

type StatTone = "primary" | "info" | "success" | "warning" | "danger" | "muted";

const toneClass: Record<StatTone, string> = {
  primary: "bg-primary text-primary-foreground",
  info: "bg-info text-primary-foreground",
  success: "bg-success text-primary-foreground",
  warning: "bg-warning text-foreground",
  danger: "bg-danger text-primary-foreground",
  muted: "bg-secondary text-muted-foreground"
};

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: StatTone;
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "muted"
}: StatCardProps) {
  return (
    <Card tone="default" className="min-w-0">
      <CardContent className="flex min-w-0 items-center gap-3 p-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg shadow-[var(--shadow-soft)]",
            toneClass[tone]
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid min-w-0 gap-1 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="min-w-0 break-words text-lg font-semibold tracking-[-0.03em]">{value}</p>
          </div>
          <p className="mt-1 min-w-0 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
