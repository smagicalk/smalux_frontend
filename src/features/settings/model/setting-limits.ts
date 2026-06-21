import {
  BellIcon,
  FileArchiveIcon,
  RadioIcon,
  ScrollTextIcon,
  ServerCogIcon,
  TerminalIcon
} from "lucide-react";

export type SettingLimitRow = readonly [key: string, value: string];

export type SettingLimitGroup = {
  title: string;
  icon: typeof FileArchiveIcon;
  badge: string;
  rows: readonly SettingLimitRow[];
};

export type SelectedSettingLimit = {
  group: string;
  key: string;
  value: string;
};

export const settingLimitGroups: readonly SettingLimitGroup[] = [
  {
    title: "主题上传",
    icon: FileArchiveIcon,
    badge: "高风险",
    rows: [
      ["maxZipSizeMb", "20"],
      ["maxExtractedSizeMb", "80"],
      ["allowedFileExtensions", ".html .css .js .json .png .webp .svg .woff2"],
      ["isolatePublicThemeCookies", "true"]
    ]
  },
  {
    title: "Ping 监测",
    icon: RadioIcon,
    badge: "外联",
    rows: [
      ["minIntervalSec", "15"],
      ["maxRetries", "5"],
      ["allowPrivateAddress", "false"],
      ["maxTargets", "200"]
    ]
  },
  {
    title: "远程执行",
    icon: TerminalIcon,
    badge: "审计",
    rows: [
      ["maxConcurrency", "8"],
      ["maxTimeoutSec", "600"],
      ["requireConfirm", "true"],
      ["maskOutputSecrets", "true"]
    ]
  },
  {
    title: "通知",
    icon: BellIcon,
    badge: "限频",
    rows: [
      ["maxRetry", "3"],
      ["rateLimitPerMinute", "30"],
      ["encryptSecrets", "true"],
      ["testNotificationAudit", "true"]
    ]
  },
  {
    title: "Agent 注册",
    icon: ServerCogIcon,
    badge: "密钥",
    rows: [
      ["tokenTtlHours", "24"],
      ["showTokenOnce", "true"],
      ["hmacReplayWindowSec", "300"],
      ["rotateSecretAudit", "true"]
    ]
  },
  {
    title: "日志保留",
    icon: ScrollTextIcon,
    badge: "治理",
    rows: [
      ["auditRetentionDays", "180"],
      ["executionRetentionDays", "90"],
      ["exportRequiresOwner", "true"],
      ["silentDelete", "false"]
    ]
  }
];

export function getInitialSettingLimitKey() {
  return settingLimitGroups[0]?.rows[0]?.[0] ?? "";
}

export function findSettingLimitByKey(key: string): SelectedSettingLimit | undefined {
  return settingLimitGroups
    .flatMap((group) =>
      group.rows.map(([rowKey, value]) => ({
        group: group.title,
        key: rowKey,
        value
      }))
    )
    .find((row) => row.key === key);
}
