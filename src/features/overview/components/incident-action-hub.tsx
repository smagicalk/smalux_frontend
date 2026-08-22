import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  VolumeX,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
  ShieldAlert,
  Server
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import type { IncidentItem } from "../types";

interface IncidentActionHubProps {
  incidents: IncidentItem[];
}

export function IncidentActionHub({
  incidents: initialIncidents
}: IncidentActionHubProps) {
  const [ackedMap, setAckedMap] = useState<Record<string, boolean>>({});
  const [silencedMap, setSilencedMap] = useState<Record<string, boolean>>({});

  const incidents = useMemo(() => {
    return initialIncidents.map((inc) => ({
      ...inc,
      acknowledged: ackedMap[inc.id] ?? inc.acknowledged,
      silenced: silencedMap[inc.id] ?? inc.silenced
    }));
  }, [initialIncidents, ackedMap, silencedMap]);

  const handleAcknowledge = (id: string, serverName: string) => {
    setAckedMap((prev) => ({ ...prev, [id]: true }));
    toast.success(`已确认知悉 ${serverName} 的告警事件，已同步值班台`);
  };

  const handleToggleSilence = (id: string, currentlySilenced: boolean, serverName: string) => {
    const nextState = !currentlySilenced;
    setSilencedMap((prev) => ({ ...prev, [id]: nextState }));
    if (nextState) {
      toast.info(`已为 ${serverName} 开启 1 小时临时告警静默`);
    } else {
      toast.success(`已解除 ${serverName} 的静默状态`);
    }
  };

  const unackedCount = incidents.filter((i) => !i.acknowledged).length;

  return (
    <Card className="h-[430px] flex flex-col justify-between shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/15 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-500" />
            <span>未决告警与值班事件 (Active Incidents)</span>
            <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4 font-mono">
              {unackedCount} 待跟进
            </Badge>
          </CardTitle>
          <Link
            to="/admin/alerts"
            className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
          >
            告警规则中心 <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <CardDescription>当前触发阈值需值班人员介入的异常事件与机器排查通道</CardDescription>
      </CardHeader>

      <CardContent className="p-3 flex-1 overflow-y-auto space-y-2.5 min-h-0">
        {incidents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground font-mono gap-1.5">
            <CheckCircle2 className="size-6 text-emerald-500/80 mb-1" />
            <span>全网暂无未决异常，所有节点与指标运行平稳</span>
          </div>
        ) : (
          incidents.map((inc) => {
            const isCrit = inc.severity === "critical";
            const targetServerId = inc.serverId || inc.serverName;
            return (
              <div
                key={inc.id}
                className={`rounded-xl border p-3 space-y-2.5 transition-all ${
                  isCrit
                    ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/70"
                    : "border-amber-500/35 bg-amber-500/5 hover:border-amber-500/60"
                } ${inc.silenced ? "opacity-60" : ""}`}
              >
                {/* Header: Severity + Rule Name + Server Name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={isCrit ? "danger" : "warning"}
                        dot
                        className="text-[10px] px-1.5 py-0 h-4 font-semibold"
                      >
                        {isCrit ? "P0 严重" : "P1 警告"}
                      </Badge>
                      <span className="font-semibold text-xs text-foreground truncate">
                        {inc.ruleName}
                      </span>
                      {inc.acknowledged && (
                        <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          ✓ 已知悉
                        </span>
                      )}
                      {inc.silenced && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/70">
                          🔕 已静默 1h
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono flex flex-wrap items-center gap-x-2">
                      <Link
                        to="/admin/infrastructure"
                        search={{ server: targetServerId }}
                        className="text-foreground font-semibold hover:text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Server className="size-3 text-muted-foreground" />
                        {inc.serverName}
                      </Link>
                      <span>·</span>
                      <span>当前: <strong className={isCrit ? "text-rose-400" : "text-amber-400"}>{inc.currentValue}</strong></span>
                      <span>·</span>
                      <span>阈值: {inc.threshold}</span>
                      <span>·</span>
                      <span>持续: {inc.duration}</span>
                    </div>
                  </div>
                </div>

                {/* SRE Operational Actions (Ack, Silence, Jump to Server Details) */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={inc.acknowledged}
                      onClick={() => handleAcknowledge(inc.id, inc.serverName)}
                      className="h-6 px-2 text-[11px] cursor-pointer"
                    >
                      <CheckCircle2 className="size-3 mr-1 text-emerald-500" />
                      {inc.acknowledged ? "已跟进" : "确认知悉"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleSilence(inc.id, !!inc.silenced, inc.serverName)}
                      className="h-6 px-2 text-[11px] cursor-pointer"
                    >
                      <VolumeX className="size-3 mr-1 text-muted-foreground" />
                      {inc.silenced ? "取消静默" : "静默 1h"}
                    </Button>
                  </div>

                  <Link
                    to="/admin/infrastructure"
                    search={{ server: targetServerId }}
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 px-2.5 text-[11px] cursor-pointer hover:border-primary/50"
                    >
                      排查机器详情
                      <ExternalLink className="size-2.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
