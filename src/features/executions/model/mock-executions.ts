export type ExecutionRisk = "low" | "medium" | "high";
export type ExecutionStatus = "success" | "running" | "failed" | "scheduled";

export type CommandTemplate = {
  id: string;
  name: string;
  description: string;
  command: string;
  scope: string;
  risk: ExecutionRisk;
  requiresApproval: boolean;
};

export type ScheduledExecution = {
  id: string;
  name: string;
  target: string;
  cron: string;
  template: string;
  enabled: boolean;
  maxConcurrency: number;
  timeoutSec: number;
  nextRunAt: string;
};

export type ExecutionRun = {
  id: string;
  target: string;
  command: string;
  operator: string;
  status: ExecutionStatus;
  risk: ExecutionRisk;
  startedAt: string;
  durationMs: number;
  outputPreview: string;
};

export const mockCommandTemplates: CommandTemplate[] = [
  {
    id: "tpl-disk",
    name: "磁盘占用巡检",
    description: "查看挂载点、inode 与大文件分布。",
    command: "df -h && df -i && du -sh /var/log/* | sort -h | tail",
    scope: "Operator",
    risk: "low",
    requiresApproval: false
  },
  {
    id: "tpl-nginx",
    name: "Nginx 配置检查",
    description: "检查配置并重新加载服务，适合部署后验证。",
    command: "nginx -t && systemctl reload nginx",
    scope: "Admin",
    risk: "medium",
    requiresApproval: true
  },
  {
    id: "tpl-clean",
    name: "日志清理",
    description: "清理指定目录内超过保留期的日志文件。",
    command: "find /var/log/smalux -type f -mtime +14 -delete",
    scope: "Admin",
    risk: "high",
    requiresApproval: true
  },
  {
    id: "tpl-agent-restart",
    name: "Agent 重启",
    description: "重启 smalux-agent 并检查心跳恢复，用于探针异常处理。",
    command: "systemctl restart smalux-agent && systemctl status smalux-agent --no-pager",
    scope: "Operator",
    risk: "medium",
    requiresApproval: true
  },
  {
    id: "tpl-network",
    name: "网络诊断",
    description: "采集路由、DNS、TCP 握手和基础延迟信息。",
    command: "ip route && resolvectl status && ss -tanp | head -40",
    scope: "Operator",
    risk: "low",
    requiresApproval: false
  },
  {
    id: "tpl-kernel",
    name: "内核参数采集",
    description: "只读采集 sysctl、ulimit 与关键内核指标。",
    command: "sysctl -a | grep -E 'somaxconn|tcp_|file-max' && ulimit -a",
    scope: "Viewer",
    risk: "low",
    requiresApproval: false
  }
];

export const mockScheduledExecutions: ScheduledExecution[] = [
  {
    id: "job-health",
    name: "每日健康巡检",
    target: "Core / Edge",
    cron: "0 2 * * *",
    template: "磁盘占用巡检",
    enabled: true,
    maxConcurrency: 4,
    timeoutSec: 120,
    nextRunAt: "2026-06-10T02:00:00.000Z"
  },
  {
    id: "job-cache",
    name: "缓存节点清理",
    target: "Cache",
    cron: "*/30 * * * *",
    template: "日志清理",
    enabled: false,
    maxConcurrency: 1,
    timeoutSec: 90,
    nextRunAt: "2026-06-09T10:30:00.000Z"
  },
  {
    id: "job-agent-heartbeat",
    name: "Agent 心跳复核",
    target: "Core",
    cron: "*/10 * * * *",
    template: "网络诊断",
    enabled: true,
    maxConcurrency: 2,
    timeoutSec: 45,
    nextRunAt: "2026-06-09T10:00:00.000Z"
  },
  {
    id: "job-db-safecheck",
    name: "数据库只读巡检",
    target: "Database",
    cron: "15 */2 * * *",
    template: "内核参数采集",
    enabled: true,
    maxConcurrency: 1,
    timeoutSec: 75,
    nextRunAt: "2026-06-09T10:15:00.000Z"
  },
  {
    id: "job-emergency-cleanup",
    name: "紧急清理预案",
    target: "Worker",
    cron: "手动触发",
    template: "日志清理",
    enabled: false,
    maxConcurrency: 1,
    timeoutSec: 120,
    nextRunAt: "待审批"
  }
];

export const mockExecutionRuns: ExecutionRun[] = [
  {
    id: "run-8912",
    target: "tyo-core-01",
    command: "nginx -t",
    operator: "admin@example.com",
    status: "success",
    risk: "medium",
    startedAt: "2026-06-09T09:42:00.000Z",
    durationMs: 820,
    outputPreview: "syntax is ok; test is successful"
  },
  {
    id: "run-8911",
    target: "sin-cache-01",
    command: "systemctl status redis",
    operator: "operator@example.com",
    status: "failed",
    risk: "low",
    startedAt: "2026-06-09T09:35:00.000Z",
    durationMs: 3100,
    outputPreview: "agent offline; command not dispatched"
  },
  {
    id: "run-8910",
    target: "Edge",
    command: "df -h",
    operator: "scheduler",
    status: "running",
    risk: "low",
    startedAt: "2026-06-09T09:50:00.000Z",
    durationMs: 44000,
    outputPreview: "streaming output from 3 of 4 targets"
  },
  {
    id: "run-8909",
    target: "fra-db-02",
    command: "sysctl -a | grep tcp_",
    operator: "admin@example.com",
    status: "scheduled",
    risk: "low",
    startedAt: "2026-06-09T10:15:00.000Z",
    durationMs: 0,
    outputPreview: "scheduled by job-db-safecheck"
  },
  {
    id: "run-8908",
    target: "lon-worker-01",
    command: "systemctl restart smalux-agent",
    operator: "operator@example.com",
    status: "failed",
    risk: "medium",
    startedAt: "2026-06-09T09:20:00.000Z",
    durationMs: 9050,
    outputPreview: "approval expired before dispatch"
  },
  {
    id: "run-8907",
    target: "hkg-proxy-01",
    command: "ip route && ss -tanp | head -40",
    operator: "scheduler",
    status: "failed",
    risk: "low",
    startedAt: "2026-06-09T09:05:00.000Z",
    durationMs: 1500,
    outputPreview: "agent heartbeat timeout"
  },
  {
    id: "run-8906",
    target: "Core",
    command: "df -h && df -i",
    operator: "scheduler",
    status: "success",
    risk: "low",
    startedAt: "2026-06-09T08:45:00.000Z",
    durationMs: 2680,
    outputPreview: "4 targets completed, 0 warnings"
  }
];
