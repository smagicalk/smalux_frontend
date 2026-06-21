import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShieldAlertIcon } from "lucide-react";

const terminalBoundaries = [
  "Web 终端只允许 WSS，并校验 Origin 与当前会话权限",
  "会话需要独立审计编号，输入、退出码和窗口标题分开记录",
  "粘贴、文件上传和 sudo 类命令由策略参数控制，默认关闭"
] as const;

export function ExecutionTerminalPanel() {
  return (
    <Card tone="muted">
      <CardHeader>
        <CardTitle>Web 终端安全入口</CardTitle>
        <CardDescription>终端是远程执行的最高风险交互形态，入口必须比普通命令按钮更克制、更可审计。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-[1rem] border border-danger/25 bg-[color:var(--surface-danger)] p-4">
          <Badge variant="danger">受控入口</Badge>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">按会话授权</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            终端不作为默认快捷入口展示，必须先选节点、确认身份、绑定审计编号，再建立 WSS 会话。
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {terminalBoundaries.map((item) => (
            <div key={item} className="flex gap-3 rounded-xl bg-white/65 p-3 text-sm dark:bg-white/6">
              <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
