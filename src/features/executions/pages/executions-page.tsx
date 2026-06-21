import { ClipboardListIcon, PlayIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ExecutionBoundaryPanels } from "@/features/executions/components/execution-boundary-panels";
import { ExecutionCharts } from "@/features/executions/components/execution-charts";
import { ExecutionDirectPanel } from "@/features/executions/components/execution-direct-panel";
import { ExecutionOverviewCards } from "@/features/executions/components/execution-overview-cards";
import { ExecutionScheduledPanel } from "@/features/executions/components/execution-scheduled-panel";
import { ExecutionTemplatePanel } from "@/features/executions/components/execution-template-panel";
import { ExecutionRunsPanel } from "@/features/executions/components/execution-runs-panel";
import { ExecutionTerminalPanel } from "@/features/executions/components/execution-terminal-panel";
import {
  mockCommandTemplates,
  mockExecutionRuns,
  mockScheduledExecutions
} from "@/features/executions/model/mock-executions";
import { executionRiskMeta } from "@/features/executions/model/execution-display";
import {
  countApprovalTemplates,
  countFailedExecutionRuns,
  findCommandTemplate
} from "@/features/executions/model/execution-selection";
import { mockNodes } from "@/features/nodes/model/mock-nodes";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function ExecutionsPage() {
  const [selectedNodeName, setSelectedNodeName] = useState(mockNodes[0]?.name ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(mockCommandTemplates[0]?.id ?? "");
  const [commandPreview, setCommandPreview] = useState(mockCommandTemplates[0]?.command ?? "");
  const selectedTemplate = useMemo(
    () => findCommandTemplate(mockCommandTemplates, selectedTemplateId),
    [selectedTemplateId]
  );
  const failedRuns = countFailedExecutionRuns(mockExecutionRuns);
  const approvalTemplateCount = countApprovalTemplates(mockCommandTemplates);

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
                  description: `${mockCommandTemplates.length} 个模板 · ${approvalTemplateCount} 个需要审批。`
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

      <ExecutionOverviewCards
        templateCount={mockCommandTemplates.length}
        scheduledCount={mockScheduledExecutions.length}
        runCount={mockExecutionRuns.length}
        failedRunCount={failedRuns}
      />

      <ExecutionCharts />
      <ExecutionBoundaryPanels />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ExecutionDirectPanel
          nodes={mockNodes}
          templates={mockCommandTemplates}
          selectedNodeName={selectedNodeName}
          selectedTemplateId={selectedTemplateId}
          commandPreview={commandPreview}
          onNodeChange={setSelectedNodeName}
          onTemplateChange={(template) => {
            setSelectedTemplateId(template.id);
            setCommandPreview(template.command);
          }}
          onCommandPreviewChange={setCommandPreview}
          onConfirm={() =>
            toast.warning("已进入二次确认", {
              description: `audit-${Date.now().toString().slice(-6)} · ${selectedNodeName} · ${selectedTemplate ? executionRiskMeta[selectedTemplate.risk].label : "未知"}`
            })
          }
        />

        <ExecutionTemplatePanel
          templates={mockCommandTemplates}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={(template) => {
            setSelectedTemplateId(template.id);
            setCommandPreview(template.command);
            toast.info(template.name, {
              description: `${template.description} · ${template.scope}`
            });
          }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ExecutionScheduledPanel
          jobs={mockScheduledExecutions}
          onInspect={(job) =>
            toast.info(job.name, {
              description: `${job.target} · ${job.cron} · ${job.enabled ? "启用" : "停用"}`
            })
          }
        />

        <ExecutionRunsPanel
          runs={mockExecutionRuns}
          onInspect={(run) =>
            toast.info(run.target, {
              description: `${run.status} · ${run.operator} · ${run.command}`
            })
          }
        />
      </div>

      <ExecutionTerminalPanel />
    </>
  );
}
