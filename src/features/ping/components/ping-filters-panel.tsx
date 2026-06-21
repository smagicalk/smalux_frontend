import type { PingProtocol, PingStatus } from "@/features/ping/model/mock-ping";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, Select, TextInput } from "@/shared/ui/form-controls";

type PingFiltersPanelProps = {
  query: string;
  statusFilter: PingStatus | "all";
  protocolFilter: PingProtocol | "all";
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: PingStatus | "all") => void;
  onProtocolFilterChange: (value: PingProtocol | "all") => void;
  onReset: () => void;
};

export function PingFiltersPanel({
  query,
  statusFilter,
  protocolFilter,
  onQueryChange,
  onStatusFilterChange,
  onProtocolFilterChange,
  onReset
}: PingFiltersPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>目标筛选</CardTitle>
        <CardDescription>筛选会同步更新目标列表和摘要，便于调试公开目标、控制面目标和异常链路。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <Field label="搜索">
          <TextInput
            placeholder="目标 / 区域 / 策略"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </Field>
        <Field label="状态">
          <Select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as PingStatus | "all")}
          >
            <option value="all">全部状态</option>
            <option value="ok">正常</option>
            <option value="degraded">降级</option>
            <option value="down">不可用</option>
          </Select>
        </Field>
        <Field label="协议">
          <Select
            value={protocolFilter}
            onChange={(event) => onProtocolFilterChange(event.target.value as PingProtocol | "all")}
          >
            <option value="all">全部协议</option>
            <option value="HTTP">HTTP</option>
            <option value="TCP">TCP</option>
            <option value="ICMP">ICMP</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button variant="outline" className="w-full md:w-auto" onClick={onReset}>
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
