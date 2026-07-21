import { useState } from "react";
import { BellOff, Trash2 } from "lucide-react";

import { useDeleteAlert, useSilenceAlert } from "@/features/alerts/hooks/use-alerts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/layout";
import { toast } from "@/shared/ui/toaster";
import type { AlertRule } from "@/shared/api/methods";

import { SEVERITY_META, formatThreshold } from "../lib/alert-meta";

/** The "rules" tab: a list of configured alert rules with silence/delete actions. */
export function RulesList({ rules }: { rules: AlertRule[] }) {
  if (!rules.length) return <EmptyState text="还没有告警规则。" icon={<BellOff className="size-8" />} />;
  return (
    <ul className="space-y-2">
      {rules.map((r) => <RuleRow key={r.id} rule={r} />)}
    </ul>
  );
}

function RuleRow({ rule }: { rule: AlertRule }) {
  const silence = useSilenceAlert();
  const del = useDeleteAlert();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const sev = SEVERITY_META[rule.severity];
  const edgeColor = sev.variant === "danger" ? "var(--danger)" : sev.variant === "warning" ? "var(--warning)" : "var(--muted-foreground)";
  return (
    <li className="glass cornered group relative overflow-hidden rounded-md border border-border p-3 pl-4 transition-colors hover:border-primary/40">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: edgeColor, boxShadow: `0 0 10px ${edgeColor}` }} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex size-2">
          {rule.enabled && !rule.silenced ? <span className="pulse-ring" style={{ background: edgeColor }} /> : null}
          <span className="size-2 rounded-full" style={{ background: edgeColor, boxShadow: `0 0 6px ${edgeColor}` }} />
        </span>
        <span className="font-medium group-hover:text-primary">{rule.name}</span>
        <Badge variant={sev.variant}>{sev.label}</Badge>
        {rule.silenced ? <Badge variant="outline"><BellOff className="size-3" /> 已静默</Badge> : null}
        {!rule.enabled ? <Badge variant="neutral">已停用</Badge> : null}
        <span className="ml-auto text-xs text-muted-foreground">
          <code className="font-mono">{rule.metric}</code> {rule.operator} {formatThreshold(rule.threshold)} · {rule.windowSec}s
        </span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline"
            onClick={() => silence.mutate({ id: rule.id, silenced: !rule.silenced }, {
              onSuccess: () => toast.success(rule.silenced ? "已取消静默" : "已静默"),
              onError: () => toast.error("操作失败")
            })}
            disabled={silence.isPending}>
            {rule.silenced ? "取消静默" : "静默"}
          </Button>
          <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-danger"
            onClick={() => setConfirmOpen(true)} aria-label="删除">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        {rule.serverId ? <div className="mt-1 w-full text-xs text-muted-foreground">作用于: {rule.serverId}</div> : null}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除告警规则"
        description={`确定删除「${rule.name}」吗？`}
        confirmLabel="删除"
        destructive
        onConfirm={() => del.mutate(rule.id, {
          onSuccess: () => toast.success("已删除"),
          onError: () => toast.error("删除失败")
        })}
      />
    </li>
  );
}
