import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PingBoundaryPanels } from "@/features/ping/components/ping-boundary-panels";
import { PingChartsPanel } from "@/features/ping/components/ping-charts-panel";
import { PingFiltersPanel } from "@/features/ping/components/ping-filters-panel";
import { PingSecurityRulesPanel } from "@/features/ping/components/ping-security-rules-panel";
import { PingSummaryCard } from "@/features/ping/components/ping-summary-card";
import { PingTargetsPanel } from "@/features/ping/components/ping-targets-panel";
import { filterPingChecks } from "@/features/ping/model/ping-filters";
import { createPingSummary, mockPingChecks, type PingStatus } from "@/features/ping/model/mock-ping";
import type { PingProtocol } from "@/features/ping/model/mock-ping";
import { formatLatency } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function PingPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PingStatus | "all">("all");
  const [protocolFilter, setProtocolFilter] = useState<PingProtocol | "all">("all");
  const filteredChecks = useMemo(
    () => filterPingChecks(mockPingChecks, { query, statusFilter, protocolFilter }),
    [protocolFilter, query, statusFilter]
  );
  const summary = createPingSummary(filteredChecks);

  return (
    <>
      <PageHeader
        eyebrow="Link Health"
        title="Ping 监测"
        description="优先找出异常目标和退化原因，再用趋势图解释链路质量。目标列表必须比摘要卡更抢眼。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("已刷新探测", {
                  description: `${filteredChecks.length} 个目标进入 mock 探测队列。`
                })
              }
            >
              <RefreshCwIcon data-icon="inline-start" aria-hidden />
              刷新探测
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info("已打开新建监测草稿", {
                  description: "默认启用服务端地址校验和私网目标拒绝。"
                })
              }
            >
              <PlusIcon data-icon="inline-start" aria-hidden />
              新建监测
            </Button>
          </>
        }
      />

      <PingFiltersPanel
        query={query}
        statusFilter={statusFilter}
        protocolFilter={protocolFilter}
        onQueryChange={setQuery}
        onStatusFilterChange={setStatusFilter}
        onProtocolFilterChange={setProtocolFilter}
        onReset={() => {
          setQuery("");
          setStatusFilter("all");
          setProtocolFilter("all");
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <PingTargetsPanel
          checks={filteredChecks}
          onInspect={(check) =>
            toast.info(check.name, {
              description: `${check.protocol} · ${check.region} · ${check.target} · ${formatLatency(check.latencyMs)}`
            })
          }
        />
        <PingSummaryCard summary={summary} />
      </div>

      <PingBoundaryPanels />
      <PingChartsPanel />
      <PingSecurityRulesPanel
        onInspect={(rule) =>
          toast.info("探测边界", {
            description: rule
          })
        }
      />
    </>
  );
}
