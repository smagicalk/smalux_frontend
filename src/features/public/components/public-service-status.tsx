import { CheckCircle2Icon } from "lucide-react";

import type { PingCheck } from "@/features/ping/model/mock-ping";
import { Badge } from "@/shared/ui/badge";

type PublicServiceStatusProps = {
  status: PingCheck["status"];
};

export function PublicServiceStatus({ status }: PublicServiceStatusProps) {
  if (status === "ok") {
    return (
      <Badge variant="success">
        <CheckCircle2Icon className="mr-1 size-3" aria-hidden />
        正常
      </Badge>
    );
  }

  return (
    <Badge variant={status === "degraded" ? "warning" : "danger"}>
      {status === "degraded" ? "降级" : "不可用"}
    </Badge>
  );
}
