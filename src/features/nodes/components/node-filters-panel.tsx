import type { NodeStatus } from "@/shared/domain/node";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, Select, TextInput } from "@/shared/ui/form-controls";

type NodeFiltersPanelProps = {
  query: string;
  statusFilter: NodeStatus | "all";
  groupFilter: string;
  groups: readonly string[];
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: NodeStatus | "all") => void;
  onGroupFilterChange: (value: string) => void;
  onReset: () => void;
};

export function NodeFiltersPanel({
  query,
  statusFilter,
  groupFilter,
  groups,
  onQueryChange,
  onStatusFilterChange,
  onGroupFilterChange,
  onReset
}: NodeFiltersPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>节点筛选</CardTitle>
        <CardDescription>筛选结果会同步影响列表和右侧编队状态，方便调试不同区域、分组和异常组合。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <Field label="搜索">
          <TextInput
            placeholder="节点 / 分组 / 区域"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </Field>
        <Field label="状态">
          <Select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as NodeStatus | "all")}
          >
            <option value="all">全部状态</option>
            <option value="online">在线</option>
            <option value="warning">预警</option>
            <option value="offline">离线</option>
          </Select>
        </Field>
        <Field label="分组">
          <Select value={groupFilter} onChange={(event) => onGroupFilterChange(event.target.value)}>
            <option value="all">全部分组</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <Button variant="outline" className="w-full md:w-auto" onClick={onReset}>
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
