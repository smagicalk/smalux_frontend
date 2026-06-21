import { CpuIcon, HardDriveIcon, MemoryStickIcon } from "lucide-react";

import { PublicNodeMetric } from "@/features/public/components/public-node-metric";
import type { MonitorNode } from "@/shared/domain/node";
import { formatLatency } from "@/shared/lib/format";
import { InteractiveCardButton } from "@/shared/ui/card";
import { StatusBadge } from "@/shared/ui/status-badge";

type PublicNodeCardProps = {
  node: MonitorNode;
  onNodeClick: (node: MonitorNode) => void;
};

export function PublicNodeCard({ node, onNodeClick }: PublicNodeCardProps) {
  return (
    <InteractiveCardButton tone="muted" padding="md" className="text-left" onClick={() => onNodeClick(node)}>
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
          <p className="mt-1 font-semibold text-foreground">{node.networkInMbps.toFixed(1)} Mbps</p>
        </div>
        <div className="rounded-[0.9rem] bg-white/70 p-2 dark:bg-white/6">
          <p>延迟</p>
          <p className="mt-1 font-semibold text-foreground">{formatLatency(node.latencyMs)}</p>
        </div>
      </div>
    </InteractiveCardButton>
  );
}
