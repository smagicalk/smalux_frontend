import { z } from "zod";

/**
 * RPC method contracts — the single source of truth shared by the frontend
 * and the backend. The backend implements these methods; the mock transport
 * returns data shaped by these schemas.
 *
 * Convention: method names are `<namespace>.<action>` (e.g. `agent.list`).
 * Subscriptions use `<stream>.subscribe` and the server pushes notifications
 * with the same method name.
 *
 * Schemas live in ./schemas/* and are split by business domain; this file
 * intentionally remains the public composition root. It re-exports them so
 * the public import path `@/shared/api/methods` stays a single entry point,
 * then assembles the `methods` catalog that maps each method name to its
 * params/result schema pair.
 *
 * Validation has two stages: a transport first validates the JSON-RPC envelope,
 * then validates `result` with the method-specific schema below. Input schemas
 * are exported for callers and backend adapters; `z.unknown()` means the method
 * has no meaningful frontend parameters, not that its result is untyped.
 */

export * from "./schemas/common";
export * from "./schemas/agent";
export * from "./schemas/tasks";
export * from "./schemas/cron";
export * from "./schemas/ping";
export * from "./schemas/alerts";
export * from "./schemas/notifications";
export * from "./schemas/logs";
export * from "./schemas/tokens";
export * from "./schemas/accounts";
export * from "./schemas/themes";
export * from "./schemas/settings";
export * from "./schemas/deployment";

import { okResultSchema, pingResultSchema } from "./schemas/common";
import {
  agentListParamsSchema,
  agentListResultSchema,
  agentPingSubscribeParamsSchema,
  agentRegisterParamsSchema,
  agentUpdateParamsSchema,
  agentSummarySampleSchema,
  agentSummarySubscribeParamsSchema,
  pingHistoryParamsSchema,
  pingHistoryResultSchema,
  pingSampleSchema
} from "./schemas/agent";
import {
  taskApproveParamsSchema,
  taskDispatchParamsSchema,
  taskListResultSchema,
  taskTemplateListResultSchema
} from "./schemas/tasks";
import {
  cronCreateParamsSchema,
  cronDeleteParamsSchema,
  cronListResultSchema,
  cronToggleParamsSchema,
  cronUpdateParamsSchema
} from "./schemas/cron";
import {
  pingCreateParamsSchema,
  pingDeleteParamsSchema,
  pingListResultSchema
} from "./schemas/ping";
import {
  alertCreateParamsSchema,
  alertDeleteParamsSchema,
  alertListResultSchema,
  alertSilenceParamsSchema
} from "./schemas/alerts";
import {
  notificationCreateParamsSchema,
  notificationListResultSchema,
  notificationToggleParamsSchema
} from "./schemas/notifications";
import { logListParamsSchema, logListResultSchema } from "./schemas/logs";
import { tokenCreateParamsSchema, tokenListResultSchema, tokenRevokeParamsSchema } from "./schemas/tokens";
import {
  accountInviteParamsSchema,
  accountListResultSchema,
  accountLockParamsSchema,
  accountUpdateParamsSchema
} from "./schemas/accounts";
import {
  themeArchiveParamsSchema,
  themeListResultSchema,
  themePublishParamsSchema,
  themeUploadParamsSchema
} from "./schemas/themes";
import { configUpdateParamsSchema, settingListResultSchema } from "./schemas/settings";
import {
  deploymentListResultSchema,
  deploymentSwitchParamsSchema
} from "./schemas/deployment";

// ---------------------------------------------------------------------------
// Method catalog — maps each `<namespace>.<action>` to its params/result
// schemas. The RPC client validates against these; the mock backend mirrors the
// exact names. Mutations return okResultSchema and feature hooks invalidate the
// relevant query prefix instead of treating the acknowledgement as fresh data.
// ---------------------------------------------------------------------------

