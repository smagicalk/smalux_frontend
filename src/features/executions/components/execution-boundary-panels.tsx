import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const batchGuardrails = [
  {
    label: "目标预演",
    value: "4 台匹配",
    description: "批量执行先按分组、标签和在线状态生成预演清单。"
  },
  {
    label: "并发上限",
    value: "2 / 组",
    description: "跨区域下发按分组限流，失败率升高时自动停止后续批次。"
  },
  {
    label: "回滚入口",
    value: "模板绑定",
    description: "高风险模板必须绑定回滚模板或人工处理说明。"
  }
] as const;

const approvalItems = [
  ["高风险写操作", "2 条待审批", "Admin + Owner"],
  ["批量目标超过阈值", "1 条待复核", "双人确认"],
  ["终端提权会话", "0 条", "即时审计"]
] as const;

export function ExecutionBoundaryPanels() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>批量动作边界</CardTitle>
          <CardDescription>批量不是把单机命令循环发送，而是目标预演、并发、失败熔断和回滚策略的组合。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {batchGuardrails.map((item) => (
            <div
              key={item.label}
              className="rounded-[1rem] border border-white/45 bg-[color:var(--surface-muted)] p-3 dark:border-white/8 dark:bg-white/6"
            >
              <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card tone="muted">
        <CardHeader>
          <CardTitle>审批队列</CardTitle>
          <CardDescription>高风险执行必须在下发前暴露审批状态。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {approvalItems.map(([name, count, policy]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/60 p-3 dark:bg-white/6"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{policy}</p>
              </div>
              <Badge variant={count === "0 条" ? "secondary" : "warning"}>{count}</Badge>
            </div>
          ))}
          <div className="rounded-xl border border-warning/25 bg-[color:var(--surface-warning)] p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">下发状态</span>
              <Badge variant="warning">部分冻结</Badge>
            </div>
            <p className="mt-2 leading-6 text-muted-foreground">
              待审批项清空前，高风险模板和批量目标超过阈值的任务不能进入执行队列。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
