import { useState } from "react";

import { useCreateChannel } from "@/features/notifications/hooks/use-notifications";
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
import type { ChannelType } from "@/shared/api/methods";

import { CHANNEL_LABEL } from "../lib/notification-meta";

/** Add-channel dialog: name + type + endpoint. */
export function CreateChannelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateChannel();
  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>("webhook");
  const [endpoint, setEndpoint] = useState("");

  const submit = () => {
    if (!name || !endpoint) return;
    create.mutate({ name, type, endpoint }, {
      onSuccess: () => {
        toast.success("渠道已添加");
        setName(""); setEndpoint(""); setType("webhook");
        onOpenChange(false);
      },
      onError: () => toast.error("添加失败")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>添加通知渠道</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="名称">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="运维 Telegram"
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <Field label="类型">
            <select value={type} onChange={(e) => setType(e.target.value as ChannelType)}
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {(Object.keys(CHANNEL_LABEL) as ChannelType[]).map((t) => (
                <option key={t} value={t}>{CHANNEL_LABEL[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="端点" hint="Webhook URL / 频道 / 邮箱 / 群名">
            <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://hooks.example.com/…"
              className="h-9 w-full rounded-md border border-border bg-card px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={create.isPending || !name || !endpoint}>添加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
