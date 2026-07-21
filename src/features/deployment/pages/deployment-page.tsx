import { useState } from "react";
import { CheckCircle2, Loader2, Rocket, XCircle } from "lucide-react";

import { useDeployment, useSwitchDeployment } from "@/features/deployment/hooks/use-deployment";
import { Badge } from "@/shared/ui/badge";
import { PageHeader } from "@/shared/ui/page-header";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { StatTile } from "@/shared/ui/layout";
import { toast } from "@/shared/ui/toaster";
import type { DeploymentMode } from "@/shared/api/methods";

import { DeploymentRow, DeploymentSkeleton } from "../components/deployment-list";
import { ComparisonRadar } from "../components/deployment-charts";
import { RuntimeInjection } from "../components/runtime-injection";
import { MODE_LABEL } from "../lib/deployment-meta";

/**
 * The deployment page. Owns the previewed-mode (`selected`) and the switch
 * confirmation; renders the KPI strip + delivery-mode list + comparison radar
 * + runtime-injection panel. The row, radar, and injection panel each live in
 * their own component.
 */
export function DeploymentPage() {
  const { data, isLoading } = useDeployment();
  const targets = data?.targets ?? [];
  const current = data?.current;
  const [selected, setSelected] = useState<DeploymentMode | null>(null);
  const [confirmMode, setConfirmMode] = useState<DeploymentMode | null>(null);
  const switchMode = useSwitchDeployment();

  const active = selected ?? current ?? targets[0]?.mode ?? null;

  const stats = {
    total: targets.length,
    ready: targets.filter((t) => t.status === "ready").length,
    building: targets.filter((t) => t.status === "building").length,
    failed: targets.filter((t) => t.status === "failed").length
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="部署" subtitle="交付策略 · 运行时注入" />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <DeploymentSkeleton />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="交付模式" value={stats.total} icon={<Rocket className="size-4" />} />
              <StatTile label="就绪" value={stats.ready} accent="success" icon={<CheckCircle2 className="size-4" />} />
              <StatTile label="构建中" value={stats.building} accent="warning" icon={<Loader2 className="size-4 animate-spin" />} />
              <StatTile label="失败" value={stats.failed} accent="danger" icon={<XCircle className="size-4" />} />
            </div>

            <section className="glass cornered relative overflow-hidden rounded-md border border-border">
              <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-semibold">交付模式</span>
                {current ? <Badge variant="primary">当前: {MODE_LABEL[current]}</Badge> : null}
              </div>
              <ul className="divide-y divide-border">
                {targets.map((t) => (
                  <DeploymentRow
                    key={t.id}
                    target={t}
                    active={t.mode === active}
                    isCurrent={t.mode === current}
                    onSelect={() => setSelected(t.mode)}
                    onSwitch={() => setConfirmMode(t.mode)}
                  />
                ))}
              </ul>
            </section>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <section className="glass cornered relative overflow-hidden rounded-md border border-border p-2">
                <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
                <div className="px-1 pb-1 text-xs text-muted-foreground">模式对比</div>
                <ComparisonRadar targets={targets} />
              </section>
              <RuntimeInjection />
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmMode != null}
        onOpenChange={(v) => { if (!v) setConfirmMode(null); }}
        title="切换交付模式"
        description={`确定将当前交付模式切换为「${confirmMode ? MODE_LABEL[confirmMode] : ""}」吗？将触发一次构建。`}
        confirmLabel="切换并构建"
        onConfirm={() => {
          if (!confirmMode) return;
          switchMode.mutate(confirmMode, {
            onSuccess: () => {
              toast.success(`已切换至 ${MODE_LABEL[confirmMode]}，开始构建`);
              setSelected(confirmMode);
            },
            onError: () => toast.error("切换失败")
          });
          setConfirmMode(null);
        }}
      />
    </div>
  );
}
