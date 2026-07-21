import { useState } from "react";

import { useCreateAlertRule } from "@/features/alerts/hooks/use-alerts";
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
import type { AlertSeverity } from "@/shared/api/methods";

import { SEVERITY_META } from "../lib/alert-meta";

type Operator = ">" | "<" | "==" | "!=";

/** Create-alert-rule dialog: metric + operator + threshold + severity. */
export function CreateAlertDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateAlertRule();
  const [name, setName] = useState("");
  const [metric, setMetric] = useState("cpuUsage");
  const [operator, setOperator] = useState<Operator>(">");
  const [threshold, setThreshold] = useState("0.85");
  const [severity, setSeverity] = useState<AlertSeverity>("warning");

  const submit = () => {
    if (!name) return;
    create.mutate(
      {
        name, metric, operator, threshold: Number(threshold),
        windowSec: 300, severity
      },
      {
        onSuccess: () => {
          toast.success("告警规则已创建");
          setName(""); setMetric("cpuUsage"); setThreshold("0.85");
          onOpenChange(false);
        },
        onError: () => toast.error("创建失败")
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>新建告警规则</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="规则名称">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="CPU 持续高负载"
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="指标">
              <select value={metric} onChange={(e) => setMetric(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-card px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="cpuUsage">cpuUsage</option>
                <option value="memUsed/memTotal">memUsed/memTotal</option>
                <option value="diskUsed/diskTotal">diskUsed/diskTotal</option>
                <option value="netTxSpeed">netTxSpeed</option>
                <option value="status">status</option>
              </select>
            </Field>
            <Field label="比较">
              <select value={operator} onChange={(e) => setOperator(e.target.value as Operator)}
                className="h-9 w-full rounded-md border border-border bg-card px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {(["&gt;", "&lt;", "==", "!="] as const).map((o) => {
                  const op = o === "&gt;" ? ">" : o === "&lt;" ? "<" : o;
                  return <option key={op} value={op}>{op}</option>;
                })}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="阈值" hint="0..1 为比率，否则为原始值">
              <input value={threshold} onChange={(e) => setThreshold(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-card px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </Field>
            <Field label="严重程度">
              <select value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {(Object.keys(SEVERITY_META) as AlertSeverity[]).map((s) => (
                  <option key={s} value={s}>{SEVERITY_META[s].label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={create.isPending || !name}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
