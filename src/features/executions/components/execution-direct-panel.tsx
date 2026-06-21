import { ExecutionConfirmationGuard } from "@/features/executions/components/execution-confirmation-guard";
import { createExecutionSelectionSummary } from "@/features/executions/model/execution-selection";
import type { CommandTemplate } from "@/features/executions/model/mock-executions";
import type { MonitorNode } from "@/shared/domain/node";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, Select, Textarea } from "@/shared/ui/form-controls";
import { MetricPill } from "@/shared/ui/metric-pill";

type ExecutionDirectPanelProps = {
  nodes: readonly MonitorNode[];
  templates: readonly CommandTemplate[];
  selectedNodeName: string;
  selectedTemplateId: string;
  commandPreview: string;
  onNodeChange: (value: string) => void;
  onTemplateChange: (template: CommandTemplate) => void;
  onCommandPreviewChange: (value: string) => void;
  onConfirm: () => void;
};

export function ExecutionDirectPanel({
  nodes,
  templates,
  selectedNodeName,
  selectedTemplateId,
  commandPreview,
  onNodeChange,
  onTemplateChange,
  onCommandPreviewChange,
  onConfirm
}: ExecutionDirectPanelProps) {
  const selectionSummary = createExecutionSelectionSummary(templates, selectedTemplateId, selectedNodeName);

  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>直接执行</CardTitle>
        <CardDescription>真实下发前，目标、模板、风险、脱敏与审计编号必须一起呈现，不能只给一个命令输入框。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="目标服务器">
            <Select value={selectedNodeName} onChange={(event) => onNodeChange(event.target.value)}>
              {nodes.map((node) => (
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
                const template = templates.find((item) => item.id === event.target.value);
                if (template) {
                  onTemplateChange(template);
                }
              }}
            >
              {templates.map((template) => (
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
            onChange={(event) => onCommandPreviewChange(event.target.value)}
          />
        </Field>
        <div className="grid gap-2 md:grid-cols-3">
          <MetricPill label="影响范围" value={selectionSummary.impactValue} />
          <MetricPill label="输出处理" value="脱敏后展示" />
          <MetricPill label="风险等级" value={selectionSummary.selectedRisk} />
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <MetricPill label="Token Scope" value={selectionSummary.tokenScope} />
          <MetricPill label="执行通道" value="JSON-RPC" />
          <MetricPill label="审批" value={selectionSummary.approvalLabel} />
        </div>
        <ExecutionConfirmationGuard onConfirm={onConfirm} />
      </CardContent>
    </Card>
  );
}
