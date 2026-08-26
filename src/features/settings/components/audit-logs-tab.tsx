import { useState, useMemo } from "react";
import {
  ScrollText,
  Search,
  RotateCw,
  Download,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Activity,
  User,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  FileCode
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toaster";
import { useLogs } from "../hooks/use-logs";
import type { Log } from "@/shared/api/methods";

export function AuditLogsTab() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState<"all" | "success" | "failure">("all");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const queryFilters = useMemo(() => ({
    search: search.trim() ? search : undefined,
    module: moduleFilter !== "all" ? moduleFilter : undefined,
    result: resultFilter !== "all" ? resultFilter : undefined
  }), [search, moduleFilter, resultFilter]);

  const { data, isLoading, refetch } = useLogs(queryFilters);
  const logs: Log[] = data?.logs || [];

  const successCount = logs.filter((l) => l.result === "success").length;
  const failureCount = logs.filter((l) => l.result !== "success").length;

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smalux_audit_logs_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${logs.length} 条审计日志为 JSON 文件`);
  };

  const formatTs = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  const formatFullDate = (ts: number) => {
    return new Date(ts).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <ScrollText className="size-3.5 text-primary" />
            记录事件总数
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{logs.length}</div>
          <div className="text-[11px] text-muted-foreground">符合当前过滤条件的操作事件</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            正常执行成功
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{successCount}</div>
          <div className="text-[11px] text-muted-foreground">鉴权通过与正常运维变更</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <ShieldAlert className="size-3.5 text-rose-500" />
            异常拦截 / 告警触发
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{failureCount}</div>
          <div className="text-[11px] text-muted-foreground">鉴权失败或异常拦截事件</div>
        </div>
      </div>

      {/* 主审计日志面板 */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="size-4 text-primary" />
                全站操作审计与安全日志
              </CardTitle>
              <CardDescription>真实追踪所有管理员、API Token 及 Agent 触发的敏感指令与鉴权行为</CardDescription>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button size="sm" variant="outline" onClick={handleExportLogs} className="h-8 px-2.5 text-xs cursor-pointer">
                <Download className="size-3.5 mr-1" /> 导出 JSON
              </Button>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8 px-2.5 cursor-pointer">
                <RotateCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
              </Button>
            </div>
          </div>

          {/* 筛选与搜索工具栏 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 mt-2 border-t border-border/40">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索操作者、动作指令、目标主机、IP地址..."
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/80 bg-muted/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                aria-label="筛选模块"
                className="h-8 px-2.5 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
              >
                <option value="all">全部业务模块</option>
                <option value="auth">🔐 认证中心 (auth)</option>
                <option value="node">🖥️ 节点主机 (node)</option>
                <option value="task">⚡ 自动化任务 (task)</option>
                <option value="alert">🚨 告警策略 (alert)</option>
                <option value="token">🔑 访问令牌 (token)</option>
                <option value="config">⚙️ 系统配置 (config)</option>
              </select>

              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value as any)}
                aria-label="筛选状态"
                className="h-8 px-2.5 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
              >
                <option value="all">全部执行结果</option>
                <option value="success">🟢 仅成功 (Success)</option>
                <option value="failure">🔴 仅异常 (Failure)</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                没有找到符合筛选条件的操作审计日志
              </div>
            ) : (
              logs.map((log) => {
                const isSuccess = log.result === "success";
                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/10 transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {isSuccess ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <XCircle className="size-4 text-rose-500" />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground font-mono">{log.action}</span>
                          <Badge variant="neutral" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                            {log.module}
                          </Badge>
                          {log.target && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              目标: <strong className="text-foreground">{log.target}</strong>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-x-2 flex-wrap">
                          <span>操作者: <strong className="text-primary">{log.actor}</strong></span>
                          <span>·</span>
                          <span>IP: {log.ip || "127.0.0.1"}</span>
                          {log.detail && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-xs text-foreground/80">{log.detail}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-muted-foreground shrink-0 self-end sm:self-center">
                      <span title={formatFullDate(log.ts)}>{formatTs(log.ts)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px] cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="size-3 mr-1" />
                        详情
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 弹窗：单条审计日志 JSON 结构化详情 */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="size-4 text-primary" />
              审计日志结构化报文详情
            </DialogTitle>
            <DialogDescription>
              事件 ID: <span className="font-mono text-foreground">{selectedLog?.id}</span> · 时间: {selectedLog && formatFullDate(selectedLog.ts)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border/80 bg-muted/20">
                <div>
                  <span className="text-muted-foreground">操作主体:</span>{" "}
                  <strong className="text-foreground font-mono">{selectedLog.actor}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">业务模块:</span>{" "}
                  <strong className="text-foreground font-mono">{selectedLog.module}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">执行动作:</span>{" "}
                  <strong className="text-foreground font-mono">{selectedLog.action}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">响应状态:</span>{" "}
                  <Badge variant={selectedLog.result === "success" ? "success" : "danger"} className="text-[10px]">
                    {selectedLog.result.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-foreground">结构化 JSON Payload</div>
                <pre className="font-mono text-xs bg-zinc-950 p-3 rounded-lg text-zinc-200 border border-border/60 overflow-x-auto select-all max-h-60">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/60">
                <Button size="sm" onClick={() => setSelectedLog(null)} className="cursor-pointer">
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
