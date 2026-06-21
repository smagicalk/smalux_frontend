import { executionRiskMeta } from "@/features/executions/model/execution-display";
import type { CommandTemplate, ExecutionRun } from "@/features/executions/model/mock-executions";

export function findCommandTemplate(
  templates: readonly CommandTemplate[],
  selectedTemplateId: string
) {
  return templates.find((template) => template.id === selectedTemplateId) ?? templates[0];
}

export function countApprovalTemplates(templates: readonly CommandTemplate[]) {
  return templates.filter((template) => template.requiresApproval).length;
}

export function countFailedExecutionRuns(runs: readonly ExecutionRun[]) {
  return runs.filter((run) => run.status === "failed").length;
}

export function createExecutionSelectionSummary(
  templates: readonly CommandTemplate[],
  selectedTemplateId: string,
  selectedNodeName: string
) {
  const selectedTemplate = findCommandTemplate(templates, selectedTemplateId);

  return {
    selectedTemplate,
    selectedRisk: selectedTemplate ? executionRiskMeta[selectedTemplate.risk].label : "未知",
    impactValue: selectedNodeName === "Edge 分组" ? "Edge 分组" : "1 台服务器",
    tokenScope: selectedTemplate?.scope ?? "未选择",
    approvalLabel: selectedTemplate?.requiresApproval ? "需要" : "无需"
  };
}
