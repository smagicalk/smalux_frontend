import { DesignGridCard } from "@/features/settings/components/design-grid-card";
import { securityDesignItems } from "@/features/settings/model/design-catalog";

export function SecurityDesignCard() {
  return (
    <DesignGridCard
      title="安全设计"
      description="认证、传输、上传、Agent 与审计边界"
      items={securityDesignItems}
    />
  );
}
