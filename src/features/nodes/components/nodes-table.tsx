import type { MonitorNode } from "@/shared/domain/node";
import { formatLatency, formatMbps } from "@/shared/lib/format";
import { PercentBar } from "@/shared/ui/percent-bar";
import { StatusBadge } from "@/shared/ui/status-badge";

const tableHeaders = ["节点", "状态", "CPU", "内存", "磁盘", "流量", "延迟"];

type NodesTableProps = {
  nodes: MonitorNode[];
  onInspect: (node: MonitorNode) => void;
};

export function NodesTable({ nodes, onInspect }: NodesTableProps) {
  return (
    <div className="overflow-hidden rounded-[1rem] border border-white/45 bg-[color:var(--surface-panel)] shadow-[var(--shadow-soft)] dark:border-white/8">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead className="bg-[color:var(--surface-muted)] text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              {tableHeaders.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr
                key={node.id}
                className="cursor-pointer border-t border-white/45 transition hover:bg-[color:var(--surface-muted)]/75 dark:border-white/8 dark:hover:bg-white/4"
                onClick={() => onInspect(node)}
              >
                <td className="px-4 py-3 align-middle">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-[-0.02em]">{node.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {node.group} · {node.region}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <StatusBadge status={node.status} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <UsageCell value={node.cpu} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <UsageCell value={node.memory} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <UsageCell value={node.disk} />
                </td>
                <td className="px-4 py-3 align-middle text-sm font-medium">
                  {formatMbps(node.networkInMbps)} / {formatMbps(node.networkOutMbps)}
                </td>
                <td className="px-4 py-3 align-middle text-sm font-medium">
                  {formatLatency(node.latencyMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type UsageCellProps = {
  value: number;
};

function UsageCell({ value }: UsageCellProps) {
  return <PercentBar value={value} layout="inline" />;
}
