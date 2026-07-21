import { Badge } from "@/shared/ui/badge";
import { formatRelativeFrom } from "@/shared/lib/utils";
import type { Server } from "@/shared/api/methods";

import { STATUS_META } from "../lib/server-meta";

/** Compact identity/status strip shared by the server detail layout. */
export function ServerIdentityStrip({ server }: { server: Server }) {
  const meta = STATUS_META[server.status];

  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
      <Badge variant={meta.variant}>{meta.label}</Badge>
      {server.tags.map((tag) => (
        <Badge key={tag} variant="outline">
          {tag}
        </Badge>
      ))}
      {server.note ? <span className="text-muted-foreground">· {server.note}</span> : null}
      {server.os ? <span className="text-muted-foreground">{server.os}</span> : null}
      {server.arch ? <span className="text-muted-foreground">{server.arch}</span> : null}
      {server.agentVersion ? (
        <span className="text-muted-foreground">agent {server.agentVersion}</span>
      ) : null}
      <span className="text-muted-foreground">
        ·{" "}
        {server.publicIpEnabled ? (
          server.publicIp ? <>公网 {server.publicIp}</> : <>公网 -</>
        ) : (
          <span className="text-muted-foreground/60">公网 关闭统计</span>
        )}
      </span>
      <span className="ml-auto text-xs text-muted-foreground">
        最后上报 {formatRelativeFrom(server.lastSeenAt)}
      </span>
    </div>
  );
}
