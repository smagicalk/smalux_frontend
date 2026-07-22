import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { cn } from "@/shared/lib/utils";

import { TASK_TABS, type TaskTab, type DispatchPreset } from "../lib/task-meta";
import { ApprovalQueue } from "../components/approval-queue";
import { DispatchDialog } from "../components/dispatch-dialog";
import { DispatchLauncher } from "../components/dispatch-launcher";
import { TaskLog } from "../components/task-log";
import { TaskSummaryStrip } from "../components/task-summary-strip";
import { Templates } from "../components/templates";

/**
 * Remote execution console. Four concerns kept in their own lanes:
 * dispatch (compose a command), templates (reusable commands), the approval
 * queue (high-risk commands gated on a human), and the live task log.
 *
 * This page only orchestrates the tabs + the shared dispatch dialog; each
 * tab's body lives in its own component under components/.
 */
export function TasksPage() {
  const [tab, setTab] = useState<TaskTab>("queue");
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [preset, setPreset] = useState<DispatchPreset | null>(null);

  const openDispatch = (p?: DispatchPreset) => {
    setPreset(p ?? null);
    setDispatchOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="远程执行"
        tone="violet"
        subtitle="命令下发 · 模板 · 审批"
        action={
          <Button size="sm" onClick={() => openDispatch()}>
            <Plus className="size-3.5" />新建任务
          </Button>
        }
      />

      {dispatchOpen ? (
        <DispatchDialog open onOpenChange={setDispatchOpen} preset={preset} />
      ) : null}

      <TaskSummaryStrip />

      <div className="flex items-center gap-1 border-b border-border px-3">
        {TASK_TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "relative h-9 border-b-2 px-3 text-sm transition-colors",
              tab === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {tab === key ? <span className="absolute inset-x-2 -bottom-px h-px" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} /> : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "queue" ? <ApprovalQueue onJumpToLog={() => setTab("log")} /> : null}
        {tab === "log" ? <TaskLog /> : null}
        {tab === "dispatch" ? <DispatchLauncher onOpen={() => openDispatch()} /> : null}
        {tab === "templates" ? <Templates onUse={(t) => openDispatch({ command: t.command, risk: t.risk, scope: t.scope })} /> : null}
      </div>
    </div>
  );
}
