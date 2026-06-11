import { BoxesIcon, NetworkIcon, ServerCogIcon } from "lucide-react";

import { StatCard } from "@/shared/ui/stat-card";

export function DeploymentOverviewStats() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="静态产物"
        value="dist/"
        description="前端始终收敛为单一构建产物，再由不同部署层接住。"
        icon={BoxesIcon}
        tone="primary"
      />
      <StatCard
        label="运行时配置"
        value="app-config"
        description="通过运行时注入 API、WS、RPC 入口，而不是重新构建前端。"
        icon={ServerCogIcon}
        tone="info"
      />
      <StatCard
        label="缓存策略"
        value="分层"
        description="静态资源可长缓存，但入口文件和运行时配置必须保持短缓存。"
        icon={NetworkIcon}
        tone="success"
      />
    </div>
  );
}
