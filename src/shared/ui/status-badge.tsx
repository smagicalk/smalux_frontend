import type { NodeStatus } from "@/shared/domain/node";
import { Badge } from "@/shared/ui/badge";

const statusText: Record<NodeStatus, string> = {
  online: "在线",
  warning: "警告",
  offline: "离线"
};

const statusVariant: Record<NodeStatus, "success" | "warning" | "secondary"> = {
  online: "success",
  warning: "warning",
  offline: "secondary"
};

type StatusBadgeProps = {
  status: NodeStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={statusVariant[status]}>{statusText[status]}</Badge>;
}
