import type {
  NotificationChannelType,
  NotificationEvent
} from "@/features/notifications/model/mock-notifications";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, Select } from "@/shared/ui/form-controls";

type NotificationFiltersPanelProps = {
  channelTypeFilter: NotificationChannelType | "all";
  eventStatusFilter: NotificationEvent["status"] | "all";
  onChannelTypeFilterChange: (value: NotificationChannelType | "all") => void;
  onEventStatusFilterChange: (value: NotificationEvent["status"] | "all") => void;
  onReset: () => void;
};

export function NotificationFiltersPanel({
  channelTypeFilter,
  eventStatusFilter,
  onChannelTypeFilterChange,
  onEventStatusFilterChange,
  onReset
}: NotificationFiltersPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>通知筛选</CardTitle>
        <CardDescription>用于调试不同渠道类型和投递状态，历史列表会按筛选结果更新。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-[220px_220px_auto]">
        <Field label="渠道类型">
          <Select
            value={channelTypeFilter}
            onChange={(event) => onChannelTypeFilterChange(event.target.value as NotificationChannelType | "all")}
          >
            <option value="all">全部渠道</option>
            <option value="Webhook">Webhook</option>
            <option value="Email">Email</option>
            <option value="Telegram">Telegram</option>
            <option value="Discord">Discord</option>
            <option value="WeCom">WeCom</option>
          </Select>
        </Field>
        <Field label="投递状态">
          <Select
            value={eventStatusFilter}
            onChange={(event) => onEventStatusFilterChange(event.target.value as NotificationEvent["status"] | "all")}
          >
            <option value="all">全部状态</option>
            <option value="sent">已发送</option>
            <option value="failed">失败</option>
            <option value="suppressed">已静默</option>
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
