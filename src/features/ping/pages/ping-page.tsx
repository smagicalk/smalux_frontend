import { PlusIcon, RefreshCwIcon, ShieldAlertIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  pingAvailabilityBars,
  pingLatencySeries,
  pingLossTrend
} from "@/features/ping/model/mock-ping-metrics";
import { createPingSummary, mockPingChecks, type PingStatus } from "@/features/ping/model/mock-ping";
import type { PingProtocol } from "@/features/ping/model/mock-ping";
import { AreaTrendChart } from "@/shared/charts/area-trend-chart";
import { BarChart } from "@/shared/charts/bar-chart";
import { MultiLineChart } from "@/shared/charts/multi-line-chart";
import { formatLatency, formatPercent } from "@/shared/lib/format";
import { Badge, type BadgeVariant } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { InteractiveCardButton } from "@/shared/ui/card";
import { Field, Select, TextInput } from "@/shared/ui/form-controls";
import { MetricPill } from "@/shared/ui/metric-pill";
import { PageHeader } from "@/shared/ui/page-header";
import { PercentBar } from "@/shared/ui/percent-bar";

const statusMeta: Record<PingStatus, { label: string; variant: BadgeVariant }> = {
  ok: { label: "正常", variant: "success" },
  degraded: { label: "降级", variant: "warning" },
  down: { label: "不可用", variant: "danger" }
};

const targetGroups = [
  ["Public", "公开状态页、对外入口", "可展示"],
  ["Control", "API / JSON-RPC / WSS", "仅后台"],
  ["Notify", "SMTP / Webhook 通道", "仅告警"],
  ["Private", "内网与管理端口", "默认拒绝"]
];

const protocolHealth = [
  ["HTTP", "证书、状态码、响应时间"],
  ["TCP", "端口连通、超时、握手耗时"],
  ["ICMP", "丢包、抖动、宿主权限"],
  ["WSS", "握手、Origin、心跳间隔"]
];

const displayBoundaries = [
  "公开页只展示已标记 public 的目标，不暴露内网域名、端口和告警策略名称",
  "API / WSS / JSON-RPC 健康检查默认仅后台可见，公开页只展示聚合状态",
  "目标新增、导入和批量修改必须先经过服务端地址校验与频率限制"
];

