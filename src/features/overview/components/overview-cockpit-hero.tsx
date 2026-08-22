import { Activity, Cpu, HardDrive, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/shared/ui/badge";

interface OverviewCockpitHeroProps {
  onlineCount: number;
  totalCount: number;
  sla: number;
  healthScore?: number;
  throughput: string;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  activeAlertsCount: number;
}

export function OverviewCockpitHero({
  onlineCount,
  totalCount,
  sla,
  healthScore = 98.4,
  throughput,
  avgCpu,
  avgMemory,
  avgDisk,
  activeAlertsCount
}: OverviewCockpitHeroProps) {
  const onlineRate = Math.round((onlineCount / totalCount) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl p-5 shadow-sm transition-all duration-300">
      {/* Background ambient light */}
      <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 size-60 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Left: Overall Health & Cluster Status */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Radial score card */}
          <div className="relative flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-inner">
            <div className="text-center">
              <span className="text-2xl font-black tracking-tight text-foreground font-mono">
                {healthScore}
              </span>
              <span className="block text-[9px] uppercase tracking-widest font-semibold text-primary">
                HEALTH
              </span>
            </div>
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>集群指挥座舱</span>
                <span className="text-xs font-mono font-normal text-muted-foreground">· Fleet HUD</span>
              </h2>
              <Badge variant="success" dot className="text-[11px] px-2 py-0.5 font-semibold">
                运行稳健
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                SLA <strong className="text-foreground">{sla}%</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                在线节点: <strong className="text-foreground">{onlineCount}/{totalCount}</strong> ({onlineRate}%)
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="size-3 text-amber-500" />
                全网连接: <strong className="text-foreground">1,420 活跃</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-primary" />
                总吞吐: <strong className="text-foreground">{throughput}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Key Cluster Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "全网 CPU",
              val: `${avgCpu}%`,
              icon: Cpu,
              color: "text-indigo-400",
              bgColor: "bg-indigo-500/10 border-indigo-500/20",
              sub: "10 节点均值"
            },
            {
              label: "全网 RAM",
              val: `${avgMemory}%`,
              icon: Activity,
              color: "text-emerald-400",
              bgColor: "bg-emerald-500/10 border-emerald-500/20",
              sub: "水位平稳"
            },
            {
              label: "全网存储",
              val: `${avgDisk}%`,
              icon: HardDrive,
              color: "text-sky-400",
              bgColor: "bg-sky-500/10 border-sky-500/20",
              sub: "冷热归档"
            },
            {
              label: "待办告警",
              val: `${activeAlertsCount} 条`,
              icon: AlertTriangle,
              color: activeAlertsCount > 0 ? "text-amber-400" : "text-emerald-400",
              bgColor: activeAlertsCount > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20",
              sub: activeAlertsCount > 0 ? "需介入处置" : "暂无异常"
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border/70 bg-card/80 p-3 flex flex-col justify-between backdrop-blur-md hover:border-primary/40 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                  <div className={`p-1.5 rounded-lg border ${item.bgColor}`}>
                    <Icon className={`size-3.5 ${item.color}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold tracking-tight text-foreground font-mono">{item.val}</div>
                  <div className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">{item.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
