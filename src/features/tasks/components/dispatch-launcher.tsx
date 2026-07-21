import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";

/**
 * The "下发" tab: a mission-control terminal mock that frames what dispatching
 * a task means (low/med run now, high goes to the approval queue) with a ready
 * session indicator, plus the button that opens the dispatch dialog.
 */
export function DispatchLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="scanline cornered relative overflow-hidden rounded-md border border-border bg-[oklch(0.12_0.01_258)]">
        <span className="scanline__beam" />
        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-danger/70" />
            <span className="size-2 rounded-full bg-warning/70" />
            <span className="size-2 rounded-full bg-success/70" />
          </span>
          <span className="font-mono">remote-exec@smalux</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-success" style={{ boxShadow: "0 0 6px var(--success)" }} />
            会话就绪
          </span>
        </div>
        <div className="p-4 font-mono text-xs leading-relaxed text-foreground/90">
          <div className="text-muted-foreground"># 选择目标节点与命令，低/中风险立即执行，高风险进入审批队列。</div>
          <div className="mt-2 text-muted-foreground"># 模板可在「模板」标签页管理，复用常用命令。</div>
          <div className="mt-3 flex items-center gap-2">
            <span style={{ color: "var(--primary)" }}>$</span>
            <span className="inline-block h-4 w-2 animate-pulse bg-primary/80" />
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <Button size="sm" onClick={onOpen}><Plus className="size-3.5" />新建任务</Button>
      </div>
    </div>
  );
}
