import {
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  PlayIcon,
  ShieldAlertIcon,
  TerminalSquareIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  mockCommandTemplates,
  mockExecutionRuns,
  mockScheduledExecutions,
  type ExecutionRisk,
  type ExecutionStatus
} from "@/features/executions/model/mock-executions";
import { ExecutionCharts } from "@/features/executions/components/execution-charts";
import { mockNodes } from "@/features/nodes/model/mock-nodes";
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
import { Field, Select, Textarea } from "@/shared/ui/form-controls";
import { MetricPill } from "@/shared/ui/metric-pill";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";

const riskMeta: Record<ExecutionRisk, { label: string; variant: BadgeVariant }> = {
  low: { label: "低风险", variant: "success" },
  medium: { label: "中风险", variant: "warning" },
  high: { label: "高风险", variant: "danger" }
};

const statusMeta: Record<ExecutionStatus, { label: string; variant: BadgeVariant }> = {
  success: { label: "成功", variant: "success" },
  running: { label: "运行中", variant: "warning" },
  failed: { label: "失败", variant: "danger" },
  scheduled: { label: "已计划", variant: "secondary" }
};

const batchGuardrails = [
  {
    label: "目标预演",
    value: "4 台匹配",
    description: "批量执行先按分组、标签和在线状态生成预演清单。"
  },
  {
    label: "并发上限",
    value: "2 / 组",
    description: "跨区域下发按分组限流，失败率升高时自动停止后续批次。"
  },
  {
    label: "回滚入口",
    value: "模板绑定",
    description: "高风险模板必须绑定回滚模板或人工处理说明。"
  }
];

const terminalBoundaries = [
  "Web 终端只允许 WSS，并校验 Origin 与当前会话权限",
  "会话需要独立审计编号，输入、退出码和窗口标题分开记录",
  "粘贴、文件上传和 sudo 类命令由策略参数控制，默认关闭"
];

const approvalItems = [
  ["高风险写操作", "2 条待审批", "Admin + Owner"],
  ["批量目标超过阈值", "1 条待复核", "双人确认"],
  ["终端提权会话", "0 条", "即时审计"]
];

