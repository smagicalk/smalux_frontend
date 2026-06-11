import { DesignGridCard } from "@/features/settings/components/design-grid-card";
import { featureDesignItems } from "@/features/settings/model/design-catalog";

export function FeatureDesignCard() {
  return (
    <DesignGridCard
      title="功能设计"
      description="按职责拆分的后台功能域"
      items={featureDesignItems}
    />
  );
}
