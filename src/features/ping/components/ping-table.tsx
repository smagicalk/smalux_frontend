import { useState } from "react";
import { Trash2 } from "lucide-react";

import { useDeletePingTarget } from "@/features/ping/hooks/use-ping";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { toast } from "@/shared/ui/toaster";
import { formatPercent, formatRelativeFrom } from "@/shared/lib/utils";
import type { PingTarget } from "@/shared/api/methods";

import {
  GROUP_LABEL,
  GROUP_VARIANT,
  LATENCY_CEILING,
  PROTOCOL_LABEL,
  latencyTone
} from "../lib/ping-meta";

/** One row of the ping table: status dot, latency bar, uptime, probe/delete. */
export function PingRow({ target }: { target: PingTarget }) {
  const del = useDeletePingTarget();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [probeOpen, setProbeOpen] = useState(false);
  const tone = latencyTone(target);
  const dotColor = target.lastOk === false ? "var(--danger)" : target.lastOk ? "var(--success)" : "var(--muted-foreground)";
  const latencyColor = tone === "good" ? "var(--success)" : tone === "warn" ? "var(--warning)" : tone === "bad" ? "var(--danger)" : "var(--muted-foreground)";
  const lastCheckAbs = target.lastCheckAt
    ? new Date(target.lastCheckAt).toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;
  return (
    <tr className="group hover:bg-muted/30">
      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex size-2">
            {target.lastOk ? <span className="pulse-ring" style={{ background: dotColor }} /> : null}
            <span className="size-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
          </span>
          <span className="font-medium group-hover:text-primary">{target.name}</span>
        </span>
      </td>
      <td className="max-w-[260px] truncate px-3 py-2 font-mono text-xs text-muted-foreground" title={target.address}>{target.address}</td>
      <td className="px-3 py-2"><Badge variant="outline">{PROTOCOL_LABEL[target.protocol]}</Badge></td>
      <td className="px-3 py-2"><Badge variant={GROUP_VARIANT[target.group]}>{GROUP_LABEL[target.group]}</Badge></td>
      <td className="px-3 py-2 text-right">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <span className="hidden h-1 w-10 overflow-hidden rounded bg-muted sm:inline-block">
            <span className="block h-full rounded" style={{ width: `${Math.min(100, ((target.latencyMs ?? 0) / (LATENCY_CEILING[target.protocol] * 2)) * 100)}%`, background: latencyColor }} />
          </span>
          <span style={{ color: latencyColor }}>{target.latencyMs != null ? `${target.latencyMs}ms` : "-"}</span>
        </span>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{target.uptime != null ? formatPercent(target.uptime, 2) : "-"}</td>
      <td className="px-3 py-2 text-right">
        <span className="text-xs tabular-nums text-muted-foreground">{lastCheckAbs ?? "—"}</span>
        <span className="ml-2 text-xs text-muted-foreground">{formatRelativeFrom(target.lastCheckAt)}</span>
      </td>
      <td className="px-3 py-2 text-right">
        <Button size="sm" variant="outline" onClick={() => setProbeOpen(true)}>探测</Button>
        <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-danger"
          onClick={() => setConfirmOpen(true)} aria-label="删除">
          <Trash2 className="size-3.5" />
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="删除监控目标"
          description={`确定删除「${target.name}」吗？`}
          confirmLabel="删除"
          destructive
          onConfirm={() => del.mutate(target.id, {
            onSuccess: () => toast.success("已删除"),
            onError: () => toast.error("删除失败")
          })}
        />
        <ConfirmDialog
          open={probeOpen}
          onOpenChange={setProbeOpen}
          title="立即探测"
          description={`立即对「${target.name}」(${target.address})发起一次 ${PROTOCOL_LABEL[target.protocol]} 探测？`}
          confirmLabel="探测"
          onConfirm={() => toast.success(`已触发「${target.name}」探测`)}
        />
      </td>
    </tr>
  );
}

/** Loading skeleton shaped like the ping table. */
export function PingSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 shimmer border-b border-border last:border-b-0" />
      ))}
    </div>
  );
}
