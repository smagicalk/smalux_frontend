import { useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react";

import { useDeleteCron, useToggleCron } from "@/features/cron/hooks/use-cron";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Switch } from "@/shared/ui/switch";
import { toast } from "@/shared/ui/toaster";
import { formatRelativeFrom } from "@/shared/lib/utils";
import type { Cron } from "@/shared/api/methods";

import { LAST_STATUS_META, formatCountdown } from "../lib/cron-meta";

/** Loading skeleton shaped like the cron list. */
export function CronSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="h-24 shimmer rounded-md border border-border" />
      ))}
    </ul>
  );
}

/** One row of the cron list: expression, last status, next-run countdown, toggle/run/delete. */
export function CronRow({ cron }: { cron: Cron }) {
  const toggle = useToggleCron();
  const del = useDeleteCron();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const last = cron.lastStatus ? LAST_STATUS_META[cron.lastStatus] : undefined;

  // Live countdown to next run — ticks every 30s so the "下次" stays accurate
  // without re-rendering on every store change. Date.now lives in the effect.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const edgeColor = last
    ? last.variant === "success" ? "var(--success)"
      : last.variant === "danger" ? "var(--danger)" : "var(--primary)"
    : "var(--muted-foreground)";

  const nextIn = cron.nextRunAt ? formatCountdown(cron.nextRunAt - now) : null;
  const nextAbs = cron.nextRunAt ? new Date(cron.nextRunAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : null;
  const lastAbs = cron.lastRunAt ? new Date(cron.lastRunAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <li className="glass cornered group relative overflow-hidden rounded-md border border-border p-3 pl-4 transition-colors hover:border-primary/40">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: edgeColor, boxShadow: `0 0 10px ${edgeColor}` }} />
      <div className="flex flex-wrap items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <span className="font-medium group-hover:text-primary">{cron.name}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{cron.expression}</span>
        {last ? <Badge variant={last.variant}>上次{last.label}</Badge> : null}
        {!cron.enabled ? <Badge variant="neutral">已停用</Badge> : null}
        <span className="text-xs text-muted-foreground">{cron.serverName}</span>
        <div className="ml-auto flex items-center gap-2">
          <Switch
            checked={cron.enabled}
            onCheckedChange={(checked) => toggle.mutate({ id: cron.id, enabled: checked }, {
              onSuccess: () => toast.success(checked ? "已启用" : "已停用"),
              onError: () => toast.error("操作失败")
            })}
            disabled={toggle.isPending}
          />
          <Button size="sm" variant="outline" onClick={() => setRunOpen(true)}>立即执行</Button>
          <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-danger"
            onClick={() => setConfirmOpen(true)} aria-label="删除">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <code className="mt-2 block truncate rounded bg-muted px-1.5 py-1 font-mono text-xs" title={cron.command}>
        {cron.command}
      </code>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="text-muted-foreground/70">上次</span>
          <span className="tabular-nums">{lastAbs ?? "—"}</span>
          <span>({formatRelativeFrom(cron.lastRunAt)})</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-muted-foreground/70">下次</span>
          <span className="tabular-nums">{nextAbs ?? "—"}</span>
          {nextIn ? (
            <Badge variant={nextIn.urgent ? "warning" : "neutral"}>倒计时 {nextIn.text}</Badge>
          ) : null}
        </span>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除计划任务"
        description={`确定删除「${cron.name}」吗？此操作不可撤销。`}
        confirmLabel="删除"
        destructive
        onConfirm={() => del.mutate(cron.id, {
          onSuccess: () => toast.success("已删除"),
          onError: () => toast.error("删除失败")
        })}
      />
      <ConfirmDialog
        open={runOpen}
        onOpenChange={setRunOpen}
        title="立即执行"
        description={`立即在「${cron.serverName}」上执行计划任务「${cron.name}」？`}
        confirmLabel="执行"
        onConfirm={() => toast.success(`已触发「${cron.name}」立即执行`)}
      />
    </li>
  );
}