export function ExecutionsPage() {
  const [selectedNodeName, setSelectedNodeName] = useState(mockNodes[0]?.name ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(mockCommandTemplates[0]?.id ?? "");
  const [commandPreview, setCommandPreview] = useState(mockCommandTemplates[0]?.command ?? "");
  const selectedTemplate = useMemo(
    () => mockCommandTemplates.find((template) => template.id === selectedTemplateId) ?? mockCommandTemplates[0],
    [selectedTemplateId]
  );
  const failedRuns = mockExecutionRuns.filter((run) => run.status === "failed").length;
  const impactValue = selectedNodeName === "Edge 分组" ? "Edge 分组" : "1 台服务器";
  const selectedRisk = selectedTemplate ? riskMeta[selectedTemplate.risk].label : "未知";

  return (
    <>
      <PageHeader
        eyebrow="Remote Actions"
        title="远程执行"
        description="这里是高风险操作面，不是普通任务列表。设计重点是让目标、命令、风险级别、审批状态和审计边界同时可见。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("模板库已同步", {
                  description: `${mockCommandTemplates.length} 个模板 · ${mockCommandTemplates.filter((template) => template.requiresApproval).length} 个需要审批。`
                })
              }
            >
              <ClipboardListIcon data-icon="inline-start" aria-hidden />
              模板库
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info("已生成执行草稿", {
                  description: `${selectedNodeName} · ${selectedTemplate?.name ?? "未选择模板"}`
                })
              }
            >
              <PlayIcon data-icon="inline-start" aria-hidden />
              直接执行
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="命令模板"
          value={`${mockCommandTemplates.length}`}
          description="模板先决定能力边界，再决定谁能执行。"
          icon={TerminalSquareIcon}
          tone="primary"
        />
        <StatCard
          label="定时任务"
          value={`${mockScheduledExecutions.length}`}
          description="cron、并发、超时和失败策略都属于同一组控制面。"
          icon={CalendarClockIcon}
          tone="info"
        />
        <StatCard
          label="执行记录"
          value={`${mockExecutionRuns.length}`}
          description={`${failedRuns} 条失败，需要回溯命令、目标和审批链。`}
          icon={ClipboardListIcon}
          tone={failedRuns > 0 ? "warning" : "success"}
        />
        <StatCard
          label="二次确认"
          value="强制"
          description="高风险命令和写操作必须经确认或审批。"
          icon={ShieldAlertIcon}
          tone="danger"
        />
      </div>

      <ExecutionCharts />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>批量动作边界</CardTitle>
            <CardDescription>批量不是把单机命令循环发送，而是目标预演、并发、失败熔断和回滚策略的组合。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {batchGuardrails.map((item) => (
              <div
                key={item.label}
                className="rounded-[1rem] border border-white/45 bg-[color:var(--surface-muted)] p-3 dark:border-white/8 dark:bg-white/6"
              >
                <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card tone="muted">
          <CardHeader>
            <CardTitle>审批队列</CardTitle>
            <CardDescription>高风险执行必须在下发前暴露审批状态。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {approvalItems.map(([name, count, policy]) => (
              <div key={name} className="flex items-center justify-between gap-3 rounded-xl bg-white/60 p-3 dark:bg-white/6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{policy}</p>
                </div>
                <Badge variant={count === "0 条" ? "secondary" : "warning"}>{count}</Badge>
              </div>
            ))}
            <div className="rounded-xl border border-warning/25 bg-[color:var(--surface-warning)] p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">下发状态</span>
                <Badge variant="warning">部分冻结</Badge>
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                待审批项清空前，高风险模板和批量目标超过阈值的任务不能进入执行队列。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card tone="strong">
          <CardHeader>
            <CardTitle>直接执行</CardTitle>
            <CardDescription>真实下发前，目标、模板、风险、脱敏与审计编号必须一起呈现，不能只给一个命令输入框。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="目标服务器">
                <Select
                  value={selectedNodeName}
                  onChange={(event) => setSelectedNodeName(event.target.value)}
                >
                  {mockNodes.map((node) => (
                    <option key={node.id} value={node.name}>
                      {node.name}
                    </option>
                  ))}
                  <option value="Edge 分组">Edge 分组</option>
                </Select>
              </Field>
              <Field label="命令模板">
                <Select
                  value={selectedTemplateId}
                  onChange={(event) => {
                    const template = mockCommandTemplates.find((item) => item.id === event.target.value);
                    setSelectedTemplateId(event.target.value);
                    setCommandPreview(template?.command ?? "");
                  }}
                >
                  {mockCommandTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="命令预览">
              <Textarea
                className="font-mono"
                value={commandPreview}
                onChange={(event) => setCommandPreview(event.target.value)}
              />
            </Field>
            <div className="grid gap-2 md:grid-cols-3">
              <MetricPill label="影响范围" value={impactValue} />
              <MetricPill label="输出处理" value="脱敏后展示" />
              <MetricPill label="风险等级" value={selectedRisk} />
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <MetricPill label="Token Scope" value={selectedTemplate?.scope ?? "未选择"} />
              <MetricPill label="执行通道" value="JSON-RPC" />
              <MetricPill label="审批" value={selectedTemplate?.requiresApproval ? "需要" : "无需"} />
            </div>
            <div className="flex flex-col gap-3 rounded-[1.2rem] border border-danger/25 bg-[color:var(--surface-danger)] p-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                <span>执行前必须展示命令、目标、风险等级、操作者和审计编号，避免“盲执行”。</span>
              </div>
              <Button
                className="w-full sm:w-fit"
                variant="danger"
                onClick={() =>
                  toast.warning("已进入二次确认", {
                    description: `audit-${Date.now().toString().slice(-6)} · ${selectedNodeName} · ${selectedRisk}`
                  })
                }
              >
                <CheckCircle2Icon data-icon="inline-start" aria-hidden />
                进入二次确认
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>命令模板</CardTitle>
            <CardDescription>模板不是装饰，它决定 Operator 能触达什么目标、是否需要审批、是否允许高风险写入。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mockCommandTemplates.map((template) => (
              <InteractiveCardButton
                key={template.id}
                tone="muted"
                padding="md"
                className="text-left"
                onClick={() => {
                  setSelectedTemplateId(template.id);
                  setCommandPreview(template.command);
                  toast.info(template.name, {
                    description: `${template.description} · ${template.scope}`
                  });
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold tracking-[-0.02em]">{template.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <Badge variant={riskMeta[template.risk].variant}>
                    {riskMeta[template.risk].label}
                  </Badge>
                </div>
                <p className="mt-3 truncate rounded-xl bg-white/70 p-2 font-mono text-xs dark:bg-white/6">
                  {template.command}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  权限：{template.scope} · {template.requiresApproval ? "需要审批" : "无需审批"}
                </p>
              </InteractiveCardButton>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>定时执行</CardTitle>
            <CardDescription>巡检、清理和健康检查需要被当作“长期运维策略”管理，而不是普通列表项。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mockScheduledExecutions.map((job) => (
              <InteractiveCardButton
                key={job.id}
                tone="muted"
                padding="md"
                className="text-left"
                onClick={() =>
                  toast.info(job.name, {
                    description: `${job.target} · ${job.cron} · ${job.enabled ? "启用" : "停用"}`
                  })
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold tracking-[-0.02em]">{job.name}</p>
                  <Badge variant={job.enabled ? "success" : "secondary"}>
                    {job.enabled ? "启用" : "停用"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span>目标：{job.target}</span>
                  <span>模板：{job.template}</span>
                  <span>cron：{job.cron}</span>
                  <span>并发：{job.maxConcurrency} / 超时：{job.timeoutSec}s</span>
                </div>
              </InteractiveCardButton>
            ))}
          </CardContent>
        </Card>

        <Card tone="strong">
          <CardHeader>
            <CardTitle>执行记录</CardTitle>
            <CardDescription>输出只展示预览，真正有价值的是状态、目标、风险和操作人是否形成了可追踪链路。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mockExecutionRuns.map((run) => (
              <InteractiveCardButton
                key={run.id}
                tone="muted"
                padding="md"
                className="text-left"
                onClick={() =>
                  toast.info(run.target, {
                    description: `${run.status} · ${run.operator} · ${run.command}`
                  })
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusMeta[run.status].variant}>
                    {statusMeta[run.status].label}
                  </Badge>
                  <Badge variant={riskMeta[run.risk].variant}>{riskMeta[run.risk].label}</Badge>
                  <span className="text-sm text-muted-foreground">{run.operator}</span>
                </div>
                <p className="mt-3 font-semibold tracking-[-0.02em]">{run.target}</p>
                <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{run.command}</p>
                <p className="mt-3 rounded-xl bg-white/70 p-2 font-mono text-xs dark:bg-white/6">{run.outputPreview}</p>
              </InteractiveCardButton>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card tone="muted">
        <CardHeader>
          <CardTitle>Web 终端安全入口</CardTitle>
          <CardDescription>终端是远程执行的最高风险交互形态，入口必须比普通命令按钮更克制、更可审计。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-[1rem] border border-danger/25 bg-[color:var(--surface-danger)] p-4">
            <Badge variant="danger">受控入口</Badge>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">按会话授权</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              终端不作为默认快捷入口展示，必须先选节点、确认身份、绑定审计编号，再建立 WSS 会话。
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {terminalBoundaries.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-white/65 p-3 text-sm dark:bg-white/6">
                <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
