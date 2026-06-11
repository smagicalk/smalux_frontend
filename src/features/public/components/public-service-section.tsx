import type { MonitorNode } from "@/shared/domain/node";
import type { PingCheck } from "@/features/ping/model/mock-ping";
import { CheckCircle2Icon, MailIcon, SignalIcon } from "lucide-react";

import { formatLatency, formatPercent } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";
import { StatusBadge } from "@/shared/ui/status-badge";

type PublicServiceSectionProps = {
  checks: readonly PingCheck[];
  regions: readonly MonitorNode[];
  subscriberEmail: string;
  onSubscriberEmailChange: (value: string) => void;
  onSubscribe: () => void;
  onServiceClick: (check: PingCheck) => void;
  onRegionClick: (node: MonitorNode) => void;
};

type PublicServiceStatusProps = {
  status: PingCheck["status"];
};

export function PublicServiceSection({
  checks,
  regions,
  subscriberEmail,
  onSubscriberEmailChange,
  onSubscribe,
  onServiceClick,
  onRegionClick
}: PublicServiceSectionProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>服务状态</CardTitle>
          <CardDescription>按访客可理解的服务维度展示，而不是后台字段或节点术语。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {checks.map((check) => (
            <InteractiveCardButton
              key={check.id}
              tone="muted"
              padding="md"
              className="grid gap-3 text-left sm:grid-cols-[minmax(0,1fr)_120px_120px]"
              onClick={() => onServiceClick(check)}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold tracking-[-0.02em]">{check.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {check.protocol} · {check.region}
                </p>
              </div>
              <PublicServiceStatus status={check.status} />
              <div className="text-sm text-muted-foreground">
                <p>{formatLatency(check.latencyMs)}</p>
                <p>{formatPercent(check.availability)}</p>
              </div>
            </InteractiveCardButton>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card tone="muted">
          <CardHeader>
            <CardTitle>订阅更新</CardTitle>
            <CardDescription>访客可以订阅公开事件，后台渠道和敏感通知配置不会外露。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">邮箱</span>
              <div className="flex h-11 items-center gap-2 rounded-2xl border border-white/45 bg-white/70 px-3 dark:border-white/8 dark:bg-white/6">
                <MailIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  placeholder="you@example.com"
                  value={subscriberEmail}
                  onChange={(event) => onSubscriberEmailChange(event.target.value)}
                />
              </div>
            </label>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:opacity-95"
              onClick={onSubscribe}
            >
              <SignalIcon className="size-4" aria-hidden />
              订阅状态更新
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>服务器区域</CardTitle>
            <CardDescription>公开展示只保留区域和健康状态。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {regions.map((node) => (
              <InteractiveCardButton
                key={node.id}
                tone="muted"
                padding="sm"
                className="flex items-center justify-between gap-3 text-left"
                onClick={() => onRegionClick(node)}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-[-0.02em]">{node.region}</p>
                  <p className="truncate text-xs text-muted-foreground">{node.group}</p>
                </div>
                <StatusBadge status={node.status} />
              </InteractiveCardButton>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function PublicServiceStatus({ status }: PublicServiceStatusProps) {
  if (status === "ok") {
    return (
      <Badge variant="success">
        <CheckCircle2Icon className="mr-1 size-3" aria-hidden />
        正常
      </Badge>
    );
  }

  return (
    <Badge variant={status === "degraded" ? "warning" : "danger"}>
      {status === "degraded" ? "降级" : "不可用"}
    </Badge>
  );
}
