import {
  KeyRoundIcon,
  PlusIcon,
  RotateCwIcon,
  SearchIcon,
  ShieldAlertIcon,
  TagsIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { mockNodes } from "@/features/nodes/model/mock-nodes";
import { NodesList } from "@/features/nodes/components/nodes-list";
import type { NodeStatus } from "@/shared/domain/node";
import { SegmentedBar } from "@/shared/charts/segmented-bar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { Field, Select, TextInput } from "@/shared/ui/form-controls";
import { MetricPill } from "@/shared/ui/metric-pill";
import { PageHeader } from "@/shared/ui/page-header";

const statusColor = {
  online: "var(--chart-2)",
  warning: "var(--chart-3)",
  offline: "var(--chart-4)"
};

const agentAccessItems = [
  ["接入通道", "WSS / 443", "Agent 只向主控发起出站连接，便于单独部署与 Nginx 反代。"],
  ["注册 Token", "一次性", "创建后只展示一次，绑定分组、区域、过期时间和 Scope。"],
  ["密钥轮换", "分批执行", "按区域错峰轮换，失败节点保留旧密钥到安全窗口结束。"]
];

const tokenScopes = [
  ["node:read", "读取指标、心跳和基础资产信息"],
  ["node:exec", "受控远程执行，不含终端提权"],
  ["node:terminal", "Web 终端会话，必须单独审批"],
  ["theme:public", "公开页主题资源读取，不接触后台配置"]
];

const regionPolicies = [
  ["Tokyo", "Core", "主控优先，严格限流"],
  ["Singapore", "Edge / Cache", "异常优先，允许降级展示"],
  ["Frankfurt", "Database", "只读默认，写操作审批"],
  ["San Francisco", "Edge", "公开页可展示，隐藏内部标签"]
];

export function NodesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NodeStatus | "all">("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const groups = Array.from(new Set(mockNodes.map((node) => node.group)));
  const filteredNodes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mockNodes.filter((node) => {
      const matchesQuery =
        !normalizedQuery ||
        [node.name, node.group, node.region].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || node.status === statusFilter;
      const matchesGroup = groupFilter === "all" || node.group === groupFilter;

      return matchesQuery && matchesStatus && matchesGroup;
    });
  }, [groupFilter, query, statusFilter]);
  const statusSegments = (["online", "warning", "offline"] as const).map((status) => ({
    label: status === "online" ? "在线" : status === "warning" ? "预警" : "离线",
    value: filteredNodes.filter((node) => node.status === status).length,
    color: statusColor[status]
  }));

  return (
    <>
      <PageHeader
        eyebrow="Fleet Operations"
        title="服务器"
        description="这个页面只专注节点本身：看状态、看分组、做操作。复杂趋势和解释性交给总览或子页。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("节点筛选已聚焦", {
                  description: `${filteredNodes.length}/${mockNodes.length} 台节点匹配当前条件。`
                })
              }
            >
              <SearchIcon data-icon="inline-start" aria-hidden />
              筛选节点
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.success("已生成注册 Token", {
                  description: "mock token: node_reg_tyo_7f8a，只展示一次。"
                })
              }
            >
              <PlusIcon data-icon="inline-start" aria-hidden />
              添加节点
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>节点筛选</CardTitle>
          <CardDescription>筛选结果会同步影响列表和右侧编队状态，方便调试不同区域、分组和异常组合。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <Field label="搜索">
            <TextInput
              placeholder="节点 / 分组 / 区域"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </Field>
          <Field label="状态">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as NodeStatus | "all")}
            >
              <option value="all">全部状态</option>
              <option value="online">在线</option>
              <option value="warning">预警</option>
              <option value="offline">离线</option>
            </Select>
          </Field>
          <Field label="分组">
            <Select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
              <option value="all">全部分组</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setGroupFilter("all");
              }}
            >
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <NodesList nodes={filteredNodes} />

        <div className="grid gap-3">
          <Card tone="muted">
            <CardHeader>
              <CardTitle>编队状态</CardTitle>
              <CardDescription>只保留和节点扫描最相关的摘要。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <SegmentedBar segments={statusSegments} label="服务器状态分布" />
              <MetricPill label="当前结果" value={`${filteredNodes.length}/${mockNodes.length}`} />
              <MetricPill label="主关注区域" value="Tokyo / Singapore" />
            </CardContent>
          </Card>

          <Card tone="strong">
            <CardHeader>
              <CardTitle>运维控制</CardTitle>
              <CardDescription>节点页只保留最常用的操作入口。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button
                className="w-full justify-start"
                onClick={() =>
                  toast.success("已创建注册 Token", {
                    description: `${groupFilter === "all" ? "全部分组" : groupFilter} · 15 分钟后过期`
                  })
                }
              >
                <KeyRoundIcon data-icon="inline-start" aria-hidden />
                创建注册 Token
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  toast.warning("已加入轮换队列", {
                    description: `${filteredNodes.length} 台匹配节点将按区域分批轮换。`
                  })
                }
              >
                <RotateCwIcon data-icon="inline-start" aria-hidden />
                批量轮换密钥
              </Button>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <Badge key={group} variant="outline">
                    <TagsIcon className="mr-1 size-3" aria-hidden />
                    {group}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3 rounded-xl border border-danger/25 bg-[color:var(--surface-danger)] p-3 text-sm">
                <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                <span>吊销、删除和轮换必须二次确认，并写入审计。</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card tone="strong">
          <CardHeader>
            <CardTitle>Agent 接入边界</CardTitle>
            <CardDescription>节点接入要同时说明通道、Token 生命周期和密钥轮换，否则添加节点会变成不透明的危险入口。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {agentAccessItems.map(([label, value, description]) => (
              <div
                key={label}
                className="rounded-[1rem] border border-white/45 bg-[color:var(--surface-muted)] p-3 dark:border-white/8 dark:bg-white/6"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{label}</p>
                  <Badge variant="outline">{value}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Scope 与区域治理</CardTitle>
            <CardDescription>后台应把“能接入什么、能执行什么、能公开展示什么”拆成可审计的权限片段。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              {tokenScopes.map(([scope, description]) => (
                <div key={scope} className="rounded-xl bg-[color:var(--surface-muted)] p-3">
                  <p className="font-mono text-sm font-semibold">{scope}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              {regionPolicies.map(([region, group, policy]) => (
                <div
                  key={region}
                  className="grid gap-2 rounded-xl border border-white/45 bg-white/65 p-3 text-sm sm:grid-cols-[100px_minmax(0,1fr)] dark:border-white/8 dark:bg-white/6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{region}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{group}</p>
                  </div>
                  <p className="text-muted-foreground">{policy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
