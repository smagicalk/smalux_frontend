export type NotificationChannelType =
  | "Webhook"
  | "Email"
  | "Telegram"
  | "Discord"
  | "WeCom";

export type NotificationChannel = {
  id: string;
  name: string;
  type: NotificationChannelType;
  enabled: boolean;
  target: string;
  lastTestAt: string;
  secretStatus: "encrypted" | "missing";
};

export type AlertPolicy = {
  id: string;
  name: string;
  condition: string;
  channels: string[];
  severity: "info" | "warning" | "critical";
  muted: boolean;
};

export type QuietWindow = {
  id: string;
  name: string;
  schedule: string;
  scope: string;
  enabled: boolean;
};

export type NotificationEvent = {
  id: string;
  title: string;
  channel: string;
  status: "sent" | "failed" | "suppressed";
  createdAt: string;
  detail: string;
};

export const mockNotificationChannels: NotificationChannel[] = [
  {
    id: "channel-webhook",
    name: "核心告警 Webhook",
    type: "Webhook",
    enabled: true,
    target: "https://hooks.example.com/smalux",
    lastTestAt: "2026-06-09T08:30:00.000Z",
    secretStatus: "encrypted"
  },
  {
    id: "channel-email",
    name: "运维邮件组",
    type: "Email",
    enabled: true,
    target: "ops@example.com",
    lastTestAt: "2026-06-08T12:10:00.000Z",
    secretStatus: "encrypted"
  },
  {
    id: "channel-telegram",
    name: "Telegram 值班群",
    type: "Telegram",
    enabled: false,
    target: "@smalux_ops",
    lastTestAt: "2026-06-07T03:20:00.000Z",
    secretStatus: "missing"
  },
  {
    id: "channel-discord",
    name: "Discord Oncall",
    type: "Discord",
    enabled: true,
    target: "https://discord.com/api/webhooks/***",
    lastTestAt: "2026-06-09T07:40:00.000Z",
    secretStatus: "encrypted"
  },
  {
    id: "channel-wecom",
    name: "企业微信机器人",
    type: "WeCom",
    enabled: false,
    target: "ops-team",
    lastTestAt: "2026-06-05T10:00:00.000Z",
    secretStatus: "missing"
  }
];

export const mockAlertPolicies: AlertPolicy[] = [
  {
    id: "policy-node-down",
    name: "服务器离线",
    condition: "status = offline 持续 2 分钟",
    channels: ["核心告警 Webhook", "运维邮件组"],
    severity: "critical",
    muted: false
  },
  {
    id: "policy-ping-loss",
    name: "Ping 丢包",
    condition: "loss > 5% 或 availability < 98%",
    channels: ["核心告警 Webhook"],
    severity: "warning",
    muted: false
  },
  {
    id: "policy-exec-failed",
    name: "远程执行失败",
    condition: "高风险任务失败或超时",
    channels: ["运维邮件组"],
    severity: "warning",
    muted: true
  },
  {
    id: "policy-terminal-opened",
    name: "Web 终端会话",
    condition: "高权限终端会话创建或超时未关闭",
    channels: ["核心告警 Webhook", "Discord Oncall"],
    severity: "critical",
    muted: false
  },
  {
    id: "policy-theme-upload",
    name: "公开主题上传",
    condition: "主题上传失败、沙箱校验失败或回滚",
    channels: ["运维邮件组"],
    severity: "info",
    muted: false
  }
];

export const mockQuietWindows: QuietWindow[] = [
  {
    id: "quiet-maintenance",
    name: "维护窗口",
    schedule: "每周日 02:00-04:00",
    scope: "Core / Database",
    enabled: true
  },
  {
    id: "quiet-deploy",
    name: "部署静默",
    schedule: "手动 90 分钟",
    scope: "Edge",
    enabled: false
  },
  {
    id: "quiet-night",
    name: "夜间低优先级静默",
    schedule: "每日 00:00-07:00",
    scope: "通知测试 / info",
    enabled: true
  }
];

export const mockNotificationEvents: NotificationEvent[] = [
  {
    id: "ntf-1003",
    title: "边缘入口丢包",
    channel: "核心告警 Webhook",
    status: "sent",
    createdAt: "2026-06-09T09:58:00.000Z",
    detail: "loss 100%, region Singapore"
  },
  {
    id: "ntf-1002",
    title: "远程执行失败",
    channel: "运维邮件组",
    status: "suppressed",
    createdAt: "2026-06-09T09:36:00.000Z",
    detail: "命中执行失败静默策略"
  },
  {
    id: "ntf-1001",
    title: "测试通知",
    channel: "Telegram 值班群",
    status: "failed",
    createdAt: "2026-06-09T08:30:00.000Z",
    detail: "缺少加密 token"
  },
  {
    id: "ntf-1000",
    title: "Web 终端会话创建",
    channel: "Discord Oncall",
    status: "sent",
    createdAt: "2026-06-09T08:18:00.000Z",
    detail: "owner@example.com opened terminal on tyo-core-01"
  },
  {
    id: "ntf-0999",
    title: "公开主题上传失败",
    channel: "运维邮件组",
    status: "sent",
    createdAt: "2026-06-09T07:55:00.000Z",
    detail: "sandbox rejected remote font import"
  },
  {
    id: "ntf-0998",
    title: "低优先级测试",
    channel: "企业微信机器人",
    status: "suppressed",
    createdAt: "2026-06-09T01:20:00.000Z",
    detail: "命中夜间低优先级静默窗口"
  }
];
