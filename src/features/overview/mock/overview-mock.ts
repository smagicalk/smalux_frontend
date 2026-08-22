import type { NodePulse, IncidentItem, LiveEventItem } from "../types";

export const MOCK_HUD_STATS = {
  healthScore: 98.4,
  onlineRate: 96,
  sla: 99.98,
  throughput: "1.45 GB/s",
  activeConnections: "1,420 活跃"
};

export const MOCK_FLEET_NODES: NodePulse[] = [
  // 1. 网关与反向代理 (5)
  { id: "srv-hkg-01", name: "hk-gateway-01", group: "网关与反向代理", region: "香港 (CN-HK)", ip: "43.154.21.90", status: "online", cpu: 32, memory: 58, disk: 44, latency: 12, uptime: "48天" },
  { id: "srv-hkg-02", name: "hk-gateway-02", group: "网关与反向代理", region: "香港 (CN-HK)", ip: "43.154.21.91", status: "online", cpu: 28, memory: 54, disk: 42, latency: 13, uptime: "48天" },
  { id: "srv-lhr-01", name: "uk-edge-gateway-01", group: "网关与反向代理", region: "伦敦 (GB-LHR)", ip: "18.130.80.66", status: "online", cpu: 22, memory: 48, disk: 38, latency: 165, uptime: "35天" },
  { id: "srv-dxb-01", name: "me-dubai-hub-01", group: "网关与反向代理", region: "迪拜 (AE-DXB)", ip: "157.175.40.12", status: "online", cpu: 31, memory: 52, disk: 40, latency: 140, uptime: "20天" },
  { id: "srv-sin-01", name: "sg-edge-gateway-01", group: "网关与反向代理", region: "新加坡 (SG-SIN)", ip: "13.214.10.88", status: "online", cpu: 25, memory: 50, disk: 38, latency: 36, uptime: "60天" },

  // 2. 全球边缘 CDN (7)
  { id: "srv-tok-01", name: "jp-edge-pop-01", group: "全球边缘 CDN", region: "东京 (JP-TYO)", ip: "18.176.44.201", status: "warning", cpu: 89, memory: 76, disk: 68, latency: 28, uptime: "62天" },
  { id: "srv-bjs-01", name: "bj-edge-node-01", group: "全球边缘 CDN", region: "北京 (CN-BJS)", ip: "120.92.14.33", status: "online", cpu: 46, memory: 62, disk: 55, latency: 8, uptime: "90天" },
  { id: "srv-sha-01", name: "sh-edge-node-02", group: "全球边缘 CDN", region: "上海 (CN-SHA)", ip: "139.196.88.74", status: "online", cpu: 38, memory: 58, disk: 50, latency: 6, uptime: "90天" },
  { id: "srv-can-01", name: "gz-edge-node-03", group: "全球边缘 CDN", region: "广州 (CN-CAN)", ip: "14.215.177.38", status: "online", cpu: 42, memory: 60, disk: 52, latency: 9, uptime: "85天" },
  { id: "srv-syd-01", name: "au-oceania-pop-01", group: "全球边缘 CDN", region: "悉尼 (AU-SYD)", ip: "13.239.55.101", status: "online", cpu: 26, memory: 44, disk: 36, latency: 128, uptime: "14天" },
  { id: "srv-iad-01", name: "us-east-proxy-01", group: "全球边缘 CDN", region: "弗吉尼亚 (US-IAD)", ip: "3.235.110.45", status: "online", cpu: 34, memory: 50, disk: 41, latency: 180, uptime: "42天" },
  { id: "srv-fra-07", name: "eu-frankfurt-pop-01", group: "全球边缘 CDN", region: "法兰克福 (DE-FRA)", ip: "3.120.90.15", status: "online", cpu: 44, memory: 58, disk: 48, latency: 154, uptime: "75天" },

  // 3. 核心业务微服务 (7)
  { id: "srv-hkg-03", name: "hk-core-api-01", group: "核心业务微服务", region: "香港 (CN-HK)", ip: "43.154.88.12", status: "online", cpu: 52, memory: 68, disk: 48, latency: 14, uptime: "48天" },
  { id: "srv-hkg-04", name: "hk-core-api-02", group: "核心业务微服务", region: "香港 (CN-HK)", ip: "43.154.88.13", status: "online", cpu: 46, memory: 64, disk: 45, latency: 14, uptime: "48天" },
  { id: "srv-sgp-01", name: "sg-prod-api-01", group: "核心业务微服务", region: "新加坡 (SG-SIN)", ip: "13.214.88.10", status: "online", cpu: 45, memory: 68, disk: 51, latency: 38, uptime: "19天" },
  { id: "srv-sgp-02", name: "sg-prod-api-02", group: "核心业务微服务", region: "新加坡 (SG-SIN)", ip: "13.214.88.11", status: "warning", cpu: 82, memory: 84, disk: 58, latency: 40, uptime: "19天" },
  { id: "srv-fra-02", name: "eu-core-node-02", group: "核心业务微服务", region: "法兰克福 (DE-FRA)", ip: "3.120.45.22", status: "online", cpu: 38, memory: 56, disk: 45, latency: 155, uptime: "30天" },
  { id: "srv-sjc-03", name: "us-core-api-01", group: "核心业务微服务", region: "硅谷 (US-SJC)", ip: "54.183.90.115", status: "online", cpu: 41, memory: 60, disk: 46, latency: 142, uptime: "25天" },
  { id: "srv-tok-06", name: "jp-core-api-01", group: "核心业务微服务", region: "东京 (JP-TYO)", ip: "18.176.55.60", status: "online", cpu: 39, memory: 62, disk: 42, latency: 29, uptime: "40天" },

  // 4. 高可用数据库 (5)
  { id: "srv-tok-02", name: "jp-db-master-01", group: "高可用数据库", region: "东京 (JP-TYO)", ip: "18.176.44.202", status: "online", cpu: 48, memory: 82, disk: 64, latency: 30, uptime: "120天" },
  { id: "srv-tok-04", name: "jp-db-slave-01", group: "高可用数据库", region: "东京 (JP-TYO)", ip: "18.176.44.204", status: "online", cpu: 36, memory: 76, disk: 64, latency: 30, uptime: "120天" },
  { id: "srv-hkg-05", name: "hk-db-master-01", group: "高可用数据库", region: "香港 (CN-HK)", ip: "43.154.99.201", status: "online", cpu: 54, memory: 84, disk: 70, latency: 15, uptime: "90天" },
  { id: "srv-fra-03", name: "eu-db-standby-01", group: "高可用数据库", region: "法兰克福 (DE-FRA)", ip: "3.120.45.25", status: "online", cpu: 22, memory: 62, disk: 60, latency: 160, uptime: "90天" },
  { id: "srv-sgp-09", name: "sg-db-replica-01", group: "高可用数据库", region: "新加坡 (SG-SIN)", ip: "13.214.88.35", status: "online", cpu: 34, memory: 78, disk: 62, latency: 38, uptime: "90天" },

  // 5. Redis 缓存集群 (4)
  { id: "srv-tok-03", name: "jp-redis-cache-01", group: "Redis 缓存集群", region: "东京 (JP-TYO)", ip: "18.176.44.203", status: "online", cpu: 24, memory: 78, disk: 22, latency: 29, uptime: "120天" },
  { id: "srv-hkg-06", name: "hk-redis-cluster-01", group: "Redis 缓存集群", region: "香港 (CN-HK)", ip: "43.154.99.202", status: "online", cpu: 28, memory: 80, disk: 26, latency: 14, uptime: "90天" },
  { id: "srv-sgp-04", name: "sg-redis-cache-01", group: "Redis 缓存集群", region: "新加坡 (SG-SIN)", ip: "13.214.88.22", status: "online", cpu: 30, memory: 75, disk: 24, latency: 38, uptime: "60天" },
  { id: "srv-fra-08", name: "eu-redis-cache-01", group: "Redis 缓存集群", region: "法兰克福 (DE-FRA)", ip: "3.120.45.88", status: "online", cpu: 26, memory: 72, disk: 20, latency: 158, uptime: "60天" },

  // 6. 消息队列 Kafka (4)
  { id: "srv-sgp-03", name: "sg-kafka-broker-01", group: "消息队列 Kafka", region: "新加坡 (SG-SIN)", ip: "13.214.88.19", status: "online", cpu: 56, memory: 72, disk: 62, latency: 39, uptime: "45天" },
  { id: "srv-sgp-05", name: "sg-kafka-broker-02", group: "消息队列 Kafka", region: "新加坡 (SG-SIN)", ip: "13.214.88.20", status: "online", cpu: 52, memory: 70, disk: 60, latency: 39, uptime: "45天" },
  { id: "srv-sgp-06", name: "sg-kafka-broker-03", group: "消息队列 Kafka", region: "新加坡 (SG-SIN)", ip: "13.214.88.21", status: "online", cpu: 48, memory: 68, disk: 58, latency: 40, uptime: "45天" },
  { id: "srv-tok-07", name: "jp-kafka-broker-01", group: "消息队列 Kafka", region: "东京 (JP-TYO)", ip: "18.176.44.210", status: "online", cpu: 50, memory: 70, disk: 55, latency: 30, uptime: "45天" },

  // 7. AI 算力与推理 (5)
  { id: "srv-sjc-01", name: "us-ai-runner-01", group: "AI 算力与推理", region: "硅谷 (US-SJC)", ip: "54.183.90.112", status: "online", cpu: 65, memory: 74, disk: 56, latency: 145, uptime: "12天" },
  { id: "srv-sjc-02", name: "us-ai-runner-02", group: "AI 算力与推理", region: "硅谷 (US-SJC)", ip: "54.183.90.113", status: "warning", cpu: 94, memory: 88, disk: 60, latency: 146, uptime: "12天" },
  { id: "srv-sjc-04", name: "us-ai-runner-03", group: "AI 算力与推理", region: "硅谷 (US-SJC)", ip: "54.183.90.114", status: "online", cpu: 58, memory: 70, disk: 52, latency: 145, uptime: "12天" },
  { id: "srv-tok-05", name: "jp-gpu-infer-01", group: "AI 算力与推理", region: "东京 (JP-TYO)", ip: "18.176.44.205", status: "online", cpu: 62, memory: 76, disk: 54, latency: 29, uptime: "30天" },
  { id: "srv-sjc-06", name: "us-ai-runner-04", group: "AI 算力与推理", region: "硅谷 (US-SJC)", ip: "54.183.90.118", status: "online", cpu: 68, memory: 76, disk: 58, latency: 144, uptime: "12天" },

  // 8. 实时通信与流媒体 (4)
  { id: "srv-hkg-07", name: "hk-rtc-stream-01", group: "实时通信与流媒体", region: "香港 (CN-HK)", ip: "43.154.101.10", status: "online", cpu: 44, memory: 52, disk: 35, latency: 13, uptime: "40天" },
  { id: "srv-sgp-07", name: "sg-live-relay-01", group: "实时通信与流媒体", region: "新加坡 (SG-SIN)", ip: "13.214.99.50", status: "online", cpu: 48, memory: 55, disk: 38, latency: 37, uptime: "40天" },
  { id: "srv-fra-04", name: "eu-rtc-stream-01", group: "实时通信与流媒体", region: "法兰克福 (DE-FRA)", ip: "3.120.55.80", status: "online", cpu: 36, memory: 48, disk: 32, latency: 158, uptime: "25天" },
  { id: "srv-tok-08", name: "jp-rtc-media-01", group: "实时通信与流媒体", region: "东京 (JP-TYO)", ip: "18.176.44.222", status: "online", cpu: 42, memory: 50, disk: 36, latency: 28, uptime: "30天" },

  // 9. 日志与大数据计算 (4)
  { id: "srv-fra-05", name: "eu-es-master-01", group: "日志与大数据计算", region: "法兰克福 (DE-FRA)", ip: "3.120.60.11", status: "online", cpu: 60, memory: 82, disk: 75, latency: 155, uptime: "80天" },
  { id: "srv-fra-06", name: "eu-es-data-01", group: "日志与大数据计算", region: "法兰克福 (DE-FRA)", ip: "3.120.60.12", status: "online", cpu: 64, memory: 85, disk: 78, latency: 156, uptime: "80天" },
  { id: "srv-sgp-08", name: "sg-clickhouse-01", group: "日志与大数据计算", region: "新加坡 (SG-SIN)", ip: "13.214.102.30", status: "online", cpu: 55, memory: 78, disk: 68, latency: 39, uptime: "50天" },
  { id: "srv-tok-09", name: "jp-clickhouse-01", group: "日志与大数据计算", region: "东京 (JP-TYO)", ip: "18.176.44.230", status: "online", cpu: 58, memory: 80, disk: 70, latency: 31, uptime: "50天" },

  // 10. 安全与 WAF 防护 (3)
  { id: "srv-hkg-08", name: "hk-waf-shield-01", group: "安全与 WAF 防护", region: "香港 (CN-HK)", ip: "43.154.210.10", status: "online", cpu: 35, memory: 46, disk: 30, latency: 11, uptime: "100天" },
  { id: "srv-sjc-05", name: "us-waf-shield-01", group: "安全与 WAF 防护", region: "硅谷 (US-SJC)", ip: "54.183.120.55", status: "online", cpu: 32, memory: 44, disk: 28, latency: 140, uptime: "100天" },
  { id: "srv-fra-09", name: "eu-waf-shield-01", group: "安全与 WAF 防护", region: "法兰克福 (DE-FRA)", ip: "3.120.70.33", status: "online", cpu: 30, memory: 42, disk: 25, latency: 156, uptime: "100天" },

  // 11. 存储与冷备容灾 (4)
  { id: "srv-fra-01", name: "eu-backup-vault-01", group: "存储与冷备容灾", region: "法兰克福 (DE-FRA)", ip: "3.120.45.19", status: "online", cpu: 18, memory: 42, disk: 92, latency: 160, uptime: "150天" },
  { id: "srv-gru-01", name: "sa-brazil-vault-01", group: "存储与冷备容灾", region: "圣保罗 (BR-GRU)", ip: "18.231.10.85", status: "online", cpu: 20, memory: 45, disk: 66, latency: 280, uptime: "25天" },
  { id: "srv-offline-01", name: "cd-backup-vault-01", group: "存储与冷备容灾", region: "成都 (CN-CTU)", ip: "118.112.18.99", status: "offline", cpu: undefined as unknown as number, memory: undefined as unknown as number, disk: undefined as unknown as number, latency: 0, uptime: "已离线" },
  { id: "srv-partial-01", name: "kr-baremetal-01", group: "存储与冷备容灾", region: "首尔 (KR-ICN)", ip: "15.164.22.10", status: "online", cpu: 16, memory: undefined as unknown as number, disk: 35, latency: 45, uptime: "12天" },
  { id: "srv-hkg-09", name: "hk-cold-backup-01", group: "存储与冷备容灾", region: "香港 (CN-HK)", ip: "43.154.220.80", status: "online", cpu: 16, memory: 38, disk: 88, latency: 14, uptime: "180天" }
];

