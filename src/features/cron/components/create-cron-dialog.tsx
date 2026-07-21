import { useState } from "react";
import { Plus } from "lucide-react";

import { useCreateCron } from "@/features/cron/hooks/use-cron";
import { useServers } from "@/features/servers/hooks/use-servers";
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

/** Header button that owns the create-cron dialog's open state. */
export function CreateCronButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-3.5" />新建任务</Button>
      <CreateCronDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Create-cron dialog: name + target server + cron expression + command. */
export function CreateCronDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data } = useServers();
  const create = useCreateCron();
  const [name, setName] = useState("");
  const [serverId, setServerId] = useState("");
  const [expression, setExpression] = useState("");
  const [command, setCommand] = useState("");
  const servers = data?.servers ?? [];

  const submit = () => {
    if (!name || !serverId || !expression || !command) return;
    create.mutate({ name, serverId, expression, command }, {
      onSuccess: () => {
        toast.success("计划任务已创建");
        setName(""); setServerId(""); setExpression(""); setCommand("");
        onOpenChange(false);
      },
      onError: () => toast.error("创建失败")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>新建计划任务</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="名称">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="每日备份"
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <Field label="目标服务器">
            <select value={serverId} onChange={(e) => setServerId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">选择服务器…</option>
              {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Cron 表达式" hint="分 时 日 月 周，例如 0 3 * * *">
            <input value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="0 3 * * *"
              className="h-9 w-full rounded-md border border-border bg-card px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <Field label="命令">
            <textarea value={command} onChange={(e) => setCommand(e.target.value)} rows={2}
              className="w-full rounded-md border border-border bg-card p-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={create.isPending || !name || !serverId || !expression || !command}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
