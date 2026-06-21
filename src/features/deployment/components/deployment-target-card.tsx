import { CheckCircle2Icon } from "lucide-react";

import type { DeploymentTarget } from "@/features/deployment/model/mock-deployment";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type DeploymentTargetCardProps = {
  target: DeploymentTarget;
  isSelected: boolean;
  onSelect: (targetId: string) => void;
  onInspect: (target: DeploymentTarget) => void;
};

export function DeploymentTargetCard({
  target,
  isSelected,
  onSelect,
  onInspect
}: DeploymentTargetCardProps) {
  return (
    <Card
      tone={isSelected ? "strong" : target.status === "ready" ? "default" : "muted"}
      className="cursor-pointer transition hover:-translate-y-0.5"
      onClick={() => onSelect(target.id)}
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
            onSelect(target.id);
            onInspect(target);
          }}
        >
          查看方案
        </Button>
      </CardContent>
    </Card>
  );
}