export function PingPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PingStatus | "all">("all");
  const [protocolFilter, setProtocolFilter] = useState<PingProtocol | "all">("all");
  const filteredChecks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mockPingChecks.filter((check) => {
      const matchesQuery =
        !normalizedQuery ||
        [check.name, check.target, check.region, check.alertPolicy]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || check.status === statusFilter;
      const matchesProtocol = protocolFilter === "all" || check.protocol === protocolFilter;

      return matchesQuery && matchesStatus && matchesProtocol;
    });
  }, [protocolFilter, query, statusFilter]);
  const summary = createPingSummary(filteredChecks);

  return (
    <>
      <PageHeader
        eyebrow="Link Health"
        title="Ping 监测"
        description="优先找出异常目标和退化原因，再用趋势图解释链路质量。目标列表必须比摘要卡更抢眼。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("已刷新探测", {
                  description: `${filteredChecks.length} 个目标进入 mock 探测队列。`
                })
              }
            >
              <RefreshCwIcon data-icon="inline-start" aria-hidden />
              刷新探测
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info("已打开新建监测草稿", {
                  description: "默认启用服务端地址校验和私网目标拒绝。"
                })
              }
            >
              <PlusIcon data-icon="inline-start" aria-hidden />
              新建监测
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>目标筛选</CardTitle>
          <CardDescription>筛选会同步更新目标列表和摘要，便于调试公开目标、控制面目标和异常链路。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <Field label="搜索">
            <TextInput
              placeholder="目标 / 区域 / 策略"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </Field>
          <Field label="状态">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PingStatus | "all")}
            >
              <option value="all">全部状态</option>
              <option value="ok">正常</option>
              <option value="degraded">降级</option>
              <option value="down">不可用</option>
            </Select>
          </Field>
          <Field label="协议">
            <Select
              value={protocolFilter}
              onChange={(event) => setProtocolFilter(event.target.value as PingProtocol | "all")}
            >
              <option value="all">全部协议</option>
              <option value="HTTP">HTTP</option>
              <option value="TCP">TCP</option>
              <option value="ICMP">ICMP</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setProtocolFilter("all");
              }}
            >
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <Card tone="strong">
          <CardHeader>
            <CardTitle>监测目标</CardTitle>
            <CardDescription>这是主操作面。先扫状态、区域、参数和可用率，再决定是否查看趋势和边界信息。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {filteredChecks.length > 0 ? (
              filteredChecks.map((check) => (
                <InteractiveCardButton
                  key={check.id}
                  tone="muted"
                  padding="sm"
                  className="grid gap-3 text-left lg:grid-cols-[minmax(0,1.45fr)_100px_100px_100px_130px]"
                  onClick={() =>
                    toast.info(check.name, {
                      description: `${check.protocol} · ${check.region} · ${check.target} · ${formatLatency(check.latencyMs)}`
                    })
                  }
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold tracking-[-0.02em]">{check.name}</p>
                      <Badge variant={statusMeta[check.status].variant}>
                        {statusMeta[check.status].label}
                      </Badge>
                      <Badge variant="outline">{check.protocol}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{check.target}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {check.region} · {check.intervalSec}s · retry {check.retries}
                    </p>
                  </div>
                  <Metric label="延迟" value={formatLatency(check.latencyMs)} />
                  <Metric label="丢包" value={formatPercent(check.lossPercent)} />
                  <Metric label="超时" value={`${check.timeoutMs} ms`} />
                  <PercentBar label="可用率" value={check.availability} />
                </InteractiveCardButton>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 bg-white/45 p-4 text-sm text-muted-foreground dark:bg-white/6">
                当前筛选没有命中任何监测目标。
              </div>
            )}
          </CardContent>
        </Card>

        <Card tone="muted">
          <CardHeader>
            <CardTitle>摘要</CardTitle>
            <CardDescription>只保留当前窗口必要摘要。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <MetricPill label="启用目标" value={`${summary.enabled}/${summary.total}`} />
            <MetricPill label="平均可用率" value={formatPercent(summary.availability)} />
            <MetricPill label="平均延迟" value={formatLatency(summary.latency)} />
            <MetricPill label="异常目标" value={`${summary.degraded + summary.down}`} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>目标组与展示范围</CardTitle>
            <CardDescription>Ping 目标需要先分组，再决定监测协议、告警策略和是否允许出现在公开状态页。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {targetGroups.map(([name, description, exposure]) => (
              <div
                key={name}
                className="rounded-[1rem] border border-white/45 bg-[color:var(--surface-muted)] p-3 dark:border-white/8 dark:bg-white/6"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{name}</p>
                  <Badge variant={exposure === "可展示" ? "success" : exposure === "默认拒绝" ? "danger" : "outline"}>
                    {exposure}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card tone="muted">
          <CardHeader>
            <CardTitle>协议健康</CardTitle>
            <CardDescription>不只测 ping，还要测控制面通道。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {protocolHealth.map(([protocol, description]) => (
              <div key={protocol} className="flex items-center justify-between gap-3 rounded-xl bg-white/65 p-3 dark:bg-white/6">
                <span className="font-mono text-sm font-semibold">{protocol}</span>
                <span className="min-w-0 text-right text-xs text-muted-foreground">{description}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card tone="strong">
          <CardHeader>
            <CardTitle>延迟趋势</CardTitle>
            <CardDescription>主链路视图。</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiLineChart label="Ping 延迟趋势" series={pingLatencySeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>可用率对比</CardTitle>
            <CardDescription>识别短板入口。</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={pingAvailabilityBars}
              label="Ping 可用率对比"
              color="var(--chart-1)"
              baseline={90}
              height={140}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>丢包走势</CardTitle>
            <CardDescription>判断抖动 / 断裂。</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaTrendChart
              values={pingLossTrend}
              label="Ping 丢包趋势"
              color="var(--chart-4)"
              height={132}
            />
          </CardContent>
        </Card>

        <Card tone="muted">
          <CardHeader>
            <CardTitle>探测边界</CardTitle>
            <CardDescription>外联策略提示。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <MetricPill label="目标校验" value="服务端审核" />
            <MetricPill label="最小间隔" value="15 秒" />
            <MetricPill label="私网限制" value="默认拒绝" />
            <MetricPill label="API/WSS" value="后台可见" />
            <MetricPill label="公开展示" value="白名单" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>安全限制</CardTitle>
          <CardDescription>外联能力必须持续暴露风险边界，而不是只显示“可新增目标”。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 lg:grid-cols-2">
          {[
            "目标地址由服务端校验，并限制私网与回环地址策略",
            "最小探测间隔、最大重试次数和超时时间必须受系统设置控制",
            "Webhook 与 Ping 目标共用外联审计和频率限制边界",
            "ICMP 是否启用取决于部署权限与宿主环境能力",
            ...displayBoundaries
          ].map((item) => (
            <InteractiveCardButton
              key={item}
              tone="muted"
              padding="sm"
              className="flex gap-3 text-left text-sm bg-[color:var(--surface-warning)] border-warning/25"
              onClick={() =>
                toast.info("探测边界", {
                  description: item
                })
              }
            >
              <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>{item}</span>
            </InteractiveCardButton>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="min-w-0 rounded-[0.9rem] bg-white/70 p-3 transition hover:bg-white/85 dark:bg-white/6 dark:hover:bg-white/8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tracking-[-0.02em]">{value}</p>
    </div>
  );
}