export const MOCK_INCIDENTS: IncidentItem[] = [
  {
    id: "inc-1",
    severity: "warning",
    ruleName: "CPU 瞬时高负载告警",
    serverName: "jp-edge-pop-01 (Tokyo)",
    serverId: "srv-tok-01",
    currentValue: "89%",
    threshold: "> 80%",
    duration: "持续 6 分钟",
    acknowledged: false,
    silenced: false
  },
  {
    id: "inc-2",
    severity: "warning",
    ruleName: "微服务容器负载偏高",
    serverName: "sg-prod-api-02 (Singapore)",
    serverId: "srv-sgp-02",
    currentValue: "82%",
    threshold: "> 80%",
    duration: "持续 14 分钟",
    acknowledged: false,
    silenced: false
  },
  {
    id: "inc-3",
    severity: "critical",
    ruleName: "节点离线超过 60s",
    serverName: "cd-edge-backup-04 (Chengdu)",
    serverId: "srv-ctu-01",
    currentValue: "Offline",
    threshold: "心跳丢失",
    duration: "持续 30 分钟",
    acknowledged: false,
    silenced: false
  },
  {
    id: "inc-4",
    severity: "critical",
    ruleName: "磁盘容量达到警戒水位",
    serverName: "eu-backup-vault-01 (Frankfurt)",
    serverId: "srv-fra-01",
    currentValue: "92%",
    threshold: "> 90%",
    duration: "持续 24 分钟",
    acknowledged: true,
    silenced: false
  },
  {
    id: "inc-5",
    severity: "info",
    ruleName: "出站网络突发流量上升",
    serverName: "hk-core-api-01 (Hong Kong)",
    serverId: "srv-hkg-03",
    currentValue: "180 MB/s",
    threshold: "> 150 MB/s",
    duration: "持续 2 分钟",
    acknowledged: false,
    silenced: true
  },
  {
    id: "inc-6",
    severity: "critical",
    ruleName: "GPU 显存与负载达到 94%",
    serverName: "us-ai-runner-02 (Silicon Valley)",
    serverId: "srv-sjc-02",
    currentValue: "94%",
    threshold: "> 90%",
    duration: "持续 18 分钟",
    acknowledged: false,
    silenced: false
  },
  {
    id: "inc-7",
    severity: "warning",
    ruleName: "TCP 连接数接近系统上限",
    serverName: "bj-edge-node-01 (Beijing)",
    serverId: "srv-bjs-01",
    currentValue: "48,200",
    threshold: "> 45,000",
    duration: "持续 10 分钟",
    acknowledged: false,
    silenced: false
  },
  {
    id: "inc-8",
    severity: "warning",
    ruleName: "冷备同步延迟超过 15 分钟",
    serverName: "sa-brazil-vault-01 (São Paulo)",
    serverId: "srv-gru-01",
    currentValue: "18m 40s",
    threshold: "> 15m",
    duration: "持续 32 分钟",
    acknowledged: false,
    silenced: false
  }
];

