import type { HostServer, PingTarget, AgentInstallCommand } from "../types";

export const MOCK_HOST_SERVERS: HostServer[] = [
  // 0. 🧪 测试场景与边界节点 (Dedicated Test Group for Process & Remote Execution Matrix)
  {
    id: "srv-test-normal",
    name: "test-01-full-featured",
    ip: "10.0.99.1",
    region: "Tokyo (AP-NRT)",
    group: "测试场景分组",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 24,
    memory: 48,
    disk: 38,
    uptime: "28天 6小时",
    load: "0.28, 0.35, 0.40",
    networkIn: "85 MB/s",
    networkOut: "112 MB/s",
    allowRemoteExec: true,
    enableProcessCollection: true,
    processCollectionMode: "enabled",
    note: "【测试01】标准全功能节点 · 自动采集开启 · 允许远程 Kill",
    lastSeenAt: Date.now() - 1000
  },
  {
    id: "srv-test-noauto",
    name: "test-02-no-auto-collect",
    ip: "10.0.99.2",
    region: "Seoul (AP-ICN)",
    group: "测试场景分组",
    os: "Ubuntu 22.04",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 15,
    memory: 36,
    disk: 42,
    uptime: "14天 2小时",
    load: "0.12, 0.18, 0.15",
    networkIn: "24 MB/s",
    networkOut: "38 MB/s",
    allowRemoteExec: true,
    enableProcessCollection: false,
    processCollectionMode: "disable_auto", // ⭐ 1. 仅禁止自动常驻采集 (允许即时采样)
    note: "【测试02】仅禁止自动常驻采集 · 遮罩展示快照 · 点击【立即单次采样】可成功更新快照",
    lastSeenAt: Date.now() - 1500
  },
  {
    id: "srv-test-forbidden",
    name: "test-03-forbidden-collect",
    ip: "10.0.99.3",
    region: "Osaka (JP-KIX)",
    group: "测试场景分组",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 16,
    memory: 40,
    disk: 30,
    uptime: "20天 8小时",
    load: "0.18, 0.22, 0.20",
    networkIn: "20 MB/s",
    networkOut: "30 MB/s",
    allowRemoteExec: true,
    enableProcessCollection: false,
    processCollectionMode: "forbidden", // ⭐ 2. 全部禁止采集 (探针硬禁用，单次采样也被拒)
    note: "【测试03】全部禁止采集 · 探针硬禁用 · 点击【立即单次采样】服务器返回拒绝并弹出红字气泡",
    lastSeenAt: Date.now() - 1800
  },
  {
    id: "srv-test-noremote",
    name: "test-04-no-remote-exec",
    ip: "10.0.99.4",
    region: "Singapore (AP-SIN)",
    group: "测试场景分组",
    os: "Alpine Linux 3.19",
    arch: "aarch64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 18,
    memory: 52,
    disk: 28,
    uptime: "45天 18小时",
    load: "0.45, 0.32, 0.28",
    networkIn: "45 MB/s",
    networkOut: "62 MB/s",
    allowRemoteExec: false, // ⭐ 禁用远程 Kill 权限
    enableProcessCollection: true,
    processCollectionMode: "enabled",
    note: "【测试04】禁用远程执行权限 · 进程正常采集 · 但 Kill 按钮置灰禁用 (allowRemoteExec: false)",
    lastSeenAt: Date.now() - 2000
  },
  {
    id: "srv-test-mixed",
    name: "test-05-mixed-forbidden-and-noremote",
    ip: "10.0.99.5",
    region: "Frankfurt (EU-FRA)",
    group: "测试场景分组",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 22,
    memory: 45,
    disk: 35,
    uptime: "30天 12小时",
    load: "0.20, 0.25, 0.22",
    networkIn: "32 MB/s",
    networkOut: "48 MB/s",
    allowRemoteExec: false, // ⭐ 禁用远程 Kill
    enableProcessCollection: false,
    processCollectionMode: "forbidden", // ⭐ 全部禁止进程采集 (双重禁用)
    note: "【测试05混合】全部禁止采集 + 禁用远程 Kill · 采样被拒弹出红字 · 抽屉内 Kill 同样置灰",
    lastSeenAt: Date.now() - 1200
  },
  {
    id: "srv-test-offline",
    name: "test-06-offline-node",
    ip: "10.0.99.6",
    region: "Chengdu (CN-CTU)",
    group: "测试场景分组",
    os: "Ubuntu 22.04",
    arch: "x86_64",
    agentVersion: "1.4.0",
    status: "offline", // ⭐ 离线故障节点
    cpu: undefined as unknown as number,
    memory: undefined as unknown as number,
    disk: undefined as unknown as number,
    uptime: "",
    load: "—",
    networkIn: "",
    networkOut: "",
    allowRemoteExec: false,
    enableProcessCollection: false,
    processCollectionMode: "forbidden",
    note: "【测试06】离线故障节点 · 探针心跳中断 · 所有实时操作与采样安全锁定",
    lastSeenAt: Date.now() - 3600000 * 24
  },

  // 1. 网关集群 (Gateway)
  {
    id: "srv-hkg-01",
    name: "edge-hkg-01",
    ip: "43.154.21.90",
    region: "Hong Kong (CN-HK)",
    group: "网关集群",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 18,
    memory: 54,
    disk: 42,
    uptime: "48天 12小时",
    load: "0.24, 0.38, 0.41",
    networkIn: "142 MB/s",
    networkOut: "188 MB/s",
    allowRemoteExec: true,
    enableProcessCollection: true,
    note: "CNY 45/mo · BGP Anycast · auto-renew",
    price: 45,
    currency: "CNY",
    expiresAt: Date.UTC(2027, 2, 15),
    billingCycle: "biennial",
    lastSeenAt: Date.now() - 1000
  },
  {
    id: "srv-hkg-02",
    name: "hk-gateway-02",
    ip: "43.154.21.91",
    region: "Hong Kong (CN-HK)",
    group: "网关集群",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 22,
    memory: 48,
    disk: 38,
    uptime: "48天 10小时",
    load: "0.31, 0.42, 0.45",
    networkIn: "128 MB/s",
    networkOut: "172 MB/s",
    note: "CNY 45/mo · BGP Anycast",
    price: 45,
    currency: "CNY",
    expiresAt: Date.UTC(2027, 2, 15),
    billingCycle: "biennial",
    lastSeenAt: Date.now() - 1200
  },
  {
    id: "srv-sin-01",
    name: "sg-gateway-01",
    ip: "13.214.88.42",
    region: "Singapore (AP-SIN)",
    group: "网关集群",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 26,
    memory: 62,
    disk: 40,
    uptime: "65天 8小时",
    load: "0.45, 0.52, 0.48",
    networkIn: "210 MB/s",
    networkOut: "245 MB/s",
    note: "USD 12/mo · AWS Ingress Point",
    price: 12,
    currency: "USD",
    expiresAt: Date.UTC(2026, 11, 20),
    billingCycle: "monthly",
    lastSeenAt: Date.now() - 800
  },
  {
    id: "srv-sjc-01",
    name: "us-west-gw-01",
    ip: "54.193.11.23",
    region: "Silicon Valley (US-SJC)",
    group: "网关集群",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 31,
    memory: 58,
    disk: 46,
    uptime: "90天 14小时",
    load: "0.55, 0.61, 0.58",
    networkIn: "185 MB/s",
    networkOut: "220 MB/s",
    note: "USD 24/mo · HE.net BGP",
    price: 24,
    currency: "USD",
    expiresAt: Date.UTC(2027, 3, 10),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1100
  },
  {
    id: "srv-fra-01",
    name: "eu-gateway-01",
    ip: "3.65.120.89",
    region: "Frankfurt (EU-FRA)",
    group: "网关集群",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 24,
    memory: 50,
    disk: 44,
    uptime: "52天 6小时",
    load: "0.38, 0.44, 0.40",
    networkIn: "160 MB/s",
    networkOut: "190 MB/s",
    note: "EUR 15/mo · DE-CIX IXP Peering",
    price: 15,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 1, 28),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1500
  },

  // 2. 边缘 CDN 分发 (CDN Edge)
  {
    id: "srv-tok-01",
    name: "jp-edge-pop-01",
    ip: "18.176.44.201",
    region: "Tokyo (JP-TYO)",
    group: "边缘 CDN 分发",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "warning",
    cpu: 86,
    memory: 88,
    disk: 74,
    uptime: "34天 2小时",
    load: "2.10, 1.85, 1.62",
    networkIn: "680 MB/s",
    networkOut: "920 MB/s",
    note: "JPY 980/mo · NTT / IIJ Route",
    price: 980,
    currency: "JPY",
    expiresAt: Date.UTC(2027, 0, 20),
    billingCycle: "monthly",
    lastSeenAt: Date.now() - 2500
  },
  {
    id: "srv-tok-02",
    name: "jp-edge-pop-02",
    ip: "18.176.44.202",
    region: "Tokyo (JP-TYO)",
    group: "边缘 CDN 分发",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 38,
    memory: 64,
    disk: 52,
    uptime: "45天 18小时",
    load: "0.62, 0.70, 0.65",
    networkIn: "340 MB/s",
    networkOut: "480 MB/s",
    note: "JPY 980/mo · JPIX Direct",
    price: 980,
    currency: "JPY",
    expiresAt: Date.UTC(2027, 0, 20),
    billingCycle: "monthly",
    lastSeenAt: Date.now() - 1400
  },
  {
    id: "srv-sel-01",
    name: "kr-edge-node-01",
    ip: "15.164.28.14",
    region: "Seoul (AP-SEL)",
    group: "边缘 CDN 分发",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 32,
    memory: 56,
    disk: 48,
    uptime: "41天 11小时",
    load: "0.52, 0.58, 0.54",
    networkIn: "290 MB/s",
    networkOut: "410 MB/s",
    note: "USD 18/mo · KINX Peering",
    price: 18,
    currency: "USD",
    expiresAt: Date.UTC(2026, 10, 15),
    billingCycle: "monthly",
    lastSeenAt: Date.now() - 900
  },
  {
    id: "srv-lon-01",
    name: "uk-edge-pop-01",
    ip: "35.178.92.11",
    region: "London (EU-LON)",
    group: "边缘 CDN 分发",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 28,
    memory: 52,
    disk: 45,
    uptime: "72天 9小时",
    load: "0.42, 0.48, 0.46",
    networkIn: "240 MB/s",
    networkOut: "310 MB/s",
    note: "GBP 12/mo · LINX Gateway",
    price: 12,
    currency: "GBP",
    expiresAt: Date.UTC(2027, 4, 1),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1300
  },
  {
    id: "srv-iad-01",
    name: "us-east-edge-01",
    ip: "3.88.214.77",
    region: "Virginia (US-IAD)",
    group: "边缘 CDN 分发",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 35,
    memory: 60,
    disk: 50,
    uptime: "85天 22小时",
    load: "0.58, 0.64, 0.60",
    networkIn: "310 MB/s",
    networkOut: "430 MB/s",
    note: "USD 20/mo · Equinix Ashburn",
    price: 20,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 18),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1050
  },
  {
    id: "srv-syd-01",
    name: "au-edge-pop-01",
    ip: "13.239.55.19",
    region: "Sydney (AP-SYD)",
    group: "边缘 CDN 分发",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 22,
    memory: 46,
    disk: 40,
    uptime: "29天 14小时",
    load: "0.34, 0.40, 0.38",
    networkIn: "180 MB/s",
    networkOut: "230 MB/s",
    note: "AUD 22/mo · NSW Anycast",
    price: 22,
    currency: "AUD",
    expiresAt: Date.UTC(2026, 9, 30),
    billingCycle: "monthly",
    lastSeenAt: Date.now() - 1600
  },

  // 3. 核心业务微服务 (Core API)
  {
    id: "srv-hkg-03",
    name: "hk-core-api-01",
    ip: "43.154.88.12",
    region: "Hong Kong (CN-HK)",
    group: "核心业务微服务",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 45,
    memory: 68,
    disk: 55,
    uptime: "54天 20小时",
    load: "0.85, 0.92, 0.88",
    networkIn: "95 MB/s",
    networkOut: "140 MB/s",
    note: "CNY 120/mo · 10Gbps CN2 GIA",
    price: 120,
    currency: "CNY",
    expiresAt: Date.UTC(2027, 5, 30),
    billingCycle: "triennial",
    lastSeenAt: Date.now() - 1500
  },
  {
    id: "srv-hkg-04",
    name: "hk-core-api-02",
    ip: "43.154.88.13",
    region: "Hong Kong (CN-HK)",
    group: "核心业务微服务",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 42,
    memory: 65,
    disk: 52,
    uptime: "54天 19小时",
    load: "0.78, 0.86, 0.82",
    networkIn: "88 MB/s",
    networkOut: "132 MB/s",
    note: "CNY 120/mo · CN2 GIA Secondary",
    price: 120,
    currency: "CNY",
    expiresAt: Date.UTC(2027, 5, 30),
    billingCycle: "triennial",
    lastSeenAt: Date.now() - 1400
  },
  {
    id: "srv-sin-02",
    name: "sg-order-srv-01",
    ip: "13.214.90.31",
    region: "Singapore (AP-SIN)",
    group: "核心业务微服务",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 36,
    memory: 58,
    disk: 44,
    uptime: "38天 12小时",
    load: "0.62, 0.68, 0.65",
    networkIn: "76 MB/s",
    networkOut: "115 MB/s",
    note: "USD 35/mo · ECS c7g.xlarge",
    price: 35,
    currency: "USD",
    expiresAt: Date.UTC(2027, 1, 10),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1000
  },
  {
    id: "srv-sin-03",
    name: "sg-user-srv-01",
    ip: "13.214.90.32",
    region: "Singapore (AP-SIN)",
    group: "核心业务微服务",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 30,
    memory: 52,
    disk: 40,
    uptime: "38天 10小时",
    load: "0.50, 0.56, 0.52",
    networkIn: "65 MB/s",
    networkOut: "92 MB/s",
    note: "USD 35/mo · ECS c7g.xlarge",
    price: 35,
    currency: "USD",
    expiresAt: Date.UTC(2027, 1, 10),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1100
  },
  {
    id: "srv-fra-02",
    name: "eu-billing-srv-01",
    ip: "3.65.122.40",
    region: "Frankfurt (EU-FRA)",
    group: "核心业务微服务",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 28,
    memory: 50,
    disk: 38,
    uptime: "45天 7小时",
    load: "0.45, 0.50, 0.48",
    networkIn: "52 MB/s",
    networkOut: "78 MB/s",
    note: "EUR 28/mo · GDPR Compliant",
    price: 28,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 3, 15),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1200
  },
  {
    id: "srv-iad-02",
    name: "us-auth-srv-01",
    ip: "3.88.215.10",
    region: "Virginia (US-IAD)",
    group: "核心业务微服务",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 34,
    memory: 56,
    disk: 42,
    uptime: "60天 16小时",
    load: "0.58, 0.65, 0.60",
    networkIn: "70 MB/s",
    networkOut: "105 MB/s",
    note: "USD 32/mo · OAuth2 Cluster",
    price: 32,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 20),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 950
  },

  // 4. 高可用数据库 (Database Cluster)
  {
    id: "srv-tok-03",
    name: "jp-db-master-01",
    ip: "18.176.45.10",
    region: "Tokyo (JP-TYO)",
    group: "高可用数据库",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 58,
    memory: 76,
    disk: 68,
    uptime: "120天 15小时",
    load: "1.25, 1.30, 1.28",
    networkIn: "110 MB/s",
    networkOut: "165 MB/s",
    note: "JPY 4500/mo · NVMe HA Cluster",
    price: 4500,
    currency: "JPY",
    expiresAt: Date.UTC(2027, 6, 1),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1300
  },
  {
    id: "srv-tok-04",
    name: "jp-db-replica-01",
    ip: "18.176.45.11",
    region: "Tokyo (JP-TYO)",
    group: "高可用数据库",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 35,
    memory: 72,
    disk: 65,
    uptime: "120天 14小时",
    load: "0.65, 0.72, 0.70",
    networkIn: "95 MB/s",
    networkOut: "45 MB/s",
    note: "JPY 3800/mo · Read Replica",
    price: 3800,
    currency: "JPY",
    expiresAt: Date.UTC(2027, 6, 1),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1400
  },
  {
    id: "srv-sin-04",
    name: "sg-db-master-01",
    ip: "13.214.92.50",
    region: "Singapore (AP-SIN)",
    group: "高可用数据库",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 52,
    memory: 74,
    disk: 62,
    uptime: "98天 8小时",
    load: "1.10, 1.15, 1.12",
    networkIn: "105 MB/s",
    networkOut: "155 MB/s",
    note: "USD 65/mo · PostgreSQL 16 HA",
    price: 65,
    currency: "USD",
    expiresAt: Date.UTC(2027, 4, 12),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1200
  },
  {
    id: "srv-fra-03",
    name: "eu-db-master-01",
    ip: "3.65.125.80",
    region: "Frankfurt (EU-FRA)",
    group: "高可用数据库",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 48,
    memory: 70,
    disk: 58,
    uptime: "110天 20小时",
    load: "0.95, 1.02, 0.98",
    networkIn: "88 MB/s",
    networkOut: "130 MB/s",
    note: "EUR 55/mo · Frankfurt Multi-AZ",
    price: 55,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 3, 25),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1500
  },
  {
    id: "srv-iad-03",
    name: "us-db-analytics-01",
    ip: "3.88.218.44",
    region: "Virginia (US-IAD)",
    group: "高可用数据库",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 62,
    memory: 82,
    disk: 75,
    uptime: "80天 5小时",
    load: "1.40, 1.48, 1.42",
    networkIn: "140 MB/s",
    networkOut: "90 MB/s",
    note: "USD 75/mo · ClickHouse Columnar",
    price: 75,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 10),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 1100
  },

  // 5. Redis 缓存集群 (Redis Cache)
  {
    id: "srv-hkg-05",
    name: "hk-redis-sentinel-01",
    ip: "43.154.90.10",
    region: "Hong Kong (CN-HK)",
    group: "Redis 缓存集群",
    os: "Alpine Linux 3.19",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 18,
    memory: 78,
    disk: 22,
    uptime: "95天 11小时",
    load: "0.32, 0.38, 0.35",
    networkIn: "190 MB/s",
    networkOut: "260 MB/s",
    note: "CNY 60/mo · Redis 7 Cluster",
    price: 60,
    currency: "CNY",
    expiresAt: Date.UTC(2027, 5, 20),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 850
  },
  {
    id: "srv-sin-05",
    name: "sg-redis-shard-01",
    ip: "13.214.95.21",
    region: "Singapore (AP-SIN)",
    group: "Redis 缓存集群",
    os: "Alpine Linux 3.19",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 24,
    memory: 84,
    disk: 25,
    uptime: "76天 14小时",
    load: "0.45, 0.50, 0.48",
    networkIn: "220 MB/s",
    networkOut: "310 MB/s",
    note: "USD 25/mo · Memory Optimized",
    price: 25,
    currency: "USD",
    expiresAt: Date.UTC(2027, 1, 15),
    billingCycle: "yearly",
    lastSeenAt: Date.now() - 950
  },
  {
    id: "srv-fra-04",
    name: "eu-redis-shard-01",
    ip: "3.65.128.30",
    region: "Frankfurt (EU-FRA)",
    group: "Redis 缓存集群",
    os: "Alpine Linux 3.19",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 20,
    memory: 75,
    disk: 24,
    uptime: "82天 9小时",
    load: "0.38, 0.42, 0.40",
    networkIn: "175 MB/s",
    networkOut: "240 MB/s",
    note: "EUR 22/mo · Redis Sentinel",
    price: 22,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 3, 10),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1250
  },
  {
    id: "srv-iad-04",
    name: "us-redis-master-01",
    ip: "3.88.220.15",
    region: "Virginia (US-IAD)",
    group: "Redis 缓存集群",
    os: "Alpine Linux 3.19",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 26,
    memory: 80,
    disk: 26,
    uptime: "105天 18小时",
    load: "0.48, 0.54, 0.50",
    networkIn: "240 MB/s",
    networkOut: "330 MB/s",
    note: "USD 28/mo · Multi-Threaded I/O",
    price: 28,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 28),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1000
  },

  // 6. 消息队列 Kafka (Message Queue)
  {
    id: "srv-sin-06",
    name: "sg-kafka-broker-01",
    ip: "13.214.98.11",
    region: "Singapore (AP-SIN)",
    group: "消息队列 Kafka",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 48,
    memory: 72,
    disk: 64,
    uptime: "68天 12小时",
    load: "1.15, 1.22, 1.18",
    networkIn: "320 MB/s",
    networkOut: "450 MB/s",
    note: "USD 45/mo · KRaft Mode",
    price: 45,
    currency: "USD",
    expiresAt: Date.UTC(2027, 0, 15),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1050
  },
  {
    id: "srv-sin-07",
    name: "sg-kafka-broker-02",
    ip: "13.214.98.12",
    region: "Singapore (AP-SIN)",
    group: "消息队列 Kafka",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 45,
    memory: 70,
    disk: 62,
    uptime: "68天 11小时",
    load: "1.08, 1.16, 1.12",
    networkIn: "300 MB/s",
    networkOut: "430 MB/s",
    note: "USD 45/mo · KRaft Mode",
    price: 45,
    currency: "USD",
    expiresAt: Date.UTC(2027, 0, 15),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1100
  },
  {
    id: "srv-fra-05",
    name: "eu-kafka-broker-01",
    ip: "3.65.130.45",
    region: "Frankfurt (EU-FRA)",
    group: "消息队列 Kafka",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 42,
    memory: 68,
    disk: 60,
    uptime: "74天 6小时",
    load: "0.95, 1.05, 1.00",
    networkIn: "280 MB/s",
    networkOut: "390 MB/s",
    note: "EUR 40/mo · Cross-Region Mirror",
    price: 40,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 3, 20),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1300
  },
  {
    id: "srv-iad-05",
    name: "us-kafka-broker-01",
    ip: "3.88.225.50",
    region: "Virginia (US-IAD)",
    group: "消息队列 Kafka",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 46,
    memory: 74,
    disk: 65,
    uptime: "88天 15小时",
    load: "1.10, 1.20, 1.15",
    networkIn: "310 MB/s",
    networkOut: "440 MB/s",
    note: "USD 48/mo · High-Throughput I/O",
    price: 48,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 12),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 980
  },

  // 7. AI 算力与推理 (AI GPU / LLM)
  {
    id: "srv-sjc-02",
    name: "us-gpu-h100-01",
    ip: "54.193.88.101",
    region: "Silicon Valley (US-SJC)",
    group: "AI 算力与推理",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "warning",
    cpu: 94,
    memory: 92,
    disk: 81,
    uptime: "21天 6小时",
    load: "18.5, 17.2, 16.8",
    networkIn: "520 MB/s",
    networkOut: "410 MB/s",
    note: "USD 850/mo · NVIDIA H100 x8",
    price: 850,
    currency: "USD",
    expiresAt: Date.UTC(2026, 11, 31),
    billingCycle: "monthly",
    lastSeenAt: Date.now() - 600
  },
  {
    id: "srv-sjc-03",
    name: "us-gpu-a100-01",
    ip: "54.193.88.102",
    region: "Silicon Valley (US-SJC)",
    group: "AI 算力与推理",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 72,
    memory: 85,
    disk: 72,
    uptime: "45天 14小时",
    load: "12.4, 11.8, 11.2",
    networkIn: "380 MB/s",
    networkOut: "310 MB/s",
    note: "USD 450/mo · NVIDIA A100 SXM4",
    price: 450,
    currency: "USD",
    expiresAt: Date.UTC(2027, 1, 15),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 800
  },
  {
    id: "srv-tok-05",
    name: "jp-gpu-l40s-01",
    ip: "18.176.50.22",
    region: "Tokyo (JP-TYO)",
    group: "AI 算力与推理",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 65,
    memory: 78,
    disk: 65,
    uptime: "30天 8小时",
    load: "8.20, 8.50, 8.10",
    networkIn: "240 MB/s",
    networkOut: "280 MB/s",
    note: "JPY 35000/mo · LLM Inference API",
    price: 35000,
    currency: "JPY",
    expiresAt: Date.UTC(2027, 0, 10),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1100
  },
  {
    id: "srv-fra-06",
    name: "eu-gpu-inference-01",
    ip: "3.65.140.90",
    region: "Frankfurt (EU-FRA)",
    group: "AI 算力与推理",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 60,
    memory: 74,
    disk: 60,
    uptime: "50天 19小时",
    load: "7.10, 7.40, 7.20",
    networkIn: "210 MB/s",
    networkOut: "260 MB/s",
    note: "EUR 320/mo · vLLM Cluster",
    price: 320,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 4, 20),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1200
  },
  {
    id: "srv-sin-08",
    name: "sg-embed-vector-01",
    ip: "13.214.105.40",
    region: "Singapore (AP-SIN)",
    group: "AI 算力与推理",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 45,
    memory: 70,
    disk: 55,
    uptime: "40天 10小时",
    load: "4.50, 4.80, 4.60",
    networkIn: "180 MB/s",
    networkOut: "210 MB/s",
    note: "USD 120/mo · Qdrant Vector Engine",
    price: 120,
    currency: "USD",
    expiresAt: Date.UTC(2027, 1, 5),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 950
  },

  // 8. 实时通信与流媒体 (RTC & Media)
  {
    id: "srv-hkg-06",
    name: "hk-webrtc-sfu-01",
    ip: "43.154.95.33",
    region: "Hong Kong (CN-HK)",
    group: "实时通信与流媒体",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 52,
    memory: 64,
    disk: 35,
    uptime: "62天 14小时",
    load: "1.20, 1.30, 1.25",
    networkIn: "450 MB/s",
    networkOut: "580 MB/s",
    note: "CNY 150/mo · LiveKit SFU Node",
    price: 150,
    currency: "CNY",
    expiresAt: Date.UTC(2027, 5, 10),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 750
  },
  {
    id: "srv-sin-09",
    name: "sg-media-transcode-01",
    ip: "13.214.110.15",
    region: "Singapore (AP-SIN)",
    group: "实时通信与流媒体",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 68,
    memory: 60,
    disk: 48,
    uptime: "44天 20小时",
    load: "2.10, 2.30, 2.15",
    networkIn: "380 MB/s",
    networkOut: "490 MB/s",
    note: "USD 65/mo · FFmpeg AV1 Pipeline",
    price: 65,
    currency: "USD",
    expiresAt: Date.UTC(2027, 1, 22),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 900
  },
  {
    id: "srv-iad-06",
    name: "us-webrtc-sfu-01",
    ip: "3.88.230.80",
    region: "Virginia (US-IAD)",
    group: "实时通信与流媒体",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 48,
    memory: 62,
    disk: 38,
    uptime: "75天 11小时",
    load: "1.10, 1.18, 1.14",
    networkIn: "410 MB/s",
    networkOut: "530 MB/s",
    note: "USD 55/mo · Low Latency RTMP",
    price: 55,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 14),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 850
  },
  {
    id: "srv-fra-07",
    name: "eu-webrtc-sfu-01",
    ip: "3.65.145.20",
    region: "Frankfurt (EU-FRA)",
    group: "实时通信与流媒体",
    os: "Ubuntu 24.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 44,
    memory: 58,
    disk: 36,
    uptime: "58天 8小时",
    load: "0.98, 1.05, 1.00",
    networkIn: "360 MB/s",
    networkOut: "470 MB/s",
    note: "EUR 50/mo · DE-CIX Low RTT",
    price: 50,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 3, 18),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1100
  },

  // 9. 日志与大数据计算 (Big Data & Logs)
  {
    id: "srv-iad-07",
    name: "us-elk-cluster-01",
    ip: "3.88.235.12",
    region: "Virginia (US-IAD)",
    group: "日志与大数据计算",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 64,
    memory: 88,
    disk: 82,
    uptime: "92天 16小时",
    load: "2.40, 2.55, 2.48",
    networkIn: "240 MB/s",
    networkOut: "120 MB/s",
    note: "USD 85/mo · OpenSearch Indexer",
    price: 85,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 5),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1200
  },
  {
    id: "srv-iad-08",
    name: "us-elk-cluster-02",
    ip: "3.88.235.13",
    region: "Virginia (US-IAD)",
    group: "日志与大数据计算",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 60,
    memory: 86,
    disk: 80,
    uptime: "92天 15小时",
    load: "2.25, 2.40, 2.35",
    networkIn: "220 MB/s",
    networkOut: "110 MB/s",
    note: "USD 85/mo · OpenSearch Indexer",
    price: 85,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 5),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1250
  },
  {
    id: "srv-sin-10",
    name: "sg-spark-master-01",
    ip: "13.214.120.55",
    region: "Singapore (AP-SIN)",
    group: "日志与大数据计算",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 72,
    memory: 84,
    disk: 76,
    uptime: "48天 19小时",
    load: "3.10, 3.25, 3.18",
    networkIn: "280 MB/s",
    networkOut: "190 MB/s",
    note: "USD 95/mo · Apache Spark 3.5",
    price: 95,
    currency: "USD",
    expiresAt: Date.UTC(2027, 1, 8),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1000
  },
  {
    id: "srv-fra-08",
    name: "eu-loki-aggregator-01",
    ip: "3.65.150.70",
    region: "Frankfurt (EU-FRA)",
    group: "日志与大数据计算",
    os: "Rocky Linux 9",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 38,
    memory: 66,
    disk: 70,
    uptime: "65天 22小时",
    load: "0.88, 0.95, 0.90",
    networkIn: "195 MB/s",
    networkOut: "85 MB/s",
    note: "EUR 45/mo · Grafana Loki Cluster",
    price: 45,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 3, 14),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1400
  },

  // 10. 安全与 WAF 防护 (Security & WAF)
  {
    id: "srv-hkg-07",
    name: "hk-waf-shield-01",
    ip: "43.154.100.88",
    region: "Hong Kong (CN-HK)",
    group: "安全与 WAF 防护",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 32,
    memory: 54,
    disk: 35,
    uptime: "105天 8小时",
    load: "0.55, 0.62, 0.58",
    networkIn: "290 MB/s",
    networkOut: "270 MB/s",
    note: "CNY 180/mo · Coraza WAF Engine",
    price: 180,
    currency: "CNY",
    expiresAt: Date.UTC(2027, 5, 1),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 700
  },
  {
    id: "srv-sjc-04",
    name: "us-waf-shield-01",
    ip: "54.193.95.40",
    region: "Silicon Valley (US-SJC)",
    group: "安全与 WAF 防护",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 36,
    memory: 58,
    disk: 38,
    uptime: "88天 14小时",
    load: "0.62, 0.70, 0.65",
    networkIn: "310 MB/s",
    networkOut: "290 MB/s",
    note: "USD 45/mo · Layer 7 DDoS Mitigation",
    price: 45,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 18),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 850
  },
  {
    id: "srv-fra-09",
    name: "eu-waf-shield-01",
    ip: "3.65.155.60",
    region: "Frankfurt (EU-FRA)",
    group: "安全与 WAF 防护",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 29,
    memory: 52,
    disk: 34,
    uptime: "95天 20小时",
    load: "0.48, 0.55, 0.50",
    networkIn: "250 MB/s",
    networkOut: "235 MB/s",
    note: "EUR 40/mo · ModSecurity V3",
    price: 40,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 3, 22),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1100
  },
  {
    id: "srv-sin-11",
    name: "sg-vault-kms-01",
    ip: "13.214.125.80",
    region: "Singapore (AP-SIN)",
    group: "安全与 WAF 防护",
    os: "Alpine Linux 3.19",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 15,
    memory: 42,
    disk: 20,
    uptime: "140天 12小时",
    load: "0.22, 0.28, 0.25",
    networkIn: "45 MB/s",
    networkOut: "40 MB/s",
    note: "USD 35/mo · HashiCorp Vault HSM",
    price: 35,
    currency: "USD",
    expiresAt: Date.UTC(2027, 1, 10),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 900
  },

  // 11. 存储与冷备容灾 (Storage & Backup)
  {
    id: "srv-iad-09",
    name: "us-minio-cluster-01",
    ip: "3.88.240.25",
    region: "Virginia (US-IAD)",
    group: "存储与冷备容灾",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 28,
    memory: 64,
    disk: 88,
    uptime: "130天 18小时",
    load: "0.68, 0.75, 0.72",
    networkIn: "180 MB/s",
    networkOut: "220 MB/s",
    note: "USD 120/mo · MinIO S3 200TB",
    price: 120,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 1),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1300
  },
  {
    id: "srv-iad-10",
    name: "us-minio-cluster-02",
    ip: "3.88.240.26",
    region: "Virginia (US-IAD)",
    group: "存储与冷备容灾",
    os: "Ubuntu 22.04 LTS",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 26,
    memory: 62,
    disk: 86,
    uptime: "130天 17小时",
    load: "0.64, 0.70, 0.68",
    networkIn: "170 MB/s",
    networkOut: "210 MB/s",
    note: "USD 120/mo · MinIO S3 200TB",
    price: 120,
    currency: "USD",
    expiresAt: Date.UTC(2027, 2, 1),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1350
  },
  {
    id: "srv-fra-10",
    name: "eu-backup-glacier-01",
    ip: "3.65.160.40",
    region: "Frankfurt (EU-FRA)",
    group: "存储与冷备容灾",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "online",
    cpu: 18,
    memory: 48,
    disk: 91,
    uptime: "150天 6小时",
    load: "0.35, 0.42, 0.38",
    networkIn: "95 MB/s",
    networkOut: "60 MB/s",
    note: "EUR 65/mo · ZFS Encrypted Storage",
    price: 65,
    currency: "EUR",
    expiresAt: Date.UTC(2027, 3, 30),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 1500
  },
  {
    id: "srv-sin-12",
    name: "sg-disaster-recovery-01",
    ip: "13.214.130.90",
    region: "Singapore (AP-SIN)",
    group: "存储与冷备容灾",
    os: "Debian 12",
    arch: "x86_64",
    agentVersion: "1.4.2",
    status: "offline",
    cpu: 0,
    memory: 0,
    disk: 84,
    uptime: "0天 0小时",
    load: "0.00, 0.00, 0.00",
    networkIn: "0 MB/s",
    networkOut: "0 MB/s",
    note: "USD 50/mo · Cold Standby DR Node",
    price: 50,
    currency: "USD",
    expiresAt: Date.UTC(2026, 11, 20),
    billingCycle: "annual",
    lastSeenAt: Date.now() - 86400000
  }
];

