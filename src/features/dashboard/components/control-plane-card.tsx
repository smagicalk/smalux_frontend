import { toast } from "sonner";

import { controlPlaneActions, type ControlPlaneAction } from "@/features/dashboard/model/operations";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

export function ControlPlaneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>运维控制面</CardTitle>
        <CardDescription>对齐哪吒类后台的常见入口：计划任务、批量执行、Web 终端和审计回放。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {controlPlaneActions.map((action) => (
          <ControlPlaneItem key={action.title} action={action} />
        ))}
      </CardContent>
    </Card>
  );
}

type ControlPlaneItemProps = {
  action: ControlPlaneAction;
};

function ControlPlaneItem({ action }: ControlPlaneItemProps) {
  const Icon = action.icon;

  return (
    <InteractiveCardButton
      tone="muted"
      padding="sm"
      className="flex w-full items-center justify-between gap-3"
      onClick={() =>
        toast.info(action.title, {
          description: action.detail
        })
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-muted-foreground dark:bg-white/8">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[-0.02em]">{action.title}</p>
          <p className="truncate text-xs text-muted-foreground">{action.detail}</p>
        </div>
      </div>
      <Badge variant="outline">{action.badge}</Badge>
    </InteractiveCardButton>
  );
}