export const methods = {
  // Connection health and agent inventory/real-time telemetry.
  "system.ping": { params: z.unknown(), result: pingResultSchema },

  "agent.list": {
    params: agentListParamsSchema,
    result: agentListResultSchema
  },
  "agent.summary.subscribe": {
    params: agentSummarySubscribeParamsSchema,
    result: agentSummarySampleSchema
  },
  "agent.ping.subscribe": {
    params: agentPingSubscribeParamsSchema,
    result: pingSampleSchema
  },
  "agent.ping.history": {
    params: pingHistoryParamsSchema,
    result: pingHistoryResultSchema
  },
  "agent.register": {
    params: agentRegisterParamsSchema,
    result: okResultSchema
  },
  "agent.update": {
    params: agentUpdateParamsSchema,
    result: okResultSchema
  },

  // Read models used by administrative feature modules.
  "task.list": { params: z.unknown(), result: taskListResultSchema },
  "task.template.list": { params: z.unknown(), result: taskTemplateListResultSchema },

  "cron.list": { params: z.unknown(), result: cronListResultSchema },

  "monitor.service.list": { params: z.unknown(), result: pingListResultSchema },

  "alert.list": { params: z.unknown(), result: alertListResultSchema },

  "notification.list": { params: z.unknown(), result: notificationListResultSchema },

  "log.list": { params: logListParamsSchema, result: logListResultSchema },

  "token.list": { params: z.unknown(), result: tokenListResultSchema },

  "account.list": { params: z.unknown(), result: accountListResultSchema },

  "theme.list": { params: z.unknown(), result: themeListResultSchema },

  "config.list": { params: z.unknown(), result: settingListResultSchema },

  "deployment.list": { params: z.unknown(), result: deploymentListResultSchema },

  // Commands. A successful acknowledgement is followed by query invalidation,
  // so list/detail state continues to come from authoritative read methods.
  "task.dispatch": { params: taskDispatchParamsSchema, result: okResultSchema },
  "task.approve": { params: taskApproveParamsSchema, result: okResultSchema },

  "cron.create": { params: cronCreateParamsSchema, result: okResultSchema },
  "cron.update": { params: cronUpdateParamsSchema, result: okResultSchema },
  "cron.toggle": { params: cronToggleParamsSchema, result: okResultSchema },
  "cron.delete": { params: cronDeleteParamsSchema, result: okResultSchema },

  "monitor.service.create": { params: pingCreateParamsSchema, result: okResultSchema },
  "monitor.service.delete": { params: pingDeleteParamsSchema, result: okResultSchema },

  "alert.create": { params: alertCreateParamsSchema, result: okResultSchema },
  "alert.silence": { params: alertSilenceParamsSchema, result: okResultSchema },
  "alert.delete": { params: alertDeleteParamsSchema, result: okResultSchema },

  "notification.create": { params: notificationCreateParamsSchema, result: okResultSchema },
  "notification.toggle": { params: notificationToggleParamsSchema, result: okResultSchema },

  "token.create": { params: tokenCreateParamsSchema, result: okResultSchema },
  "token.revoke": { params: tokenRevokeParamsSchema, result: okResultSchema },

  "account.invite": { params: accountInviteParamsSchema, result: okResultSchema },
  "account.lock": { params: accountLockParamsSchema, result: okResultSchema },
  "account.update": { params: accountUpdateParamsSchema, result: okResultSchema },

  "theme.upload": { params: themeUploadParamsSchema, result: okResultSchema },
  "theme.publish": { params: themePublishParamsSchema, result: okResultSchema },
  "theme.archive": { params: themeArchiveParamsSchema, result: okResultSchema },

  "config.update": { params: configUpdateParamsSchema, result: okResultSchema },

  "deployment.switch": { params: deploymentSwitchParamsSchema, result: okResultSchema }
} as const;

/** Union of every RPC name currently supported by the frontend contract. */
export type MethodName = keyof typeof methods;
