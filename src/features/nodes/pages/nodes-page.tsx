import {
  PlusIcon,
  SearchIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AddServerDialog } from "@/features/nodes/components/add-server-dialog";
import { NodeAgentBoundaryCard } from "@/features/nodes/components/node-agent-boundary-card";
import { NodeFiltersPanel } from "@/features/nodes/components/node-filters-panel";
import { NodeFleetStatusCard } from "@/features/nodes/components/node-fleet-status-card";
import { NodeGovernanceCard } from "@/features/nodes/components/node-governance-card";
import { NodeOperationsCard } from "@/features/nodes/components/node-operations-card";
import { mockNodes } from "@/features/nodes/model/mock-nodes";
import { NodesList } from "@/features/nodes/components/nodes-list";
import { createNodeFilterOptions, filterNodes } from "@/features/nodes/model/node-filters";
import { createNodeStatusSegments, nodeStatusColor } from "@/features/nodes/model/node-display";
import { createServerCreateSummary } from "@/features/nodes/model/server-create-form";
import type { NodeStatus } from "@/shared/domain/node";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function NodesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NodeStatus | "all">("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const groups = createNodeFilterOptions(mockNodes);
  const filteredNodes = useMemo(
    () => filterNodes(mockNodes, { query, statusFilter, groupFilter }),
    [groupFilter, query, statusFilter]
  );
  const statusSegments = createNodeStatusSegments(
    ["online", "warning", "offline"],
    (status) => filteredNodes.filter((node) => node.status === status).length,
    (status) => nodeStatusColor[status]
  );

  return (
    <>
      <PageHeader
        eyebrow="Fleet Operations"
        title="服务器"
        description="这个页面只专注节点本身：看状态、看分组、做操作。复杂趋势和解释性交给总览或子页。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("节点筛选已聚焦", {
                  description: `${filteredNodes.length}/${mockNodes.length} 台节点匹配当前条件。`
                })
              }
            >
              <SearchIcon data-icon="inline-start" aria-hidden />
              筛选节点
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddServerOpen(true)}
            >
              <PlusIcon data-icon="inline-start" aria-hidden />
              添加服务器
            </Button>
          </>
        }
      />

      <AddServerDialog
        open={isAddServerOpen}
        onOpenChange={setIsAddServerOpen}
        onSubmit={(values) =>
          toast.success("服务器草稿已创建", {
            description: createServerCreateSummary(values)
          })
        }
      />

      <NodeFiltersPanel
        query={query}
        statusFilter={statusFilter}
        groupFilter={groupFilter}
        groups={groups}
        onQueryChange={setQuery}
        onStatusFilterChange={setStatusFilter}
        onGroupFilterChange={setGroupFilter}
        onReset={() => {
          setQuery("");
          setStatusFilter("all");
          setGroupFilter("all");
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <NodesList
          nodes={filteredNodes}
          onInspect={(node) =>
            toast.info(node.name, {
              description: `${node.group} · ${node.region} · ${node.status}`
            })
          }
        />

        <div className="grid gap-3">
          <NodeFleetStatusCard
            statusSegments={statusSegments}
            filteredCount={filteredNodes.length}
            totalCount={mockNodes.length}
          />

          <NodeOperationsCard
            groups={groups}
            onCreateToken={() =>
              toast.success("已创建注册 Token", {
                description: `${groupFilter === "all" ? "全部分组" : groupFilter} · 15 分钟后过期`
              })
            }
            onRotateKeys={() =>
              toast.warning("已加入轮换队列", {
                description: `${filteredNodes.length} 台匹配节点将按区域分批轮换。`
              })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <NodeAgentBoundaryCard />
        <NodeGovernanceCard />
      </div>
    </>
  );
}
