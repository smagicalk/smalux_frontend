import type { ChannelType } from "@/shared/api/methods";

export const CHANNEL_LABEL: Record<ChannelType, string> = {
  webhook: "Webhook", telegram: "Telegram", discord: "Discord", email: "邮件", wecom: "企业微信"
};

export const SEVERITY_VARIANT = { info: "neutral", warning: "warning", critical: "danger" } as const;

export type LogFilter = "all" | "failed" | "critical";
export const LOG_OPTS: ReadonlyArray<{ key: LogFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "failed", label: "失败" },
  { key: "critical", label: "严重" }
];
