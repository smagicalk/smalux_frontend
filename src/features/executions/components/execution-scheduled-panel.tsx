import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

import type { ScheduledExecution } from "@/features/executions/model/mock-executions";

type ExecutionScheduledPanelProps = {
  jobs: readonly ScheduledExecution[];
  onInspect: (job: ScheduledExecution) => void;
};

export function ExecutionScheduledPanel({ jobs, onInspect }: ExecutionScheduledPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>定时执行</CardTitle>
        <CardDescription>巡检、清理和健康检查需要被当作“长期运维策略”管理，而不是普通列表项。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {jobs.map((job) => (
          <InteractiveCardButton
            key={job.id}
            tone="muted"
            padding="md"
            className="text-left"
            onClick={() => onInspect(job)}
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
  );
}
