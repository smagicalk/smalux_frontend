import { useState } from "react";
import {
  Terminal,
  Clock,
  ScrollText,
  Play,
  Plus,
  Zap,
  Copy,
  ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { PageHeader } from "@/shared/ui/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toaster";

interface CronJob {
  id: string;
  name: string;
  expression: string;
  command: string;
  targets: string;
  enabled: boolean;
  lastRunStatus: "success" | "failed" | "running";
  lastRunAt: string;
  nextRunIn: string;
}

interface ExecutionRecord {
  id: string;
  taskId: string;
  command: string;
  targets: string;
  status: "success" | "failed" | "running";
  exitCode: number;
  duration: string;
  triggeredBy: string;
  createdAt: string;
  output?: string;
}

export function AutomationPage() {
  const [activeTab, setActiveTab] = useState<"dispatch" | "cron" | "logs">("dispatch");
  const [commandText, setCommandText] = useState("df -h && free -m");
  const [selectedTarget, setSelectedTarget] = useState<string>("all");
  const [activeLog, setActiveLog] = useState<ExecutionRecord | null>(null);
  const [cronDialogOpen, setCronDialogOpen] = useState(false);

  // New Cron Form
  const [newCron, setNewCron] = useState({
    name: "",
    expression: "0 2 * * *",
    command: "",
    targets: "全网全部 12 台主机"
  });

  // Script templates
  const templates = [
    { title: "清理 Docker 无用容器与镜像", cmd: "docker system prune -af --volumes" },
    { title: "重载 Nginx 配置文件 (平滑)", cmd: "nginx -t && systemctl reload nginx" },
    { title: "查询系统资源与磁盘占用", cmd: "df -hT && echo '---' && free -h && uptime" },
    { title: "检查关键服务状态 (Systemd)", cmd: "systemctl status smalux-agent docker --no-pager" },
    { title: "APT / YUM 基础系统安全补丁更新", cmd: "apt-get update && apt-get --only-upgrade install -y libssl3" }
  ];

  // Cron jobs
  const [cronJobs, setCronJobs] = useState<CronJob[]>([
    {
      id: "cron-1",
      name: "每天凌晨自动清理系统临时日志",
      expression: "0 3 * * *",
      command: "journalctl --vacuum-time=3d",
      targets: "全网全部 12 台主机",
      enabled: true,
      lastRunStatus: "success",
      lastRunAt: "今天 03:00",
      nextRunIn: "5 小时 14 分钟后"
    },
    {
      id: "cron-2",
      name: "每小时同步与校验 NTP 时间服务器",
      expression: "0 * * * *",
      command: "chronyc -a makestep",
      targets: "全网全部 12 台主机",
      enabled: true,
      lastRunStatus: "success",
      lastRunAt: "21:00",
      nextRunIn: "45 分钟后"
    },
    {
      id: "cron-3",
      name: "生产数据库快照本地冷备份",
      expression: "0 1 * * *",
      command: "/opt/scripts/backup-db.sh",
      targets: "hk-prod-gateway-01",
      enabled: true,
      lastRunStatus: "success",
      lastRunAt: "昨天 01:00",
      nextRunIn: "3 小时 14 分钟后"
    },
    {
      id: "cron-4",
      name: "每周 SSL 证书自动续签检测",
      expression: "0 0 * * 0",
      command: "certbot renew --quiet",
      targets: "hk-prod-gateway-01",
      enabled: false,
      lastRunStatus: "success",
      lastRunAt: "上周日 00:00",
      nextRunIn: "已停用"
    }
  ]);

  // Execution History
  const [executions, setExecutions] = useState<ExecutionRecord[]>([
    {
      id: "exec-901",
      taskId: "TASK-4029",
      command: "df -hT && free -m",
      targets: "12 台主机",
      status: "success",
      exitCode: 0,
      duration: "1.24s",
      triggeredBy: "admin",
      createdAt: "3 分钟前",
      output: `[hk-prod-gateway-01] Filesystem     Type   Size  Used Avail Use% Mounted on\n[hk-prod-gateway-01] /dev/vda1      ext4    50G   21G   27G  44% /\n[hk-prod-gateway-01]               total        used        free      shared  buff/cache   available\n[hk-prod-gateway-01] Mem:           7820        4210        1240         120        2370        3490\n\n[sg-app-worker-01] Filesystem     Type   Size  Used Avail Use% Mounted on\n[sg-app-worker-01] /dev/vda1      ext4    80G   48G   29G  63% /\n\n>> 全部节点执行完毕，Exit code: 0`
    },
    {
      id: "exec-902",
      taskId: "TASK-4028",
      command: "nginx -t && systemctl reload nginx",
      targets: "hk-prod-gateway-01",
      status: "success",
      exitCode: 0,
      duration: "0.85s",
      triggeredBy: "admin",
      createdAt: "28 分钟前",
      output: `nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n>> Reloading nginx.service: SUCCESS\n>> Exit code: 0`
    },
    {
      id: "exec-903",
      taskId: "TASK-4027",
      command: "docker system prune -f",
      targets: "sg-app-worker-02",
      status: "success",
      exitCode: 0,
      duration: "4.12s",
      triggeredBy: "cron-job",
      createdAt: "2 小时前",
      output: `Deleted Containers:\n3a4b9c1d2e\nTotal reclaimed space: 1.48GB\n>> Exit code: 0`
    }
  ]);

  const handleDispatch = () => {
    if (!commandText.trim()) {
      toast.error("请输入要下发的命令");
      return;
    }
    toast.success("命令已下发至所选主机，正在实时回显执行状态...");
    const newExec: ExecutionRecord = {
      id: `exec-${Date.now()}`,
      taskId: `TASK-${Math.floor(1000 + Math.random() * 9000)}`,
      command: commandText,
      targets: selectedTarget === "all" ? "全部主机 (12台)" : "指定节点",
      status: "success",
      exitCode: 0,
      duration: "0.92s",
      triggeredBy: "admin",
      createdAt: "刚刚",
      output: `>> 执行命令: ${commandText}\n>> 目标: ${selectedTarget === "all" ? "12 台主机" : "指定节点"}\n>> [Node-01] 执行成功 (Exit Code 0)\n>> [Node-02] 执行成功 (Exit Code 0)\n>> 操作完成。`
    };
    setExecutions([newExec, ...executions]);
    setActiveLog(newExec);
  };

  const toggleCron = (id: string) => {
    setCronJobs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
    toast.success("计划任务状态已更新");
  };

  const handleCreateCron = () => {
    if (!newCron.name || !newCron.command) {
      toast.error("请填写计划任务名称与执行命令");
      return;
    }
    const job: CronJob = {
      id: `cron-${Date.now()}`,
      name: newCron.name,
      expression: newCron.expression,
      command: newCron.command,
      targets: newCron.targets,
      enabled: true,
      lastRunStatus: "success",
      lastRunAt: "从未运行",
      nextRunIn: "计算中..."
    };
    setCronJobs([job, ...cronJobs]);
    setCronDialogOpen(false);
    toast.success("计划任务创建成功");
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="自动化运维"
        subtitle="远程批量命令执行、脚本模板与定时任务"
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setActiveTab("dispatch")}>
              <Play className="size-3.5 mr-1" /> 快速下发
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <button
            onClick={() => setActiveTab("dispatch")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "dispatch"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Terminal className="size-3.5" />
            远程命令与模板
          </button>
          <button
            onClick={() => setActiveTab("cron")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "cron"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Clock className="size-3.5" />
            计划任务 (Cron)
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ScrollText className="size-3.5" />
            执行审计日志 ({executions.length})
          </button>
        </div>

        {/* Tab 1: Dispatch & Templates */}
        {activeTab === "dispatch" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Command Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="size-4 text-primary" />
                  即时下发运维命令
                </CardTitle>
                <CardDescription>
                  通过安全加密通道向一台或多台主机下发 Shell 脚本指令并实时采集输出
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">目标主机范围</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "all", label: "全网全部主机 (12 台)" },
                      { id: "hk", label: "香港机房 (CN-HK)" },
                      { id: "sg", label: "新加坡集群 (AP-SG)" },
                      { id: "prod", label: "生产环境标签 [env=prod]" }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTarget(t.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                          selectedTarget === t.id
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">Bash 脚本指令</label>
                    <span className="text-[11px] text-muted-foreground font-mono">超时限制: 60s</span>
                  </div>
                  <div className="relative rounded-lg border border-border/80 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 shadow-inner">
                    <div className="text-emerald-400 mb-1 select-none font-bold">#!/usr/bin/env bash</div>
                    <textarea
                      rows={5}
                      value={commandText}
                      onChange={(e) => setCommandText(e.target.value)}
                      placeholder="在此输入 Shell 脚本指令..."
                      className="w-full resize-none bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>执行身份: root (sudo)</span>
                  </div>
                  <Button onClick={handleDispatch} className="gap-1.5">
                    <Play className="size-3.5" /> 立即下发执行
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Template Library */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" />
                  高频常用脚本模板
                </CardTitle>
                <CardDescription>点击快速载入并执行</CardDescription>
              </CardHeader>

              <CardContent className="space-y-2.5">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCommandText(tpl.cmd);
                      toast.info(`已载入模板: ${tpl.title}`);
                    }}
                    className="w-full rounded-lg border border-border/80 bg-muted/20 p-3 text-left hover:bg-muted/60 hover:border-primary/40 transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tpl.title}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground truncate">
                      {tpl.cmd}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Cron Jobs */}
        {activeTab === "cron" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">计划任务列表</CardTitle>
                <CardDescription>基于分布式 Agent 调度的周期性运维任务</CardDescription>
              </div>
              <Button size="sm" onClick={() => setCronDialogOpen(true)}>
                <Plus className="size-3.5 mr-1" /> 新建计划任务
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {cronJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{job.name}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border border-border/60">
                          {job.expression}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        指令: {job.command} · 目标: {job.targets}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono">
                      <div>
                        <div className="text-[10px] text-muted-foreground/80 uppercase">下次触发</div>
                        <div className="font-bold text-foreground">{job.nextRunIn}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={job.enabled}
                          onCheckedChange={() => toggleCron(job.id)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          onClick={() => toast.success(`已手动触发运行: ${job.name}`)}
                        >
                          立即运行
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Execution Logs */}
        {activeTab === "logs" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">历史执行记录与审计</CardTitle>
              <CardDescription>包含即时下发命令与计划任务调度的完整审计回显</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {executions.map((exec) => (
                  <div
                    key={exec.id}
                    onClick={() => setActiveLog(exec)}
                    className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant={exec.status === "success" ? "success" : "danger"} dot className="shrink-0">
                        {exec.status === "success" ? "成功 (0)" : "失败"}
                      </Badge>
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-semibold text-foreground truncate">
                          {exec.command}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          ID: {exec.taskId} · 目标: {exec.targets} · 耗时: {exec.duration} · 执行者: {exec.triggeredBy}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>{exec.createdAt}</span>
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog: Create Cron Job */}
      <Dialog open={cronDialogOpen} onOpenChange={setCronDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              新建计划调度任务
            </DialogTitle>
            <DialogDescription>
              按标准 Cron 表达式周期性自动在目标服务器上执行运维脚本
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">任务名称</label>
              <input
                value={newCron.name}
                onChange={(e) => setNewCron({ ...newCron, name: e.target.value })}
                placeholder="例如: 每日凌晨清理临时日志"
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Cron 表达式 (分 时 日 月 周)</label>
              <input
                value={newCron.expression}
                onChange={(e) => setNewCron({ ...newCron, expression: e.target.value })}
                placeholder="0 2 * * *"
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
              <div className="flex gap-2 pt-1 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setNewCron({ ...newCron, expression: "0 * * * *" })}
                  className="hover:text-primary underline cursor-pointer"
                >
                  每小时
                </button>
                <button
                  type="button"
                  onClick={() => setNewCron({ ...newCron, expression: "0 3 * * *" })}
                  className="hover:text-primary underline cursor-pointer"
                >
                  每天凌晨3点
                </button>
                <button
                  type="button"
                  onClick={() => setNewCron({ ...newCron, expression: "0 0 * * 0" })}
                  className="hover:text-primary underline cursor-pointer"
                >
                  每周日
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">执行 Shell 指令</label>
              <textarea
                rows={3}
                value={newCron.command}
                onChange={(e) => setNewCron({ ...newCron, command: e.target.value })}
                placeholder="例如: /opt/scripts/backup.sh"
                className="w-full rounded-lg border border-border/80 bg-muted/40 p-2 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setCronDialogOpen(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleCreateCron}>
                保存任务
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Terminal Output Viewer */}
      {activeLog && (
        <Dialog open={!!activeLog} onOpenChange={(open) => !open && setActiveLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-mono">
                <Terminal className="size-4 text-emerald-500" />
                {activeLog.taskId} 执行输出回显
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                命令: {activeLog.command} · 耗时 {activeLog.duration}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="rounded-lg border border-border/80 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-200 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                {activeLog.output || "无标准输出"}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveLog(null)}>
                  关闭
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(activeLog.output || "");
                    toast.success("日志已复制到剪贴板");
                  }}
                >
                  <Copy className="size-3.5 mr-1" /> 复制回显
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
