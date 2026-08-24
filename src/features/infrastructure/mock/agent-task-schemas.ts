import type { AgentTaskSchema } from "../types/task-schema";

export const AGENT_TASK_SCHEMAS: AgentTaskSchema[] = [
  // ================= 1. 内置核心采集任务 (Built-in Tasks) =================
  {
    id: "task.sys.cpu",
    name: "CPU 综合负载与核心利用率时序采集",
    category: "builtin",
    description: "高频采样 CPU 各物理/逻辑核心利用率、上下文切换、系统 Load Average 及运行队列长度。",
    iconName: "Cpu",
    defaultIntervalSec: 2,
    tags: ["计算负载", "核心指标", "常驻采集"],
    fields: [
      {
        id: "intervalSec",
        label: "采集与上报周期",
        type: "slider",
        group: "调度策略",
        min: 1,
        max: 60,
        step: 1,
        unit: "秒",
        defaultValue: 2,
        description: "Agent 向中心服务器推流采样数据的频率间隔 (推荐 2s)"
      },
      {
        id: "collectPerCore",
        label: "细化采集每个逻辑核心利用率",
        type: "switch",
        group: "采样维度",
        defaultValue: true,
        description: "开启后上报 Core-0 ~ Core-N 各核心负载波形，关闭仅上报总体平均值"
      },
      {
        id: "loadAvgMetrics",
        label: "Load Average 指标采样维度",
        type: "checkbox-group",
        group: "采样维度",
        defaultValue: ["1min", "5min", "15min"],
        options: [
          { label: "1 分钟负载 (load1)", value: "1min" },
          { label: "5 分钟负载 (load5)", value: "5min" },
          { label: "15 分钟负载 (load15)", value: "15min" }
        ]
      },
      {
        id: "reportQueueLength",
        label: "上报 CPU 运行队列长度 (Run Queue)",
        type: "switch",
        group: "高级诊断",
        defaultValue: false,
        description: "用于深度分析 CPU 调度争抢与阻塞瓶颈"
      }
    ]
  },
  {
    id: "task.sys.mem",
    name: "物理内存、Swap 与缓冲区内存矩阵上报",
    category: "builtin",
    description: "监控物理内存消耗率、已分配虚拟内存、Page Cache 与 Buffer、匿名页及 Swap 交换分区吃紧度。",
    iconName: "Activity",
    defaultIntervalSec: 2,
    tags: ["内存矩阵", "核心指标", "常驻采集"],
    fields: [
      {
        id: "intervalSec",
        label: "采集与上报周期",
        type: "slider",
        group: "调度策略",
        min: 1,
        max: 60,
        step: 1,
        unit: "秒",
        defaultValue: 2,
        description: "内存时序数据上报频率"
      },
      {
        id: "includeBuffersCache",
        label: "计入 Buffer / Cache 详细拆解",
        type: "switch",
        group: "采样维度",
        defaultValue: true,
        description: "上报可用内存 (Available) 与可回收缓存 (Reclaimable)"
      },
      {
        id: "trackSwapPressure",
        label: "监控 Swap 交换空间使用量与换入换出率",
        type: "switch",
        group: "采样维度",
        defaultValue: true,
        description: "当内存不足时监控 Swap 活跃度"
      },
      {
        id: "oomScoreTracking",
        label: "追踪高内存占用进程 OOM Score 水位",
        type: "switch",
        group: "高级诊断",
        defaultValue: false,
        description: "预警即将触发 Linux 内核 OOM Killer 的关键进程"
      }
    ]
  },
  {
    id: "task.sys.disk",
    name: "存储分区容量水位与 I/O 读写吞吐监控",
    category: "builtin",
    description: "定时采集各挂载点磁盘剩余空间、Inode 占用、磁盘每秒读写 MB/s、IOPS 水平及平均 I/O 等待时延。",
    iconName: "HardDrive",
    defaultIntervalSec: 10,
    tags: ["磁盘存储", "I/O 吞吐", "容量巡检"],
    fields: [
      {
        id: "intervalSec",
        label: "采集与上报周期",
        type: "slider",
        group: "调度策略",
        min: 5,
        max: 300,
        step: 5,
        unit: "秒",
        defaultValue: 10,
        description: "磁盘空间与 I/O 统计周期"
      },
      {
        id: "mountFilterMode",
        label: "挂载点探测范围过滤模式",
        type: "select",
        group: "过滤范围",
        defaultValue: "auto",
        options: [
          { label: "自动探测全部真实物理盘 (排除虚拟盘)", value: "auto" },
          { label: "包含全部挂载点 (含 NFS / 远程网络盘)", value: "all" },
          { label: "仅限系统根路径 (/)", value: "root_only" },
          { label: "自定义白名单路径", value: "custom" }
        ]
      },
      {
        id: "customMountPaths",
        label: "指定监控挂载路径 (每行一个)",
        type: "textarea",
        group: "过滤范围",
        defaultValue: "/\n/data\n/var/lib/docker",
        placeholder: "/data\n/var/log",
        dependsOn: { field: "mountFilterMode", equals: "custom" },
        description: "仅采集指定路径的容量与读写状况"
      },
      {
        id: "excludedFsTypes",
        label: "排除的虚拟文件系统类型",
        type: "checkbox-group",
        group: "过滤范围",
        defaultValue: ["tmpfs", "devtmpfs", "overlay"],
        options: [
          { label: "tmpfs (内存临时盘)", value: "tmpfs" },
          { label: "devtmpfs (设备文件系统)", value: "devtmpfs" },
          { label: "overlay (Docker分层镜像)", value: "overlay" },
          { label: "squashfs (只读快照)", value: "squashfs" }
        ]
      },
      {
        id: "enableIopsTracking",
        label: "采集详细 IOPS 读写次数与 I/O 等待时间 (%util / await)",
        type: "switch",
        group: "性能诊断",
        defaultValue: true,
        description: "开启后分析磁盘瓶颈与等待队列深度"
      },
      {
        id: "trackInodeUsage",
        label: "采集 Inode 节点使用率",
        type: "switch",
        group: "性能诊断",
        defaultValue: true,
        description: "防止大量小文件耗尽 Inode 导致磁盘不可写"
      }
    ]
  },
  {
    id: "task.net.traffic",
    name: "网卡物理吞吐量与 TCP/UDP 连接状态监测",
    category: "builtin",
    description: "实时统计算力网络上行/下行速率、丢包重传计数、主动/被动 TCP 连接数及 TIME_WAIT 状态统计。",
    iconName: "Network",
    defaultIntervalSec: 2,
    tags: ["网络带宽", "TCP状态", "流量统计"],
    fields: [
      {
        id: "intervalSec",
        label: "采集与上报周期",
        type: "slider",
        group: "调度策略",
        min: 1,
        max: 60,
        step: 1,
        unit: "秒",
        defaultValue: 2,
        description: "网络吞吐速率采样周期"
      },
      {
        id: "nicFilterMode",
        label: "网卡接口探测策略",
        type: "select",
        group: "接口过滤",
        defaultValue: "auto",
        options: [
          { label: "自动探测活跃物理主网卡 (推荐)", value: "auto" },
          { label: "全部网卡 (含 docker0, veth, lo, br-*)", value: "all" },
          { label: "指定网卡名称白名单", value: "whitelist" }
        ]
      },
      {
        id: "nicWhitelist",
        label: "网卡名称白名单 (逗号分隔)",
        type: "text",
        group: "接口过滤",
        defaultValue: "eth0, ens3, bond0",
        placeholder: "eth0, ens3",
        dependsOn: { field: "nicFilterMode", equals: "whitelist" }
      },
      {
        id: "trackTcpStates",
        label: "采集 TCP 连接状态分布 (ESTABLISHED / TIME_WAIT / CLOSE_WAIT)",
        type: "switch",
        group: "协议栈状态",
        defaultValue: true,
        description: "实时监控高并发连接数与连接泄漏"
      },
      {
        id: "trackDropAndErrors",
        label: "采集网卡丢包 (Drops) 与校验错误 (Errors)",
        type: "switch",
        group: "协议栈状态",
        defaultValue: true,
        description: "用于识别网络硬件或网关链路拥塞"
      }
    ]
  },
  {
    id: "task.net.ping",
    name: "多目标网络 RTT 延迟与丢包率拨测任务",
    category: "builtin",
    description: "由 Agent 节点自主向配置的网关、公网 DNS、业务上游与同伴节点发起高精度 ICMP/TCP 连通性探测。",
    iconName: "Radio",
    defaultIntervalSec: 5,
    tags: ["延迟拨测", "链路质量", "丢包统计"],
    fields: [
      {
        id: "intervalSec",
        label: "拨测频率周期",
        type: "slider",
        group: "调度策略",
        min: 1,
        max: 60,
        step: 1,
        unit: "秒",
        defaultValue: 5,
        description: "每次发起探测的间隔"
      },
      {
        id: "pingProtocol",
        label: "默认探测协议",
        type: "select",
        group: "拨测配置",
        defaultValue: "ICMP",
        options: [
          { label: "ICMP Ping (标准底层回显)", value: "ICMP" },
          { label: "TCP Syn Ping (端口连通性探测)", value: "TCP" },
          { label: "HTTP / HTTPS GET (应用层状态与首字节延迟)", value: "HTTP" }
        ]
      },
      {
        id: "timeoutMs",
        label: "单次探测超时时间",
        type: "number",
        group: "拨测配置",
        min: 200,
        max: 5000,
        step: 100,
        unit: "毫秒",
        defaultValue: 1500,
        description: "超过该耗时则判定为丢包 / 超时"
      },
      {
        id: "concurrency",
        label: "并发探测任务数",
        type: "number",
        group: "性能限制",
        min: 1,
        max: 32,
        step: 1,
        defaultValue: 8,
        description: "限制同时探测的并发目标数，避免抢占过多网络栈"
      }
    ]
  },
  {
    id: "task.proc.sampler",
    name: "系统运行进程表快照与 Top 资源占用排序",
    category: "builtin",
    description: "采集进程 PID、父进程、执行用户、CPU/内存占用及命令行参数，支持即时快照与常驻轮询采集。",
    iconName: "Sliders",
    defaultIntervalSec: 30,
    tags: ["进程树", "排查分析", "安全审计"],
    fields: [
      {
        id: "intervalSec",
        label: "后台轮询刷新周期",
        type: "slider",
        group: "调度策略",
        min: 5,
        max: 300,
        step: 5,
        unit: "秒",
        defaultValue: 30,
        description: "进程快照自动抓取周期 (建议 ≥ 15s 以节省 Agent 开销)"
      },
      {
        id: "topLimit",
        label: "上报 Top 资源占用进程数量",
        type: "number",
        group: "采样限制",
        min: 10,
        max: 200,
        step: 10,
        defaultValue: 50,
        description: "限制按 CPU/内存降序截取的最大进程条目"
      },
      {
        id: "filterKernelThreads",
        label: "过滤 Linux 内核线程 ([kworker], [ksoftirqd] 等)",
        type: "switch",
        group: "采样限制",
        defaultValue: true,
        description: "仅展示用户态真实应用程序进程"
      },
      {
        id: "allowRemoteKill",
        label: "允许通过 Web 控制台发送终止信号 (SIGTERM / SIGKILL)",
        type: "switch",
        group: "安全管控",
        defaultValue: true,
        description: "配合 Agent 本地 --enable-remote 权限生效"
      }
    ]
  },

  // ================= 2. PLUS 插件扩展任务 (Plus Extensions) =================
  {
    id: "task.plus.gpu",
    name: "NVIDIA / AMD GPU 显存与算力推理利用率",
    category: "plus",
    version: "v1.4.0 · PLUS",
    description: "基于 NVML / ROCm 采集 GPU 显存分配、核心计算利用率、功耗、PCIe 带宽、风扇转速与芯片温度。",
    iconName: "Sparkles",
    defaultIntervalSec: 5,
    tags: ["GPU加速", "AI算力", "NVML驱动", "PLUS插件"],
    fields: [
      {
        id: "intervalSec",
        label: "GPU 遥测采集频率",
        type: "slider",
        group: "调度策略",
        min: 1,
        max: 60,
        step: 1,
        unit: "秒",
        defaultValue: 5
      },
      {
        id: "driverBackend",
        label: "GPU 驱动接口后端",
        type: "select",
        group: "驱动架构",
        defaultValue: "nvml",
        options: [
          { label: "NVIDIA NVML (官方显卡驱动接口)", value: "nvml" },
          { label: "AMD ROCm / SMI (AMD Radeon/Instinct)", value: "rocm" },
          { label: "自动探测 (Auto-detect)", value: "auto" }
        ]
      },
      {
        id: "targetGpuIndexes",
        label: "要监控的 GPU 物理卡号 (逗号分隔或 'all')",
        type: "text",
        group: "设备选择",
        defaultValue: "all",
        placeholder: "0, 1, 2"
      },
      {
        id: "metricsCollection",
        label: "采集指标项列表",
        type: "checkbox-group",
        group: "采集指标",
        defaultValue: ["utilization", "memory", "temperature", "power", "pcie"],
        options: [
          { label: "GPU 核心算力利用率 (%)", value: "utilization" },
          { label: "VRAM 显存已分配/总量", value: "memory" },
          { label: "GPU 芯片核心温度 (°C)", value: "temperature" },
          { label: "即时功耗 (Watt) 与功耗上限", value: "power" },
          { label: "PCIe 吞吐速率 (TX/RX MB/s)", value: "pcie" },
          { label: "散热风扇转速 (%)", value: "fan" }
        ]
      },
      {
        id: "alertPowerThresholdW",
        label: "GPU 功耗过载预警阈值 (Watt, 0 为关闭)",
        type: "number",
        group: "安全与阈值",
        min: 0,
        max: 1000,
        step: 10,
        unit: "W",
        defaultValue: 450
      }
    ]
  },
  {
    id: "task.plus.docker",
    name: "Docker / Containerd 容器生命周期与健康巡检",
    category: "plus",
    version: "v2.1.2 · PLUS",
    description: "自动发现宿主机运行的容器，采集容器 CPU/内存限额配额、重启次数、健康检查状态与网络暴露端口。",
    iconName: "Container",
    defaultIntervalSec: 15,
    tags: ["容器化", "Docker", "Containerd", "PLUS插件"],
    fields: [
      {
        id: "intervalSec",
        label: "容器巡检周期",
        type: "slider",
        group: "调度策略",
        min: 5,
        max: 120,
        step: 5,
        unit: "秒",
        defaultValue: 15
      },
      {
        id: "socketPath",
        label: "容器运行时套接字路径 (Socket Path)",
        type: "text",
        group: "通信接口",
        defaultValue: "/var/run/docker.sock",
        placeholder: "/var/run/docker.sock 或 /run/containerd/containerd.sock",
        description: "Agent 读取本地容器状态所用的 UNIX 域套接字"
      },
      {
        id: "containerFilterMode",
        label: "容器过滤策略",
        type: "select",
        group: "过滤范围",
        defaultValue: "running_only",
        options: [
          { label: "仅限当前运行中容器 (Running)", value: "running_only" },
          { label: "包含所有已退出与暂停容器 (All Containers)", value: "all" },
          { label: "按标签或容器名前缀白名单过滤", value: "filter" }
        ]
      },
      {
        id: "nameFilterRegex",
        label: "容器名称匹配正则或前缀",
        type: "text",
        group: "过滤范围",
        defaultValue: "^prod-",
        placeholder: "^web-|^db-",
        dependsOn: { field: "containerFilterMode", equals: "filter" }
      },
      {
        id: "sampleMetrics",
        label: "容器遥测指标采集项",
        type: "checkbox-group",
        group: "采样维度",
        defaultValue: ["cpu", "memory", "restarts", "health"],
        options: [
          { label: "容器 CPU 使用量与 Quota 配额", value: "cpu" },
          { label: "容器物理内存已用与 Limit 限制", value: "memory" },
          { label: "容器异常退出与重启计数 (Restarts)", value: "restarts" },
          { label: "Docker HealthCheck 健康检查结果", value: "health" },
          { label: "容器虚拟网络 I/O (Bytes In/Out)", value: "net" }
        ]
      }
    ]
  },
  {
    id: "task.plus.ssl",
    name: "域名与服务 SSL/TLS 证书生命周期巡检",
    category: "plus",
    version: "v1.0.8 · PLUS",
    description: "检测本地 Nginx/Caddy 配置的证书或远程 HTTPS 端点，计算证书颁发者、加密套件与剩余有效天数。",
    iconName: "Lock",
    defaultIntervalSec: 3600,
    tags: ["HTTPS", "证书到期", "安全防护", "PLUS插件"],
    fields: [
      {
        id: "intervalHours",
        label: "巡检周期",
        type: "number",
        group: "调度策略",
        min: 1,
        max: 168,
        step: 1,
        unit: "小时",
        defaultValue: 24,
        description: "推荐每 24 小时巡检一次证书有效期"
      },
      {
        id: "targetEndpoints",
        label: "要巡检的域名或 HTTPS 端口 (每行一个)",
        type: "textarea",
        group: "探测目标",
        defaultValue: "api.smalux.com:443\nconsole.smalux.com:443\ngateway.internal:8443",
        placeholder: "example.com:443\nauth.example.com",
        description: "支持带端口号的标准域名"
      },
      {
        id: "warnThresholdDays",
        label: "证书即将到期预警天数阈值",
        type: "number",
        group: "告警规则",
        min: 3,
        max: 90,
        step: 1,
        unit: "天",
        defaultValue: 15,
        description: "剩余有效期少于该天数时触发告警下发"
      },
      {
        id: "autoRenewHook",
        label: "到期前自动触发本地 Certbot 续签脚本",
        type: "switch",
        group: "自动化 Hook",
        defaultValue: false,
        description: "需 Agent 本地拥有 root 执行权限"
      },
      {
        id: "renewCommand",
        label: "续签执行命令",
        type: "text",
        group: "自动化 Hook",
        defaultValue: "certbot renew --quiet && systemctl reload nginx",
        dependsOn: { field: "autoRenewHook", equals: true }
      }
    ]
  },
  {
    id: "task.plus.nginx",
    name: "Nginx / Web Access 日志实时 QPS 与状态码分析",
    category: "plus",
    version: "v1.5.1 · PLUS",
    description: "基于流式管道解析 HTTP 访问日志，秒级统计 2xx/3xx/4xx/5xx 占比、P99 响应耗时与 Top 访问 IP。",
    iconName: "FileCode",
    defaultIntervalSec: 10,
    tags: ["HTTP流量", "QPS统计", "状态码分析", "PLUS插件"],
    fields: [
      {
        id: "intervalSec",
        label: "流式统计聚合周期",
        type: "slider",
        group: "调度策略",
        min: 5,
        max: 60,
        step: 5,
        unit: "秒",
        defaultValue: 10
      },
      {
        id: "accessLogPath",
        label: "Nginx Access 日志绝对路径",
        type: "text",
        group: "日志源配置",
        defaultValue: "/var/log/nginx/access.log",
        placeholder: "/var/log/nginx/access.log",
        description: "支持 Tail 增量管道读取，零磁盘额外开销"
      },
      {
        id: "logFormat",
        label: "日志格式定义",
        type: "select",
        group: "日志源配置",
        defaultValue: "combined",
        options: [
          { label: "Nginx 标准 combined 格式", value: "combined" },
          { label: "Nginx main 扩展格式 (含 request_time)", value: "main" },
          { label: "JSON 结构化单行日志", value: "json" }
        ]
      },
      {
        id: "sampleRate",
        label: "日志采样率 (针对极高并发流量)",
        type: "slider",
        group: "流量调控",
        min: 10,
        max: 100,
        step: 10,
        unit: "%",
        defaultValue: 100,
        description: "100% 为全量解析；QPS 超 50,000 时可适度降低采样率"
      },
      {
        id: "topIpCount",
        label: "上报 Top 访问来源 IP 数量",
        type: "number",
        group: "安全分析",
        min: 5,
        max: 50,
        step: 5,
        defaultValue: 10,
        description: "用于识别潜在 CC 攻击或爬虫 IP"
      }
    ]
  },
  {
    id: "task.plus.db",
    name: "MySQL / Redis / PG 数据库连接池与慢查询探针",
    category: "plus",
    version: "v2.0.4 · PLUS",
    description: "通过只读探针连接上报活跃连接数、每秒查询量 (QPS/TPS)、命中率、缓存键数量与慢查询告警。",
    iconName: "Database",
    defaultIntervalSec: 15,
    tags: ["数据库", "MySQL", "Redis", "慢查询", "PLUS插件"],
    fields: [
      {
        id: "dbType",
        label: "数据库引擎类型",
        type: "select",
        group: "连接配置",
        defaultValue: "mysql",
        options: [
          { label: "MySQL 5.7 / 8.0 / MariaDB", value: "mysql" },
          { label: "Redis 6.x / 7.x (含 Cluster)", value: "redis" },
          { label: "PostgreSQL 12 ~ 16", value: "postgres" }
        ]
      },
      {
        id: "connectionDsn",
        label: "只读探测连接串 (DSN)",
        type: "text",
        group: "连接配置",
        defaultValue: "smalux_monitor:pwd_readonly@tcp(127.0.0.1:3306)/mysql",
        placeholder: "user:pass@tcp(127.0.0.1:3306)/db",
        description: "仅需授予只读权限 (例如 MySQL: PROCESS, SELECT ON performance_schema.*)"
      },
      {
        id: "intervalSec",
        label: "探测采样周期",
        type: "slider",
        group: "调度策略",
        min: 5,
        max: 120,
        step: 5,
        unit: "秒",
        defaultValue: 15
      },
      {
        id: "slowQueryThresholdMs",
        label: "慢查询捕获判定时延",
        type: "number",
        group: "性能诊断",
        min: 50,
        max: 5000,
        step: 50,
        unit: "毫秒",
        defaultValue: 200,
        description: "执行时间超过此阈值的 SQL 将触发告警快照"
      },
      {
        id: "trackConnectionPool",
        label: "监控最大连接数配额与 Threads_connected 水位",
        type: "switch",
        group: "性能诊断",
        defaultValue: true
      }
    ]
  },
  {
    id: "task.plus.ebpf",
    name: "Linux eBPF 内核级套接字链路与微丢包追踪",
    category: "plus",
    version: "v1.0.0 · 实验性 PLUS",
    description: "装载轻量级 eBPF kprobe/tracepoint 探测器，实现内核协议栈微秒级延迟监测与系统调用安全拦截。",
    iconName: "Flame",
    defaultIntervalSec: 10,
    tags: ["eBPF", "内核追踪", "微秒时延", "实验性PLUS"],
    fields: [
      {
        id: "intervalSec",
        label: "内核聚合数据上报周期",
        type: "slider",
        group: "调度策略",
        min: 5,
        max: 60,
        step: 5,
        unit: "秒",
        defaultValue: 10
      },
      {
        id: "ebpfMode",
        label: "eBPF 探测模式",
        type: "select",
        group: "内核探针",
        defaultValue: "tcp_rtt",
        options: [
          { label: "TCP 内核 RTT 与微丢包追踪 (tcp_retransmit_skb)", value: "tcp_rtt" },
          { label: "Socket 握手排队时延 (tcp_v4_connect)", value: "socket_latency" },
          { label: "敏感系统调用拦截 (execve/openat 审计)", value: "syscall_audit" }
        ]
      },
      {
        id: "bpfRingBufferSizeKb",
        label: "BPF Ring Buffer 缓冲区大小",
        type: "number",
        group: "内核资源",
        min: 256,
        max: 8192,
        step: 256,
        unit: "KB",
        defaultValue: 1024,
        description: "内核与用户空间事件交换缓存"
      },
      {
        id: "filterPorts",
        label: "关注的目标业务端口号 (逗号分隔)",
        type: "text",
        group: "过滤规则",
        defaultValue: "80, 443, 8080, 3306, 6379",
        placeholder: "80, 443"
      }
    ]
  }
];
