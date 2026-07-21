import { useState } from "react";
import { Play } from "lucide-react";

import { useServers } from "@/features/servers/hooks/use-servers";
import { useDispatchTask } from "@/features/tasks/hooks/use-tasks";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/layout";
import { toast } from "@/shared/ui/toaster";
import { cn } from "@/shared/lib/utils";

import { RISK_LEVELS, type DispatchPreset } from "../lib/task-meta";

/**
 * Dispatch dialog: compose a command against a chosen server with a risk level.
 * Seeded from a template preset when opened from the templates tab. High-risk
 * commands route into the approval queue instead of executing immediately.
 */
export function DispatchDialog({
  open,
  onOpenChange,
  preset
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preset: DispatchPreset | null;
}) {
  const { data } = useServers();
  const dispatch = useDispatchTask();
  const [serverId, setServerId] = useState("");
  const [command, setCommand] = useState(() => preset?.command ?? "");
  const [risk, setRisk] = useState<"low" | "medium" | "high">(
    () => preset?.risk ?? "low"
  );
  const servers = data?.servers ?? [];

  const submit = () => {
    if (!serverId || !command) return;
    dispatch.mutate(
      { serverId, command, risk, scope: risk === "high" ? "node:exec" : "node:read" },
      {
        onSuccess: () => {
          toast.success(risk === "high" ? "已提交，高风险任务进入审批队列" : "任务已下发");
          setCommand("");
          setRisk("low");
          onOpenChange(false);
        },
        onError: () => toast.error("下发失败")
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>下发任务</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="目标服务器">
            <select
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">选择服务器…</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {s.region}</option>
              ))}
            </select>
          </Field>
          <Field label="命令">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={3}
              placeholder="df -h"
              className="w-full rounded-md border border-border bg-card p-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <Field label="风险等级" hint="高风险命令将进入审批队列，需人工批准后执行">
            <div className="flex gap-1.5">
              {RISK_LEVELS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRisk(r.key)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                    risk === r.key
                      ? r.key === "high" ? "border-danger bg-danger/10 text-danger"
                        : r.key === "medium" ? "border-warning bg-warning/10 text-warning"
                          : "border-success bg-success/10 text-success"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={dispatch.isPending || !serverId || !command}>
            <Play className="size-3.5" />下发
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
