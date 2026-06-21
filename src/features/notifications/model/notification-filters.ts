import type {
  AlertPolicy,
  NotificationChannel,
  NotificationChannelType,
  NotificationEvent,
  QuietWindow
} from "@/features/notifications/model/mock-notifications";

export type NotificationFilters = {
  channelTypeFilter: NotificationChannelType | "all";
  eventStatusFilter: NotificationEvent["status"] | "all";
};

export function filterNotificationChannels(
  channels: readonly NotificationChannel[],
  channelTypeFilter: NotificationFilters["channelTypeFilter"]
) {
  return channels.filter((channel) => channelTypeFilter === "all" || channel.type === channelTypeFilter);
}

export function filterNotificationEvents(
  events: readonly NotificationEvent[],
  eventStatusFilter: NotificationFilters["eventStatusFilter"]
) {
  return events.filter((event) => eventStatusFilter === "all" || event.status === eventStatusFilter);
}

export function createNotificationSummary(
  channels: readonly NotificationChannel[],
  policies: readonly AlertPolicy[],
  quietWindows: readonly QuietWindow[]
) {
  return {
    enabledChannels: channels.filter((channel) => channel.enabled).length,
    channelCount: channels.length,
    activePolicies: policies.filter((policy) => !policy.muted).length,
    quietWindowCount: quietWindows.length
  };
}
