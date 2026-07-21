import { Loader2, Rocket } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn, formatRelativeFrom } from "@/shared/lib/utils";
import type { DeploymentTarget } from "@/shared/api/methods";

import { COMPLEXITY_VARIANT, MODE_DESC, MODE_LABEL, STATUS_META } from "../lib/deployment-meta";

/** Loading skeleton shaped like the deployment page. */
export function DeploymentSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 shimmer rounded-md border border-border" />)}
      </div>
      <div className="h-40 shimmer rounded-md border border-border" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-56 shimmer rounded-md border border-border" />)}
      </div>
    </div>
  );
}

/** One delivery-mode row: status dot, mode label, description, switch button.
 *  `active` = currently previewed; `isCurrent` = the live deployment. */
export function DeploymentRow({
  target,
  active,
  isCurrent,
  onSelect,
  onSwitch
}: {
  target: DeploymentTarget;
  active: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  onSwitch: () => void;
}) {
  const status = STATUS_META[target.status];
  const dotColor = target.status === "ready" ? "var(--success)" : target.status === "building" ? "var(--warning)" : "var(--danger)";
  const updatedAbs = new Date(target.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (
    <li
      className={cn(
        "group flex cursor-pointer items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/30",
        active && "bg-primary/5",
        target.status === "building" && "scanline"
      )}
      onClick={onSelect}
    >
      {target.status === "building" ? <span className="scanline__beam" /> : null}
      <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Rocket className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="relative flex size-2">
            {target.status === "building" ? <span className="pulse-ring" style={{ background: dotColor }} /> : null}
            <span className="size-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
          </span>
          <span className="font-medium group-hover:text-primary">{MODE_LABEL[target.mode]}</span>
          {target.status === "building" ? <Loader2 className="size-3 animate-spin text-warning" /> : null}
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant={COMPLEXITY_VARIANT[target.complexity]}>{target.complexity}</Badge>
          {isCurrent ? <Badge variant="primary">当前</Badge> : null}
          <span className="ml-auto text-xs text-muted-foreground">{target.name}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{MODE_DESC[target.mode]}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">更新于 <span className="tabular-nums">{updatedAbs}</span> ({formatRelativeFrom(target.updatedAt)})</span>
          {!isCurrent ? (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSwitch(); }}>
              切换
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
