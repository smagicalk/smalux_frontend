import { toast } from "sonner";

import type { OperationsSummaryItem } from "@/features/dashboard/model/operations";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type OperationsExceptionCardProps = {
  items: readonly OperationsSummaryItem[];
};

export function OperationsExceptionCard({ items }: OperationsExceptionCardProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>异常队列</CardTitle>
        <CardDescription>优先显示现在就要处理的对象，不把状态线索埋进说明文本里。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <OverviewItem key={item.title} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

type OverviewItemProps = {
  item: OperationsSummaryItem;
};

function OverviewItem({ item }: OverviewItemProps) {
  const Icon = item.icon;

  return (
    <InteractiveCardButton
      tone="muted"
      padding="sm"
      onClick={() =>
        toast.info(item.title, {
          description: item.detail
        })
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-muted-foreground dark:bg-white/8">
            <Icon className="size-4" aria-hidden />
          </div>
          <p className="truncate text-sm font-semibold tracking-[-0.02em]">{item.title}</p>
        </div>
        <Badge variant="outline">{item.badge}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
    </InteractiveCardButton>
  );
}
