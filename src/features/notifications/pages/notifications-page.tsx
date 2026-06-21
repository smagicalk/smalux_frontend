import {
  PlusIcon,
  SendIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { NotificationChannelsPanel } from "@/features/notifications/components/notification-channels-panel";
import { NotificationCharts } from "@/features/notifications/components/notification-charts";
import { NotificationFiltersPanel } from "@/features/notifications/components/notification-filters-panel";
import { NotificationHistoryPanel } from "@/features/notifications/components/notification-history-panel";
import { NotificationOverviewCards } from "@/features/notifications/components/notification-overview-cards";
import { NotificationPoliciesPanel } from "@/features/notifications/components/notification-policies-panel";
import { NotificationTemplatesPanel } from "@/features/notifications/components/notification-templates-panel";
import {
  createNotificationSummary,
  filterNotificationChannels,
  filterNotificationEvents
} from "@/features/notifications/model/notification-filters";
import {
  mockAlertPolicies,
  mockNotificationChannels,
  mockNotificationEvents,
  mockQuietWindows,
  type NotificationChannelType,
  type NotificationEvent
} from "@/features/notifications/model/mock-notifications";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function NotificationsPage() {
  const [channelTypeFilter, setChannelTypeFilter] = useState<NotificationChannelType | "all">("all");
  const [eventStatusFilter, setEventStatusFilter] = useState<NotificationEvent["status"] | "all">("all");
  const filteredChannels = useMemo(
    () => filterNotificationChannels(mockNotificationChannels, channelTypeFilter),
    [channelTypeFilter]
  );
  const filteredEvents = useMemo(
    () => filterNotificationEvents(mockNotificationEvents, eventStatusFilter),
    [eventStatusFilter]
  );
  const summary = createNotificationSummary(mockNotificationChannels, mockAlertPolicies, mockQuietWindows);

  return (
    <>
      <PageHeader
        eyebrow="Alert Routing"
        title="通知"
        description="这页的重点不是展示渠道数量，而是把‘事件如何被路由、静默、失败和审计’说清楚。它本质上是告警编排面。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("测试通知已入队", {
                  description: `${summary.enabledChannels} 个启用渠道将收到 mock 测试消息。`
                })
              }
            >
              <SendIcon data-icon="inline-start" aria-hidden />
              测试通知
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info("已创建渠道草稿", {
                  description: "默认密钥状态为 missing，保存前必须加密。"
                })
              }
            >
              <PlusIcon data-icon="inline-start" aria-hidden />
              新建渠道
            </Button>
          </>
        }
      />

      <NotificationOverviewCards
        enabledChannels={summary.enabledChannels}
        channelCount={summary.channelCount}
        activePolicies={summary.activePolicies}
        quietWindowCount={summary.quietWindowCount}
      />

      <NotificationCharts />

      <NotificationFiltersPanel
        channelTypeFilter={channelTypeFilter}
        eventStatusFilter={eventStatusFilter}
        onChannelTypeFilterChange={setChannelTypeFilter}
        onEventStatusFilterChange={setEventStatusFilter}
        onReset={() => {
          setChannelTypeFilter("all");
          setEventStatusFilter("all");
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <NotificationChannelsPanel
          channels={filteredChannels}
          onInspect={(channel) =>
            toast.info(channel.name, {
              description: `${channel.type} · ${channel.enabled ? "启用" : "停用"} · ${channel.target}`
            })
          }
        />
        <NotificationTemplatesPanel
          onInspect={(title, value) =>
            toast.info(title, {
              description: value
            })
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <NotificationPoliciesPanel
          policies={mockAlertPolicies}
          onInspect={(policy) =>
            toast.info(policy.name, {
              description: `${policy.condition} · ${policy.severity}`
            })
          }
        />
        <NotificationHistoryPanel
          quietWindows={mockQuietWindows}
          events={filteredEvents}
          onInspectQuietWindow={(window) =>
            toast.info(window.name, {
              description: `${window.schedule} · ${window.scope}`
            })
          }
          onInspectEvent={(event) =>
            toast.info(event.title, {
              description: `${event.channel} · ${event.detail}`
            })
          }
        />
      </div>
    </>
  );
}
