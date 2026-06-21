import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

import { executionRiskMeta } from "@/features/executions/model/execution-display";
import type { CommandTemplate } from "@/features/executions/model/mock-executions";

type ExecutionTemplatePanelProps = {
  templates: readonly CommandTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (template: CommandTemplate) => void;
};

export function ExecutionTemplatePanel({
  templates,
  selectedTemplateId,
  onSelectTemplate
}: ExecutionTemplatePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>命令模板</CardTitle>
        <CardDescription>模板不是装饰，它决定 Operator 能触达什么目标、是否需要审批、是否允许高风险写入。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {templates.map((template) => (
          <InteractiveCardButton
            key={template.id}
            tone={template.id === selectedTemplateId ? "strong" : "muted"}
            padding="md"
            className="text-left"
            onClick={() => onSelectTemplate(template)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold tracking-[-0.02em]">{template.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
              </div>
              <Badge variant={executionRiskMeta[template.risk].variant}>
                {executionRiskMeta[template.risk].label}
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
  );
}