export const MOCK_PING_TARGETS: PingTarget[] = [
  // 1. HTTPS / TLS 核心业务
  {
    id: "prb-api-01",
    name: "全球核心 API 网关",
    protocol: "HTTPS",
    target: "https://api.smalux.io/healthz",
    group: "public",
    status: "up",
    latencyMs: 14,
    uptime24h: 99.98,
    uptimeSla: { "24h": 99.98, "7d": 99.95, "30d": 99.92, "90d": 99.89, "1y": 99.85 },
    sslDaysLeft: 84,
    lastCheckAt: Date.now() - 12000,
    enabled: true
  },
  {
    id: "prb-auth-01",
    name: "用户身份认证中心 (OAuth2)",
    protocol: "HTTPS",
    target: "https://auth.smalux.io/.well-known/openid-configuration",
    group: "public",
    status: "up",
    latencyMs: 18,
    uptime24h: 100.0,
    uptimeSla: { "24h": 100.0, "7d": 99.99, "30d": 99.97, "90d": 99.95, "1y": 99.92 },
    sslDaysLeft: 62,
    lastCheckAt: Date.now() - 15000,
    enabled: true
  },
  {
    id: "prb-pay-01",
    name: "跨境结算与收单中心",
    protocol: "HTTPS",
    target: "https://pay.smalux.io/v1/gateway/status",
    group: "control",
    status: "up",
    latencyMs: 24,
    uptime24h: 99.99,
    uptimeSla: { "24h": 99.99, "7d": 99.98, "30d": 99.95, "90d": 99.91, "1y": 99.88 },
    sslDaysLeft: 12,
    lastCheckAt: Date.now() - 20000,
    enabled: true
  },
  {
    id: "prb-cdn-01",
    name: "全球边缘 CDN 边缘调度节点",
    protocol: "HTTPS",
    target: "https://cdn.smalux.io/ping",
    group: "public",
    status: "up",
    latencyMs: 8,
    uptime24h: 99.95,
    uptimeSla: { "24h": 99.95, "7d": 99.91, "30d": 99.85, "90d": 99.78, "1y": 99.70 },
    sslDaysLeft: 110,
    lastCheckAt: Date.now() - 8000,
    enabled: true
  },
  {
    id: "prb-pending-01",
    name: "新机房骨干专线测试 (Pending)",
    protocol: "ICMP",
    target: "18.176.99.100",
    group: "private",
    status: "up",
    latencyMs: null as unknown as number,
    uptime24h: null as unknown as number,
    uptimeSla: undefined,
    lastCheckAt: 0,
    enabled: true
  },
  {
    id: "prb-ai-01",
    name: "AI 算力大模型推理网关",
    protocol: "HTTPS",
    target: "https://ai.smalux.io/v1/models",
    group: "public",
    status: "degraded",
    latencyMs: 285,
    uptime24h: 98.42,
    uptimeSla: { "24h": 98.42, "7d": 98.10, "30d": 97.80, "90d": 97.40, "1y": 96.90 },
    sslDaysLeft: 45,
    lastCheckAt: Date.now() - 5000,
    enabled: true
  },
  {
    id: "prb-dash-01",
    name: "云控控制台前端 (SPA)",
    protocol: "HTTPS",
    target: "https://console.smalux.io/version",
    group: "control",
    status: "up",
    latencyMs: 16,
    uptime24h: 100.0,
    uptimeSla: { "24h": 100.0, "7d": 100.0, "30d": 99.99, "90d": 99.96, "1y": 99.94 },
    sslDaysLeft: 95,
    lastCheckAt: Date.now() - 14000,
    enabled: true
  },

  // 2. HTTP (Plain / Webhook)
  {
    id: "prb-webhook-01",
    name: "企业微信 / 钉钉告警通道 Webhook",
    protocol: "HTTP",
    target: "http://hook.internal.smalux.io:8080/alert/dispatch",
    group: "notify",
    status: "up",
    latencyMs: 12,
    uptime24h: 99.92,
    uptimeSla: { "24h": 99.92, "7d": 99.88, "30d": 99.80, "90d": 99.72, "1y": 99.60 },
    lastCheckAt: Date.now() - 30000,
    enabled: true
  },
  {
    id: "prb-metrics-01",
    name: "Prometheus 遥测指标收集器",
    protocol: "HTTP",
    target: "http://metrics.internal.smalux.io:9090/-/healthy",
    group: "private",
    status: "up",
    latencyMs: 9,
    uptime24h: 99.99,
    uptimeSla: { "24h": 99.99, "7d": 99.98, "30d": 99.95, "90d": 99.90, "1y": 99.85 },
    lastCheckAt: Date.now() - 18000,
    enabled: true
  },
  {
    id: "prb-pkg-01",
    name: "Agent 二进制软件分发源",
    protocol: "HTTP",
    target: "http://repo.smalux.io/agent/stable/release.json",
    group: "public",
    status: "up",
    latencyMs: 28,
    uptime24h: 99.90,
    uptimeSla: { "24h": 99.90, "7d": 99.85, "30d": 99.78, "90d": 99.65, "1y": 99.50 },
    lastCheckAt: Date.now() - 45000,
    enabled: true
  },

  // 3. TCP 端口与高并发协议
  {
    id: "prb-db-01",
    name: "PostgreSQL 主集群 (5432)",
    protocol: "TCP",
    target: "db-master.internal.smalux.io:5432",
    group: "private",
    status: "up",
    latencyMs: 4,
    uptime24h: 100.0,
    uptimeSla: { "24h": 100.0, "7d": 100.0, "30d": 99.99, "90d": 99.98, "1y": 99.95 },
    lastCheckAt: Date.now() - 10000,
    enabled: true
  },
  {
    id: "prb-redis-01",
    name: "Redis 缓存哨兵集群 (6379)",
    protocol: "TCP",
    target: "redis-cluster.internal.smalux.io:6379",
    group: "private",
    status: "up",
    latencyMs: 2,
    uptime24h: 99.99,
    uptimeSla: { "24h": 99.99, "7d": 99.98, "30d": 99.96, "90d": 99.92, "1y": 99.88 },
    lastCheckAt: Date.now() - 10000,
    enabled: true
  },
  {
    id: "prb-kafka-01",
    name: "Kafka 核心事件总线 (9092)",
    protocol: "TCP",
    target: "kafka-event.internal.smalux.io:9092",
    group: "private",
    status: "up",
    latencyMs: 6,
    uptime24h: 99.96,
    uptimeSla: { "24h": 99.96, "7d": 99.92, "30d": 99.88, "90d": 99.82, "1y": 99.75 },
    lastCheckAt: Date.now() - 12000,
    enabled: true
  },
  {
    id: "prb-mysql-01",
    name: "MySQL 业务只读从库 (3306)",
    protocol: "TCP",
    target: "mysql-ro.internal.smalux.io:3306",
    group: "private",
    status: "up",
    latencyMs: 5,
    uptime24h: 99.97,
    uptimeSla: { "24h": 99.97, "7d": 99.94, "30d": 99.90, "90d": 99.85, "1y": 99.80 },
    lastCheckAt: Date.now() - 15000,
    enabled: true
  },

  // 4. ICMP 基础网络互联
  {
    id: "prb-dns-01",
    name: "Cloudflare Anycast DNS",
    protocol: "ICMP",
    target: "1.1.1.1",
    group: "public",
    status: "up",
    latencyMs: 5,
    uptime24h: 100.0,
    uptimeSla: { "24h": 100.0, "7d": 100.0, "30d": 99.99, "90d": 99.98, "1y": 99.97 },
    lastCheckAt: Date.now() - 5000,
    enabled: true
  },
  {
    id: "prb-dns-02",
    name: "Google Public DNS",
    protocol: "ICMP",
    target: "8.8.8.8",
    group: "public",
    status: "up",
    latencyMs: 11,
    uptime24h: 100.0,
    uptimeSla: { "24h": 100.0, "7d": 100.0, "30d": 99.99, "90d": 99.98, "1y": 99.96 },
    lastCheckAt: Date.now() - 5000,
    enabled: true
  },
  {
    id: "prb-gw-hkg",
    name: "亚太香港骨干路由 (HK-IX)",
    protocol: "ICMP",
    target: "202.40.161.1",
    group: "private",
    status: "up",
    latencyMs: 15,
    uptime24h: 99.94,
    uptimeSla: { "24h": 99.94, "7d": 99.90, "30d": 99.85, "90d": 99.75, "1y": 99.65 },
    lastCheckAt: Date.now() - 8000,
    enabled: true
  }
];

