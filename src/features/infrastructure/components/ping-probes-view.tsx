import { useMemo } from "react";
import {
  Activity,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import type { PingTarget, SlaTimeRange } from "../types";

interface PingProbesViewProps {
  probes: PingTarget[];
  total: number;
  totalPages: number;
  allProbes: PingTarget[];
  page: number;
  pageSize: number;
  searchQuery: string;
  protocolFilter: "all" | "HTTP" | "HTTPS" | "TCP" | "ICMP";
  statusFilter: "all" | "up" | "degraded" | "down";
  slaRange: SlaTimeRange;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onProtocolChange: (proto: "all" | "HTTP" | "HTTPS" | "TCP" | "ICMP") => void;
  onStatusChange: (status: "all" | "up" | "degraded" | "down") => void;
  onSlaRangeChange: (range: SlaTimeRange) => void;
  onOpenCreateProbe: () => void;
}

const SLA_RANGE_OPTIONS: Array<{ id: SlaTimeRange; label: string; short: string }> = [
  { id: "24h", label: "最近 24 小时", short: "24h" },
  { id: "7d", label: "最近 7 天", short: "7d" },
  { id: "30d", label: "最近 30 天", short: "30d" },
  { id: "90d", label: "最近 90 天", short: "90d" },
  { id: "1y", label: "最近 1 年", short: "1y" }
];

export function PingProbesView({
  probes,
  total,
  totalPages,
  allProbes,
  page,
  pageSize,
  searchQuery,
  protocolFilter,
  statusFilter,
  slaRange,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onProtocolChange,
  onStatusChange,
  onSlaRangeChange,
  onOpenCreateProbe
}: PingProbesViewProps) {
  // Global HUD Summary stats across all targets
  const upCount = allProbes.filter((p) => p.status === "up").length;
  const avgLatency = allProbes.length
    ? Math.round(allProbes.reduce((a, b) => a + b.latencyMs, 0) / allProbes.length)
    : 0;

  const currentAvgSla = useMemo(() => {
    if (!allProbes.length) return "100.00";
    const sum = allProbes.reduce((acc, p) => {
      const val = p.uptimeSla ? p.uptimeSla[slaRange] : p.uptime24h;
      return acc + (val ?? 100);
    }, 0);
    return (sum / allProbes.length).toFixed(2);
  }, [allProbes, slaRange]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 space-y-3">
        {/* Header Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <CardTitle className="text-base">服务探针与 SLA 拨测 (Service Probes & SLA)</CardTitle>
              <Badge variant="neutral" className="text-[11px] font-mono px-2 py-0.5">
                {allProbes.length} 拨测目标
              </Badge>
            </div>
            <CardDescription>
              全球边缘探针主动探测，涵盖 HTTP 状态码、TCP 端口连通性、ICMP 丢包与 SSL 证书生命周期
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={onOpenCreateProbe}
            className="cursor-pointer self-start sm:self-auto font-medium"
          >
            <Plus className="size-3.5 mr-1.5" /> 新建拨测探针
          </Button>
        </div>

        {/* HUD Quick Stats with Dynamic Period SLA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground font-mono">健康探针数</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {upCount} / {allProbes.length}
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground font-mono">平均网络延迟</span>
            <div className="text-base font-bold font-mono text-primary mt-0.5">
              {avgLatency} ms
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-mono">
                全网综合可用率 ({slaRange})
              </span>
            </div>
            <div className="text-base font-bold font-mono text-indigo-400 mt-0.5">
              {currentAvgSla}%
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground font-mono">SSL 证书预警 (HTTPS/TLS)</span>
            <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
              {allProbes.filter((p) => (p.protocol === "HTTPS" || p.protocol === "WSS") && p.sslDaysLeft != null && p.sslDaysLeft < 30).length > 0
                ? `${allProbes.filter((p) => (p.protocol === "HTTPS" || p.protocol === "WSS") && p.sslDaysLeft != null && p.sslDaysLeft < 30).length} 个即将到期`
                : "全部正常有效"}
            </div>
          </div>
        </div>

        {/* Toolbar with SLA Range Dropdown & Server-side Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            {/* Search */}
            <div className="relative w-52 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="搜索探针名称 / 目标地址..."
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 pl-8 pr-3 text-xs outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Protocol Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs">
              {(["all", "HTTP", "HTTPS", "TCP", "ICMP"] as const).map((proto) => (
                <button
                  key={proto}
                  type="button"
                  onClick={() => onProtocolChange(proto)}
                  className={`rounded-md px-2 py-1 font-medium transition-colors cursor-pointer ${
                    protocolFilter === proto
                      ? "bg-card text-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {proto === "all" ? "全部协议" : proto}
                </button>
              ))}
            </div>
          </div>

          {/* Right Toolbar: SLA Time Range Selector & Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* SLA Time Range Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-xs">
              <Clock className="size-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground font-medium">SLA 时段:</span>
              <select
                value={slaRange}
                onChange={(e) => onSlaRangeChange(e.target.value as SlaTimeRange)}
                className="bg-transparent text-xs text-foreground font-semibold outline-none cursor-pointer pr-1"
              >
                {SLA_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-popover text-foreground">
                    {opt.label} ({opt.short})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs shrink-0">
              {[
                { id: "all" as const, label: "全部" },
                { id: "up" as const, label: "🟢 正常" },
                { id: "degraded" as const, label: "🟡 劣化" },
                { id: "down" as const, label: "🔴 异常" }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onStatusChange(st.id)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                    statusFilter === st.id
                      ? "bg-card text-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {probes.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground font-mono">
            未找到匹配的服务拨测探针
          </div>
        ) : (
          <div className="rounded-xl border border-border/70 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/40 border-b border-border/70 text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">探针名称 / ID</th>
                  <th className="p-3 font-semibold">协议类型</th>
                  <th className="p-3 font-semibold">探测目标地址 (Endpoint)</th>
                  <th className="p-3 font-semibold">运行状态</th>
                  <th className="p-3 font-semibold text-right">实时延迟</th>
                  <th className="p-3 font-semibold text-right">
                    可用率 SLA ({SLA_RANGE_OPTIONS.find((o) => o.id === slaRange)?.short})
                  </th>
                  <th className="p-3 font-semibold text-right">SSL 证书有效期 (HTTPS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card/30">
                {probes.map((probe) => {
                  const isUp = probe.status === "up";
                  const isDeg = probe.status === "degraded";
                  const isTls = probe.protocol === "HTTPS" || probe.protocol === "WSS";
                  const currentSlaValue = probe.uptimeSla ? probe.uptimeSla[slaRange] : probe.uptime24h;

                  return (
                    <tr key={probe.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{probe.name}</div>
                        <div className="text-[10px] text-muted-foreground">{probe.id}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            probe.protocol === "HTTPS"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : probe.protocol === "WSS"
                              ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                              : probe.protocol === "HTTP"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              : probe.protocol === "TCP"
                              ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {probe.protocol}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">{probe.target}</td>
                      <td className="p-3">
                        <Badge
                          variant={isUp ? "success" : isDeg ? "warning" : "danger"}
                          dot
                          className="text-[9px] px-1.5 py-0 h-4"
                        >
                          {isUp ? "正常响应" : isDeg ? "延迟劣化" : "拨测失败"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {probe.latencyMs == null ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">等待检测</span>
                        ) : (
                          <span
                            className={`font-bold ${
                              probe.latencyMs > 200
                                ? "text-amber-400"
                                : probe.latencyMs > 500
                                ? "text-rose-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {probe.latencyMs} ms
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-col items-end">
                          {currentSlaValue == null ? (
                            <span className="text-muted-foreground/60 text-[11px] font-sans">等待检测</span>
                          ) : (
                            <span
                              className={`font-bold ${
                                currentSlaValue < 99
                                  ? "text-amber-400"
                                  : currentSlaValue < 95
                                  ? "text-rose-400"
                                  : "text-foreground"
                              }`}
                            >
                              {currentSlaValue.toFixed(2)}%
                            </span>
                          )}
                          {/* Mini Uptime Timeline Bar (16 blocks) */}
                          <div className="flex items-center gap-0.5 mt-1">
                            {Array.from({ length: 16 }, (_, idx) => {
                              const isDegradedSlot = isDeg && idx >= 14;
                              return (
                                <span
                                  key={idx}
                                  className={`size-1 rounded-xs ${
                                    isDegradedSlot
                                      ? "bg-amber-400"
                                      : isUp
                                      ? "bg-emerald-400/80"
                                      : "bg-rose-500"
                                  }`}
                                  title={`${slaRange} 时段采样`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {isTls && probe.sslDaysLeft != null ? (
                          <span
                            className={`flex items-center justify-end gap-1 ${
                              probe.sslDaysLeft < 15
                                ? "text-rose-400 font-bold"
                                : probe.sslDaysLeft < 30
                                ? "text-amber-400 font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {probe.sslDaysLeft < 30 ? (
                              <ShieldAlert className="size-3" />
                            ) : (
                              <ShieldCheck className="size-3 text-emerald-400" />
                            )}
                            {probe.sslDaysLeft} 天
                          </span>
                        ) : (
                          <span className="text-muted-foreground/35 text-[10px]">非 TLS / 不适用</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Compact Pagination Bar */}
        {total > 0 && (
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
              <span>共 <strong>{total}</strong> 个探针</span>
              <span>·</span>
              <span>第 <strong>{page}</strong> / {totalPages} 页</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <span>每页:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-muted/40 border border-border/80 rounded px-1.5 py-0.5 outline-none font-semibold text-foreground cursor-pointer"
                >
                  <option value={5}>5 条</option>
                  <option value={10}>10 条</option>
                  <option value={20}>20 条</option>
                  <option value={50}>50 条</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="h-7.5 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" /> 上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="h-7.5 px-2.5 text-xs gap-1 cursor-pointer"
              >
                下一页 <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
