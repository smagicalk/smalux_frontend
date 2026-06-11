import type { LucideIcon } from "lucide-react";
import { ClockIcon, Globe2Icon, ServerIcon } from "lucide-react";

import { formatLatency, formatPercent } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";

type PublicHeroPanelProps = {
  isOperational: boolean;
  onlineNodes: number;
  totalNodes: number;
  availability: number;
  latency: number;
};

type PublicMetricProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function PublicHeroPanel({
  isOperational,
  onlineNodes,
  totalNodes,
  availability,
  latency
}: PublicHeroPanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/55 bg-[color:var(--surface-panel-strong)] p-6 shadow-[var(--shadow-panel)] dark:border-white/8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isOperational ? "success" : "warning"}>
          {isOperational ? "全部正常" : "部分服务异常"}
        </Badge>
        <Badge variant="outline">对外状态面板</Badge>
      </div>
      <div className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
          Service Health
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
          {isOperational ? "服务运行正常" : "部分服务异常"}
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          当前面向访客展示区域状态、外部可用性、恢复进度和最近事件。内部地址、执行细节和敏感配置不会在此暴露。
        </p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <PublicMetric icon={ServerIcon} label="在线服务器" value={`${onlineNodes}/${totalNodes}`} />
        <PublicMetric icon={Globe2Icon} label="平均可用率" value={formatPercent(availability)} />
        <PublicMetric icon={ClockIcon} label="平均延迟" value={formatLatency(latency)} />
      </div>
    </section>
  );
}

function PublicMetric({ icon: Icon, label, value }: PublicMetricProps) {
  return (
    <div className="rounded-[1.2rem] bg-[color:var(--surface-muted)] p-4 dark:bg-white/6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <span>{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}
