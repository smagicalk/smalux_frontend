import type { TaskRecord, TaskTemplate, CronJob } from "../types";

const now = Date.now();
const min = 60_000;
const hr = 3_600_000;
const day = 86_400_000;

export const MOCK_TASK_RECORDS: TaskRecord[] = [
  {
    id: "task-01",
    serverId: "srv-hkg-01",
    serverName: "hk-gateway-01",
    command: "systemctl reload nginx && nginx -t",
    status: "success",
    risk: "medium",
    scope: "node:exec",
    startedAt: now - 5 * min,
    finishedAt: now - 5 * min + 1200,
    durationMs: 1200,
    exitCode: 0,
    output: "syntax is ok\ntest is successful\nReloading nginx.service...",
    approver: "admin"
  },
  {
    id: "task-02",
    serverId: "srv-tok-01",
    serverName: "jp-edge-pop-01",
    command: "docker system prune -af --volumes",
    status: "success",
    risk: "high",
    scope: "node:exec",
    startedAt: now - 45 * min,
    finishedAt: now - 45 * min + 8400,
    durationMs: 8400,
    exitCode: 0,
    output: "Deleted Images: 12\nDeleted Containers: 3\nTotal reclaimed space: 14.8GB",
    approver: "admin"
  },
  {
    id: "task-03",
    serverId: "srv-sgp-02",
    serverName: "sg-prod-api-02",
    command: "apt update && apt upgrade -y",
    status: "running",
    risk: "high",
    scope: "node:exec",
    startedAt: now - 2 * min,
    approver: "admin"
  },
  {
    id: "task-04",
    serverId: "srv-fra-01",
    serverName: "eu-backup-vault-01",
    command: "zfs status -v pool-backup",
    status: "success",
    risk: "low",
    scope: "node:read",
    startedAt: now - 3 * hr,
    finishedAt: now - 3 * hr + 450,
    durationMs: 450,
    exitCode: 0,
    output: "pool: pool-backup\n state: ONLINE\nstatus: Some supported and requested features are not enabled."
  },
  {
    id: "task-05",
    serverId: "srv-sjc-01",
    serverName: "us-ai-runner-01",
    command: "nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used --format=csv",
    status: "success",
    risk: "low",
    scope: "node:read",
    startedAt: now - 10 * min,
    finishedAt: now - 10 * min + 320,
    durationMs: 320,
    exitCode: 0,
    output: "temperature.gpu, utilization.gpu [%], memory.used [MiB]\n42, 68 %, 7420 MiB"
  },
  {
    id: "task-06",
    serverId: "srv-ctu-01",
    serverName: "cd-edge-backup-04",
    command: "ping -c 3 1.1.1.1",
    status: "failed",
    risk: "low",
    scope: "node:read",
    startedAt: now - 30 * min,
    finishedAt: now - 30 * min + 5000,
    durationMs: 5000,
    exitCode: 1,
    output: "connect: Network is unreachable"
  }
];

export const MOCK_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "tpl-1",
    name: "Nginx 配置重载",
    command: "nginx -t && systemctl reload nginx",
    risk: "medium",
    scope: "node:exec",
    requiresApproval: false,
    description: "校验 Nginx 配置语法并在无误后平滑重新加载"
  },
  {
    id: "tpl-2",
    name: "Docker 垃圾与无用镜像清理",
    command: "docker system prune -af --volumes",
    risk: "high",
    scope: "node:exec",
    requiresApproval: true,
    description: "清理未使用的 Docker 镜像、悬挂卷和停止的容器缓存"
  },
  {
    id: "tpl-3",
    name: "系统资源深度巡检",
    command: "uname -a && uptime && free -h && df -hT && top -bn1 | head -n 20",
    risk: "low",
    scope: "node:read",
    requiresApproval: false,
    description: "快速获取主机内核、负载、内存、磁盘和前 20 进程摘要"
  },
  {
    id: "tpl-4",
    name: "Agent 守护进程重启",
    command: "systemctl restart smalux-agent",
    risk: "medium",
    scope: "node:exec",
    requiresApproval: true,
    description: "重启本机的 smalux 节点遥测 Agent 服务"
  },
  {
    id: "tpl-5",
    name: "全网 NTP 时间校准",
    command: "chronyc makestep || ntpdate pool.ntp.org",
    risk: "low",
    scope: "node:exec",
    requiresApproval: false,
    description: "强制对齐主机的硬件与网络时钟"
  }
];

export const MOCK_CRON_JOBS: CronJob[] = [
  {
    id: "cron-1",
    name: "PostgreSQL 每日全量备份",
    serverId: "srv-tok-02",
    serverName: "jp-db-master-01",
    expression: "0 3 * * *",
    command: "pg_dumpall | gzip > /backup/pg_dump_$(date +%Y%m%d).sql.gz",
    enabled: true,
    lastRunAt: now - 11 * hr,
    nextRunAt: now + 13 * hr,
    lastStatus: "success"
  },
  {
    id: "cron-2",
    name: "系统访问与审计日志周清理",
    serverId: "srv-hkg-01",
    serverName: "hk-gateway-01",
    expression: "0 4 * * 0",
    command: "find /var/log/nginx -type f -name '*.gz' -mtime +30 -delete",
    enabled: true,
    lastRunAt: now - 2 * day,
    nextRunAt: now + 5 * day,
    lastStatus: "success"
  },
  {
    id: "cron-3",
    name: "Let's Encrypt 证书自动续期",
    serverId: "srv-hkg-03",
    serverName: "hk-core-api-01",
    expression: "0 0 1 * *",
    command: "certbot renew --quiet && systemctl reload nginx",
    enabled: true,
    lastRunAt: now - 20 * day,
    nextRunAt: now + 10 * day,
    lastStatus: "success"
  },
  {
    id: "cron-4",
    name: "节点高水位磁盘巡检上报",
    serverId: "srv-fra-01",
    serverName: "eu-backup-vault-01",
    expression: "0 */6 * * *",
    command: "df -h / | awk '{print $5}'",
    enabled: true,
    lastRunAt: now - 2 * hr,
    nextRunAt: now + 4 * hr,
    lastStatus: "success"
  }
];
