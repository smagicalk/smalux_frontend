import { CheckCircle2Icon, ShieldAlertIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";

type ExecutionConfirmationGuardProps = {
  onConfirm: () => void;
};

export function ExecutionConfirmationGuard({ onConfirm }: ExecutionConfirmationGuardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.2rem] border border-danger/25 bg-[color:var(--surface-danger)] p-4 text-sm">
      <div className="flex items-start gap-3">
        <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        <span>执行前必须展示命令、目标、风险等级、操作者和审计编号，避免“盲执行”。</span>
      </div>
      <Button className="w-full sm:w-fit" variant="danger" onClick={onConfirm}>
        <CheckCircle2Icon data-icon="inline-start" aria-hidden />
        进入二次确认
      </Button>
    </div>
  );
}
