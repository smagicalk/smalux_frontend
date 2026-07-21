import { z } from "zod";

import { alertSeveritySchema } from "./alerts";

// notification.* — delivery channels + the events they fired. An event carries
// the originating alert's severity, hence the alerts import.

export const channelTypeSchema = z.enum([
  "webhook",
  "telegram",
  "discord",
  "email",
  "wecom"
]);
export type ChannelType = z.infer<typeof channelTypeSchema>;

export const notificationChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: channelTypeSchema,
  enabled: z.boolean(),
  endpoint: z.string(),
  lastDeliveryAt: z.number().optional(),
  lastOk: z.boolean().optional()
});
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

export const notificationEventSchema = z.object({
  id: z.string(),
  channelName: z.string(),
  severity: alertSeveritySchema,
  message: z.string(),
  deliveredAt: z.number(),
  ok: z.boolean()
});
export type NotificationEvent = z.infer<typeof notificationEventSchema>;

export const notificationListResultSchema = z.object({
  channels: z.array(notificationChannelSchema),
  events: z.array(notificationEventSchema)
});

// mutations
export const notificationCreateParamsSchema = z.object({
  name: z.string(),
  type: channelTypeSchema,
  endpoint: z.string()
});
export const notificationToggleParamsSchema = z.object({ id: z.string(), enabled: z.boolean() });
