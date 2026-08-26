/**
 * Mock data for every non-server domain. Servers live in mock-servers.ts
 * (they feed the live monitoring stream too); everything else is static
 * fixture data here, shaped by the schemas in methods.ts.
 */
import type {
  Account,
  AlertHistory,
  AlertRule,
  Cron,
  CronLog,
  DeploymentTarget,
  Log,
  NotificationChannel,
  NotificationEvent,
  PingTarget,
  Setting,
  Task,
  TaskTemplate,
  TaskVariable,
  Theme,
  Token
} from "@/shared/api/methods";

const now = Date.now();
const min = 60_000;
const hr = 3_600_000;
const day = 86_400_000;

export const mockTasks: Task[] = [
  // 批次 0: 超大型全集群批量运维巡检与升级 (16台主机，含成功/失败/超时分布)
  { id: "t0_1", batchId: "b-cluster-upgrade", serverId: "srv-hkg-01", serverName: "edge-hkg-01", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 620, durationMs: 620, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 15.6G total, 4.2G used, 11.4G free\nSwap: 0B used" },
  { id: "t0_2", batchId: "b-cluster-upgrade", serverId: "srv-hkg-02", serverName: "core-hkg-02", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 580, durationMs: 580, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 31.8G total, 11.3G used, 20.5G free\nSwap: 0B used" },
  { id: "t0_3", batchId: "b-cluster-upgrade", serverId: "srv-hkg-03", serverName: "edge-hkg-03", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 740, durationMs: 740, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 15.6G total, 3.1G used, 12.5G free\nSwap: 0B used" },
  { id: "t0_4", batchId: "b-cluster-upgrade", serverId: "srv-tok-01", serverName: "edge-tok-01", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 690, durationMs: 690, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 8.0G total, 2.4G used, 5.6G free\nSwap: 0B used" },
  { id: "t0_5", batchId: "b-cluster-upgrade", serverId: "srv-tok-02", serverName: "worker-tok-02", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 810, durationMs: 810, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 16.0G total, 6.8G used, 9.2G free\nSwap: 0B used" },
  { id: "t0_6", batchId: "b-cluster-upgrade", serverId: "srv-sgp-01", serverName: "edge-sgp-01", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 920, durationMs: 920, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 8.0G total, 3.1G used, 4.9G free\nSwap: 0B used" },
  { id: "t0_7", batchId: "b-cluster-upgrade", serverId: "srv-sgp-02", serverName: "worker-sgp-02", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 880, durationMs: 880, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 31.2G total, 14.2G used, 17.0G free\nSwap: 0B used" },
  { id: "t0_8", batchId: "b-cluster-upgrade", serverId: "srv-sgp-03", serverName: "worker-sgp-03", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 790, durationMs: 790, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 16.0G total, 5.2G used, 10.8G free\nSwap: 0B used" },
  { id: "t0_9", batchId: "b-cluster-upgrade", serverId: "srv-fra-01", serverName: "edge-fra-01", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 1050, durationMs: 1050, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 8.0G total, 1.9G used, 6.1G free\nSwap: 0B used" },
  { id: "t0_10", batchId: "b-cluster-upgrade", serverId: "srv-fra-02", serverName: "edge-fra-02", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 1120, durationMs: 1120, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 8.0G total, 2.1G used, 5.9G free\nSwap: 0B used" },
  { id: "t0_11", batchId: "b-cluster-upgrade", serverId: "srv-fra-03", serverName: "backup-fra-03", command: "smalux-agent --check && free -m", status: "timeout", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 30000, durationMs: 30000, exitCode: 124, output: "Error: Execution timed out after 30 seconds waiting for agent response." },
  { id: "t0_12", batchId: "b-cluster-upgrade", serverId: "srv-lax-01", serverName: "db-lax-01", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 1300, durationMs: 1300, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 64.0G total, 28.5G used, 35.5G free\nSwap: 0B used" },
  { id: "t0_13", batchId: "b-cluster-upgrade", serverId: "srv-lax-02", serverName: "db-lax-02", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 1250, durationMs: 1250, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 64.0G total, 27.8G used, 36.2G free\nSwap: 0B used" },
  { id: "t0_14", batchId: "b-cluster-upgrade", serverId: "srv-sha-01", serverName: "worker-sha-01", command: "smalux-agent --check && free -m", status: "failed", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 850, durationMs: 850, exitCode: 100, output: "E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 14201 (unattended-upgr)\nN: Be aware that removing the lock file is not a solution and may break your system." },
  { id: "t0_15", batchId: "b-cluster-upgrade", serverId: "srv-lon-01", serverName: "edge-lon-01", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 960, durationMs: 960, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 8.0G total, 2.7G used, 5.3G free\nSwap: 0B used" },
  { id: "t0_16", batchId: "b-cluster-upgrade", serverId: "srv-syd-01", serverName: "edge-syd-01", command: "smalux-agent --check && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 15 * min, finishedAt: now - 15 * min + 1450, durationMs: 1450, exitCode: 0, output: "[OK] Agent daemon v2.4.0 is healthy.\nMem: 8.0G total, 1.8G used, 6.2G free\nSwap: 0B used" },

  // 批次 1: 批量重启 Nginx (2台主机)
  { id: "t1_1", batchId: "b-restart-nginx", serverId: "srv-hkg-01", serverName: "edge-hkg-01", command: "systemctl restart nginx", status: "success", risk: "medium", scope: "node:exec", startedAt: now - 2 * hr, finishedAt: now - 2 * hr + 3200, durationMs: 3200, exitCode: 0, output: "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n[OK] Reloaded Nginx Web Server on edge-hkg-01." },
  { id: "t1_2", batchId: "b-restart-nginx", serverId: "srv-tok-01", serverName: "edge-tok-01", command: "systemctl restart nginx", status: "success", risk: "medium", scope: "node:exec", startedAt: now - 2 * hr, finishedAt: now - 2 * hr + 2900, durationMs: 2900, exitCode: 0, output: "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n[OK] Reloaded Nginx Web Server on edge-tok-01." },

  // 批次 2: 批量系统巡检 (3台主机)
  { id: "t2_1", batchId: "b-system-check", serverId: "srv-tok-01", serverName: "edge-tok-01", command: "df -h && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 90 * min, finishedAt: now - 90 * min + 800, durationMs: 800, exitCode: 0, output: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p1  100G   24G   72G  25% /\n---\nMem: 15.6G total, 3.8G used, 11.8G free" },
  { id: "t2_2", batchId: "b-system-check", serverId: "srv-sgp-02", serverName: "worker-sgp-02", command: "df -h && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 90 * min, finishedAt: now - 90 * min + 950, durationMs: 950, exitCode: 0, output: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       200G   68G  132G  34% /\n---\nMem: 31.2G total, 12.4G used, 18.8G free" },
  { id: "t2_3", batchId: "b-system-check", serverId: "srv-fra-02", serverName: "edge-fra-02", command: "df -h && free -m", status: "success", risk: "low", scope: "node:read", startedAt: now - 90 * min, finishedAt: now - 90 * min + 1100, durationMs: 1100, exitCode: 0, output: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1        80G   18G   62G  23% /\n---\nMem: 8.0G total, 2.1G used, 5.9G free" },

  // 批次 3: Docker 清理 (单台)
  { id: "t3", batchId: "b-docker-prune", serverId: "srv-sgp-02", serverName: "worker-sgp-02", command: "docker system prune -af", status: "success", risk: "high", scope: "node:exec", startedAt: now - 5 * min, finishedAt: now - 5 * min + 4200, durationMs: 4200, exitCode: 0, output: "Deleted Containers: 4\nDeleted Images: 8\nTotal reclaimed space: 12.4GB\n[OK] Docker prune completed." },

  // 批次 4: 临时文件清理 (单台)
  { id: "t4", batchId: "b-tmp-clean", serverId: "srv-fra-02", serverName: "edge-fra-02", command: "rm -rf /tmp/cache/*", status: "success", risk: "high", scope: "node:exec", startedAt: now - 40 * min, finishedAt: now - 40 * min + 600, durationMs: 600, exitCode: 0, output: "Removed 142 temporary cache files." },

  // 批次 5: 数据库备份 (单台)
  { id: "t5", batchId: "b-db-backup", serverId: "srv-lax-01", serverName: "db-lax-01", command: "pg_dump -U postgres -d main > /backup/main.sql", status: "success", risk: "medium", scope: "node:exec", startedAt: now - 55 * min, finishedAt: now - 55 * min + 8500, durationMs: 8500, exitCode: 0, output: "pg_dump: exporting database schema and tables...\n[OK] Database dump created successfully (248MB)." },

  // 批次 6: 容器日志检索 (2台主机，其中1台异常)
  { id: "t6_1", batchId: "b-docker-logs", serverId: "srv-sha-01", serverName: "worker-sha-01", command: "docker logs app", status: "failed", risk: "low", scope: "node:read", startedAt: now - 3 * hr, finishedAt: now - 3 * hr + 1500, durationMs: 1500, exitCode: 1, output: "Error response from daemon: No such container: app" },
  { id: "t6_2", batchId: "b-docker-logs", serverId: "srv-hkg-02", serverName: "core-hkg-02", command: "docker logs app", status: "success", risk: "low", scope: "node:read", startedAt: now - 3 * hr, finishedAt: now - 3 * hr + 900, durationMs: 900, exitCode: 0, output: "2026-08-24T18:30:00Z [INFO] Worker pool initialized. Listening on port 8080." },

  // 批次 7: 运行时间检测 (超时)
  { id: "t7", batchId: "b-uptime", serverId: "srv-hkg-02", serverName: "core-hkg-02", command: "uptime", status: "timeout", risk: "low", scope: "node:read", startedAt: now - 4 * hr, finishedAt: now - 4 * hr + 30_000, durationMs: 30_000, exitCode: 124, output: "Command timed out after 30s." }
];

export const mockTaskTemplates: TaskTemplate[] = [
  { id: "tp1", name: "重启 Web 服务", command: "systemctl restart nginx", risk: "medium", scope: "node:exec", description: "平滑重启 Nginx Web 服务并测试配置文件" },
  { id: "tp2", name: "系统综合诊断", command: "uname -a && df -h && free -m && uptime", risk: "low", scope: "node:read", description: "采集内核版本、磁盘占用、内存容量与瞬时负载" },
  { id: "tp3", name: "网络内核参数采集", command: "sysctl -a | grep -E 'net.ipv4.tcp|net.core'", risk: "low", scope: "node:read", description: "提取 TCP 拥塞控制算法与网络缓冲区核心配置" },
  { id: "tp4", name: "Agent 守护进程重启", command: "systemctl restart smalux-agent", risk: "high", scope: "node:exec", description: "重启当前节点上的 Smalux 监控采集守护进程" },
  { id: "tp5", name: "网络链路连通性检测", command: "ping -c 4 8.8.8.8 && mtr -rn -c 5 1.1.1.1", risk: "low", scope: "node:read", description: "快速测试公网出网延迟与骨干路由跳点损耗" }
];

export const mockTaskVariables: TaskVariable[] = [
  // ── 主机网络与元数据 ──
  { key: "{{SERVER_IPV4}}", category: "host", label: "主机 IPv4 地址", desc: "自动注入当前调度目标节点的公网或主内网 IPv4", example: "185.199.108.153" },
  { key: "{{SERVER_IPV6}}", category: "host", label: "主机 IPv6 地址", desc: "自动注入当前调度目标节点的 IPv6 地址", example: "2400:cb00:2048:1::c629:d7a2" },
  { key: "{{SERVER_NAME}}", category: "host", label: "主机 Hostname", desc: "自动注入当前节点的标准主机名称", example: "edge-hkg-01" },
  { key: "{{SERVER_ID}}", category: "host", label: "主机唯一识别 ID", desc: "系统全局分配的节点唯一标识符", example: "srv-hkg-01" },
  { key: "{{SERVER_REGION}}", category: "host", label: "主机所属地域/机房", desc: "节点所在的地理区域或数据中心代码", example: "Hong Kong (HKG)" },
  { key: "{{SERVER_GROUP}}", category: "host", label: "业务分组名称", desc: "节点所属的业务拓扑集群或逻辑分组", example: "网关集群" },
  { key: "{{SERVER_PORT}}", category: "host", label: "Agent 通信端口", desc: "目标主机上 Agent 服务监听的远程端口", example: "22" },
  { key: "{{TRAFFIC_USED}}", category: "host", label: "当月已用流量", desc: "目标主机当前计费周期的公网出入流量累计", example: "3.42 TB" },
  { key: "{{TRAFFIC_TOTAL}}", category: "host", label: "当月总流量配额", desc: "目标主机的每月月度流量总配额上限", example: "10.00 TB" },
  { key: "{{TRAFFIC_USAGE_PERCENT}}", category: "host", label: "流量使用率百分比", desc: "已用流量与总配额的实时百分比", example: "34.2%" },

  // ── 时间戳与格式化日期 ──
  { key: "{{TIMESTAMP}}", category: "time", label: "Unix 时间戳 (秒)", desc: "当前任务执行开始时的 10 位标准秒级时间戳", example: "1724428800" },
  { key: "{{TIMESTAMP_MS}}", category: "time", label: "毫秒时间戳 (ms)", desc: "高精度 13 位毫秒级 Unix 时间戳", example: "1724428800123" },
  { key: "{{DATE}}", category: "time", label: "当前日期 (YYYY-MM-DD)", desc: "以 ISO 格式输出的当天标准公历日期", example: "2026-08-23" },
  { key: "{{TIME}}", category: "time", label: "当前时间 (HH:mm:ss)", desc: "当前执行时分秒标准时间戳", example: "14:30:00" },
  { key: "{{DATETIME}}", category: "time", label: "紧凑日期时间", desc: "适合作为日志/备份文件后缀的年月日时间串", example: "20260823_143000" },

  // ── 运行环境与上下文 ──
  { key: "{{EXEC_USER}}", category: "env", label: "执行操作人", desc: "发起本次运维下发的当前登录管理员工号/角色", example: "root / admin" },
  { key: "{{TEMP_DIR}}", category: "env", label: "安全临时执行目录", desc: "远程节点上为本次任务开辟的沙箱临时目录", example: "/tmp/smalux_job" },
  { key: "{{LOG_FILE}}", category: "env", label: "任务专用日志文件", desc: "自动生成的单次指令独立日志输出路径", example: "/var/log/smalux_task.log" },
  { key: "{{AGENT_VERSION}}", category: "env", label: "Agent 客户端版本", desc: "目标主机上当前运行的 Smalux Fleet 守护版本", example: "v2.4.0" },
  { key: "{{RANDOM_ID}}", category: "env", label: "随机任务 Hash (8位)", desc: "为防止多节点命名冲突生成的随机十六进制串", example: "9f4a8b2c" }
];

export const mockCrons: Cron[] = [
  { id: "c1", name: "每日核心数据库备份", serverId: "srv-lax-01", serverName: "db-lax-01", expression: "0 3 * * *", command: "pg_dump main | gzip > /backup/main.sql.gz", enabled: true, lastRunAt: now - 20 * hr, nextRunAt: now + 4 * hr, lastStatus: "success" },
  { id: "c2", name: "30天以上过期日志清理", serverId: "srv-hkg-01", serverName: "edge-hkg-01", expression: "0 4 * * 0", command: "find /var/log -mtime +30 -delete", enabled: true, lastRunAt: now - 2 * day, nextRunAt: now + 5 * day, lastStatus: "success" },
  { id: "c3", name: "SSL 证书自动续期检查", serverId: "srv-fra-01", serverName: "core-fra-01", expression: "0 0 * * *", command: "certbot renew --dry-run", enabled: false, lastRunAt: now - day, lastStatus: "success" },
  { id: "c4", name: "流量统计周期性汇总上报", serverId: "srv-sgp-01", serverName: "cache-sgp-01", expression: "*/30 * * * *", command: "vnstat --json", enabled: true, lastRunAt: now - 25 * min, nextRunAt: now + 5 * min, lastStatus: "success" },
  { id: "c5", name: "根分区磁盘空间巡检", serverId: "srv-tok-01", serverName: "edge-tok-01", expression: "0 */6 * * *", command: "df -h | mail ops@smalux", enabled: true, lastRunAt: now - 3 * hr, nextRunAt: now + 3 * hr, lastStatus: "failed" },
  { id: "c6", name: "Docker 悬空镜像与无用卷清理", serverId: "srv-fra-01", serverName: "core-fra-01", expression: "0 2 * * 1", command: "docker system prune -af --volumes", enabled: true, lastRunAt: now - 3 * day, nextRunAt: now + 4 * day, lastStatus: "success" },
  { id: "c7", name: "Redis AOF 重写与 RDB 快照持久化", serverId: "srv-lax-01", serverName: "db-lax-01", expression: "0 4 * * *", command: "redis-cli BGREWRITEAOF && redis-cli BGSAVE", enabled: true, lastRunAt: now - 19 * hr, nextRunAt: now + 5 * hr, lastStatus: "success" },
  { id: "c8", name: "NTP 集群时间精准同步校验", serverId: "srv-sgp-01", serverName: "cache-sgp-01", expression: "0 */4 * * *", command: "chronyc makestep && chronyc sources -v", enabled: true, lastRunAt: now - 2 * hr, nextRunAt: now + 2 * hr, lastStatus: "success" },
  { id: "c9", name: "僵尸进程与高 CPU 进程扫描", serverId: "srv-hkg-01", serverName: "edge-hkg-01", expression: "*/15 * * * *", command: "ps -eo pid,ppid,stat,cmd | grep -w 'Z'", enabled: true, lastRunAt: now - 12 * min, nextRunAt: now + 3 * min, lastStatus: "success" },
  { id: "c10", name: "全网安全内核审计日志归档", serverId: "srv-tok-01", serverName: "edge-tok-01", expression: "0 1 * * *", command: "ausearch -ts today -i > /var/log/audit_today.log", enabled: false, lastRunAt: now - 22 * hr, nextRunAt: now + 2 * hr, lastStatus: "success" },
  { id: "c11", name: "Nginx 配置热载与平滑重载", serverId: "srv-fra-01", serverName: "core-fra-01", expression: "0 5 * * *", command: "nginx -t && nginx -s reload", enabled: true, lastRunAt: now - 18 * hr, nextRunAt: now + 6 * hr, lastStatus: "success" },
  { id: "c12", name: "边缘网关健康度探针主动上报", serverId: "srv-hkg-01", serverName: "edge-hkg-01", expression: "*/10 * * * *", command: "curl -s http://127.0.0.1:9090/healthz", enabled: true, lastRunAt: now - 8 * min, nextRunAt: now + 2 * min, lastStatus: "success" }
];

export const mockCronLogs: CronLog[] = [
  // ── 任务 1: 每日备份 (c1) ──
  {
    id: "cl-1-1",
    cronId: "c1",
    cronName: "每日备份",
    batchId: "cb-c1-3",
    runNumber: 3,
    expression: "0 3 * * *",
    serverId: "srv-lax-01",
    serverName: "db-lax-01",
    command: "pg_dump main | gzip > /backup/main.sql.gz",
    status: "success",
    triggerType: "cron",
    startedAt: now - 20 * hr,
    finishedAt: now - 20 * hr + 8400,
    durationMs: 8400,
    exitCode: 0,
    output: "pg_dump: dumping database \"main\" schema and data...\npg_dump: compressing stream with gzip level 6\n[OK] Snapshot saved to /backup/main.sql.gz (184.2 MB)\nMD5 Checksum: 7b3a4f8910e52cd80a7146e5912a7f55"
  },
  {
    id: "cl-1-2",
    cronId: "c1",
    cronName: "每日备份",
    batchId: "cb-c1-3",
    runNumber: 3,
    expression: "0 3 * * *",
    serverId: "srv-lax-02",
    serverName: "db-lax-02",
    command: "pg_dump main | gzip > /backup/main_replica.sql.gz",
    status: "success",
    triggerType: "cron",
    startedAt: now - 20 * hr,
    finishedAt: now - 20 * hr + 7900,
    durationMs: 7900,
    exitCode: 0,
    output: "pg_dump: dumping replica database \"main\"...\n[OK] Snapshot saved to /backup/main_replica.sql.gz (183.9 MB)\nMD5 Checksum: 8a1f3c9902e41de90b8235f4901b8a44"
  },
  {
    id: "cl-2-1",
    cronId: "c1",
    cronName: "每日备份",
    batchId: "cb-c1-2",
    runNumber: 2,
    expression: "0 3 * * *",
    serverId: "srv-lax-01",
    serverName: "db-lax-01",
    command: "pg_dump main | gzip > /backup/main.sql.gz",
    status: "success",
    triggerType: "manual",
    startedAt: now - 44 * hr,
    finishedAt: now - 44 * hr + 8900,
    durationMs: 8900,
    exitCode: 0,
    output: "[Manual Trigger] Operator requested manual pre-upgrade snapshot.\npg_dump: database snapshot created successfully (181.9 MB)."
  },
  {
    id: "cl-2-2",
    cronId: "c1",
    cronName: "每日备份",
    batchId: "cb-c1-2",
    runNumber: 2,
    expression: "0 3 * * *",
    serverId: "srv-lax-02",
    serverName: "db-lax-02",
    command: "pg_dump main | gzip > /backup/main_replica.sql.gz",
    status: "success",
    triggerType: "manual",
    startedAt: now - 44 * hr,
    finishedAt: now - 44 * hr + 8600,
    durationMs: 8600,
    exitCode: 0,
    output: "[Manual Trigger] Replica node backup snapshot completed successfully (181.7 MB)."
  },
  {
    id: "cl-0-1",
    cronId: "c1",
    cronName: "每日备份",
    batchId: "cb-c1-1",
    runNumber: 1,
    expression: "0 3 * * *",
    serverId: "srv-lax-01",
    serverName: "db-lax-01",
    command: "pg_dump main | gzip > /backup/main.sql.gz",
    status: "success",
    triggerType: "cron",
    startedAt: now - 68 * hr,
    finishedAt: now - 68 * hr + 8200,
    durationMs: 8200,
    exitCode: 0,
    output: "pg_dump: snapshot created (180.1 MB)."
  },
  {
    id: "cl-0-2",
    cronId: "c1",
    cronName: "每日备份",
    batchId: "cb-c1-1",
    runNumber: 1,
    expression: "0 3 * * *",
    serverId: "srv-fra-01",
    serverName: "core-fra-01",
    command: "pg_dump main | gzip > /backup/main.sql.gz",
    status: "failed",
    triggerType: "cron",
    startedAt: now - 68 * hr,
    finishedAt: now - 68 * hr + 1500,
    durationMs: 1500,
    exitCode: 2,
    output: "pg_dump: [error] could not connect to server: Connection refused\nIs the server running on host \"127.0.0.1\" and accepting TCP/IP connections on port 5432?"
  },

  // ── 任务 2: 流量统计上报 (c4) ──
  {
    id: "cl-3-1",
    cronId: "c4",
    cronName: "流量统计上报",
    batchId: "cb-c4-12",
    runNumber: 12,
    expression: "*/30 * * * *",
    serverId: "srv-sgp-01",
    serverName: "cache-sgp-01",
    command: "vnstat --json",
    status: "success",
    triggerType: "cron",
    startedAt: now - 25 * min,
    finishedAt: now - 25 * min + 350,
    durationMs: 350,
    exitCode: 0,
    output: "{\"vnstatversion\":\"2.6\",\"jsonversion\":\"2\",\"interfaces\":[{\"name\":\"eth0\",\"traffic\":{\"total\":{\"rx\":104857600,\"tx\":419430400}}}]}"
  },
  {
    id: "cl-3-2",
    cronId: "c4",
    cronName: "流量统计上报",
    batchId: "cb-c4-12",
    runNumber: 12,
    expression: "*/30 * * * *",
    serverId: "srv-hkg-01",
    serverName: "edge-hkg-01",
    command: "vnstat --json",
    status: "success",
    triggerType: "cron",
    startedAt: now - 25 * min,
    finishedAt: now - 25 * min + 410,
    durationMs: 410,
    exitCode: 0,
    output: "{\"vnstatversion\":\"2.6\",\"jsonversion\":\"2\",\"interfaces\":[{\"name\":\"eth0\",\"traffic\":{\"total\":{\"rx\":384210000,\"tx\":982000000}}}]}"
  },
  {
    id: "cl-3-3",
    cronId: "c4",
    cronName: "流量统计上报",
    batchId: "cb-c4-12",
    runNumber: 12,
    expression: "*/30 * * * *",
    serverId: "srv-tok-01",
    serverName: "edge-tok-01",
    command: "vnstat --json",
    status: "success",
    triggerType: "cron",
    startedAt: now - 25 * min,
    finishedAt: now - 25 * min + 380,
    durationMs: 380,
    exitCode: 0,
    output: "{\"vnstatversion\":\"2.6\",\"jsonversion\":\"2\",\"interfaces\":[{\"name\":\"eth0\",\"traffic\":{\"total\":{\"rx\":214210000,\"tx\":582000000}}}]}"
  },
  {
    id: "cl-4-1",
    cronId: "c4",
    cronName: "流量统计上报",
    batchId: "cb-c4-11",
    runNumber: 11,
    expression: "*/30 * * * *",
    serverId: "srv-sgp-01",
    serverName: "cache-sgp-01",
    command: "vnstat --json",
    status: "success",
    triggerType: "cron",
    startedAt: now - 55 * min,
    finishedAt: now - 55 * min + 320,
    durationMs: 320,
    exitCode: 0,
    output: "{\"vnstatversion\":\"2.6\",\"jsonversion\":\"2\",\"interfaces\":[{\"name\":\"eth0\",\"traffic\":{\"total\":{\"rx\":98421000,\"tx\":392000000}}}]}"
  },

  // ── 任务 3: 磁盘巡检 (c5) ──
  {
    id: "cl-5-1",
    cronId: "c5",
    cronName: "磁盘巡检",
    batchId: "cb-c5-4",
    runNumber: 4,
    expression: "0 */6 * * *",
    serverId: "srv-tok-01",
    serverName: "edge-tok-01",
    command: "df -h | mail ops@smalux",
    status: "failed",
    triggerType: "cron",
    startedAt: now - 3 * hr,
    finishedAt: now - 3 * hr + 1200,
    durationMs: 1200,
    exitCode: 127,
    output: "/bin/sh: line 1: mail: command not found\n[FATAL] Unable to dispatch alert notification email via local sendmail/mailx."
  },
  {
    id: "cl-5-2",
    cronId: "c5",
    cronName: "磁盘巡检",
    batchId: "cb-c5-4",
    runNumber: 4,
    expression: "0 */6 * * *",
    serverId: "srv-hkg-01",
    serverName: "edge-hkg-01",
    command: "df -h | mail ops@smalux",
    status: "success",
    triggerType: "cron",
    startedAt: now - 3 * hr,
    finishedAt: now - 3 * hr + 950,
    durationMs: 950,
    exitCode: 0,
    output: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/root        50G   18G   30G  38% /\ntmpfs           3.9G     0  3.9G   0% /dev/shm\n[OK] Disk health summary dispatched to ops@smalux successfully."
  },

  // ── 任务 4: 日志清理 (c2) ──
  {
    id: "cl-6-1",
    cronId: "c2",
    cronName: "日志清理",
    batchId: "cb-c2-2",
    runNumber: 2,
    expression: "0 4 * * 0",
    serverId: "srv-hkg-01",
    serverName: "edge-hkg-01",
    command: "find /var/log -mtime +30 -delete",
    status: "success",
    triggerType: "cron",
    startedAt: now - 2 * day,
    finishedAt: now - 2 * day + 1800,
    durationMs: 1800,
    exitCode: 0,
    output: "Scanning directory /var/log for files older than 30 days...\nPruned 28 archived log files.\nFreed disk space: 3.2 GB."
  },

  // ── 任务 5: 证书续期检查 (c3) ──
  {
    id: "cl-7-1",
    cronId: "c3",
    cronName: "SSL 证书自动续期检查",
    batchId: "cb-c3-1",
    runNumber: 1,
    expression: "0 0 * * *",
    serverId: "srv-fra-01",
    serverName: "core-fra-01",
    command: "certbot renew --dry-run",
    status: "success",
    triggerType: "cron",
    startedAt: now - day,
    finishedAt: now - day + 4600,
    durationMs: 4600,
    exitCode: 0,
    output: "Saving debug log to /var/log/letsencrypt/letsencrypt.log\nProcessing /etc/letsencrypt/renewal/smalux.example.com.conf\nSimulating renewal of an existing certificate for *.smalux.example.com\nThe dry run was successful."
  },

  // ── 任务 6: Docker 悬空镜像清理 (c6) ──
  {
    id: "cl-8-1",
    cronId: "c6",
    cronName: "Docker 悬空镜像与无用卷清理",
    batchId: "cb-c6-2",
    runNumber: 2,
    expression: "0 2 * * 1",
    serverId: "srv-fra-01",
    serverName: "core-fra-01",
    command: "docker system prune -af --volumes",
    status: "success",
    triggerType: "cron",
    startedAt: now - 3 * day,
    finishedAt: now - 3 * day + 12400,
    durationMs: 12400,
    exitCode: 0,
    output: "Deleted Images:\ndeleted: sha256:4b19283...\nTotal reclaimed space: 14.82GB"
  },
  {
    id: "cl-8-2",
    cronId: "c6",
    cronName: "Docker 悬空镜像与无用卷清理",
    batchId: "cb-c6-1",
    runNumber: 1,
    expression: "0 2 * * 1",
    serverId: "srv-fra-01",
    serverName: "core-fra-01",
    command: "docker system prune -af --volumes",
    status: "success",
    triggerType: "manual",
    startedAt: now - 10 * day,
    finishedAt: now - 10 * day + 9800,
    durationMs: 9800,
    exitCode: 0,
    output: "Manual trigger: Docker system pruned successfully. Reclaimed 8.12GB."
  },

  // ── 任务 7: Redis AOF 重写 (c7) ──
  {
    id: "cl-9-1",
    cronId: "c7",
    cronName: "Redis AOF 重写与 RDB 快照持久化",
    batchId: "cb-c7-5",
    runNumber: 5,
    expression: "0 4 * * *",
    serverId: "srv-lax-01",
    serverName: "db-lax-01",
    command: "redis-cli BGREWRITEAOF && redis-cli BGSAVE",
    status: "success",
    triggerType: "cron",
    startedAt: now - 19 * hr,
    finishedAt: now - 19 * hr + 3200,
    durationMs: 3200,
    exitCode: 0,
    output: "Background append only file rewriting started\nBackground saving started\n[OK] RDB snapshot persisted to dump.rdb (542 MB)"
  },
  {
    id: "cl-9-2",
    cronId: "c7",
    cronName: "Redis AOF 重写与 RDB 快照持久化",
    batchId: "cb-c7-4",
    runNumber: 4,
    expression: "0 4 * * *",
    serverId: "srv-lax-01",
    serverName: "db-lax-01",
    command: "redis-cli BGREWRITEAOF && redis-cli BGSAVE",
    status: "success",
    triggerType: "cron",
    startedAt: now - 43 * hr,
    finishedAt: now - 43 * hr + 3100,
    durationMs: 3100,
    exitCode: 0,
    output: "Background append only file rewriting started\nBackground saving started\n[OK] RDB snapshot persisted to dump.rdb (538 MB)"
  },

  // ── 任务 8: NTP 时间同步校验 (c8) ──
  {
    id: "cl-10-1",
    cronId: "c8",
    cronName: "NTP 集群时间精准同步校验",
    batchId: "cb-c8-8",
    runNumber: 8,
    expression: "0 */4 * * *",
    serverId: "srv-sgp-01",
    serverName: "cache-sgp-01",
    command: "chronyc makestep && chronyc sources -v",
    status: "success",
    triggerType: "cron",
    startedAt: now - 2 * hr,
    finishedAt: now - 2 * hr + 820,
    durationMs: 820,
    exitCode: 0,
    output: "200 OK\nMS Name/IP address         Stratum Poll Reach LastRx Last sample\n^* time.cloudflare.com          3   6   377    25   -12us[  -15us] +/- 12ms"
  },

  // ── 任务 9: 僵尸进程扫描 (c9) ──
  {
    id: "cl-11-1",
    cronId: "c9",
    cronName: "僵尸进程与高 CPU 进程扫描",
    batchId: "cb-c9-15",
    runNumber: 15,
    expression: "*/15 * * * *",
    serverId: "srv-hkg-01",
    serverName: "edge-hkg-01",
    command: "ps -eo pid,ppid,stat,cmd | grep -w 'Z'",
    status: "success",
    triggerType: "cron",
    startedAt: now - 12 * min,
    finishedAt: now - 12 * min + 190,
    durationMs: 190,
    exitCode: 0,
    output: "[OK] No zombie processes detected in system process tree."
  },

  // ── 任务 11: Nginx 配置热载 (c11) ──
  {
    id: "cl-12-1",
    cronId: "c11",
    cronName: "Nginx 配置热载与平滑重载",
    batchId: "cb-c11-3",
    runNumber: 3,
    expression: "0 5 * * *",
    serverId: "srv-fra-01",
    serverName: "core-fra-01",
    command: "nginx -t && nginx -s reload",
    status: "success",
    triggerType: "cron",
    startedAt: now - 18 * hr,
    finishedAt: now - 18 * hr + 1500,
    durationMs: 1500,
    exitCode: 0,
    output: "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n[OK] Signal HUP dispatched to master process."
  },

  // ── 任务 12: 边缘网关健康度探针 (c12) ──
  {
    id: "cl-13-1",
    cronId: "c12",
    cronName: "边缘网关健康度探针主动上报",
    batchId: "cb-c12-20",
    runNumber: 20,
    expression: "*/10 * * * *",
    serverId: "srv-hkg-01",
    serverName: "edge-hkg-01",
    command: "curl -s http://127.0.0.1:9090/healthz",
    status: "success",
    triggerType: "cron",
    startedAt: now - 8 * min,
    finishedAt: now - 8 * min + 85,
    durationMs: 85,
    exitCode: 0,
    output: "{\"status\":\"healthy\",\"uptime\":384210,\"active_conns\":182,\"edge_latency_p99\":\"4.2ms\"}"
  }
];

export const mockPingTargets: PingTarget[] = [
  { id: "p-pending", name: "新机房骨干专线测试 (Pending)", address: "18.176.99.100", protocol: "icmp", group: "private", enabled: true, latencyMs: undefined, uptime: undefined as unknown as number, lastCheckAt: 0, lastOk: true },
  { id: "p1", name: "主站 HTTPS", address: "https://smalux.example.com", protocol: "http", group: "public", enabled: true, latencyMs: 45, uptime: 0.999, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p2", name: "API 网关", address: "https://api.smalux.example.com/health", protocol: "http", group: "control", enabled: true, latencyMs: 82, uptime: 0.995, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p3", name: "WSS 终端", address: "wss://api.smalux.example.com/ws", protocol: "wss", group: "control", enabled: true, latencyMs: 120, uptime: 0.998, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p4", name: "数据库端口", address: "db-lax-01:5432", protocol: "tcp", group: "private", enabled: true, latencyMs: 8, uptime: 1, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p5", name: "Redis 入口", address: "cache-sgp-01:6379", protocol: "tcp", group: "private", enabled: true, latencyMs: 3, uptime: 0.999, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p6", name: "ICMP 探测 HK", address: "edge-hkg-01", protocol: "icmp", group: "notify", enabled: true, latencyMs: 12, uptime: 0.997, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p7", name: "私网拒绝样例", address: "10.0.0.99:22", protocol: "tcp", group: "private", enabled: false, latencyMs: undefined, uptime: 0, lastCheckAt: now - 30_000, lastOk: false }
];

export const mockAlertRules: AlertRule[] = [
  { id: "a1", name: "全网主机 CPU 持续超载预警", metric: "host.cpu.usage", operator: ">", threshold: 85, windowSec: 300, repeatIntervalSec: 1800, severity: "warning", channelIds: ["n1", "n4"], enabled: true, silenced: false },
  { id: "a2", name: "生产集群物理内存枯竭告警", metric: "host.mem.usage", operator: ">", threshold: 90, windowSec: 180, repeatIntervalSec: 600, severity: "critical", channelIds: ["n1", "n7"], enabled: true, silenced: false },
  { id: "a3", name: "根分区磁盘空间不足 (>90%)", metric: "host.disk.usage", operator: ">", threshold: 90, windowSec: 600, repeatIntervalSec: 3600, severity: "critical", channelIds: ["n4", "n8"], enabled: true, silenced: false },
  { id: "a4", name: "主机 Agent 守护进程失联超时", metric: "agent.offline.timeout", operator: ">", threshold: 60, windowSec: 60, repeatIntervalSec: 300, severity: "critical", channelIds: ["n1", "n2", "n4"], enabled: true, silenced: false },
  { id: "a5", name: "核心数据库节点专属磁盘预警 (db-lax-01)", serverId: "srv-lax-01", metric: "host.disk.usage", operator: ">", threshold: 85, windowSec: 300, repeatIntervalSec: 1800, severity: "warning", channelIds: ["n9"], enabled: true, silenced: false },
  { id: "a6", name: "新加坡节点出网流量突增 (>100MB/s)", serverId: "srv-sgp-01", metric: "host.net.txSpeed", operator: ">", threshold: 100, windowSec: 300, repeatIntervalSec: 0, severity: "warning", channelIds: ["n5"], enabled: true, silenced: false },
  { id: "a7", name: "香港网关出网带宽激增预警", serverId: "srv-hkg-01", metric: "host.net.txSpeed", operator: ">", threshold: 200, windowSec: 180, repeatIntervalSec: 3600, severity: "info", channelIds: ["n2"], enabled: true, silenced: true },
  { id: "a8", name: "15分钟系统平均负载过载 (>8.0)", metric: "host.load.15m", operator: ">", threshold: 8, windowSec: 900, repeatIntervalSec: 1800, severity: "warning", channelIds: ["n1"], enabled: true, silenced: false },
  { id: "a9", name: "网络 ICMP 丢包率异常 (>15%)", metric: "probe.ping.loss", operator: ">", threshold: 15, windowSec: 120, repeatIntervalSec: 600, severity: "warning", channelIds: ["n4", "n5"], enabled: true, silenced: false },
  { id: "a10", name: "跨国 TCP 握手网络高延迟 (>120ms)", serverIds: ["srv-tok-01", "srv-sgp-01"], metric: "probe.tcp.latency", operator: ">", threshold: 120, windowSec: 300, repeatIntervalSec: 3600, severity: "info", channelIds: ["n2"], enabled: true, silenced: false },
  { id: "a11", name: "关键节点物理内存重度拥堵 (>95%)", serverIds: ["srv-fra-01", "srv-lax-01"], metric: "host.mem.usage", operator: ">", threshold: 95, windowSec: 120, repeatIntervalSec: 300, severity: "critical", channelIds: ["n1", "n7", "n8"], enabled: true, silenced: false },
  { id: "a12", name: "只读磁盘分区故障触发告警", metric: "host.disk.readonly", operator: "==", threshold: 1, windowSec: 60, repeatIntervalSec: 300, severity: "critical", channelIds: ["n4"], enabled: true, silenced: false },
  { id: "a13", name: "全网节点月度总流量配额预警 (>80%)", metric: "host.traffic.monthly", operator: ">", threshold: 80, windowSec: 1800, repeatIntervalSec: 86400, severity: "warning", channelIds: ["n7"], enabled: false, silenced: false },
  { id: "a14", name: "自定义脚本监控返回异常状态", metric: "custom.script.status", operator: "!=", threshold: 0, windowSec: 60, repeatIntervalSec: 1800, severity: "warning", channelIds: ["n10", "n11"], enabled: true, silenced: false }
];

export const mockAlertHistory: AlertHistory[] = [
  {
    id: "ah1",
    ruleId: "a1",
    ruleName: "全网主机 CPU 持续超载预警",
    serverName: "test-01-full-featured",
    serverId: "srv-test-normal",
    severity: "warning",
    triggeredAt: now - 12 * min,
    resolvedAt: undefined,
    value: 0.89,
    message: "test-01-full-featured (东京测试节点) 连续 3 分钟 CPU 计算负载达到 89.2% (阈值 85%)，正在持续触发中。"
  },
  {
    id: "ah2",
    ruleId: "a2",
    ruleName: "生产集群物理内存枯竭告警",
    serverName: "test-01-full-featured",
    serverId: "srv-test-normal",
    severity: "critical",
    triggeredAt: now - 95 * min,
    resolvedAt: now - 72 * min,
    value: 0.94,
    message: "test-01-full-featured 物理内存占用达 94.6%，触发 P0 级严重警报，触发自动杀进程后内存占用已回落至 48%。"
  },
  {
    id: "ah3",
    ruleId: "a3",
    ruleName: "根分区磁盘空间不足 (>90%)",
    serverName: "test-01-full-featured",
    serverId: "srv-test-normal",
    severity: "warning",
    triggeredAt: now - 5 * hr,
    resolvedAt: now - 4 * hr - 30 * min,
    value: 0.91,
    message: "test-01-full-featured / 根分区磁盘已用 91.2%，经巡检清理 Docker 未引用镜像与日志后已降至 38%。"
  },
  {
    id: "ah4",
    ruleId: "a7",
    ruleName: "外网 Ping 丢包率过高 (>10%)",
    serverName: "test-01-full-featured",
    serverId: "srv-test-normal",
    severity: "info",
    triggeredAt: now - 18 * hr,
    resolvedAt: now - 17 * hr - 50 * min,
    value: 0.12,
    message: "test-01-full-featured 探测目标网关时丢包率达 12.4%，持续 2 分钟后骨干网络抖动恢复。"
  },
  {
    id: "ah5",
    ruleId: "a1",
    ruleName: "全网主机 CPU 持续超载预警",
    serverName: "edge-tok-01",
    serverId: "srv-tok-01",
    severity: "warning",
    triggeredAt: now - 18 * min,
    resolvedAt: undefined,
    value: 0.92,
    message: "edge-tok-01 (东京接入节点) 连续 5 分钟 CPU 利用率超过 85% (瞬时采样 92.4%)，请关注计算负载。"
  },
  {
    id: "ah6",
    ruleId: "a4",
    ruleName: "主机 Agent 守护进程失联超时",
    serverName: "worker-sgp-02",
    serverId: "srv-sgp-02",
    severity: "critical",
    triggeredAt: now - 42 * min,
    resolvedAt: undefined,
    value: 0,
    message: "worker-sgp-02 (新加坡工作节点) 心跳汇报中断超过 60 秒，节点状态已置为离线，可能发生系统宕机或网络中断。"
  },
  {
    id: "ah7",
    ruleId: "a2",
    ruleName: "生产集群物理内存枯竭告警",
    serverName: "core-fra-01",
    serverId: "srv-fra-01",
    severity: "critical",
    triggeredAt: now - 3 * hr,
    resolvedAt: now - 2 * hr - 45 * min,
    value: 0.94,
    message: "core-fra-01 (法兰克福核心节点) 物理内存占用达 94.2%，触发 P0 级严重警报，已被 OOM 杀进程后内存回落至正常水位。"
  },
  {
    id: "ah8",
    ruleId: "a3",
    ruleName: "根分区磁盘空间不足 (>90%)",
    serverName: "edge-hkg-01",
    serverId: "srv-hkg-01",
    severity: "critical",
    triggeredAt: now - 8 * hr,
    resolvedAt: now - 7 * hr - 15 * min,
    value: 0.91,
    message: "edge-hkg-01 (香港边缘节点) / 根分区磁盘已用 91.8%，经自动执行日志清理任务释放 8.4GB 空间后已自动恢复。"
  },
  {
    id: "ah9",
    ruleId: "a6",
    ruleName: "出网流量突增预警 (>100MB/s)",
    serverName: "cache-sgp-01",
    serverId: "srv-sgp-01",
    severity: "warning",
    triggeredAt: now - 14 * hr,
    resolvedAt: now - 13 * hr - 50 * min,
    value: 0.85,
    message: "cache-sgp-01 出站网络带宽激增至 124MB/s，持续 5 分钟后大文件同步传输完毕已自动回落至正常水位。"
  },
  {
    id: "ah10",
    ruleId: "a5",
    ruleName: "核心数据库节点专属磁盘预警 (db-lax-01)",
    serverName: "db-lax-01",
    serverId: "srv-lax-01",
    severity: "warning",
    triggeredAt: now - 22 * hr,
    resolvedAt: now - 21 * hr - 40 * min,
    value: 0.88,
    message: "db-lax-01 (洛杉矶主数据库) 数据盘占用率达到 88.0%，完成 WAL 归档日志同步并清理后已恢复。"
  },
  {
    id: "ah11",
    ruleId: "a1",
    ruleName: "全网主机 CPU 持续超载预警",
    serverName: "test-02-no-auto-collect",
    serverId: "srv-test-noauto",
    severity: "warning",
    triggeredAt: now - 45 * min,
    resolvedAt: undefined,
    value: 0.87,
    message: "test-02-no-auto-collect (首尔节点) 瞬时 CPU 负载超过 87%，持续时间超过预警基线。"
  },
  {
    id: "ah12",
    ruleId: "a8",
    ruleName: "TCP 活跃连接数骤增超限",
    serverName: "test-04-no-remote-exec",
    serverId: "srv-test-noremote",
    severity: "info",
    triggeredAt: now - 6 * hr,
    resolvedAt: now - 5 * hr - 20 * min,
    value: 12500,
    message: "test-04-no-remote-exec TCP 并发连接数达 12,500 条，超出基准 10,000 条，突发 HTTP 连接已释放。"
  },
  {
    id: "ah13",
    ruleId: "a9",
    ruleName: "系统 15 分钟平均负载过载",
    serverName: "test-05-mixed-forbidden-and-noremote",
    serverId: "srv-test-mixed",
    severity: "critical",
    triggeredAt: now - 28 * hr,
    resolvedAt: now - 27 * hr,
    value: 16.4,
    message: "test-05-mixed 15 分钟系统负载升至 16.4 (核心数 8)，触发高负载报警。"
  }
];


export const mockNotificationChannels: NotificationChannel[] = [
  // 1. Telegram Bot (支持 1)
  { id: "n1", name: "Telegram · SRE 核心值班群 Bot", type: "telegram", enabled: true, endpoint: "https://api.telegram.org/bot72819283:AAE.../sendMessage?chat_id=-10082918234", lastDeliveryAt: now - 8 * min, lastOk: true },
  { id: "n2", name: "Telegram · 基础设施离线告警频道", type: "telegram", enabled: true, endpoint: "https://api.telegram.org/bot83920192:BBF.../sendMessage?chat_id=-10029381920", lastDeliveryAt: now - 22 * min, lastOk: true },
  { id: "n3", name: "Telegram · 个人应急私聊 Bot", type: "telegram", enabled: true, endpoint: "https://api.telegram.org/bot61283912:CCF.../sendMessage?chat_id=582910293", lastDeliveryAt: now - 45 * min, lastOk: true },

  // 2. HTTP Webhook (支持 2)
  { id: "n4", name: "生产自愈自动化 Webhook 接口", type: "webhook", enabled: true, endpoint: "https://ops-gateway.internal.smalux/v1/auto-remediation", lastDeliveryAt: now - 14 * min, lastOk: true },
  { id: "n5", name: "内部运维平台事件流 Webhook", type: "webhook", enabled: true, endpoint: "https://event-center.company.net/api/v2/alerts/ingest", lastDeliveryAt: now - 35 * min, lastOk: true },
  { id: "n6", name: "PagerDuty 事件网关 Webhook", type: "webhook", enabled: false, endpoint: "https://events.pagerduty.com/v2/enqueue", lastDeliveryAt: now - 12 * hr, lastOk: false },

  // 3. Email 邮件通知 (支持 3)
  { id: "n7", name: "个人主力邮箱 (admin@smalux.internal)", type: "email", enabled: true, endpoint: "admin@smalux.internal", lastDeliveryAt: now - 1 * hr, lastOk: true },
  { id: "n8", name: "SRE 团队公共值班邮箱 (sre-oncall@smalux.internal)", type: "email", enabled: true, endpoint: "sre-oncall@smalux.internal", lastDeliveryAt: now - 2 * hr, lastOk: true },
  { id: "n9", name: "SecOps 安全事件应急邮箱组", type: "email", enabled: true, endpoint: "secops-duty@smalux.internal", lastDeliveryAt: now - 5 * hr, lastOk: true },

  // 4. JavaScript 脚本 (支持 4)
  { id: "n10", name: "动态 JavaScript 自定义转发脚本", type: "js", enabled: true, endpoint: "export default async function(evt) { await fetch('https://api.custom.com', { method: 'POST', body: JSON.stringify(evt) }); }", lastDeliveryAt: now - 8 * hr, lastOk: true },
  { id: "n11", name: "多协议自建告警中转 JS 处理器", type: "js", enabled: true, endpoint: "async function sendEvent(event) { await fetch('https://gateway.internal/events', { method: 'POST', body: JSON.stringify(event) }); }", lastDeliveryAt: now - 24 * hr, lastOk: true }
];

export const mockNotificationEvents: NotificationEvent[] = [
  { id: "ne1", channelName: "Telegram 个人应急报警 Bot", severity: "warning", message: "edge-tok-01 CPU 利用率达 92.4% (持续 5m)", deliveredAt: now - 18 * min, ok: true },
  { id: "ne2", channelName: "生产自愈自动化 Webhook 接口", severity: "critical", message: "worker-sgp-02 主机心跳离线中断超过 60s", deliveredAt: now - 42 * min, ok: true },
  { id: "ne3", channelName: "个人主力邮箱 SMTP 外发", severity: "critical", message: "core-fra-01 物理内存占用超过 94.2% 紧急预警", deliveredAt: now - 3 * hr, ok: true },
  { id: "ne4", channelName: "动态 JavaScript 自定义转发脚本", severity: "critical", message: "edge-hkg-01 根分区磁盘空间占用超 90%", deliveredAt: now - 8 * hr, ok: true },
  { id: "ne5", channelName: "个人主力邮箱 SMTP 外发", severity: "warning", message: "cache-sgp-01 出站网络带宽达到 124MB/s", deliveredAt: now - 14 * hr, ok: true },
  { id: "ne6", channelName: "Telegram 个人应急报警 Bot", severity: "info", message: "每日数据库全量冷备份已就绪 (184.2MB)", deliveredAt: now - 20 * hr, ok: true }
];

export const mockLogs: Log[] = [
  { id: "l1", ts: now - 2 * min, actor: "admin", module: "task", action: "task.dispatch", result: "success", target: "srv-sgp-02", ip: "203.0.113.5", detail: "apt update && apt upgrade -y" },
  { id: "l2", ts: now - 15 * min, actor: "operator", module: "terminal", action: "terminal.open", result: "success", target: "srv-fra-01", ip: "203.0.113.5", detail: "WSS session 4f2a" },
  { id: "l3", ts: now - 30 * min, actor: "admin", module: "token", action: "token.create", result: "success", target: "deploy-bot", detail: "scopes: node:read,node:exec" },
  { id: "l4", ts: now - 45 * min, actor: "viewer", module: "auth", action: "auth.login", result: "failure", target: "viewer", ip: "198.51.100.7", detail: "密码错误 3 次" },
  { id: "l5", ts: now - 2 * hr, actor: "system", module: "alert", action: "alert.trigger", result: "success", target: "a4", detail: "worker-sgp-02 离线" },
  { id: "l6", ts: now - 3 * hr, actor: "admin", module: "theme", action: "theme.upload", result: "success", target: "dark-pro", detail: "sandbox build ok" },
  { id: "l7", ts: now - 4 * hr, actor: "admin", module: "config", action: "config.edit", result: "success", target: "limits.taskConcurrency", detail: "8 -> 16" },
  { id: "l8", ts: now - 5 * hr, actor: "admin", module: "cron", action: "cron.update", result: "success", target: "c3", detail: "enabled=false" },
  { id: "l9", ts: now - 6 * hr, actor: "auditor", module: "auth", action: "auth.login", result: "success", target: "auditor", ip: "203.0.113.5" },
  { id: "l10", ts: now - 7 * hr, actor: "admin", module: "task", action: "task.approve", result: "success", target: "t3", detail: "high-risk approved" }
];

export const mockTokens: Token[] = [
  // 1. CI/CD 自动部署令牌 (Admin)
  { id: "tk1", name: "github-actions-deploy", scopes: ["admin", "read"], createdAt: now - 30 * day, expiresAt: now + 60 * day, lastUsedAt: now - 25 * min, createdBy: "admin", revoked: false },
  // 2. Prometheus 指标采集 (Read)
  { id: "tk2", name: "prometheus-metrics-exporter", scopes: ["read"], createdAt: now - 90 * day, expiresAt: undefined, lastUsedAt: now - 3 * min, createdBy: "admin", revoked: false },
  // 3. Grafana Cloud 仪表盘 (Read)
  { id: "tk3", name: "grafana-cloud-dashboard", scopes: ["read"], createdAt: now - 45 * day, expiresAt: undefined, lastUsedAt: now - 15 * min, createdBy: "admin", revoked: false },
  // 4. GitLab 自动化测试流水线 (Admin)
  { id: "tk4", name: "gitlab-runner-ci", scopes: ["admin", "read"], createdAt: now - 18 * day, expiresAt: now + 72 * day, lastUsedAt: now - 2 * hr, createdBy: "operator", revoked: false },
  // 5. Ansible 自动化批量运维 (Admin)
  { id: "tk5", name: "ansible-worker-nodes", scopes: ["admin", "read"], createdAt: now - 12 * day, expiresAt: now + 168 * day, lastUsedAt: now - 5 * hr, createdBy: "admin", revoked: false },
  // 6. Uptime Kuma 外部健康探活 (Read)
  { id: "tk6", name: "uptime-kuma-healthcheck", scopes: ["read"], createdAt: now - 7 * day, expiresAt: undefined, lastUsedAt: now - 1 * min, createdBy: "admin", revoked: false },
  // 7. Home Assistant 智能家居面板 (Read)
  { id: "tk7", name: "home-assistant-integration", scopes: ["read"], createdAt: now - 4 * day, expiresAt: now + 361 * day, lastUsedAt: now - 40 * min, createdBy: "admin", revoked: false },
  // 8. ArgoCD 持续交付同步器 (Admin)
  { id: "tk8", name: "argocd-gitops-sync", scopes: ["admin", "read"], createdAt: now - 2 * day, expiresAt: now + 28 * day, lastUsedAt: now - 50 * min, createdBy: "admin", revoked: false },
  // 9. 审计与合规导出专用脚本 (Read)
  { id: "tk9", name: "security-audit-exporter", scopes: ["read"], createdAt: now - 5 * day, expiresAt: now + 25 * day, lastUsedAt: now - day, createdBy: "auditor", revoked: false },
  // 10. Terraform 基础设施即代码 (Admin)
  { id: "tk10", name: "terraform-provider-iaac", scopes: ["admin", "read"], createdAt: now - 1 * day, expiresAt: now + 89 * day, lastUsedAt: now - 4 * hr, createdBy: "admin", revoked: false },
  // 11. 临时调试用令牌（已过期）
  { id: "tk11", name: "temp-debug-key", scopes: ["admin", "read"], createdAt: now - 60 * day, expiresAt: now - 5 * day, lastUsedAt: now - 6 * day, createdBy: "operator", revoked: false },
  // 12. 已废弃的旧版本探针密钥（已注销）
  { id: "tk12", name: "legacy-v1-agent-key", scopes: ["admin", "read"], createdAt: now - 180 * day, expiresAt: now + 180 * day, lastUsedAt: now - 90 * day, createdBy: "admin", revoked: true },
  // 13. 旧监控系统 Grafana v8（已注销）
  { id: "tk13", name: "old-grafana-v8", scopes: ["read"], createdAt: now - 240 * day, expiresAt: undefined, lastUsedAt: now - 120 * day, createdBy: "admin", revoked: true },
  // 14. 自动化归档定时脚本 (Admin)
  { id: "tk14", name: "s3-archive-sync-daemon", scopes: ["admin", "read"], createdAt: now - 8 * day, expiresAt: now + 82 * day, lastUsedAt: now - 8 * hr, createdBy: "admin", revoked: false }
];


export const mockAccounts: Account[] = [
  { id: "u1", username: "admin", role: "admin", status: "active", mfaEnabled: true, passkeyEnabled: true, lastLoginAt: now - 2 * min, sessions: 2 },
  { id: "u2", username: "operator", role: "operator", status: "active", mfaEnabled: true, passkeyEnabled: false, lastLoginAt: now - 3 * hr, sessions: 1 },
  { id: "u3", username: "viewer", role: "viewer", status: "active", mfaEnabled: false, passkeyEnabled: false, lastLoginAt: now - day, sessions: 0 },
  { id: "u4", username: "auditor", role: "auditor", status: "active", mfaEnabled: true, passkeyEnabled: true, lastLoginAt: now - 6 * hr, sessions: 1 },
  { id: "u5", username: "intern", role: "viewer", status: "invited", mfaEnabled: false, passkeyEnabled: false, lastLoginAt: undefined, sessions: 0 },
  { id: "u6", username: "old-admin", role: "admin", status: "locked", mfaEnabled: true, passkeyEnabled: false, lastLoginAt: now - 60 * day, sessions: 0 }
];

export const mockThemes: Theme[] = [
  {
    id: "th1",
    name: "内置黑晶极简大盘 (Built-in Obsidian)",
    status: "published",
    publicVisible: true,
    version: "1.2.0",
    updatedAt: now - 30 * day,
    author: "system",
    isBuiltin: true,
    description: "系统原生内置的响应式全网服务可用性大盘，轻量极速，支持探针延迟时序与节点聚合状态展示。",
    configSchema: [
      { key: "title", label: "状态大盘展示标题", type: "string", defaultValue: "Smalux 全球边缘网络服务可用性实时看板", description: "显示在公开状态页顶部的品牌大盘标题" },
      { key: "banner", label: "实时公告横幅 (Banner)", type: "text", defaultValue: "🟢 全网 8 个核心边缘 POP 节点及控制平面当前运转正常，SLA 达到 99.98%", description: "在状态页头部展示的维护通告或健康播报" },
      { key: "show_latency_chart", label: "展示 24h 探针延迟与丢包率图表", type: "boolean", defaultValue: true, description: "是否在公开页面中呈现网络节点延迟时序折线图" },
      { key: "refresh_interval_sec", label: "公开页数据自动刷新间隔 (秒)", type: "number", defaultValue: 15, description: "前端公开页免登录长轮询请求探针实时状态的周期" },
      { key: "group_by", label: "节点卡片展示分组维度", type: "select", defaultValue: "region", description: "探针节点在前端页面的分类方式", options: [{ label: "按地理区域分组 (Region / Continent)", value: "region" }, { label: "按业务标签分组 (Tag / Service Group)", value: "tag" }, { label: "全平铺紧凑排列 (Flat Compact)", value: "flat" }] }
    ]
  },
  {
    id: "th2",
    name: "Dark Pro 企业版全黑大盘",
    status: "draft",
    publicVisible: true,
    version: "2.1.0",
    updatedAt: now - 3 * hr,
    author: "admin",
    isBuiltin: false,
    description: "高对比度纯黑背景企业级监控大盘，适合 NOC 大屏长时间看板场景，信息密度极高。",
    configSchema: [
      { key: "title", label: "大盘标题", type: "string", defaultValue: "Smalux NOC 全球节点监控中心", description: "大屏顶部展示的品牌标题" },
      { key: "accent_color", label: "主强调色调", type: "select", defaultValue: "cyan", description: "大盘主色调", options: [{ label: "青蓝 (Cyan)", value: "cyan" }, { label: "绿色 (Green)", value: "green" }, { label: "紫色 (Purple)", value: "purple" }] },
      { key: "show_clock", label: "显示全局实时时钟", type: "boolean", defaultValue: true, description: "在大盘右上角显示当前服务器 UTC 时间" }
    ]
  },
  {
    id: "th3",
    name: "Enterprise Blue 蓝色企业版",
    status: "draft",
    publicVisible: false,
    version: "1.4.2",
    updatedAt: now - 10 * day,
    author: "admin",
    isBuiltin: false,
    description: "标准蓝白配色企业级状态页，风格简洁正式，适合对外客户 SLA 报告与合规场景。",
    configSchema: [
      { key: "title", label: "大盘标题", type: "string", defaultValue: "服务健康状态实时大盘", description: "对外客户展示标题" },
      { key: "company_logo_url", label: "企业 Logo URL", type: "string", defaultValue: "", description: "填写企业 Logo 图片链接，留空则不显示" },
      { key: "show_sla_metrics", label: "展示 SLA 统计指标", type: "boolean", defaultValue: true, description: "是否展示 30 天 SLA 可用性统计卡片" }
    ]
  },
  {
    id: "th4",
    name: "Neon Glow 霓虹辉光主题 (草稿)",
    status: "draft",
    publicVisible: false,
    version: "0.3.0",
    updatedAt: now - 2 * hr,
    author: "operator",
    isBuiltin: false,
    description: "霓虹风格炫酷大盘，采用荧光绿/紫渐变背景，适合科技感展示场景，当前处于草稿阶段。",
    configSchema: [
      { key: "title", label: "大盘标题", type: "string", defaultValue: "⚡ Network Status · Live", description: "大盘展示标题" },
      { key: "glow_intensity", label: "霓虹发光强度", type: "select", defaultValue: "medium", description: "控制霓虹光晕的视觉强度", options: [{ label: "低 (Subtle)", value: "low" }, { label: "中 (Medium)", value: "medium" }, { label: "高 (Intense)", value: "high" }] }
    ]
  },
  {
    id: "th5",
    name: "Legacy Light 经典浅色版 (已归档)",
    status: "archived",
    publicVisible: false,
    version: "0.9.1",
    updatedAt: now - 120 * day,
    author: "system",
    isBuiltin: true,
    description: "经典浅色主题，已随 v2.0 版本升级归档，保留历史记录。",
    configSchema: []
  }
];


export const mockSettings: Setting[] = [
  { key: "site.name", label: "站点名称", value: "smalux", group: "general", editable: true },
  { key: "site.subTitle", label: "副标题标语", value: "Console", group: "general", editable: true },
  { key: "site.icon", label: "站点图标", value: "zap", group: "general", editable: true },
  { key: "site.locale", label: "默认语言", value: "zh-CN", group: "general", editable: true },
  { key: "network.agentIngressUrl", label: "Agent 通信网关端点", value: "wss://smalux.example.com/ws/agent", group: "network", editable: false },
  { key: "network.realIpHeader", label: "真实客户端 IP 请求头", value: "X-Forwarded-For", group: "network", editable: true },
  // 执行限制
  { key: "limits.taskTimeoutSec", label: "单任务超时时间(秒)", value: "300", group: "limits", editable: true },
  { key: "limits.taskLogMaxLines", label: "任务日志行数上限", value: "2000", group: "limits", editable: true },
  // 全局存储配额
  { key: "storage.maxDbSizeGb", label: "数据库磁盘容量上限(GB)", value: "20", group: "limits", editable: true },
  // 单项指标与数据保存时长 (天)
  { key: "storage.cpuRetentionDays", label: "CPU 负载时序留存(天)", value: "30", group: "limits", editable: true },
  { key: "storage.memoryRetentionDays", label: "内存/Swap 时序留存(天)", value: "30", group: "limits", editable: true },
  { key: "storage.diskRetentionDays", label: "磁盘 I/O与容量留存(天)", value: "30", group: "limits", editable: true },
  { key: "storage.networkRetentionDays", label: "网络带宽吞吐留存(天)", value: "30", group: "limits", editable: true },
  { key: "storage.pingRetentionDays", label: "网络拨测延时留存(天)", value: "30", group: "limits", editable: true },
  { key: "storage.processRetentionDays", label: "进程快照数据留存(天)", value: "7", group: "limits", editable: true },
  { key: "storage.taskRetentionDays", label: "任务执行与脚本日志留存(天)", value: "30", group: "limits", editable: true },
  { key: "storage.alertRetentionDays", label: "历史告警事件留存(天)", value: "30", group: "limits", editable: true },
  { key: "storage.apiLogRetentionDays", label: "API 访问鉴权流水留存(天)", value: "30", group: "limits", editable: true },
  { key: "storage.auditRetentionDays", label: "审计操作日志留存(天)", value: "90", group: "limits", editable: true },
  // 探针生命周期
  { key: "limits.agentRegisterTokenTtl", label: "注册 Token 有效期(秒)", value: "300", group: "limits", editable: true },
  { key: "storage.agentOfflineTimeoutSec", label: "探针失联判定超时(秒)", value: "60", group: "limits", editable: true },
  { key: "storage.inactiveNodePruneDays", label: "离线废弃节点清理(天)", value: "30", group: "limits", editable: true },
  { key: "limits.themeUploadSizeMb", label: "主题上传上限(MB)", value: "8", group: "limits", editable: true },
  // 安全防御基线与高危操作提权策略
  { key: "security.totpEnabled", label: "TOTP 开启状态", value: "true", group: "security", editable: false },
  { key: "security.ipWhitelist", label: "控制台 IP 访问白名单", value: "", group: "security", editable: true },
  { key: "security.stepUpSessionTtlMinutes", label: "高危操作提权时效(分钟)", value: "15", group: "security", editable: true },
  { key: "security.stepUpVerificationMode", label: "高危操作验证模式", value: "totp_or_password", group: "security", editable: true },
  { key: "security.maxFailedAttempts", label: "连续鉴权失败锁定次数", value: "5", group: "security", editable: true },
  { key: "security.cookieHttpOnly", label: "HttpOnly Cookie", value: "true", group: "security", editable: false }
];

export const mockDeploymentTargets: DeploymentTarget[] = [
  { id: "d1", mode: "static", name: "纯静态 CDN", status: "ready", updatedAt: now - 2 * day, complexity: "low" },
  { id: "d2", mode: "nginx", name: "Nginx 反代", status: "ready", updatedAt: now - day, complexity: "medium" },
  { id: "d3", mode: "rust-embed", name: "Rust 内置 embed", status: "building", updatedAt: now - 30 * min, complexity: "high" }
];

/**
 * Per-server ping probe targets for the detail-page latency chart. Each box
 * pings its own set of targets (gateway / DNS / public ingress / neighbor
 * nodes), and the count is intentionally arbitrary — 0..n, different per
 * server — so the multi-line chart and its "未配置探测点" empty state both have
 * live data to render against. A server with no entry (or an empty array)
 * emits samples with an empty `probes` list.
 *
 * Targets double as their own label; the address is what the agent probes and
 * what the legend shows.
 */
export const mockPingProbes: Record<string, string[]> = {
  "srv-hkg-01": ["网关 10.0.0.1", "DNS 1.1.1.1", "公网 baidu.com", "邻近 tok-01"],
  "srv-hkg-02": ["网关 10.0.0.1", "DNS 8.8.8.8", "公网 google.com"],
  "srv-tok-01": ["网关 10.0.1.1", "DNS 1.1.1.1", "公网 yahoo.co.jp", "邻近 hkg-01", "邻近 lax-01"],
  "srv-sgp-01": ["网关 10.0.2.1", "DNS 1.1.1.1", "公网 baidu.com"],
  "srv-sgp-02": ["DNS 8.8.8.8"],
  "srv-lax-01": ["网关 10.0.3.1", "DNS 8.8.8.8", "公网 cloudflare.com", "邻近 tok-01"],
  "srv-sha-01": ["网关 10.0.4.1", "DNS 223.5.5.5", "公网 baidu.com", "邻近 hkg-01", "邻近 sgp-01"],
  "srv-fra-01": ["网关 10.0.5.1", "DNS 1.1.1.1", "公网 google.com"],
  "srv-syd-01": ["网关 10.0.6.1", "公网 cloudflare.com"],
  "srv-unknown": []
};
