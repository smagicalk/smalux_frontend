import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { useServers } from "@/features/servers/hooks/use-servers";
import { useMonitoring } from "@/features/servers/hooks/use-monitoring";
import { PageHeader } from "@/shared/ui/page-header";

import { ServerDetailBody } from "../components/server-detail-body";

/**
 * Server detail: loads the server by route id, subscribes to its live stream,
 * and hands off to the detail body. The page itself only owns the not-found
 * fallback + the header; everything visual lives in ServerDetailBody and below.
 */
export function ServerDetailPage() {
  const { id } = useParams({ from: "/admin/servers/$id" });
  const { data } = useServers();
  const server = data?.servers.find((s) => s.id === id);

  // Subscribe to this single server's live stream.
  useMonitoring([id]);

  if (data && !server) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="服务器未找到" />
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <Link to="/admin/servers" className="text-primary hover:underline">
            返回服务器列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={server?.name ?? "服务器"}
        subtitle={server?.region}
        action={
          <Link
            to="/admin/servers"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> 返回
          </Link>
        }
      />
      {server ? <ServerDetailBody server={server} /> : null}
    </div>
  );
}
