import { DeploymentTargetCard } from "@/features/deployment/components/deployment-target-card";
import { SelectedDeploymentSummary } from "@/features/deployment/components/selected-deployment-summary";
import type { DeploymentTarget } from "@/features/deployment/model/mock-deployment";

type DeploymentTargetsPanelProps = {
  targets: readonly DeploymentTarget[];
  selectedTargetId: string;
  onTargetSelect: (targetId: string) => void;
  onTargetInspect: (target: DeploymentTarget) => void;
};

export function DeploymentTargetsPanel({
  targets,
  selectedTargetId,
  onTargetSelect,
  onTargetInspect
}: DeploymentTargetsPanelProps) {
  const selectedTarget = targets.find((target) => target.id === selectedTargetId) ?? targets[0];

  if (!selectedTarget) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        {targets.map((target) => (
          <DeploymentTargetCard
            key={target.id}
            target={target}
            isSelected={target.id === selectedTargetId}
            onSelect={onTargetSelect}
            onInspect={onTargetInspect}
          />
        ))}
      </div>

      <SelectedDeploymentSummary target={selectedTarget} />
    </>
  );
}
