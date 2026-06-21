import { CheckCircle2Icon } from "lucide-react";

import type { DeploymentTarget } from "@/features/deployment/model/mock-deployment";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type SelectedDeploymentSummaryProps = {
  target: DeploymentTarget;
};

export function SelectedDeploymentSummary({ target }: SelectedDeploymentSummaryProps) {
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
