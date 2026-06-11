import { CheckCircle2Icon } from "lucide-react";

import type { DeploymentTarget } from "@/features/deployment/model/mock-deployment";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type DeploymentTargetsPanelProps = {
  targets: readonly DeploymentTarget[];
  selectedTargetId: string;
  onTargetSelect: (targetId: string) => void;
  onTargetInspect: (target: DeploymentTarget) => void;
};

export function DeploymentTargetsPanel({
  targets,
  selectedTargetId,
  onTargetSelect,
  onTargetInspect
}: DeploymentTargetsPanelProps) {
  const selectedTarget = targets.find((target) => target.id === selectedTargetId) ?? targets[0];

  if (!selectedTarget) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        {targets.map((target) => (
          <Card
            key={target.id}
            tone={target.id === selectedTargetId ? "strong" : target.status === "ready" ? "default" : "muted"}
            className="cursor-pointer transition hover:-translate-y-0.5"
            onClick={() => onTargetSelect(target.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{target.name}</CardTitle>
                  <CardDescription className="mt-1">{target.description}</CardDescription>
                </div>
                <Badge variant={target.status === "ready" ? "success" : "secondary"}>
                  {target.status === "ready" ? "可用" : "规划"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {target.strengths.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-2 text-sm">
                {target.checklist.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2Icon className="size-4 text-success" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button
                variant={target.status === "ready" ? "outline" : "secondary"}
                className="w-full"
                onClick={(event) => {
                  event.stopPropagation();
                  onTargetSelect(target.id);
                  onTargetInspect(target);
                }}
              >
                查看方案
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <SelectedDeploymentSummary target={selectedTarget} />
    </>
  );
}

type SelectedDeploymentSummaryProps = {
  target: DeploymentTarget;
};

function SelectedDeploymentSummary({ target }: SelectedDeploymentSummaryProps) {
  return (
    <Card tone="muted">
      <CardHeader>
        <CardTitle>当前方案：{target.name}</CardTitle>
        <CardDescription>{target.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-wrap gap-2">
          {target.strengths.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
        <div className="grid gap-2 text-sm">
          {target.checklist.map((item) => (
            <div key={item} className="flex min-w-0 items-center gap-2 rounded-xl bg-white/65 p-2 dark:bg-white/6">
              <CheckCircle2Icon className="size-4 shrink-0 text-success" aria-hidden />
              <span className="min-w-0">{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
