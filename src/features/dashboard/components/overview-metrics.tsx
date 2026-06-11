import {
  CpuIcon,
  HardDriveIcon,
  NetworkIcon,
  ServerIcon
} from "lucide-react";

import type { MonitorNode } from "@/shared/domain/node";
import { formatPercent } from "@/shared/lib/format";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { InteractiveCardButton } from "@/shared/ui/card";
import { createOverview } from "@/features/dashboard/model/overview";

type OverviewMetricsProps = {
  nodes: MonitorNode[];
};

export function OverviewMetrics({ nodes }: OverviewMetricsProps) {
  const overview = createOverview(nodes);

  const items = [
    {
      label: "节点",
      value: overview.total.toString(),
      description: `${overview.online} online / ${overview.offline} offline`,
      icon: ServerIcon,
      badge: "fleet"
    },
    {
      label: "CPU",
      value: formatPercent(overview.averageCpu),
      description: `${overview.warning} 个节点需关注`,
      icon: CpuIcon,
      badge: overview.averageCpu > 65 ? "high" : "steady"
    },
    {
      label: "内存",
      value: formatPercent(overview.averageMemory),
      description: "当前均值",
      icon: HardDriveIcon,
      badge: overview.averageMemory > 70 ? "tight" : "ok"
    },
    {
      label: "流量",
      value: `${overview.traffic.toFixed(2)} Gbps`,
      description: "聚合带宽",
      icon: NetworkIcon,
      badge: "traffic"
    }
  ];

  return (
    <div className="grid gap-2 xl:grid-cols-4">
      {items.map((item) => (
        <InteractiveCardButton
          key={item.label}
          tone="default"
          className="flex w-full items-center gap-3"
          onClick={() =>
            toast.info(item.label, {
              description: item.description
            })
          }
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-[color:var(--surface-muted)] text-muted-foreground dark:bg-white/6">
            <item.icon className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <Badge variant="outline">{item.badge}</Badge>
            </div>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="truncate text-xl font-semibold tracking-[-0.04em]">{item.value}</p>
              <p className="truncate text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>
        </InteractiveCardButton>
      ))}
    </div>
  );
}
