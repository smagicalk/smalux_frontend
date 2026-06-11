import type { LucideIcon } from "lucide-react";
import { CpuIcon, HardDriveIcon, MemoryStickIcon } from "lucide-react";

import type { MonitorNode } from "@/shared/domain/node";
import { formatLatency } from "@/shared/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";
import { StatusBadge } from "@/shared/ui/status-badge";

type PublicFleetSectionProps = {
  nodes: readonly MonitorNode[];
  onNodeClick: (node: MonitorNode) => void;
};

type PublicNodeMetricProps = {
  icon: LucideIcon;
  label: string;
  value: number;
};

export function PublicFleetSection({ nodes, onNodeClick }: PublicFleetSectionProps) {
  return (
    <section>
      <Card tone="strong">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>节点快读</CardTitle>
              <CardDescription>
                按 Komari 式公开面板组织：访客先看到区域、在线状态和资源压力，后台细节仍留在管理端。
              </CardDescription>
            </div>
            <div className="rounded-full border border-white/50 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/10">
              Public Fleet
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {nodes.map((node) => (
            <InteractiveCardButton
              key={node.id}
              tone="muted"
              padding="md"
              className="text-left"
              onClick={() => onNodeClick(node)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold tracking-[-0.02em]">{node.name}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {node.region} · {node.group}
                  </p>
                </div>
                <StatusBadge status={node.status} />
              </div>
              <div className="mt-4 grid gap-2">
                <PublicNodeMetric icon={CpuIcon} label="CPU" value={node.cpu} />
                <PublicNodeMetric icon={MemoryStickIcon} label="内存" value={node.memory} />
                <PublicNodeMetric icon={HardDriveIcon} label="磁盘" value={node.disk} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="rounded-[0.9rem] bg-white/70 p-2 dark:bg-white/6">
                  <p>入站</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {node.networkInMbps.toFixed(1)} Mbps
                  </p>
                </div>
                <div className="rounded-[0.9rem] bg-white/70 p-2 dark:bg-white/6">
                  <p>延迟</p>
                  <p className="mt-1 font-semibold text-foreground">{formatLatency(node.latencyMs)}</p>
                </div>
              </div>
            </InteractiveCardButton>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function PublicNodeMetric({ icon: Icon, label, value }: PublicNodeMetricProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-2 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        <span>{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-white/80 dark:bg-white/10">
        <span
          className="block h-full rounded-sm bg-primary"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      <span className="text-right font-semibold">{value}%</span>
    </div>
  );
}
