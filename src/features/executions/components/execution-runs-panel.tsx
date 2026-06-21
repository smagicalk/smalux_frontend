import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

import { executionRiskMeta, executionStatusMeta } from "@/features/executions/model/execution-display";
import type { ExecutionRun } from "@/features/executions/model/mock-executions";

type ExecutionRunsPanelProps = {
  runs: readonly ExecutionRun[];
  onInspect: (run: ExecutionRun) => void;
};

export function ExecutionRunsPanel({ runs, onInspect }: ExecutionRunsPanelProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>执行记录</CardTitle>
        <CardDescription>输出只展示预览，真正有价值的是状态、目标、风险和操作人是否形成了可追踪链路。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {runs.map((run) => (
          <InteractiveCardButton
            key={run.id}
            tone="muted"
            padding="md"
            className="text-left"
            onClick={() => onInspect(run)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={executionStatusMeta[run.status].variant}>
                {executionStatusMeta[run.status].label}
              </Badge>
              <Badge variant={executionRiskMeta[run.risk].variant}>
                {executionRiskMeta[run.risk].label}
              </Badge>
              <span className="text-sm text-muted-foreground">{run.operator}</span>
            </div>
            <p className="mt-3 font-semibold tracking-[-0.02em]">{run.target}</p>
            <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{run.command}</p>
            <p className="mt-3 rounded-xl bg-white/70 p-2 font-mono text-xs dark:bg-white/6">{run.outputPreview}</p>
          </InteractiveCardButton>
        ))}
      </CardContent>
    </Card>
  );
}
