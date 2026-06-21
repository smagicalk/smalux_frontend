import type { BadgeVariant } from "@/shared/ui/badge";

import type { AlertPolicy, NotificationEvent } from "@/features/notifications/model/mock-notifications";

export const notificationSeverityMeta: Record<
  AlertPolicy["severity"],
  { label: string; variant: BadgeVariant }
> = {
  info: { label: "信息", variant: "secondary" },
  warning: { label: "警告", variant: "warning" },
  critical: { label: "严重", variant: "danger" }
};

export const notificationEventMeta: Record<
  NotificationEvent["status"],
  { label: string; variant: BadgeVariant }
> = {
  sent: { label: "已发送", variant: "success" },
  failed: { label: "失败", variant: "danger" },
  suppressed: { label: "已静默", variant: "secondary" }
};
