import { Play, TerminalSquare } from "lucide-react";

import { useTaskTemplates } from "@/features/tasks/hooks/use-tasks";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/layout";
import type { TaskTemplate } from "@/shared/api/methods";

import { RISK_VARIANT } from "../lib/task-meta";

/** The "模板" tab: a grid of reusable command templates, each runnable as-is. */
export function Templates({ onUse }: { onUse: (t: TaskTemplate) => void }) {
  const { data, isLoading } = useTaskTemplates();
  if (isLoading) return <EmptyState text="加载模板…" />;
  const templates = data?.templates ?? [];
  if (!templates.length) return <EmptyState text="还没有模板。" icon={<TerminalSquare className="size-8" />} />;

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {templates.map((t) => <TemplateCard key={t.id} template={t} onUse={() => onUse(t)} />)}
    </div>
  );
}

function TemplateCard({ template, onUse }: { template: TaskTemplate; onUse: () => void }) {
  const edgeColor = template.risk === "high" ? "var(--danger)" : template.risk === "medium" ? "var(--warning)" : "var(--success)";
  return (
    <div className="glass cornered group relative overflow-hidden rounded-md border border-border p-3 pl-4 transition-colors hover:border-primary/40">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: edgeColor, boxShadow: `0 0 10px ${edgeColor}` }} />
      <div className="flex items-center gap-2">
        <span className="font-medium group-hover:text-primary">{template.name}</span>
        <Badge variant={RISK_VARIANT[template.risk]}>{template.risk}</Badge>
        {template.requiresApproval ? <Badge variant="warning">需审批</Badge> : null}
        <span className="ml-auto text-xs text-muted-foreground">{template.scope}</span>
      </div>
      <code className="mt-2 block truncate rounded bg-muted px-1.5 py-1 font-mono text-xs" title={template.command}>
        {template.command}
      </code>
      <div className="mt-2 flex justify-end">
        <Button size="sm" variant="outline" onClick={onUse}>
          <Play className="size-3.5" />使用模板
        </Button>
      </div>
    </div>
  );
}
