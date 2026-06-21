import { describe, expect, it } from "vitest";

import {
  createNotificationSummary,
  filterNotificationChannels,
  filterNotificationEvents
} from "@/features/notifications/model/notification-filters";
import type {
  AlertPolicy,
  NotificationChannel,
  NotificationEvent,
  QuietWindow
} from "@/features/notifications/model/mock-notifications";

const channels: NotificationChannel[] = [
  {
    id: "webhook",
    name: "Webhook",
    type: "Webhook",
    enabled: true,
    target: "https://hooks.example.com",
    lastTestAt: "2026-06-09T00:00:00.000Z",
    secretStatus: "encrypted"
  },
  {
    id: "email",
    name: "Email",
    type: "Email",
    enabled: false,
    target: "ops@example.com",
    lastTestAt: "2026-06-09T00:00:00.000Z",
    secretStatus: "missing"
  }
];

const events: NotificationEvent[] = [
  {
    id: "sent",
    title: "sent event",
    channel: "Webhook",
    status: "sent",
    createdAt: "2026-06-09T00:00:00.000Z",
    detail: "delivered"
  },
  {
    id: "failed",
    title: "failed event",
    channel: "Email",
    status: "failed",
    createdAt: "2026-06-09T00:00:00.000Z",
    detail: "missing secret"
  }
];

const policies: AlertPolicy[] = [
  {
    id: "active",
    name: "active",
    condition: "status = offline",
    channels: ["Webhook"],
    severity: "critical",
    muted: false
  },
  {
    id: "muted",
    name: "muted",
    condition: "loss > 5%",
    channels: ["Email"],
    severity: "warning",
    muted: true
  }
];

const quietWindows: QuietWindow[] = [
  {
    id: "night",
    name: "night",
    schedule: "00:00-07:00",
    scope: "info",
    enabled: true
  }
];

describe("notification filters", () => {
  it("filters channels and events independently", () => {
    expect(filterNotificationChannels(channels, "Webhook").map((channel) => channel.id)).toEqual(["webhook"]);
    expect(filterNotificationEvents(events, "failed").map((event) => event.id)).toEqual(["failed"]);
  });

  it("summarizes enabled channels and active policies", () => {
    expect(createNotificationSummary(channels, policies, quietWindows)).toEqual({
      enabledChannels: 1,
      channelCount: 2,
      activePolicies: 1,
      quietWindowCount: 1
    });
  });
});
