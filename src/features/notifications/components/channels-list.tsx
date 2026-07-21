import { useState } from "react";
import { Bell, Send } from "lucide-react";

import { useToggleChannel } from "@/features/notifications/hooks/use-notifications";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/layout";
import { Switch } from "@/shared/ui/switch";
import { toast } from "@/shared/ui/toaster";
import { cn, formatRelativeFrom } from "@/shared/lib/utils";
import type { NotificationChannel } from "@/shared/api/methods";

import { CHANNEL_LABEL } from "../lib/notification-meta";

/** The "channels" tab: a grid of notification channel cards. */
export function ChannelsList({ channels }: { channels: NotificationChannel[] }) {
  if (!channels.length) return <EmptyState text="还没有通知渠道。" icon={<Bell className="size-8" />} />;
  return (
    <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {channels.map((c) => <ChannelCard key={c.id} channel={c} />)}
    </ul>
  );
}

/** Loading skeleton shaped like the channel grid. */
export function NotifSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 shimmer rounded-md border border-border" />
      ))}
    </div>
  );
}

function ChannelCard({ channel }: { channel: NotificationChannel }) {
  const toggle = useToggleChannel();
  const [testOpen, setTestOpen] = useState(false);
  const ok = channel.lastOk !== false;
  const edgeColor = ok ? "var(--success)" : "var(--danger)";
  const lastAbs = channel.lastDeliveryAt
    ? new Date(channel.lastDeliveryAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <li className="glass cornered group relative overflow-hidden rounded-md border border-border p-3 pl-4 transition-colors hover:border-primary/40">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: edgeColor, boxShadow: `0 0 10px ${edgeColor}` }} />
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          {channel.enabled && !ok ? <span className="pulse-ring" style={{ background: edgeColor }} /> : null}
          <span className="size-2 rounded-full" style={{ background: edgeColor, boxShadow: `0 0 6px ${edgeColor}` }} />
        </span>
        <span className="font-medium group-hover:text-primary">{channel.name}</span>
        <Badge variant="outline">{CHANNEL_LABEL[channel.type]}</Badge>
        {channel.enabled ? <Badge variant="success">启用</Badge> : <Badge variant="neutral">停用</Badge>}
        {!ok ? <Badge variant="danger">投递失败</Badge> : null}
        <Switch
          checked={channel.enabled}
          onCheckedChange={(checked) => toggle.mutate({ id: channel.id, enabled: checked }, {
            onSuccess: () => toast.success(checked ? "已启用" : "已停用"),
            onError: () => toast.error("操作失败")
          })}
          disabled={toggle.isPending}
        />
      </div>
      <code className="mt-2 block truncate rounded bg-muted px-1.5 py-1 font-mono text-xs text-muted-foreground" title={channel.endpoint}>
        {channel.endpoint}
      </code>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>最近投递: <span className="tabular-nums">{lastAbs ?? "—"}</span> ({formatRelativeFrom(channel.lastDeliveryAt)})</span>
        <Button size="sm" variant="outline" onClick={() => setTestOpen(true)}>
          <Send className="size-3.5" />测试
        </Button>
      </div>
      <TestChannelDialog channel={channel} open={testOpen} onOpenChange={setTestOpen} />
    </li>
  );
}

/** Test-delivery dialog: simulates sending a probe message to the channel. */
function TestChannelDialog({
  channel,
  open,
  onOpenChange
}: {
  channel: NotificationChannel;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [ok] = useState(() => Math.random() > 0.15);

  const send = () => {
    setState("sending");
    // Mock the round-trip; a real backend would call notification.test.
    window.setTimeout(() => {
      setState("done");
      if (ok) toast.success("测试投递成功");
      else toast.error("测试投递失败");
    }, 700);
  };

  const close = () => {
    setState("idle");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setState("idle"); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>测试投递 · {channel.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{CHANNEL_LABEL[channel.type]}</Badge>
            <code className="truncate text-xs text-muted-foreground">{channel.endpoint}</code>
          </div>
          <p className="text-muted-foreground">
            将向该渠道发送一条测试告警消息，验证端点可达性与格式。
          </p>
          {state === "done" ? (
            <div className={cn("rounded-md border p-3", ok ? "border-success/40 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger")}>
              {ok ? "✓ 测试消息已成功送达" : "✕ 投递失败：端点无响应或被拒绝"}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={close}>关闭</Button>
          {state !== "done" ? (
            <Button size="sm" onClick={send} disabled={state === "sending"}>
              <Send className="size-3.5" />{state === "sending" ? "发送中…" : "发送测试"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
