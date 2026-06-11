import {
  BellIcon,
  FileArchiveIcon,
  RadioIcon,
  SaveIcon,
  SearchIcon,
  ScrollTextIcon,
  ServerCogIcon,
  TerminalIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { InteractiveCardButton } from "@/shared/ui/card";
import { Field, Select } from "@/shared/ui/form-controls";

const settingGroups = [
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

export function SettingLimitsCard() {
  const [query, setQuery] = useState("");
  const [selectedGroupTitle, setSelectedGroupTitle] = useState("all");
  const [selectedRowKey, setSelectedRowKey] = useState(settingGroups[0]?.rows[0]?.[0] ?? "");
  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return settingGroups
      .filter((group) => selectedGroupTitle === "all" || group.title === selectedGroupTitle)
      .map((group) => ({
        ...group,
        rows: group.rows.filter(([key, value]) => {
          if (!normalizedQuery) {
            return true;
          }

          return [group.title, group.badge, key, value].join(" ").toLowerCase().includes(normalizedQuery);
        })
      }))
      .filter((group) => group.rows.length > 0);
  }, [query, selectedGroupTitle]);
  const visibleRowsCount = filteredGroups.reduce((total, group) => total + group.rows.length, 0);
  const selectedRow = settingGroups
    .flatMap((group) =>
      group.rows.map(([key, value]) => ({
        group: group.title,
        key,
        value
      }))
    )
    .find((row) => row.key === selectedRowKey);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>限制项与边界</CardTitle>
            <CardDescription>把真正需要显式参数化的高风险能力收进同一层，避免设置页沦为设计说明墙。</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() =>
              toast.success("限制项草稿已保存", {
                description: `${selectedRow?.group ?? "未选择"} · ${selectedRow?.key ?? "无参数"} = ${selectedRow?.value ?? "-"}`
              })
            }
          >
            <SaveIcon data-icon="inline-start" aria-hidden />
            保存草稿
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <Field label="搜索参数">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-white/70 px-3 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 dark:bg-white/6">
              <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="参数 / 分组 / 值"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </Field>
          <Field label="分组">
            <Select value={selectedGroupTitle} onChange={(event) => setSelectedGroupTitle(event.target.value)}>
              <option value="all">全部分组</option>
              {settingGroups.map((group) => (
                <option key={group.title} value={group.title}>
                  {group.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="当前参数">
            <Select value={selectedRowKey} onChange={(event) => setSelectedRowKey(event.target.value)}>
              {settingGroups.map((group) =>
                group.rows.map(([key]) => (
                  <option key={key} value={key}>
                    {group.title} / {key}
                  </option>
                ))
              )}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => {
                setQuery("");
                setSelectedGroupTitle("all");
                setSelectedRowKey(settingGroups[0]?.rows[0]?.[0] ?? "");
              }}
            >
              重置
            </Button>
          </div>
        </div>

        <div className="rounded-[1rem] border border-white/45 bg-[color:var(--surface-muted)] p-3 text-sm dark:border-white/8 dark:bg-white/6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">当前筛选</span>
            <Badge variant="outline">{visibleRowsCount} 项参数</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            {selectedRow
              ? `${selectedRow.group} / ${selectedRow.key} = ${selectedRow.value}`
              : "请选择一个限制项参数"}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <section
              key={group.title}
              className="rounded-[1.25rem] border border-white/45 bg-[color:var(--surface-muted)] p-4 dark:border-white/8 dark:bg-white/6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <group.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <h3 className="truncate font-semibold tracking-[-0.02em]">{group.title}</h3>
                </div>
                <Badge variant="outline">{group.badge}</Badge>
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                {group.rows.map(([key, value]) => (
                  <InteractiveCardButton
                    key={key}
                    tone="default"
                    padding="sm"
                    className="grid gap-1"
                    onClick={() => setSelectedRowKey(key)}
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {key}
                    </dt>
                    <dd className="break-words text-sm font-semibold tracking-[-0.02em]">{value}</dd>
                  </InteractiveCardButton>
                ))}
              </dl>
            </section>
          ))}
        </div>

        {filteredGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-[color:var(--surface-muted)] p-4 text-sm text-muted-foreground">
            当前筛选没有命中任何限制项参数。
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