export const MOCK_AGENT_INSTALL_COMMAND: AgentInstallCommand = {
  token: "smalux_tok_live_79a2f1b8",
  endpoint: "https://api.smalux.io",
  ttlSeconds: 3600,
  curlCommand: "curl -fsSL https://get.smalux.io/install.sh | bash -s -- --token smalux_tok_live_79a2f1b8 --server https://api.smalux.io",
  wgetCommand: "wget -qO- https://get.smalux.io/install.sh | bash -s -- --token smalux_tok_live_79a2f1b8 --server https://api.smalux.io",
  dockerCommand: "docker run -d --name smalux-agent --restart always -e TOKEN=smalux_tok_live_79a2f1b8 -e SERVER=https://api.smalux.io smalux/agent:latest",
  powershellCommand: "irm https://get.smalux.io/install.ps1 | iex -ArgumentList '-Token smalux_tok_live_79a2f1b8 -Server https://api.smalux.io'"
};

export function getMockServerTelemetry(server: HostServer, timeRange: string): import("../types").ServerTelemetryResponse {
  let times: string[];
  let cpuPoints: number[];
  let memPoints: number[];
  let netRxPoints: number[];
  let netTxPoints: number[];
  let ioReadPoints: number[];
  let ioWritePoints: number[];

  const isOffline = server.status === "offline";
  const isIoDisabled = server.id === "srv-partial-01" || server.group === "边缘异构节点";

  const baseNetIn = parseInt(server.networkIn) || 45;
  const baseNetOut = parseInt(server.networkOut) || 68;

  if (timeRange === "realtime") {
    times = ["18:15:00", "18:15:30", "18:16:00", "18:16:30", "18:17:00", "18:17:30", "18:18:00", "18:18:30", "18:19:00", "18:19:30", "18:20:00"];
    cpuPoints = [19, 21, 24, 22, 28, 25, 22, 26, 23, 27, server.cpu || 20];
    memPoints = [53, 53, 54, 54, 54, 54, 55, 54, 54, 55, server.memory || 52];
    netRxPoints = [38, 42, 45, 48, 52, 46, 44, 50, 48, 55, baseNetIn];
    netTxPoints = [52, 58, 62, 68, 72, 64, 60, 70, 66, 75, baseNetOut];
    ioReadPoints = [35, 40, 42, 50, 48, 44, 46, 52, 48, 50, 48];
    ioWritePoints = [18, 20, 22, 28, 25, 21, 24, 26, 23, 25, 24];
  } else if (timeRange === "1h") {
    times = ["17:20", "17:25", "17:30", "17:35", "17:40", "17:45", "17:50", "17:55", "18:00", "18:05", "18:10", "18:20"];
    cpuPoints = [18, 24, 20, 32, 28, 22, 35, 29, 24, 30, 26, server.cpu || 18];
    memPoints = [52, 53, 52, 54, 54, 53, 55, 54, 54, 55, 54, server.memory || 50];
    netRxPoints = [32, 45, 38, 56, 48, 42, 68, 54, 46, 52, 48, baseNetIn];
    netTxPoints = [44, 58, 52, 74, 62, 58, 88, 72, 60, 68, 64, baseNetOut];
    ioReadPoints = [28, 42, 35, 64, 48, 38, 72, 52, 44, 48, 45, 48];
    ioWritePoints = [14, 22, 18, 36, 26, 20, 38, 28, 22, 25, 23, 24];
  } else if (timeRange === "6h") {
    times = ["12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];
    cpuPoints = [15, 18, 25, 38, 42, 30, 26, 34, 40, 28, 25, server.cpu || 18];
    memPoints = [50, 51, 52, 53, 55, 54, 54, 55, 56, 54, 54, server.memory || 50];
    netRxPoints = [28, 34, 46, 68, 75, 54, 48, 62, 70, 52, 48, baseNetIn];
    netTxPoints = [38, 45, 60, 88, 98, 72, 64, 82, 92, 68, 64, baseNetOut];
    ioReadPoints = [22, 28, 38, 75, 82, 45, 38, 56, 68, 46, 42, 48];
    ioWritePoints = [12, 15, 20, 42, 46, 25, 20, 32, 38, 24, 22, 24];
  } else if (timeRange === "24h") {
    times = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"];
    cpuPoints = [12, 10, 8, 14, 26, 38, 45, 52, 48, 42, 36, 28, server.cpu || 18];
    memPoints = [48, 48, 48, 49, 51, 53, 55, 56, 56, 55, 54, 53, server.memory || 50];
    netRxPoints = [18, 15, 12, 24, 48, 72, 85, 96, 88, 76, 64, 52, baseNetIn];
    netTxPoints = [24, 20, 16, 32, 64, 95, 112, 128, 116, 98, 84, 68, baseNetOut];
    ioReadPoints = [15, 12, 10, 18, 38, 65, 82, 94, 86, 70, 55, 42, 48];
    ioWritePoints = [8, 6, 5, 10, 22, 36, 48, 54, 48, 38, 28, 22, 24];
  } else if (timeRange === "3d") {
    times = ["08-20 00:00", "08-20 12:00", "08-21 00:00", "08-21 12:00", "08-22 00:00", "08-22 12:00", "当前"];
    cpuPoints = [18, 36, 16, 42, 15, 38, server.cpu || 18];
    memPoints = [50, 53, 51, 55, 52, 54, server.memory || 50];
    netRxPoints = [28, 68, 25, 82, 24, 72, baseNetIn];
    netTxPoints = [38, 92, 34, 110, 32, 96, baseNetOut];
    ioReadPoints = [24, 62, 20, 78, 22, 68, 48];
    ioWritePoints = [12, 34, 10, 44, 11, 38, 24];
  } else if (timeRange === "7d") {
    times = ["08-16", "08-17", "08-18", "08-19", "08-20", "08-21", "08-22"];
    cpuPoints = [22, 28, 35, 30, 26, 34, server.cpu || 18];
    memPoints = [49, 50, 52, 53, 52, 54, server.memory || 50];
    netRxPoints = [38, 48, 62, 54, 46, 58, baseNetIn];
    netTxPoints = [52, 66, 84, 72, 64, 78, baseNetOut];
    ioReadPoints = [34, 44, 58, 48, 40, 52, 48];
    ioWritePoints = [18, 24, 32, 26, 22, 28, 24];
  } else if (timeRange === "30d") {
    times = ["07-24", "07-28", "08-01", "08-05", "08-09", "08-13", "08-17", "08-22"];
    cpuPoints = [19, 24, 32, 28, 22, 36, 28, server.cpu || 18];
    memPoints = [46, 48, 50, 51, 52, 54, 53, server.memory || 50];
    netRxPoints = [32, 42, 56, 50, 40, 64, 52, baseNetIn];
    netTxPoints = [44, 58, 76, 68, 56, 86, 70, baseNetOut];
    ioReadPoints = [28, 38, 52, 44, 36, 60, 46, 48];
    ioWritePoints = [15, 20, 28, 24, 18, 32, 24, 24];
  } else {
    // 90d
    times = ["05-24", "06-05", "06-17", "06-29", "07-11", "07-23", "08-04", "08-16", "08-22"];
    cpuPoints = [16, 20, 26, 30, 24, 28, 34, 28, server.cpu || 18];
    memPoints = [42, 44, 46, 48, 49, 51, 53, 54, server.memory || 50];
    netRxPoints = [26, 34, 46, 54, 42, 50, 62, 52, baseNetIn];
    netTxPoints = [36, 48, 64, 74, 58, 68, 84, 70, baseNetOut];
    ioReadPoints = [22, 30, 40, 48, 36, 44, 56, 46, 48];
    ioWritePoints = [12, 16, 22, 26, 20, 24, 30, 24, 24];
  }

  // Helper to simulate heartbeat drop: keep first ~65% historical telemetry points and null the rest
  const maskOffline = <T>(pts: T[]): (T | null)[] => {
    if (!isOffline) return pts;
    const cutoff = Math.max(1, Math.floor(pts.length * 0.65));
    return pts.map((p, idx) => (idx < cutoff ? p : null));
  };

  return {
    times,
    cpu: { enabled: true, data: maskOffline(cpuPoints), unit: "%" },
    memory: { enabled: true, data: maskOffline(memPoints), unit: "%" },
    netIn: { enabled: true, data: maskOffline(netRxPoints), unit: "MB/s" },
    netOut: { enabled: true, data: maskOffline(netTxPoints), unit: "MB/s" },
    ioRead: { enabled: !isIoDisabled, data: !isIoDisabled ? maskOffline(ioReadPoints) : [], unit: "MB/s" },
    ioWrite: { enabled: !isIoDisabled, data: !isIoDisabled ? maskOffline(ioWritePoints) : [], unit: "MB/s" }
  };
}

export function getMockServerProcesses(server: HostServer | null): import("../types").ServerProcessItem[] {
  if (!server) return [];
  const baseCpu = server.cpu || 18;
  const baseMem = server.memory || 50;

  return [
    { pid: 1, ppid: 0, name: "systemd", command: "/sbin/init splash", user: "root", cpu: 0.1, mem: 0.4, resKb: 12400, resMb: 12, threads: 1, status: "S" },
    
    // Nginx master & workers
    { pid: 1419, ppid: 1, name: "nginx: master process", command: "nginx: master process /usr/sbin/nginx -g 'daemon off;'", user: "root", cpu: 0.2, mem: 0.5, resKb: 18000, resMb: 18, threads: 1, status: "S" },
    { pid: 1420, ppid: 1419, name: "nginx: worker process", command: "nginx: worker process (worker 0)", user: "www-data", cpu: +(4.2 + (baseCpu % 5)).toFixed(1), mem: 1.8, resKb: 85000, resMb: 85, threads: 4, status: "S", ioReadMb: 12.4, ioWriteMb: 4.8 },
    { pid: 1421, ppid: 1419, name: "nginx: worker process", command: "nginx: worker process (worker 1)", user: "www-data", cpu: +(3.8 + (baseCpu % 4)).toFixed(1), mem: 1.7, resKb: 82000, resMb: 82, threads: 4, status: "S", ioReadMb: 10.2, ioWriteMb: 3.9 },

    // MySQL Database
    { pid: 2884, ppid: 1, name: "mysqld --defaults-file", command: "/usr/sbin/mysqld --defaults-file=/etc/mysql/my.cnf --daemonize", user: "mysql", cpu: +(12.4 + (baseCpu % 8)).toFixed(1), mem: +(28.5 + (baseMem % 10)).toFixed(1), resKb: 1450000, resMb: 1420, threads: 32, status: "S", ioReadMb: 45.2, ioWriteMb: 28.6 },

    // Redis
    { pid: 3102, ppid: 1, name: "redis-server *:6379", command: "/usr/bin/redis-server 127.0.0.1:6379 --protected-mode yes", user: "redis", cpu: 2.1, mem: 8.4, resKb: 420000, resMb: 412, threads: 6, status: "S", ioReadMb: 0.8, ioWriteMb: 2.1 },

    // Node.js Cluster (Master & Workers)
    { pid: 4889, ppid: 1, name: "node /app/server.js (master)", command: "node /app/dist/server.js --cluster-master", user: "node", cpu: 1.2, mem: 4.5, resKb: 142000, resMb: 140, threads: 4, status: "S" },
    { pid: 4890, ppid: 4889, name: "node /app/server.js (worker 1)", command: "node --max-old-space-size=2048 /app/dist/server.js --cluster-worker=1", user: "node", cpu: +(8.5 + (baseCpu % 6)).toFixed(1), mem: 14.2, resKb: 695000, resMb: 680, threads: 12, status: "R", ioReadMb: 5.6, ioWriteMb: 1.2 },
    { pid: 4891, ppid: 4889, name: "node /app/server.js (worker 2)", command: "node --max-old-space-size=2048 /app/dist/server.js --cluster-worker=2", user: "node", cpu: +(6.2 + (baseCpu % 4)).toFixed(1), mem: 12.8, resKb: 580000, resMb: 566, threads: 12, status: "S", ioReadMb: 4.1, ioWriteMb: 0.9 },

    // Docker & Containerd
    { pid: 1098, ppid: 1, name: "dockerd -H fd://", command: "/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock", user: "root", cpu: 1.5, mem: 3.2, resKb: 168000, resMb: 164, threads: 18, status: "S", ioReadMb: 2.4, ioWriteMb: 4.1 },
    { pid: 1145, ppid: 1098, name: "containerd", command: "/usr/bin/containerd --config /etc/containerd/config.toml", user: "root", cpu: 0.8, mem: 2.1, resKb: 98000, resMb: 98, threads: 14, status: "S", ioReadMb: 1.1, ioWriteMb: 2.2 },

    // SSHd & User Session
    { pid: 892, ppid: 1, name: "sshd: /usr/sbin/sshd -D", command: "/usr/sbin/sshd -D", user: "root", cpu: 0.1, mem: 0.2, resKb: 9500, resMb: 9.5, threads: 1, status: "S" },
    { pid: 8891, ppid: 892, name: "sshd: root@pts/0", command: "sshd: root@pts/0 [priv] (sshd: active session)", user: "root", cpu: 0.1, mem: 0.3, resKb: 14000, resMb: 14, threads: 1, status: "S", ioReadMb: 0.0, ioWriteMb: 0.0 },
    { pid: 8895, ppid: 8891, name: "-bash", command: "-bash", user: "root", cpu: 0.0, mem: 0.2, resKb: 6200, resMb: 6, threads: 1, status: "S" },

    // Monitoring & Daemons
    { pid: 6112, ppid: 1, name: "smalux-agent-daemon", command: "/usr/local/bin/smalux-agent --config /etc/smalux/agent.yaml", user: "root", cpu: 0.4, mem: 0.8, resKb: 36000, resMb: 36, threads: 8, status: "S", ioReadMb: 0.1, ioWriteMb: 0.1 },
    { pid: 1042, ppid: 1, name: "systemd-journald", command: "/usr/lib/systemd/systemd-journald", user: "root", cpu: 0.2, mem: 0.6, resKb: 28000, resMb: 28, threads: 1, status: "S", ioReadMb: 0.2, ioWriteMb: 1.5 },
    { pid: 5540, ppid: 1, name: "prometheus-node-exporter", command: "/usr/local/bin/node_exporter --collector.systemd", user: "prometheus", cpu: 0.3, mem: 0.5, resKb: 24000, resMb: 24, threads: 4, status: "S", ioReadMb: 0.0, ioWriteMb: 0.0 },
    { pid: 7820, ppid: 1, name: "vector --config /etc/vector", command: "/usr/bin/vector --config /etc/vector/vector.toml --watch-config", user: "vector", cpu: 2.8, mem: 4.5, resKb: 220000, resMb: 215, threads: 16, status: "R", ioReadMb: 18.2, ioWriteMb: 15.4 },
    { pid: 9912, ppid: 1, name: "cron -f", command: "/usr/sbin/cron -f -L 15", user: "root", cpu: 0.0, mem: 0.1, resKb: 820, resMb: 0.8, threads: 1, status: "S", ioReadMb: 0.0, ioWriteMb: 0.0 }
  ];
}

export interface ServerAgentStatus {
  status: "online" | "warning" | "offline";
  statusText: string;
  badgeText: string;
  subtitle: string;
  protocol: string;
  protocolDetail: string;
  latencyMs: number;
  jitterMs: number;
  lossRate: string;
  quality: string;
  interval: string;
  lastPing: string;
  cpuUsage: string;
  memRss: string;
  version: string;
  isLatest: boolean;
  allowRemoteExec: boolean;
  pid: number;
}

export function getServerAgentStatus(server: Partial<HostServer>): ServerAgentStatus {
  const isOffline = server.status === "offline";
  const isWarning = server.status === "warning";

  const pid = 1000 + (server.id ? Math.abs(server.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 9000 : 42);
  const latency = isOffline ? 0 : isWarning ? 86 : Math.max(8, (server.cpu || 20) % 25 + 8);
  const jitter = +(latency * 0.08).toFixed(1);
  const lossRate = isOffline ? "100%" : isWarning ? "2.5%" : "0.0%";
  const quality = isOffline ? "中断" : isWarning ? "波动" : "极佳";

  return {
    status: isOffline ? "offline" : isWarning ? "warning" : "online",
    statusText: isOffline ? "Agent 守护进程连接中断" : isWarning ? "Agent 守护进程网络波动" : "Agent 守护进程连接正常",
    badgeText: isOffline ? "OFFLINE · TIMEOUT" : isWarning ? "DEGRADED · JITTER" : "ONLINE · LOW JITTER",
    subtitle: isOffline
      ? "长连接通道已断开 · 正在等待客户端重新上线"
      : "双向全双工流式遥测通道已建立 · 数据每 2 秒实时推流上报",
    protocol: "gRPC / TLS 1.3",
    protocolDetail: "HTTP/2 多路复用长连",
    latencyMs: latency,
    jitterMs: jitter,
    lossRate,
    quality,
    interval: isOffline ? "--" : "2s / 次",
    lastPing: isOffline ? "5分钟前" : "刚刚 (1s 前)",
    cpuUsage: isOffline ? "0%" : `0.${Math.max(1, (server.cpu || 10) % 5 + 1)}%`,
    memRss: isOffline ? "0 MB" : `${(16 + ((server.memory || 30) % 8)).toFixed(1)} MB`,
    version: server.agentVersion ? `v${server.agentVersion}` : "v1.4.2",
    isLatest: true,
    allowRemoteExec: server.allowRemoteExec !== false,
    pid
  };
}

export interface ServerNetworkDetails {
  hasIpv4: boolean;
  hasIpv6: boolean;
  isDualStack: boolean;
  ipv4: string;
  ipv4Gateway: string;
  ipv4Mask: string;
  ipv4Asn: string;
  ipv4Isp: string;
  ipv4Mtu: number;
  ipv6: string;
  ipv6Gateway: string;
  ipv6Prefix: string;
  ipv6Scope: string;
  ipv6Allocation: string;
  nicName: string;
  nicModel: string;
  nicSpeed: string;
  nicMac: string;
  nicDuplex: string;
  nicRxBytes: string;
  nicTxBytes: string;
  nicRxPackets: number;
  nicTxPackets: number;
  dnsServers: string[];
  tcpEstablished: number;
  tcpTimeWait: number;
  tcpSynRecv: number;
  bgpPeers: number;
  bgpStatus: string;
}

export interface GlobalProbeRegion {
  id: string;
  name: string;
  target: string;
  color: string;
  baseLatency: number;
  currentLatency: number;
  jitter: number;
  loss: string;
  status: "up" | "degraded" | "down";
  isp: string;
  regionCode: string;
}

export const BASE_GLOBAL_PROBE_REGIONS: GlobalProbeRegion[] = [
  { id: "hk", name: "中国香港 (Hong Kong)", target: "HK-Gateway-Edge", color: "#38bdf8", baseLatency: 16, currentLatency: 16, jitter: 1.1, loss: "0%", status: "up", isp: "HKT / PCCW Global", regionCode: "HKG" },
  { id: "sg", name: "新加坡 (Singapore)", target: "GCP Asia-Southeast1", color: "#34d399", baseLatency: 32, currentLatency: 33, jitter: 1.4, loss: "0%", status: "up", isp: "Singtel / Google Anycast", regionCode: "SIN" },
  { id: "tyo", name: "日本东京 (Tokyo)", target: "AWS AP-Northeast-1", color: "#818cf8", baseLatency: 38, currentLatency: 38, jitter: 1.6, loss: "0%", status: "up", isp: "NTT Communications", regionCode: "NRT" },
  { id: "sel", name: "韩国首尔 (Seoul)", target: "Oracle Cloud ICN", color: "#06b6d4", baseLatency: 42, currentLatency: 44, jitter: 1.8, loss: "0%", status: "up", isp: "KT Corp / SK Telecom", regionCode: "ICN" },
  { id: "sjc", name: "美国硅谷 (San Jose)", target: "US-West Anycast Ingress", color: "#fbbf24", baseLatency: 128, currentLatency: 130, jitter: 3.2, loss: "0%", status: "up", isp: "Equinix SV1 / Hurricane", regionCode: "SJC" },
  { id: "iad", name: "美国弗吉尼亚 (N. Virginia)", target: "AWS US-East-1", color: "#f97316", baseLatency: 158, currentLatency: 162, jitter: 4.1, loss: "0.1%", status: "degraded", isp: "Lumen / AWS Transit", regionCode: "IAD" },
  { id: "fra", name: "德国法兰克福 (Frankfurt)", target: "EU-Central Backbone", color: "#f43f5e", baseLatency: 164, currentLatency: 166, jitter: 3.8, loss: "0.2%", status: "degraded", isp: "DE-CIX / Telia Carrier", regionCode: "FRA" },
  { id: "lhr", name: "英国伦敦 (London)", target: "Equinix LD8 Edge", color: "#a855f7", baseLatency: 172, currentLatency: 174, jitter: 4.2, loss: "0%", status: "up", isp: "Vodafone / LINX London", regionCode: "LHR" },
  { id: "syd", name: "澳大利亚悉尼 (Sydney)", target: "Telstra Core AP", color: "#10b981", baseLatency: 145, currentLatency: 148, jitter: 3.5, loss: "0%", status: "up", isp: "Telstra Global", regionCode: "SYD" },
  { id: "sao", name: "巴西圣保罗 (São Paulo)", target: "AWS SA-East-1", color: "#ec4899", baseLatency: 245, currentLatency: 252, jitter: 6.8, loss: "0.5%", status: "degraded", isp: "Claro / IX.br SP", regionCode: "GRU" }
];

export function getServerNetworkDetails(server: Partial<HostServer>): ServerNetworkDetails {
  const hasIpv4 = Boolean(server.ipv4 || (server.ip && !server.ip.includes(":")));
  const hasIpv6 = Boolean(server.ipv6);
  const isDualStack = hasIpv4 && hasIpv6;

  const ipv4Val = server.ipv4 || (!server.ip?.includes(":") ? server.ip : "198.51.100.42") || "198.51.100.42";
  const ipv6Val = server.ipv6 || (server.ip?.includes(":") ? server.ip : `2402:4e00:1000::${server.id?.replace("srv-", "") || "42"}`);

  // Derived subnet gateway
  const ipv4Octets = ipv4Val.split(".");
  const ipv4Gateway = ipv4Octets.length === 4 ? `${ipv4Octets[0]}.${ipv4Octets[1]}.${ipv4Octets[2]}.1` : "198.51.100.1";

  const cpu = server.cpu || 20;
  const tcpEstablished = Math.round(cpu * 32 + 280);
  const tcpTimeWait = Math.round(cpu * 4 + 38);
  const tcpSynRecv = Math.max(1, Math.round(cpu * 0.2));

  // Determine ISP/ASN based on region/name
  const isCloudflare = server.name?.toLowerCase().includes("cf") || server.group?.includes("CDN");
  const isAws = server.name?.toLowerCase().includes("aws") || server.group?.includes("AI");
  const isGcp = server.name?.toLowerCase().includes("gcp") || server.group?.includes("网关");

  const ipv4Asn = isCloudflare ? "AS13335 (Cloudflare Anycast)" : isAws ? "AS16509 (Amazon.com AWS)" : isGcp ? "AS15169 (Google Cloud Platform)" : "AS4134 (China Telecom Backbone)";
  const ipv4Isp = isCloudflare ? "Cloudflare Global Anycast Edge" : isAws ? "AWS Direct Connect Transit" : isGcp ? "Google Premium Cloud Interconnect" : "China Telecom CN2 GIA High-Speed";

  const nicMac = `52:54:00:${Math.abs(ipv4Val.split(".").reduce((a, b) => a + Number(b), 0) % 89 + 10).toString(16)}:3a:${(cpu % 90 + 10).toString(16)}`;

  return {
    hasIpv4,
    hasIpv6,
    isDualStack,
    ipv4: ipv4Val,
    ipv4Gateway,
    ipv4Mask: "255.255.255.0 (/24)",
    ipv4Asn,
    ipv4Isp,
    ipv4Mtu: 1500,
    ipv6: ipv6Val,
    ipv6Gateway: "fe80::1 (Link-Local Gateway)",
    ipv6Prefix: "/64 Global Unicast",
    ipv6Scope: "Global (2000::/3)",
    ipv6Allocation: "SLAAC + DHCPv6 Stateless",
    nicName: "eth0",
    nicModel: "Intel Corporation 82599ES 10-Gigabit SFI/SFP+ Network Connection",
    nicSpeed: "10000 Mbps (Full Duplex)",
    nicMac,
    nicDuplex: "Full Duplex · Auto-Negotiation ON",
    nicRxBytes: `${(148.5 + (server.trafficUsedGb || 1200) * 0.8).toFixed(1)} GB`,
    nicTxBytes: `${(210.8 + (server.trafficUsedGb || 1200) * 1.2).toFixed(1)} GB`,
    nicRxPackets: Math.round((server.trafficUsedGb || 1200) * 128000 + 4500000),
    nicTxPackets: Math.round((server.trafficUsedGb || 1200) * 164000 + 5800000),
    dnsServers: ["1.1.1.1 (Cloudflare)", "8.8.8.8 (Google)", "2001:4860:4860::8888 (Google IPv6)"],
    tcpEstablished,
    tcpTimeWait,
    tcpSynRecv,
    bgpPeers: isCloudflare ? 36 : isAws ? 18 : 8,
    bgpStatus: "Established · Full Peering Table"
  };
}

export function getServerProbeRegions(server: Partial<HostServer>): GlobalProbeRegion[] {
  const isOffline = server.status === "offline";
  const isWarning = server.status === "warning";

  return BASE_GLOBAL_PROBE_REGIONS.map((probe) => {
    let latency = probe.baseLatency;
    let loss = probe.loss;
    let status: "up" | "degraded" | "down" = probe.status;

    if (isOffline) {
      latency = 0;
      loss = "100%";
      status = "down";
    } else if (isWarning) {
      latency = +(probe.baseLatency * 1.6).toFixed(1);
      loss = probe.loss === "0%" ? "1.5%" : probe.loss;
      status = "degraded";
    } else if (server.id?.includes("ai") && probe.id === "iad") {
      latency = 72; // Closer to US East
    }

    const jitter = +(latency * 0.08).toFixed(1);

    return {
      ...probe,
      currentLatency: latency,
      jitter,
      loss,
      status
    };
  });
}

// ==================== Node Configuration & Operations Mock Database ====================

import type { ServerConfigFormState } from "../types";

const MOCK_CONFIG_STORE: Record<string, Partial<ServerConfigFormState>> = {};

export function getMockServerConfig(serverId: string, fallbackServer?: Partial<HostServer>): ServerConfigFormState {
  const existing = MOCK_CONFIG_STORE[serverId];
  const srv = fallbackServer || MOCK_HOST_SERVERS.find((s) => s.id === serverId) || MOCK_HOST_SERVERS[0];

  const defaultGroups = srv.groups || (srv.group ? [srv.group] : ["网关集群"]);
  const defaultTags = srv.tags || ["production", "gateway", "bgp"];
  const defaultLocation = srv.location || (srv.region ? `${srv.region} (BGP Anycast)` : "中国 香港 (Hong Kong · BGP)");

  return {
    name: existing?.name ?? srv.name ?? "Node",
    groups: existing?.groups ?? defaultGroups,
    tags: existing?.tags ?? defaultTags,
    autoLocation: existing?.autoLocation ?? (srv.autoLocation ?? true),
    location: existing?.location ?? defaultLocation,
    trafficLimitValue: existing?.trafficLimitValue ?? (srv.trafficLimitValue ?? 1000),
    trafficLimitUnit: existing?.trafficLimitUnit ?? (srv.trafficLimitUnit ?? "GB"),
    trafficLimitGb: existing?.trafficLimitGb ?? (srv.trafficTotalGb ?? 1000),
    trafficCalculation: existing?.trafficCalculation ?? (srv.trafficCalculation ?? "outbound"),
    trafficResetDay: existing?.trafficResetDay ?? (srv.trafficResetDay ?? 1),
    publicVisible: existing?.publicVisible ?? (srv.publicVisible ?? true),
    maintenanceMode: existing?.maintenanceMode ?? (srv.maintenanceMode ?? false),
    price: existing?.price ?? (srv.price ?? 45),
    currency: existing?.currency ?? (srv.currency || "CNY"),
    billingCycle: existing?.billingCycle ?? (srv.billingCycle || "biennial"),
    expiresAt: existing?.expiresAt ?? (srv.expiresAt ? (typeof srv.expiresAt === "number" ? new Date(srv.expiresAt).toISOString().split("T")[0] : srv.expiresAt) : "2027-03-15"),
    autoRenew: existing?.autoRenew ?? (srv.autoRenew ?? true),
    note: existing?.note ?? (srv.note || "BGP Anycast · 生产核心节点 · 自动续费"),
    cpuThreshold: existing?.cpuThreshold ?? (srv.cpuThreshold ?? 85),
    cpuDurationSec: existing?.cpuDurationSec ?? (srv.cpuDurationSec ?? 60),
    memThreshold: existing?.memThreshold ?? (srv.memThreshold ?? 90),
    memDurationSec: existing?.memDurationSec ?? (srv.memDurationSec ?? 60),
    diskThreshold: existing?.diskThreshold ?? (srv.diskThreshold ?? 90),
    diskDurationSec: existing?.diskDurationSec ?? (srv.diskDurationSec ?? 300),
    netThresholdMb: existing?.netThresholdMb ?? 100,
    offlineTimeoutSec: existing?.offlineTimeoutSec ?? (srv.offlineTimeoutSec ?? 60),
    enableNotify: existing?.enableNotify ?? (srv.enableNotify ?? true),
    notifyChannels: existing?.notifyChannels ?? (srv.notifyChannels ?? [
      { id: "notif-tg-devops", name: "Telegram SRE 核心运维群", type: "telegram", target: "-1001928374652", enabled: true },
      { id: "notif-webhook-feishu", name: "飞书 基础设施监控机器人", type: "webhook", target: "https://open.feishu.cn/open-apis/bot/v2/hook/xxx", enabled: true },
      { id: "notif-email-ops", name: "运维组公共告警邮箱", type: "email", target: "sre-alerts@company.internal", enabled: false }
    ]),
    agentToken: existing?.agentToken ?? (srv.agentToken || `smx_tok_${srv.id?.replace("srv-", "") || "agent"}_${Math.random().toString(36).slice(2, 8)}`),
    allowRemoteExec: existing?.allowRemoteExec ?? (srv.allowRemoteExec !== false && srv.id !== "srv-test-noremote")
  };
}

export function updateMockServerConfig(
  serverId: string,
  updates: Partial<ServerConfigFormState>
): { ok: boolean; data: ServerConfigFormState; message: string } {
  const current = getMockServerConfig(serverId);
  const nextConfig: ServerConfigFormState = {
    ...current,
    ...updates
  };
  MOCK_CONFIG_STORE[serverId] = nextConfig;

  // Mutate in-memory MOCK_HOST_SERVERS to keep consistency
  const idx = MOCK_HOST_SERVERS.findIndex((s) => s.id === serverId);
  if (idx !== -1) {
    MOCK_HOST_SERVERS[idx] = {
      ...MOCK_HOST_SERVERS[idx],
      name: nextConfig.name,
      group: nextConfig.groups[0] || MOCK_HOST_SERVERS[idx].group,
      groups: nextConfig.groups,
      tags: nextConfig.tags,
      location: nextConfig.location,
      price: nextConfig.price,
      currency: nextConfig.currency,
      billingCycle: nextConfig.billingCycle,
      expiresAt: nextConfig.expiresAt,
      note: nextConfig.note,
      allowRemoteExec: nextConfig.allowRemoteExec,
      autoRenew: nextConfig.autoRenew,
      trafficTotalGb: nextConfig.trafficLimitGb
    };
  }

  return {
    ok: true,
    data: nextConfig,
    message: `主机 [${nextConfig.name}] 配置与报警策略已成功更新并生效`
  };
}

export function decommissionMockServer(serverId: string): { ok: boolean; serverId: string; message: string } {
  delete MOCK_CONFIG_STORE[serverId];
  const idx = MOCK_HOST_SERVERS.findIndex((s) => s.id === serverId);
  if (idx !== -1) {
    MOCK_HOST_SERVERS.splice(idx, 1);
  }
  return {
    ok: true,
    serverId,
    message: `节点 [${serverId}] 已成功从集群注销并解绑`
  };
}

