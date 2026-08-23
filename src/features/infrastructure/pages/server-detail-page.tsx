import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import {
  Server,
  ArrowLeft,
  Activity,
  Terminal,
  Send,
  CreditCard,
  Settings,
  Globe,
  Cpu,
  HardDrive,
  Radio,
  Copy,
  Check,
  RotateCcw,
  Save,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Disc3,
  Flame,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { EChart, type EChartsOption } from "@/shared/charts/echart";
import type { EChartsType } from "echarts/core";
import { useThemeStore, resolveThemeMode } from "@/shared/stores/theme-store";
import { useInfrastructureData } from "../api/use-infrastructure-api";
import { useMonitoring } from "@/features/servers/hooks/use-monitoring";
import { MOCK_HOST_SERVERS, getMockServerTelemetry, getMockServerProcesses } from "../mock/infrastructure-mock";
import { ServerProcessesDrawer } from "../components/server-processes-drawer";
import { toast } from "sonner";
import type { HostServer } from "../types";

export type TelemetryTimeRange = "1h" | "6h" | "24h" | "3d" | "7d" | "30d" | "90d";

const TELEMETRY_SERIES_CONFIG = [
  { key: "CPU (%)", label: "CPU (%)", barBg: "bg-indigo-400" },
  { key: "内存 (%)", label: "内存 (%)", barBg: "bg-emerald-400" },
  { key: "下行 (MB/s)", label: "下行 (MB/s)", barBg: "bg-sky-400", isDashed: true },
  { key: "上行 (MB/s)", label: "上行 (MB/s)", barBg: "bg-purple-400", isDashed: true },
  { key: "读 I/O (MB/s)", label: "读 I/O (MB/s)", barBg: "bg-teal-400" },
  { key: "写 I/O (MB/s)", label: "写 I/O (MB/s)", barBg: "bg-amber-400" }
];

export function ServerDetailPage() {
  const { serverId } = useParams({ strict: false }) as { serverId?: string };
  const navigate = useNavigate();
  const themeMode = useThemeStore((state) => state.mode);
  const isDark = resolveThemeMode(themeMode) === "dark";

  const [activeTab, setActiveTab] = useState<"telemetry" | "network" | "terminal" | "config">("telemetry");
  const [timeRange, setTimeRange] = useState<TelemetryTimeRange>("1h");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hidden Series state for outside interactive legend
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Process profiling availability toggle, snapshot state & drawer
  const [processCollectionEnabled, setProcessCollectionEnabled] = useState(true);
  const [isSamplingProcesses, setIsSamplingProcesses] = useState(false);
  const [isProcessesDrawerOpen, setIsProcessesDrawerOpen] = useState(false);
  const [processSnapshotTime, setProcessSnapshotTime] = useState<string>("刚刚");

  // Subscribe to live metrics for this server
  useMonitoring(serverId ? [serverId] : undefined);
  const { servers, refetchServers } = useInfrastructureData({ limit: 100 });

  // Resolve target server
  const server: HostServer | null = useMemo(() => {
    if (!serverId) return null;
    const found = servers.find((s) => s.id === serverId || s.name.toLowerCase() === serverId.toLowerCase());
    if (found) return found;
    return MOCK_HOST_SERVERS.find((s) => s.id === serverId || s.name.toLowerCase() === serverId.toLowerCase()) || null;
  }, [serverId, servers]);

  // Top 5 processes for overview widget
  const topProcesses = useMemo(() => {
    return getMockServerProcesses(server).slice(0, 5);
  }, [server]);

  // Editable Configuration State
  const [configForm, setConfigForm] = useState({
    name: "",
    group: "",
    tags: "gateway, production, bgp",
    publicVisible: true,
    maintenanceMode: false,
    price: 45,
    currency: "CNY",
    billingCycle: "biennial",
    expiresAt: "2027-03-15",
    autoRenew: true,
    note: "",
    cpuThreshold: 85,
    memThreshold: 90,
    diskThreshold: 90,
    offlineTimeoutSec: 60,
    enableNotify: true,
    agentToken: "",
    allowRemoteExec: true,
    heartbeatInterval: "2s"
  });

  // Sync initial configuration
  useEffect(() => {
    if (server) {
      setProcessCollectionEnabled(server.enableProcessCollection !== false);
      setConfigForm({
        name: server.name,
        group: server.group || "网关集群",
        tags: server.group ? `${server.group}, production, core` : "production",
        publicVisible: true,
        maintenanceMode: false,
        price: server.price ?? 45,
        currency: server.currency || "CNY",
        billingCycle: server.billingCycle || "biennial",
        expiresAt: server.expiresAt ? new Date(server.expiresAt).toISOString().split("T")[0] : "2027-03-15",
        autoRenew: true,
        note: server.note || "BGP Anycast · 生产核心节点 · 自动续费",
        cpuThreshold: 85,
        memThreshold: 90,
        diskThreshold: 90,
        offlineTimeoutSec: 60,
        enableNotify: true,
        agentToken: `smx_tok_${server.id.replace("srv-", "")}_${Math.random().toString(36).slice(2, 8)}`,
        allowRemoteExec: server.allowRemoteExec !== false,
        heartbeatInterval: "2s"
      });
    }
  }, [server?.id]);

  // Terminal State & Commands
  const [termInput, setTermInput] = useState("");
  const [termLogs, setTermLogs] = useState<string[]>([
    "==========================================================================",
    " smalux agent daemon v1.4.2 [STATUS: CONNECTED / LOW LATENCY: 18ms]",
    " Linux kernel 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64",
    " Type commands or click quick shortcuts below.",
    "=========================================================================="
  ]);
  const termEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "terminal") {
      termEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [termLogs, activeTab]);

  const executeCommand = (cmd: string) => {
    if (!cmd.trim() || !server) return;
    const trimmed = cmd.trim();
    const newLogs = [...termLogs, `root@${server.name}:~# ${trimmed}`];

    if (trimmed === "clear") {
      setTermLogs(["Console screen cleared."]);
      setTermInput("");
      return;
    } else if (trimmed === "help") {
      newLogs.push(
        "Supported commands: top, iostat, df -h, free -m, docker ps, netstat -tlpn, uname -a, uptime, ping, systemctl status, clear"
      );
    } else if (trimmed === "uptime") {
      newLogs.push(` ${new Date().toLocaleTimeString()} up ${server.uptime}, 2 users, load average: ${server.load}`);
    } else if (trimmed.startsWith("iostat")) {
      newLogs.push(
        "Linux 6.8.0-40-generic (smalux-node) 	2026-08-22 	_x86_64_	(8 CPU)",
        "avg-cpu:  %user   %nice %system %iowait  %steal   %idle",
        "           4.25    0.00    1.80    0.35    0.00   93.60",
        "Device             tps    kB_read/s    kB_wrtn/s    kB_dscd/s",
        "nvme0n1         324.50     48210.00     24150.00         0.00",
        "sda              12.40       120.00       850.00         0.00"
      );
    } else if (trimmed.startsWith("df")) {
      newLogs.push(
        "Filesystem      Size  Used Avail Use% Mounted on",
        "/dev/root        50G   21G   27G  44% /",
        "/dev/nvme0n1p2  450G  189G  261G  42% /data",
        "tmpfs           7.8G     0  7.8G   0% /dev/shm"
      );
    } else if (trimmed.startsWith("free")) {
      newLogs.push(
        "               total        used        free      shared  buff/cache   available",
        "Mem:           16384        9240        4820         320        2324        6824",
        "Swap:           4096         512        3584"
      );
    } else if (trimmed.startsWith("docker")) {
      newLogs.push(
        "CONTAINER ID   IMAGE                COMMAND                  CREATED        STATUS        PORTS",
        "a9b2c3d4e5f6   nginx:1.25-alpine    \"/docker-entrypoint.…\"   12 days ago    Up 12 days    0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp",
        "f1e2d3c4b5a6   redis:7.2-alpine     \"docker-entrypoint.s…\"   12 days ago    Up 12 days    0.0.0.0:6379->6379/tcp",
        "c8d9e0f1a2b3   smalux-agent:latest  \"/usr/bin/smalux-age…\"   48 days ago    Up 48 days    0.0.0.0:9100->9100/tcp",
        "8e7d6c5b4a3f   postgres:16-alpine   \"docker-entrypoint.s…\"   20 days ago    Up 20 days    0.0.0.0:5432->5432/tcp"
      );
    } else if (trimmed.startsWith("netstat")) {
      newLogs.push(
        "Active Internet connections (only servers)",
        "Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name",
        "tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      892/sshd",
        "tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1420/nginx",
        "tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN      1420/nginx",
        "tcp        0      0 0.0.0.0:9100            0.0.0.0:*               LISTEN      2105/smalux-agent"
      );
    } else if (trimmed.startsWith("systemctl status")) {
      newLogs.push(
        "● smalux-agent.service - smalux host telemetry agent",
        "   Loaded: loaded (/etc/systemd/system/smalux-agent.service; enabled; vendor preset: enabled)",
        "   Active: active (running) since Thu 2026-07-05 08:20:11 UTC; 48 days ago",
        "   Main PID: 2105 (smalux-agent)",
        "   Tasks: 8 (limit: 19124)",
        "   Memory: 18.4M",
        "   CGroup: /system.slice/smalux-agent.service",
        "           └─2105 /usr/local/bin/smalux-agent --config /etc/smalux/agent.yaml"
      );
    } else if (trimmed === "uname -a") {
      newLogs.push(`Linux ${server.name} 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`);
    } else if (trimmed.startsWith("top")) {
      newLogs.push(
        "top - 18:00:12 up 48 days,  2 users,  load average: 0.32, 0.45, 0.40",
        "Tasks: 184 total,   1 running, 183 sleeping,   0 stopped,   0 zombie",
        "%Cpu(s):  4.2 us,  1.8 sy,  0.0 ni, 93.8 id,  0.1 wa,  0.0 hi,  0.1 si",
        "MiB Mem :  16384.0 total,   4820.2 free,   9240.5 used,   2324.3 buff/cache",
        "MiB Swap:   4096.0 total,   3584.0 free,    512.0 used.   6824.0 avail Mem"
      );
    } else {
      newLogs.push(`[EXEC] Command '${trimmed}' executed successfully with exit code 0.`);
    }

    setTermLogs(newLogs);
    setTermInput("");
  };

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`已复制 ${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchServers();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("节点遥测数据已刷新");
    }, 500);
  };

  const handleSampleProcesses = () => {
    setIsSamplingProcesses(true);
    setTimeout(() => {
      setIsSamplingProcesses(false);
      setProcessSnapshotTime(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
      toast.success("已完成单次进程级即时采样分析");
    }, 600);
  };

  const handleSaveConfig = () => {
    if (!server) return;
    toast.success(`主机 [${configForm.name || server.name}] 配置已保存并实时生效`);
  };

  const handleResetConfig = () => {
    if (!server) return;
    setConfigForm({
      name: server.name,
      group: server.group || "网关集群",
      tags: server.group ? `${server.group}, production, core` : "production",
      publicVisible: true,
      maintenanceMode: false,
      price: server.price ?? 45,
      currency: server.currency || "CNY",
      billingCycle: server.billingCycle || "biennial",
      expiresAt: server.expiresAt ? new Date(server.expiresAt).toISOString().split("T")[0] : "2027-03-15",
      autoRenew: true,
      note: server.note || "BGP Anycast · 生产核心节点 · 自动续费",
      cpuThreshold: 85,
      memThreshold: 90,
      diskThreshold: 90,
      offlineTimeoutSec: 60,
      enableNotify: true,
      agentToken: `smx_tok_${server.id.replace("srv-", "")}_${Math.random().toString(36).slice(2, 8)}`,
      allowRemoteExec: true,
      heartbeatInterval: "2s"
    });
    toast.info("已重置为服务器原始配置");
  };

  // Server Telemetry Timeseries (Unified Scheme 3: { enabled, data, unit })
  const telemetryData = useMemo(() => {
    if (!server) return null;
    return getMockServerTelemetry(server, timeRange);
  }, [server, timeRange]);

  // Telemetry Chart Option with I/O and Multi-Span Time Series
  const telemetryChartOption: EChartsOption = useMemo(() => {
    if (!server || !telemetryData) return {};
    const textColor = isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.55)";
    const splitColor = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";

    const seriesCandidates = [
      {
        name: "CPU (%)",
        enabled: telemetryData.cpu.enabled,
        series: {
          name: "CPU (%)",
          type: "line" as const,
          smooth: 0.35,
          yAxisIndex: 0,
          data: hiddenSeries["CPU (%)"] ? [] : telemetryData.cpu.data,
          lineStyle: { width: 2.5, color: "#818cf8" },
          areaStyle: hiddenSeries["CPU (%)"]
            ? undefined
            : {
                color: {
                  type: "linear" as const,
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(129, 140, 248, 0.35)" },
                    { offset: 1, color: "rgba(129, 140, 248, 0.0)" }
                  ]
                }
              }
        }
      },
      {
        name: "内存 (%)",
        enabled: telemetryData.memory.enabled,
        series: {
          name: "内存 (%)",
          type: "line" as const,
          smooth: 0.35,
          yAxisIndex: 0,
          data: hiddenSeries["内存 (%)"] ? [] : telemetryData.memory.data,
          lineStyle: { width: 2.5, color: "#34d399" },
          areaStyle: hiddenSeries["内存 (%)"]
            ? undefined
            : {
                color: {
                  type: "linear" as const,
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(52, 211, 153, 0.25)" },
                    { offset: 1, color: "rgba(52, 211, 153, 0.0)" }
                  ]
                }
              }
        }
      },
      {
        name: "下行 (MB/s)",
        enabled: telemetryData.netIn.enabled,
        series: {
          name: "下行 (MB/s)",
          type: "line" as const,
          smooth: 0.35,
          yAxisIndex: 1,
          data: hiddenSeries["下行 (MB/s)"] ? [] : telemetryData.netIn.data,
          lineStyle: { width: 2, color: "#38bdf8", type: "dashed" as const }
        }
      },
      {
        name: "上行 (MB/s)",
        enabled: telemetryData.netOut.enabled,
        series: {
          name: "上行 (MB/s)",
          type: "line" as const,
          smooth: 0.35,
          yAxisIndex: 1,
          data: hiddenSeries["上行 (MB/s)"] ? [] : telemetryData.netOut.data,
          lineStyle: { width: 2, color: "#a855f7", type: "dashed" as const }
        }
      },
      {
        name: "读 I/O (MB/s)",
        enabled: telemetryData.ioRead.enabled,
        series: {
          name: "读 I/O (MB/s)",
          type: "line" as const,
          smooth: 0.35,
          yAxisIndex: 1,
          data: hiddenSeries["读 I/O (MB/s)"] ? [] : telemetryData.ioRead.data,
          lineStyle: { width: 2, color: "#14b8a6" }
        }
      },
      {
        name: "写 I/O (MB/s)",
        enabled: telemetryData.ioWrite.enabled,
        series: {
          name: "写 I/O (MB/s)",
          type: "line" as const,
          smooth: 0.35,
          yAxisIndex: 1,
          data: hiddenSeries["写 I/O (MB/s)"] ? [] : telemetryData.ioWrite.data,
          lineStyle: { width: 2, color: "#f59e0b" }
        }
      }
    ];

    // Only render series that have enabled === true
    const activeSeriesList = seriesCandidates.filter((s) => s.enabled).map((s) => s.series);

    return {
      grid: { left: "2%", right: "2%", top: "8%", bottom: "6%", containLabel: true },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: isDark ? "rgba(12, 14, 20, 0.95)" : "rgba(255, 255, 255, 0.95)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)",
        textStyle: { color: isDark ? "#fff" : "#111", fontSize: 11, fontFamily: "monospace" }
      },
      legend: {
        show: false
      },
      xAxis: {
        type: "category" as const,
        data: telemetryData.times,
        boundaryGap: false,
        axisLine: { lineStyle: { color: splitColor } },
        axisLabel: { color: textColor, fontSize: 10, fontFamily: "monospace" }
      },
      yAxis: [
        {
          type: "value" as const,
          max: 100,
          splitLine: { lineStyle: { color: splitColor, type: "dashed" as const } },
          axisLabel: { color: textColor, fontSize: 10, fontFamily: "monospace", formatter: "{value}%" }
        },
        {
          type: "value" as const,
          splitLine: { show: false },
          axisLabel: { color: textColor, fontSize: 10, fontFamily: "monospace", formatter: "{value}M" }
        }
      ],
      series: activeSeriesList
    };
  }, [server, isDark, telemetryData, hiddenSeries]);

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Server className="size-12 text-muted-foreground/50" />
        <h3 className="text-lg font-bold text-foreground">未找到该主机节点</h3>
        <p className="text-xs text-muted-foreground">ID: {serverId} 不存在或尚未注册到集群中</p>
        <Button size="sm" onClick={() => navigate({ to: "/admin/infrastructure" })}>
          <ArrowLeft className="size-3.5 mr-1.5" /> 返回基础设施列表
        </Button>
      </div>
    );
  }

  const isWarn = server.status === "warning";
  const isOff = server.status === "offline";

  const memTotal = server.memTotalGb || 16;
  const memUsed = server.memUsedGb || +(memTotal * (server.memory / 100)).toFixed(1);
  const diskTotal = server.diskTotalGb || 500;
  const diskUsed = server.diskUsedGb || +(diskTotal * (server.disk / 100)).toFixed(1);
  const trafficTotal = server.trafficTotalGb || 10000;
  const trafficUsed = server.trafficUsedGb || Math.round(1800 + server.cpu * 55);
  const trafficRatio = Math.min(100, Math.round((trafficUsed / trafficTotal) * 100));

  const ipv4 = server.ipv4 || server.ip;
  const ipv6 = server.ipv6 || `2402:4e00:1000::${server.id.replace("srv-", "").replace(/-/g, ":")}`;

  const globalProbes = [
    { region: "中国香港 (Hong Kong)", target: "HK-Gateway-Edge", latency: "16ms", loss: "0%", status: "up" },
    { region: "日本东京 (Tokyo)", target: "AWS AP-Northeast-1", latency: "38ms", loss: "0%", status: "up" },
    { region: "新加坡 (Singapore)", target: "GCP Asia-Southeast1", latency: "32ms", loss: "0%", status: "up" },
    { region: "美国硅谷 (San Jose)", target: "US-West Anycast Ingress", latency: "128ms", loss: "0%", status: "up" },
    { region: "德国法兰克福 (Frankfurt)", target: "EU-Central Backbone", latency: "164ms", loss: "0.2%", status: "up" }
  ];

  return (
    <div className="flex flex-col min-h-full space-y-6 px-4 sm:px-6 lg:px-8 py-6 pb-16">
      {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: "/admin/infrastructure" })}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="size-3.5" /> 返回列表
            </Button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate" title={server.name}>
                  {server.name}
                </h1>
                <Badge
                  variant={isOff ? "danger" : isWarn ? "warning" : "success"}
                  dot
                  className="text-xs px-2.5 py-0.5 font-medium"
                >
                  {isOff ? "节点离线" : isWarn ? "高负载预警" : "正常在线"}
                </Badge>
                {server.group && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                    {server.group}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono mt-1">
                <span className="text-foreground/90 font-semibold">{ipv4}</span>
                <span>·</span>
                <span>{server.region}</span>
                <span>·</span>
                <span>{server.os} ({server.arch || "x86_64"})</span>
                <span>·</span>
                <span className={isOff ? "text-rose-400" : "text-emerald-400 font-medium"}>
                  {isOff ? "已离线" : `连续运行 ${server.uptime}`}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(`ssh root@${ipv4}`, "ssh", "SSH 登录命令")}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer font-mono font-medium hidden sm:inline-flex"
            >
              {copiedKey === "ssh" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              ssh root@{ipv4}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer font-medium"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              {isRefreshing ? "刷新中..." : "刷新数据"}
            </Button>
          </div>
        </div>

        {/* Global Offline Machine Banner */}
        {isOff && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-4 shrink-0 text-rose-400" />
              <div>
                <span className="font-bold">该主机当前处于离线状态 (Heartbeat Lost)：</span>
                <span className="opacity-90">探针心跳已中断，下方所呈现的时序曲线与进程信息为最后一次历史归档快照，已自动禁用远程指令。</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30 shrink-0">
              离线保护模式
            </Badge>
          </div>
        )}

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "telemetry"
                ? "bg-card text-foreground font-bold shadow-2xs border border-border/80 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="size-4" /> 实时遥测与多维指标
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("network")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "network"
                ? "bg-card text-foreground font-bold shadow-2xs border border-border/80 text-cyan-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="size-4" /> 双栈网络与全球拨测
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terminal")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "terminal"
                ? "bg-card text-foreground font-bold shadow-2xs border border-border/80 text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="size-4" /> Web 终端与即时命令
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "config"
                ? "bg-card text-foreground font-bold shadow-2xs border border-border/80 text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="size-4" /> 节点配置与运维管理
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>实时遥测已连接 (2s)</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* ===================== TAB 1: TELEMETRY ===================== */}
        {activeTab === "telemetry" && (
          <div className="space-y-5">
            {/* 6 Big Metric Gauge Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* 1. CPU */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Cpu className="size-3.5 text-indigo-400" /> CPU 负载
                  </span>
                  <span className="text-[11px]">{server.cpuCores || 8} vCPU</span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${server.cpu > 80 ? "text-amber-400" : "text-foreground"}`}>
                    {server.cpu}%
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    Load: {server.load}
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      server.cpu > 85 ? "bg-rose-500" : server.cpu > 70 ? "bg-amber-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${server.cpu}%` }}
                  />
                </div>
              </div>

              {/* 2. Memory */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="size-3.5 text-emerald-400" /> 内存占用
                  </span>
                  <span className="text-[11px]">{memUsed}G / {memTotal}G</span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${server.memory > 85 ? "text-amber-400" : "text-foreground"}`}>
                    {server.memory}%
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    Swap: 512 MB
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      server.memory > 85 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${server.memory}%` }}
                  />
                </div>
              </div>

              {/* 3. Disk Storage */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <HardDrive className="size-3.5 text-amber-400" /> 磁盘空间
                  </span>
                  <span className="text-[11px]">{diskUsed}G / {diskTotal}G</span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${server.disk > 85 ? "text-amber-400" : "text-foreground"}`}>
                    {server.disk}%
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    剩余 {(diskTotal - diskUsed).toFixed(0)} GB
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${server.disk}%` }}
                  />
                </div>
              </div>

              {/* 4. Disk & System I/O */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Disc3 className="size-3.5 text-teal-400" /> 磁盘 I/O
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className="text-xs sm:text-sm lg:text-xs xl:text-sm font-black tracking-tight flex items-center gap-1.5 whitespace-nowrap leading-none">
                    <span className="text-teal-400 shrink-0">↓ 48 MB/s</span>
                    <span className="text-amber-400 shrink-0">↑ 24 MB/s</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden flex">
                  <div className="h-full bg-teal-500 rounded-l-full" style={{ width: "45%" }} />
                  <div className="h-full bg-amber-500 rounded-r-full" style={{ width: "25%" }} />
                </div>
              </div>

              {/* 5. Real-time Network Throughput */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Activity className="size-3.5 text-sky-400" /> 实时网络
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className="text-xs sm:text-sm lg:text-xs xl:text-sm font-black tracking-tight flex items-center gap-1.5 whitespace-nowrap leading-tight">
                    <span className="text-sky-400 shrink-0">↓ {server.networkIn}</span>
                    <span className="text-indigo-400 shrink-0">↑ {server.networkOut}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5 whitespace-nowrap">
                    {server.tcpConns || 280} TCP · {Math.round((server.tcpConns || 280) * 0.25 + 16)} UDP
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, server.cpu * 0.7 + 15))}%` }}
                  />
                </div>
              </div>

              {/* 6. Monthly Bandwidth Quota */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Globe className="size-3.5 text-purple-400" /> 流量配额
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {trafficTotal >= 1024 ? `${(trafficTotal / 1024).toFixed(0)} TB` : `${trafficTotal} GB`}
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${trafficRatio > 85 ? "text-amber-400" : "text-foreground"}`}>
                    {trafficRatio}%
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    已用 {trafficUsed >= 1024 ? `${(trafficUsed / 1024).toFixed(1)}T` : `${trafficUsed}G`}
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      trafficRatio > 85 ? "bg-amber-500" : "bg-gradient-to-r from-sky-500 to-purple-500"
                    }`}
                    style={{ width: `${trafficRatio}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Performance Streams Chart Card with Extended Time Spans & I/O */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">
                    全维性能波形监控 (Telemetry Streams & I/O)
                  </span>
                  <Badge variant="neutral" className="text-[10px] font-mono">采样率: 2s</Badge>
                </div>

                {/* Extended Multi-Span Time Range Buttons */}
                <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs overflow-x-auto">
                  {(["1h", "6h", "24h", "3d", "7d", "30d", "90d"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTimeRange(r)}
                      className={`px-2.5 py-1 rounded font-mono font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        timeRange === r ? "bg-card text-foreground font-bold shadow-2xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r === "1h" ? "1小时" : r === "6h" ? "6小时" : r === "24h" ? "24小时" : r === "3d" ? "3天" : r === "7d" ? "7天" : r === "30d" ? "30天" : "90天 (季度)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Native Chart Style Interactive Legend Bar */}
              <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 pt-1 px-1 font-mono text-xs">
                {TELEMETRY_SERIES_CONFIG.filter((item) => {
                  if (!telemetryData) return true;
                  if (item.key === "CPU (%)") return telemetryData.cpu.enabled;
                  if (item.key === "内存 (%)") return telemetryData.memory.enabled;
                  if (item.key === "下行 (MB/s)") return telemetryData.netIn.enabled;
                  if (item.key === "上行 (MB/s)") return telemetryData.netOut.enabled;
                  if (item.key === "读 I/O (MB/s)") return telemetryData.ioRead.enabled;
                  if (item.key === "写 I/O (MB/s)") return telemetryData.ioWrite.enabled;
                  return true;
                }).map((item) => {
                  const isVisible = !hiddenSeries[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleSeries(item.key)}
                      className={`inline-flex items-center gap-1.5 py-0.5 px-1 rounded transition-all cursor-pointer select-none ${
                        isVisible
                          ? "text-muted-foreground/90 hover:text-foreground"
                          : "text-muted-foreground/35 line-through opacity-50"
                      }`}
                      title={`点击${isVisible ? "隐藏" : "显示"} ${item.label}`}
                    >
                      <span
                        className={`h-2.5 w-4 rounded-xs transition-colors shrink-0 ${
                          isVisible ? item.barBg : "bg-muted-foreground/25"
                        } ${item.isDashed ? "border border-dashed border-white/40" : ""}`}
                      />
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <EChart option={telemetryChartOption} height={260} notMerge={false} />
            </div>

            {/* Top Processes (Optional & Conditional) & Hardware Specs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Processes (Optional / Switchable Profiling) */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between text-xs font-bold text-foreground gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="size-3.5 text-emerald-400" />
                    <span>活跃高负载进程 (Top Processes)</span>
                    <Badge variant={processCollectionEnabled ? "success" : "neutral"} className="text-[10px]">
                      {processCollectionEnabled ? "常驻采集已开启" : "自动采集已停用"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      快照: {processSnapshotTime}
                    </span>
                    <button
                      type="button"
                      onClick={isOff ? undefined : handleSampleProcesses}
                      disabled={isSamplingProcesses || isOff}
                      className={`text-[11px] font-mono flex items-center gap-1 ${
                        isOff
                          ? "text-muted-foreground/35 cursor-not-allowed select-none"
                          : "text-primary hover:underline cursor-pointer"
                      }`}
                      title={isOff ? "主机已离线，无法进行即时采样" : "触发即时单次抓取最新快照"}
                    >
                      <RefreshCw className={`size-3 ${isSamplingProcesses ? "animate-spin" : ""}`} /> 即时采样
                    </button>
                    <button
                      type="button"
                      onClick={isOff ? undefined : () => setIsProcessesDrawerOpen(true)}
                      disabled={isOff}
                      className={`text-[11px] font-mono font-bold ml-1 flex items-center gap-1 ${
                        isOff
                          ? "text-muted-foreground/35 cursor-not-allowed select-none"
                          : "text-foreground/80 hover:text-primary hover:underline cursor-pointer"
                      }`}
                      title={isOff ? "主机已离线，进程采集已中断" : "打开右侧弹窗查看全量系统进程详细信息"}
                    >
                      查看全部 →
                    </button>
                  </div>
                </div>

                <div className="relative rounded-lg border border-border/60 overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px]">
                      <tr>
                        <th className="p-2.5">PID</th>
                        <th className="p-2.5">进程命令</th>
                        <th className="p-2.5">用户</th>
                        <th className="p-2.5 text-right">CPU%</th>
                        <th className="p-2.5 text-right">MEM%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 bg-card/20">
                      {topProcesses.map((p) => {
                        const fullCmd = p.command || p.name;
                        return (
                          <tr key={p.pid} className="hover:bg-muted/30">
                            <td className="p-2.5 font-semibold text-primary">{p.pid}</td>
                            <td className="p-2.5 text-foreground font-medium truncate max-w-[160px]" title={fullCmd}>
                              {fullCmd}
                            </td>
                            <td className="p-2.5 text-muted-foreground">{p.user}</td>
                            <td className="p-2.5 text-right text-indigo-400 font-bold">{p.cpu}%</td>
                            <td className="p-2.5 text-right text-emerald-400 font-bold">{p.mem}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mask: Offline Machine or Collection Disabled */}
                  {isOff ? (
                    <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-background/80 flex flex-col items-center justify-center p-5 text-center space-y-2 select-none">
                      <div className="p-2 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="size-5" />
                      </div>
                      <div className="text-xs font-bold text-foreground">主机当前已离线 (Heartbeat Lost)</div>
                      <p className="text-[11px] text-muted-foreground max-w-xs">
                        探针心跳中断，实时遥测与进程采集已暂停，无法执行远程交互。
                      </p>
                    </div>
                  ) : !processCollectionEnabled ? (
                    <div className="absolute inset-0 z-10 backdrop-blur-[1.5px] bg-background/65 flex flex-col items-center justify-center p-4 text-center space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>自动常驻采集已停用 · 当前展示历史快照 ({processSnapshotTime})</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                        <Button size="sm" variant="outline" onClick={handleSampleProcesses} className="h-7 text-xs gap-1 cursor-pointer">
                          <Sparkles className="size-3 text-primary" /> 立即单次采样
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setIsProcessesDrawerOpen(true)} className="h-7 text-xs gap-1 cursor-pointer">
                          查看全部快照
                        </Button>
                        <Button size="sm" variant="default" onClick={() => setProcessCollectionEnabled(true)} className="h-7 text-xs gap-1 cursor-pointer">
                          开启常驻采集
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Card Bottom: View All Processes */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isOff ? undefined : () => setIsProcessesDrawerOpen(true)}
                  disabled={isOff}
                  className={`w-full h-8 text-xs font-mono gap-1.5 ${
                    isOff
                      ? "opacity-40 cursor-not-allowed select-none bg-muted/20 border-border/40 text-muted-foreground"
                      : "cursor-pointer bg-card/40 hover:bg-muted/40"
                  }`}
                  title={isOff ? "主机已离线，无法查看实时进程监控" : undefined}
                >
                  查看全量系统进程树 (Process Explorer) →
                </Button>
              </div>

              {/* Hardware Specifications */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between text-xs font-bold text-foreground font-sans">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="size-3.5 text-primary" /> 硬件规格与内核深度环境
                  </span>
                  <Badge variant="neutral" className="text-[10px]">{server.os}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-3 text-muted-foreground pt-1 border-t border-border/50 text-xs">
                  <div>CPU 规格: <strong className="text-foreground">{server.cpuCores || 8} vCPU (AMD EPYC™)</strong></div>
                  <div>系统架构: <strong className="text-foreground">{server.arch || "x86_64"}</strong></div>
                  <div>Linux 内核: <strong className="text-foreground">6.8.0-40-generic</strong></div>
                  <div>虚拟化平台: <strong className="text-foreground">KVM / QEMU</strong></div>
                  <div>Agent 客户端: <strong className="text-primary font-bold">v{server.agentVersion || "1.4.2"}</strong></div>
                  <div>连续运行: <strong className="text-foreground">{server.uptime}</strong></div>
                  <div>网络接口: <strong className="text-cyan-400">eth0 (10Gbps VirtIO)</strong></div>
                  <div>系统负载: <strong className="text-foreground">{server.load}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: NETWORK & GLOBAL PROBES ===================== */}
        {activeTab === "network" && (
          <div className="space-y-5">
            {/* IP Details Card */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 font-mono text-xs shadow-2xs">
              <div className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Globe className="size-4 text-cyan-400" />
                  <span>双栈网络寻址与接口参数</span>
                </div>
                <Badge variant="success" dot className="text-xs">Dual-Stack IPv4/IPv6</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                {/* IPv4 */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>公网 IPv4 地址</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ipv4, "ipv4", "IPv4")}
                      className="text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {copiedKey === "ipv4" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />} 复制
                    </button>
                  </div>
                  <div className="text-base font-bold text-foreground select-all">{ipv4}</div>
                  <div className="text-xs text-muted-foreground">子网掩码: 255.255.255.0 · 网关: 43.154.21.1</div>
                </div>

                {/* IPv6 */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>公网 IPv6 地址</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ipv6, "ipv6", "IPv6")}
                      className="text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {copiedKey === "ipv6" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />} 复制
                    </button>
                  </div>
                  <div className="text-sm font-bold text-foreground select-all truncate" title={ipv6}>
                    {ipv6}
                  </div>
                  <div className="text-xs text-muted-foreground">Prefix: /64 · Default Route Enabled</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-muted-foreground">
                <div className="p-3 rounded bg-muted/30 border border-border/40">
                  <span className="block text-[11px] text-muted-foreground">机房运营商</span>
                  <strong className="text-foreground font-sans">BGP Anycast / Tier 1</strong>
                </div>
                <div className="p-3 rounded bg-muted/30 border border-border/40">
                  <span className="block text-[11px] text-muted-foreground">数据中心区域</span>
                  <strong className="text-foreground">{server.region}</strong>
                </div>
                <div className="p-3 rounded bg-muted/30 border border-border/40">
                  <span className="block text-[11px] text-muted-foreground">DNS 上游</span>
                  <strong className="text-foreground">1.1.1.1, 8.8.8.8</strong>
                </div>
                <div className="p-3 rounded bg-muted/30 border border-border/40">
                  <span className="block text-[11px] text-muted-foreground">MTU 报文大小</span>
                  <strong className="text-foreground">1500 (Standard)</strong>
                </div>
              </div>
            </div>

            {/* Global Probes */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Radio className="size-4 text-emerald-400" />
                  <span>全球核心分布式拨测点延迟 (Multi-Region Probes)</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">平均 RTT: 76ms</span>
              </div>

              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-xs">
                    <tr>
                      <th className="p-3">探测源区域 (Region)</th>
                      <th className="p-3">目标探测端点</th>
                      <th className="p-3 text-right">往返延迟 (RTT)</th>
                      <th className="p-3 text-right">丢包率</th>
                      <th className="p-3 text-right">链路状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-card/20">
                    {globalProbes.map((probe, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-3 font-sans font-semibold text-foreground">{probe.region}</td>
                        <td className="p-3 text-muted-foreground">{probe.target}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">{probe.latency}</td>
                        <td className="p-3 text-right text-muted-foreground">{probe.loss}</td>
                        <td className="p-3 text-right">
                          <Badge variant="success" dot className="text-xs px-2 py-0">
                            正常
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: WEB TERMINAL ===================== */}
        {activeTab === "terminal" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border/70 bg-card/60 text-xs">
              <span className="text-xs font-mono text-muted-foreground mr-1 flex items-center gap-1">
                <Sparkles className="size-3.5 text-primary" /> 快捷指令:
              </span>
              {[
                "top",
                "iostat",
                "df -h",
                "free -m",
                "docker ps",
                "netstat -tlpn",
                "systemctl status smalux-agent",
                "uname -a",
                "uptime",
                "clear"
              ].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => executeCommand(cmd)}
                  className="px-2.5 py-1 rounded bg-muted/60 hover:bg-primary/20 hover:text-primary border border-border/50 text-xs font-mono transition-colors cursor-pointer text-foreground/80"
                >
                  {cmd}
                </button>
              ))}
            </div>

            <div className="flex flex-col h-[600px] rounded-xl border border-zinc-800 bg-zinc-950 text-emerald-400 font-mono text-xs overflow-hidden shadow-2xl">
              <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs text-zinc-400 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-rose-500 inline-block" />
                    <span className="size-2.5 rounded-full bg-amber-500 inline-block" />
                    <span className="size-2.5 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <span className="font-semibold text-zinc-300">
                    smalux-shell · root@{server.name} ({ipv4})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400">🟢 WSS Connected</span>
                  <span>·</span>
                  <span>TLS 1.3 / AES-GCM</span>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-2 select-text font-mono leading-relaxed">
                {termLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
                <div ref={termEndRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeCommand(termInput);
                }}
                className="border-t border-zinc-800 bg-zinc-900/90 p-3 flex items-center gap-2"
              >
                <span className="text-emerald-400 font-bold shrink-0">
                  root@{server.name}:~#
                </span>
                <input
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  placeholder="输入 Linux 命令 (例如 top, iostat, df -h, free -m)..."
                  className="flex-1 bg-transparent text-zinc-100 text-xs outline-none font-mono placeholder:text-zinc-600"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800 cursor-pointer"
                >
                  <Send className="size-3.5 mr-1" /> 执行
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: CONFIGURATION & SETTINGS ===================== */}
        {activeTab === "config" && (
          <div className="space-y-5">
            {/* Section 1: Basic Node Metadata */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <Settings className="size-4 text-primary" />
                <span>节点基本信息与分组管理</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50 text-xs">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">节点展示别名 (Host Name)</label>
                  <input
                    value={configForm.name}
                    onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground"
                    placeholder="输入主机别名"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">所属集群业务分组 (Cluster Group)</label>
                  <input
                    value={configForm.group}
                    onChange={(e) => setConfigForm({ ...configForm, group: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground"
                    placeholder="如: 网关集群 / 核心业务"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">节点标签 (Tags，英文逗号分隔)</label>
                  <input
                    value={configForm.tags}
                    onChange={(e) => setConfigForm({ ...configForm, tags: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground"
                    placeholder="production, gateway, bgp"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">心跳遥测采样周期</label>
                  <select
                    value={configForm.heartbeatInterval}
                    onChange={(e) => setConfigForm({ ...configForm, heartbeatInterval: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    <option value="1s">1 秒 (高频极速)</option>
                    <option value="2s">2 秒 (推荐标准)</option>
                    <option value="5s">5 秒 (省流模式)</option>
                    <option value="10s">10 秒 (低功耗)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">公开状态页可见性 (Public Visibility)</div>
                  <div className="text-muted-foreground text-xs">是否在公开集群状态页向全网展示该节点的健康度</div>
                </div>
                <Switch
                  checked={configForm.publicVisible}
                  onCheckedChange={(checked) => setConfigForm({ ...configForm, publicVisible: checked })}
                />
              </div>

              <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5" /> 维护模式 (Maintenance Mode)
                  </div>
                  <div className="text-muted-foreground text-xs">开启后将暂停针对该节点的异常告警与自动化巡检触发</div>
                </div>
                <Switch
                  checked={configForm.maintenanceMode}
                  onCheckedChange={(checked) => setConfigForm({ ...configForm, maintenanceMode: checked })}
                />
              </div>
            </div>

            {/* Section 2: Billing & Asset Management */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <CreditCard className="size-4 text-amber-400" />
                <span>资产采购与续费账单档案</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50 text-xs">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">计费价格 & 币种</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={configForm.price}
                      onChange={(e) => setConfigForm({ ...configForm, price: Number(e.target.value) })}
                      className="w-2/3 h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground"
                    />
                    <select
                      value={configForm.currency}
                      onChange={(e) => setConfigForm({ ...configForm, currency: e.target.value })}
                      className="w-1/3 h-9 rounded-lg border border-border/80 bg-muted/30 px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer font-bold"
                    >
                      <option value="CNY">CNY ¥</option>
                      <option value="USD">USD $</option>
                      <option value="EUR">EUR €</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">计费周期</label>
                  <select
                    value={configForm.billingCycle}
                    onChange={(e) => setConfigForm({ ...configForm, billingCycle: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    <option value="monthly">月付 (Monthly)</option>
                    <option value="annual">年付 (Annual)</option>
                    <option value="biennial">两年付 (Biennial)</option>
                    <option value="payg">按量付费 (PAYG)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">服务到期时间</label>
                  <input
                    type="date"
                    value={configForm.expiresAt}
                    onChange={(e) => setConfigForm({ ...configForm, expiresAt: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-muted-foreground font-medium">资产与提供商备注说明</label>
                <input
                  value={configForm.note}
                  onChange={(e) => setConfigForm({ ...configForm, note: e.target.value })}
                  className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground"
                  placeholder="如: AWS Ingress / 腾讯云 CVM / 自动续费绑卡"
                />
              </div>
            </div>

            {/* Section 3: Alert Thresholds & Security Token */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <Lock className="size-4 text-emerald-400" />
                <span>告警阈值与 Agent 认证安全凭据</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50 text-xs">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">CPU 告警水位阈值</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={configForm.cpuThreshold}
                      onChange={(e) => setConfigForm({ ...configForm, cpuThreshold: Number(e.target.value) })}
                      className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground font-mono"
                    />
                    <span className="text-muted-foreground font-mono">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">内存告警水位阈值</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={configForm.memThreshold}
                      onChange={(e) => setConfigForm({ ...configForm, memThreshold: Number(e.target.value) })}
                      className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground font-mono"
                    />
                    <span className="text-muted-foreground font-mono">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">离线判定超时时长</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={configForm.offlineTimeoutSec}
                      onChange={(e) => setConfigForm({ ...configForm, offlineTimeoutSec: Number(e.target.value) })}
                      className="w-full h-9 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground font-mono"
                    />
                    <span className="text-muted-foreground font-mono">秒</span>
                  </div>
                </div>
              </div>

              {/* Agent Secret Token */}
              <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-muted-foreground font-medium">Agent 客户端认证通信 Token</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newToken = `smx_tok_${server.id.replace("srv-", "")}_${Math.random().toString(36).slice(2, 10)}`;
                      setConfigForm({ ...configForm, agentToken: newToken });
                      toast.info("已生成新 Agent 认证 Token (点击保存生效)");
                    }}
                    className="text-primary hover:underline cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <RefreshCw className="size-3" /> 重新生成
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={configForm.agentToken}
                    readOnly
                    className="flex-1 h-9 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono text-foreground outline-none select-all"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(configForm.agentToken, "token", "Agent Token")}
                    className="h-9 px-3 cursor-pointer text-xs gap-1 font-medium"
                  >
                    {copiedKey === "token" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />} 复制
                  </Button>
                </div>
              </div>
            </div>

            {/* Save & Action Footer */}
            <div className="pt-4 border-t border-border/70 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetConfig}
                className="cursor-pointer gap-1.5 text-xs font-medium"
              >
                <RotateCcw className="size-3.5" /> 重置修改
              </Button>
              <Button
                size="sm"
                onClick={handleSaveConfig}
                className="cursor-pointer gap-1.5 text-xs font-bold px-5"
              >
                <Save className="size-3.5" /> 保存节点配置
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Full Process Inspector Drawer */}
      <ServerProcessesDrawer
        server={server}
        isOpen={isProcessesDrawerOpen}
        onClose={() => setIsProcessesDrawerOpen(false)}
        processCollectionEnabled={processCollectionEnabled}
        onEnableCollection={() => setProcessCollectionEnabled(true)}
      />
    </div>
  );
}