export const MOCK_LIVE_EVENTS: LiveEventItem[] = [
  { id: "e1", tag: "AGENT", text: "节点 hk-gateway-01 Agent 心跳握手成功 (v1.4.2)", time: "2秒前", color: "text-emerald-500" },
  { id: "e2", tag: "CRON", text: "计划任务 [每日数据库备份] 执行完毕 (耗时 3.2s, 状态 OK)", time: "18秒前", color: "text-primary" },
  { id: "e3", tag: "PING", text: "探针 HTTP: api.smalux.com 探活响应正常 (21ms)", time: "45秒前", color: "text-emerald-500" },
  { id: "e4", tag: "AUTH", text: "管理员 admin 从 116.228.84.12 登录指挥控制台", time: "2分钟前", color: "text-sky-500" },
  { id: "e5", tag: "TASK", text: "自动化命令 [Docker 镜像修剪] 在 8 台节点执行完毕", time: "5分钟前", color: "text-violet-500" },
  { id: "e6", tag: "AGENT", text: "节点 us-ai-runner-01 GPU 温度采集正常 (42°C)", time: "8分钟前", color: "text-emerald-500" },
  { id: "e7", tag: "CRON", text: "计划任务 [Nginx 访问日志切分归档] 执行成功", time: "12分钟前", color: "text-primary" },
  { id: "e8", tag: "PING", text: "探针 TCP: db-master-01:5432 连通性测试通过 (3ms)", time: "15分钟前", color: "text-emerald-500" },
  { id: "e9", tag: "AUTH", text: "CI/CD 服务凭证 [deploy-bot] 调用 agent.list 接口", time: "22分钟前", color: "text-muted-foreground" },
  { id: "e10", tag: "TASK", text: "分发任务 [全网 NTP 时间同步] 在 49 台节点完成同步", time: "30分钟前", color: "text-violet-500" }
];
