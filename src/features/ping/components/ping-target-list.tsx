import { Activity, Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/layout";
import type { PingTarget } from "@/shared/api/methods";

import { PingRow, PingSkeleton } from "./ping-table";

/** Ping target loading, empty, and table states. */
export function PingTargetList({
  targets,
  isLoading,
  onCreate
}: {
  targets: PingTarget[];
  isLoading: boolean;
  onCreate: () => void;
}) {
  if (isLoading) return <PingSkeleton />;
  if (!targets.length) {
    return (
      <EmptyState
        text="没有匹配的监控目标。"
        icon={<Activity className="size-8" />}
        action={<Button size="sm" onClick={onCreate}><Plus className="size-3.5" />添加目标</Button>}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">名称</th>
            <th className="px-3 py-2 text-left font-medium">地址</th>
            <th className="px-3 py-2 text-left font-medium">协议</th>
            <th className="px-3 py-2 text-left font-medium">分组</th>
            <th className="px-3 py-2 text-right font-medium">延迟</th>
            <th className="px-3 py-2 text-right font-medium">可用率</th>
            <th className="px-3 py-2 text-right font-medium">检测</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {targets.map((target) => <PingRow key={target.id} target={target} />)}
        </tbody>
      </table>
    </div>
  );
}
