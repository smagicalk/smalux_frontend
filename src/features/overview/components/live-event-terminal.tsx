import { Terminal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import type { LiveEventItem } from "../types";

interface LiveEventTerminalProps {
  events: LiveEventItem[];
}

export function LiveEventTerminal({ events }: LiveEventTerminalProps) {
  return (
    <Card className="h-[430px] flex flex-col justify-between shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/15 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="size-4 text-emerald-500" />
            <span>控制台实时事件广播流 (Live Stream)</span>
          </CardTitle>
          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded-full border border-border/60">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            实时流在线
          </span>
        </div>
        <CardDescription>各节点遥测心跳、计划任务调度与管理员审计日志</CardDescription>
      </CardHeader>

      <CardContent className="p-3 font-mono text-xs space-y-1.5 flex-1 overflow-y-auto min-h-0">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between hover:bg-muted/30 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-border/50"
          >
            <div className="flex items-center gap-2.5 truncate pr-2">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/80 border border-border/70 shrink-0 ${e.color}`}
              >
                [{e.tag}]
              </span>
              <span className="text-foreground truncate text-xs">{e.text}</span>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0 font-sans">{e.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
