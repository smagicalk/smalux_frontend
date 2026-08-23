import { useState, useRef, useEffect, useMemo } from "react";
import {
  Server,
  X,
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
  Maximize2,
  Minimize2,
  Save,
  ShieldAlert,
  Clock,
  MapPin,
  Layers,
  Sparkles,
  Lock,
  RefreshCw,
  Disc3,
  AlertCircle,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Flame,
  Eye,
  EyeOff,
  Trash2,
  Bell,
  Key,
  Download,
  Code2,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  Coins,
  Calendar,
  FileText
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { EChart, type EChartsOption } from "@/shared/charts/echart";
import type { EChartsType } from "echarts/core";
import { useThemeStore, resolveThemeMode } from "@/shared/stores/theme-store";
import { useRpc } from "@/app/providers/rpc-context";
import { methods } from "@/shared/api/methods";
import { toast } from "sonner";
import { useServerHardware } from "@/features/servers/hooks/use-server-hardware";
import { getMockServerTelemetry, getMockServerProcesses } from "../mock/infrastructure-mock";
import { useAgentStatus } from "../api/use-agent-status";
import { useServerNetworkProbes } from "../api/use-network-probes";
import { ServerProcessesDrawer, formatProcessMemory } from "./server-processes-drawer";
import { ScrollableBadgeInputStrip } from "./scrollable-badge-input-strip";
import { ReinstallServerDialog } from "./reinstall-server-dialog";
import { DynamicNotifyChannels, DEFAULT_NOTIFY_CHANNELS, type NotifyChannelItem } from "./dynamic-notify-channels";
import { AssetBillingLifecycleSection } from "./asset-billing-lifecycle-section";
import { useServerConfig } from "../api/use-server-config";
import { getMockTerminalOutput, DEFAULT_KNOWN_GROUPS, DEFAULT_KNOWN_TAGS } from "../pages/server-detail-page";
import { useInfrastructureData } from "../api/use-infrastructure-api";
import { MOCK_HOST_SERVERS } from "../mock/infrastructure-mock";
import type { HostServer } from "../types";

const CURRENCY_OPTIONS = [
  { code: "CNY", sym: "¥", name: "CNY (¥ 人民币)" },
  { code: "USD", sym: "$", name: "USD ($ 美元)" },
  { code: "EUR", sym: "€", name: "EUR (€ 欧元)" },
  { code: "HKD", sym: "HK$", name: "HKD (HK$ 港币)" },
  { code: "JPY", sym: "¥", name: "JPY (¥ 日元)" },
  { code: "GBP", sym: "£", name: "GBP (£ 英镑)" },
  { code: "SGD", sym: "S$", name: "SGD (S$ 新加坡元)" },
  { code: "AUD", sym: "A$", name: "AUD (A$ 澳元)" },
  { code: "CAD", sym: "C$", name: "CAD (C$ 加元)" },
  { code: "USDT", sym: "₮", name: "USDT (₮ 泰达币)" },
  { code: "TWD", sym: "NT$", name: "TWD (NT$ 新台币)" },
  { code: "KRW", sym: "₩", name: "KRW (₩ 韩元)" }
];

const BILLING_CYCLE_OPTIONS = [
  { value: "weekly", label: "周付 (Weekly · 7天)", days: 7 },
  { value: "monthly", label: "月付 (Monthly · 30天)", days: 30 },
  { value: "quarterly", label: "季付 / 三月 (Quarterly · 90天)", days: 90 },
  { value: "semiannual", label: "半年付 (Semi-Annual · 180天)", days: 180 },
  { value: "annual", label: "年付 (Annual · 365天)", days: 365 },
  { value: "biennial", label: "两年付 (Biennial · 730天)", days: 730 },
  { value: "triennial", label: "三年付 (Triennial · 1095天)", days: 1095 },
  { value: "payg", label: "按量计费 (Pay-As-You-Go)", days: 30 }
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: "¥",
  USD: "$",
  EUR: "€",
  HKD: "HK$",
  JPY: "¥",
  GBP: "£",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
  USDT: "₮",
  TWD: "NT$",
  KRW: "₩"
};

const BILLING_CYCLE_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  semiannual: 180,
  annual: 365,
  biennial: 730,
  triennial: 1095,
  payg: 30
};

interface ServerDetailDrawerProps {
  server: HostServer | null;
  onClose: () => void;
}

export type TelemetryTimeRange = "realtime" | "1h" | "6h" | "24h" | "3d" | "7d" | "30d" | "90d";

const TELEMETRY_SERIES_CONFIG = [
  { key: "CPU (%)", label: "CPU (%)", barBg: "bg-indigo-400" },
  { key: "内存 (%)", label: "内存 (%)", barBg: "bg-emerald-400" },
  { key: "下行 (MB/s)", label: "下行 (MB/s)", barBg: "bg-sky-400", isDashed: true },
  { key: "上行 (MB/s)", label: "上行 (MB/s)", barBg: "bg-purple-400", isDashed: true },
  { key: "读 I/O (MB/s)", label: "读 I/O (MB/s)", barBg: "bg-teal-400" },
  { key: "写 I/O (MB/s)", label: "写 I/O (MB/s)", barBg: "bg-amber-400" }
];

const PROBE_TIME_RANGES = [
  { key: "realtime", label: "实时", fullLabel: "实时 (最近5分钟)", ms: 5 * 60 * 1000, stepCount: 30 },
  { key: "1h", label: "1h", fullLabel: "1小时", ms: 3600 * 1000, stepCount: 24 },
  { key: "3h", label: "3h", fullLabel: "3小时", ms: 3 * 3600 * 1000, stepCount: 24 },
  { key: "5h", label: "5h", fullLabel: "5小时", ms: 5 * 3600 * 1000, stepCount: 25 },
  { key: "12h", label: "12h", fullLabel: "12小时", ms: 12 * 3600 * 1000, stepCount: 24 },
  { key: "1d", label: "1d", fullLabel: "1天 (24小时)", ms: 24 * 3600 * 1000, stepCount: 24 },
  { key: "3d", label: "3d", fullLabel: "3天", ms: 3 * 24 * 3600 * 1000, stepCount: 24 },
  { key: "7d", label: "7d", fullLabel: "7天", ms: 7 * 24 * 3600 * 1000, stepCount: 28 },
  { key: "15d", label: "15d", fullLabel: "15天", ms: 15 * 24 * 3600 * 1000, stepCount: 30 },
  { key: "1m", label: "1m", fullLabel: "1个月 (30天)", ms: 30 * 24 * 3600 * 1000, stepCount: 30 },
  { key: "3m", label: "3m", fullLabel: "3个月 (90天)", ms: 90 * 24 * 3600 * 1000, stepCount: 30 }
] as const;

type ProbeTimeRangeKey = (typeof PROBE_TIME_RANGES)[number]["key"];

export function ServerDetailDrawer({ server, onClose }: ServerDetailDrawerProps) {
  const { client } = useRpc();
  const [activeTab, setActiveTab] = useState<"telemetry" | "network" | "terminal" | "config">("telemetry");
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeRange, setTimeRange] = useState<TelemetryTimeRange>("1h");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  // Top 5 processes for overview widget
  const { data: hw } = useServerHardware(server?.id);
  const topProcesses = useMemo(() => {
    return getMockServerProcesses(server).slice(0, 5);
  }, [server]);

  const themeMode = useThemeStore((state) => state.mode);
  const isDark = resolveThemeMode(themeMode) === "dark";

  // Server configuration via useServerConfig (RPC + Mock API engine)
  const {
    config: configForm,
    setConfig: setConfigForm,
    isLoading: isLoadingConfig,
    isSaving: isSavingConfig,
    isDeleting: isDeletingServer,
    saveConfig,
    resetConfig,
    deleteServer
  } = useServerConfig(server?.id, server ?? undefined, {
    onDeleted: () => onClose()
  });

  const { servers } = useInfrastructureData({ limit: 100 });
  const [groupInput, setGroupInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const [customGroups, setCustomGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("smalux_known_groups");
      return saved ? JSON.parse(saved) : DEFAULT_KNOWN_GROUPS;
    } catch {
      return DEFAULT_KNOWN_GROUPS;
    }
  });

  const [customTags, setCustomTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("smalux_known_tags");
      return saved ? JSON.parse(saved) : DEFAULT_KNOWN_TAGS;
    } catch {
      return DEFAULT_KNOWN_TAGS;
    }
  });

  // Dynamically compute all known groups from all servers + user input history
  const allKnownGroups = useMemo(() => {
    const serverGroups = (servers || []).map((s) => s.group).filter(Boolean);
    const mockGroups = MOCK_HOST_SERVERS.map((s) => s.group).filter(Boolean);
    return Array.from(new Set([...serverGroups, ...mockGroups, ...customGroups, ...configForm.groups]));
  }, [servers, customGroups, configForm.groups]);

  // Dynamically compute all known tags from custom pool + current server tags
  const allKnownTags = useMemo(() => {
    return Array.from(new Set([...customTags, ...configForm.tags]));
  }, [customTags, configForm.tags]);

  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addGroup = (g: string) => {
    const trimmed = g.trim();
    if (!trimmed) return;
    if (!configForm.groups.includes(trimmed)) {
      setConfigForm((prev) => ({ ...prev, groups: [...prev.groups, trimmed] }));
    }
    if (!customGroups.includes(trimmed)) {
      const updated = [...customGroups, trimmed];
      setCustomGroups(updated);
      try {
        localStorage.setItem("smalux_known_groups", JSON.stringify(updated));
      } catch {}
    }
    setGroupInput("");
  };

  const removeGroup = (g: string) => {
    setConfigForm((prev) => ({ ...prev, groups: prev.groups.filter((item) => item !== g) }));
  };

  const addTag = (t: string) => {
    const trimmed = t.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (!configForm.tags.includes(trimmed)) {
      setConfigForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    if (!customTags.includes(trimmed)) {
      const updated = [...customTags, trimmed];
      setCustomTags(updated);
      try {
        localStorage.setItem("smalux_known_tags", JSON.stringify(updated));
      } catch {}
    }
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setConfigForm((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== t) }));
  };

  const [isReinstallDialogOpen, setIsReinstallDialogOpen] = useState(false);

  // Expiration days calculation
  const expirationInfo = useMemo(() => {
    if (!configForm.expiresAt) return { daysLeft: null, status: "unknown", label: "未设置到期日" };
    const exp = new Date(configForm.expiresAt).getTime();
    const diff = Math.ceil((exp - Date.now()) / (24 * 3600 * 1000));
    if (diff < 0) return { daysLeft: diff, status: "expired", label: `已过期 ${Math.abs(diff)} 天` };
    if (diff <= 15) return { daysLeft: diff, status: "warning", label: `剩余 ${diff} 天 (即将到期)` };
    return { daysLeft: diff, status: "normal", label: `剩余 ${diff} 天` };
  }, [configForm.expiresAt]);

  // Dynamic Residual Value Calculation
  const residualInfo = useMemo(() => {
    const sym = CURRENCY_SYMBOLS[configForm.currency] || "¥";
    const cycleDays = BILLING_CYCLE_DAYS[configForm.billingCycle] || 365;
    const daysLeft = expirationInfo.daysLeft !== null ? Math.max(0, expirationInfo.daysLeft) : 0;
    const price = Number(configForm.price) || 0;

    if (configForm.billingCycle === "payg" || price === 0 || !configForm.expiresAt || expirationInfo.status === "expired") {
      return {
        value: "0.00",
        sym,
        dailyCost: "0.00",
        percent: 0,
        daysLeft,
        cycleDays,
        isPayg: configForm.billingCycle === "payg",
        isExpired: expirationInfo.status === "expired"
      };
    }

    const residual = Math.max(0, price * (daysLeft / cycleDays));
    const daily = price / cycleDays;
    const percent = Math.min(100, Math.max(0, Math.round((daysLeft / cycleDays) * 100)));

    return {
      value: residual.toFixed(2),
      sym,
      dailyCost: daily.toFixed(2),
      percent,
      daysLeft,
      cycleDays,
      isPayg: false,
      isExpired: false
    };
  }, [configForm.price, configForm.currency, configForm.billingCycle, configForm.expiresAt, expirationInfo.daysLeft, expirationInfo.status]);

  // Sync initial configuration
  useEffect(() => {
    if (server) {
      setProcessCollectionEnabled(server.enableProcessCollection !== false);
      const initialGroups = server.group ? [server.group] : ["网关集群"];
      setConfigForm({
        name: server.name,
        groups: initialGroups,
        tags: ["production", "gateway", "bgp"],
        autoLocation: true,
        location: server.region ? `${server.region} (BGP Anycast)` : "中国 香港 (Hong Kong · BGP)",
        trafficLimitValue: 1000,
        trafficLimitUnit: "GB",
        trafficLimitGb: 1000,
        trafficCalculation: "outbound",
        trafficResetDay: 1,
        publicVisible: true,
        maintenanceMode: false,
        price: server.price ?? 45,
        currency: server.currency || "CNY",
        billingCycle: server.billingCycle || "biennial",
        expiresAt: server.expiresAt ? new Date(server.expiresAt).toISOString().split("T")[0] : "2027-03-15",
        autoRenew: true,
        note: server.note || "BGP Anycast · 生产核心节点 · 自动续费",
        cpuThreshold: 85,
        cpuDurationSec: 60,
        memThreshold: 90,
        memDurationSec: 60,
        diskThreshold: 90,
        diskDurationSec: 300,
        netThresholdMb: 100,
        offlineTimeoutSec: 60,
        enableNotify: true,
        notifyChannels: DEFAULT_NOTIFY_CHANNELS,
        agentToken: `smx_tok_${server.id.replace("srv-", "")}_${Math.random().toString(36).slice(2, 8)}`,
        allowRemoteExec: server.allowRemoteExec !== false && server.id !== "srv-test-noremote"
      });
    }
  }, [server?.id, server?.enableProcessCollection]);

  // Global Probes Time Range & Filter State
  const [probeTimeRange, setProbeTimeRange] = useState<ProbeTimeRangeKey>("1d");
  const [hiddenProbes, setHiddenProbes] = useState<Record<string, boolean>>({});

  const toggleProbeVisibility = (id: string) => {
    setHiddenProbes((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Terminal State & Commands
  const [termInput, setTermInput] = useState("");
  const [termStatus, setTermStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [termLogs, setTermLogs] = useState<string[]>([
    "==========================================================================",
    " smalux Web Terminal & Remote Command Execution Engine",
    " 节点: " + (server?.name || "Node") + " (" + (server?.ipv4 || server?.ip || "127.0.0.1") + ")",
    " 状态: 🟡 待命 (输入首条指令或点击快捷指令时自动建立 WSS 加密通道)",
    " 提示: 在下方输入 Linux 命令或点击快捷按钮开始交互。",
    "=========================================================================="
  ]);
  const termEndRef = useRef<HTMLDivElement>(null);

  const isRemoteEnabled = Boolean(
    configForm.allowRemoteExec &&
    server?.status !== "offline" &&
    server?.id !== "srv-test-noremote"
  );

  useEffect(() => {
    if (activeTab === "terminal") {
      termEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [termLogs, activeTab]);

  const executeCommand = (cmd: string) => {
    if (!cmd.trim() || !server || !isRemoteEnabled) return;
    const trimmed = cmd.trim();
    setTermInput("");

    if (termStatus !== "connected") {
      setTermStatus("connecting");
      const sessionId = `smx_sess_${Math.random().toString(36).slice(2, 9)}`;
      const handshakeLogs = [
        `root@${server.name}:~# ${trimmed}`,
        `[WSS] 正在向 ${server.ipv4 || server.ip || "127.0.0.1"}:443 发起安全 WebSocket 握手...`,
        `[TLS] TLS 1.3 协商就绪 (Cipher: TLS_AES_256_GCM_SHA384 / RTT 18ms)`,
        `[AUTH] 节点安全凭据与公钥校验通过，终端会话已激活 (${sessionId})`
      ];

      if (trimmed === "clear") {
        setTermStatus("connected");
        setTermLogs(["Console screen cleared."]);
        return;
      }

      const results = getMockTerminalOutput(trimmed, server);
      setTermLogs((prev) => [...prev, ...handshakeLogs, ...results]);
      setTermStatus("connected");
      return;
    }

    if (trimmed === "clear") {
      setTermLogs(["Console screen cleared."]);
      return;
    }

    const results = getMockTerminalOutput(trimmed, server);
    setTermLogs((prev) => [...prev, `root@${server.name}:~# ${trimmed}`, ...results]);
  };

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`已复制 ${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSampleProcesses = async () => {
    if (!server) return;
    setIsSamplingProcesses(true);
    try {
      const res = await client.call(
        "agent.sampleProcesses",
        { serverId: server.id },
        methods["agent.sampleProcesses"].result
      );
      if (res.ok) {
        setProcessSnapshotTime(res.timestamp || new Date().toLocaleTimeString("zh-CN", { hour12: false }));
        toast.success("已完成单次进程级即时采样分析", { duration: 3000 });
      } else {
        toast.error(res.error || "探针已完全禁用进程采集权限", { duration: 3000 });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "探针已完全禁用进程采集权限", { duration: 3000 });
    } finally {
      setIsSamplingProcesses(false);
    }
  };

  const handleEnableAutoCollection = async () => {
    if (!server) return;
    setIsSamplingProcesses(true);
    try {
      const res = await client.call(
        "agent.sampleProcesses",
        { serverId: server.id },
        methods["agent.sampleProcesses"].result
      );
      if (res.ok) {
        setProcessCollectionEnabled(true);
        setProcessSnapshotTime(res.timestamp || new Date().toLocaleTimeString("zh-CN", { hour12: false }));
        toast.success("已开启常驻自动采集，并已刷新当前进程列表", { duration: 3000 });
      } else {
        toast.error(res.error || "探针拒绝开启常驻采集", { duration: 3000 });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "探针拒绝开启常驻采集", { duration: 3000 });
    } finally {
      setIsSamplingProcesses(false);
    }
  };

  const handleSaveConfig = () => {
    saveConfig();
  };

  const handleResetConfig = () => {
    resetConfig();
  };

  const handleDeleteNode = () => {
    if (!server) return;
    if (confirm(`⚠️ 危险操作确认\n\n确定要将节点 [${server.name}] 从集群中解除绑定并彻底删除吗？\n删除后历史遥测与指标数据将不再保留！`)) {
      deleteServer();
    }
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

  const {
    data: agentStatus,
    heartbeatBars,
    slaPercentage,
    slaNote,
    isPinging,
    triggerPing
  } = useAgentStatus(server);

  const {
    networkDetails,
    probeRegions,
    summary: probeSummary,
    isTesting: isTestingProbes,
    runGlobalTest
  } = useServerNetworkProbes(server, probeTimeRange);

  const probeChartOption = useMemo<EChartsOption>(() => {
    const config = PROBE_TIME_RANGES.find((r) => r.key === probeTimeRange) || PROBE_TIME_RANGES[4];
    const count = config.stepCount;
    const intervalMs = config.ms / count;

    const timeLabels: string[] = [];
    const now = Date.now();

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now - i * intervalMs);
      if (probeTimeRange === "realtime") {
        timeLabels.push(`${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`);
      } else if (["15d", "1m", "3m"].includes(probeTimeRange)) {
        timeLabels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      } else if (["3d", "7d"].includes(probeTimeRange)) {
        timeLabels.push(`${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:00`);
      } else {
        timeLabels.push(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      }
    }

    const activeProbes = probeRegions.filter((p) => !hiddenProbes[p.id]);

    const series = activeProbes.map((probe) => {
      const data = timeLabels.map((_, idx) => {
        const wave1 = Math.sin((idx / count) * Math.PI * 4 + probe.baseLatency * 0.1) * (probe.baseLatency * 0.06);
        const wave2 = Math.cos((idx / count) * Math.PI * 2 + probe.baseLatency * 0.2) * (probe.baseLatency * 0.04);
        const jitter = wave1 + wave2 + Math.sin(idx * 1.7) * 0.4;
        return Math.max(1, +(probe.baseLatency + jitter).toFixed(1));
      });

      return {
        name: probe.name,
        type: "line" as const,
        smooth: 0.4,
        showSymbol: false,
        symbolSize: 4,
        lineStyle: {
          width: 2,
          color: probe.color
        },
        itemStyle: {
          color: probe.color
        },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${probe.color}33` },
              { offset: 1, color: `${probe.color}00` }
            ]
          }
        },
        data
      };
    });

    return {
      tooltip: {
        trigger: "axis" as const,
        confine: true,
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.96)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
        borderWidth: 1,
        padding: [8, 12],
        extraCssText: "box-shadow: 0 12px 32px rgba(0,0,0,0.36); backdrop-filter: blur(8px); border-radius: 8px; z-index: 50; pointer-events: none;",
        textStyle: {
          color: isDark ? "#f8fafc" : "#0f172a",
          fontSize: 11,
          fontFamily: "monospace"
        },
        position: (point: number[], _params: any, _dom: any, _rect: any, size: { contentSize: [number, number]; viewSize: [number, number] }) => {
          const [x, y] = point;
          const [w, h] = size.contentSize;
          const [viewW, viewH] = size.viewSize;

          let posX = x + 16;
          if (posX + w > viewW - 10) {
            posX = x - w - 16;
          }
          if (posX < 10) posX = 10;

          // If cursor is in the upper 48% of the chart, show tooltip BELOW the cursor to prevent top clipping
          let posY = y < viewH * 0.48 ? y + 16 : y - h - 16;
          if (posY < 8) posY = 8;
          if (posY + h > viewH - 8) posY = Math.max(8, viewH - h - 8);

          return [posX, posY];
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return "";
          let html = `<div style="font-weight:bold;margin-bottom:6px;border-bottom:1px solid rgba(128,128,128,0.2);padding-bottom:4px;font-size:11px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span>时间: ${params[0]?.axisValue}</span>
            <span style="opacity:0.65;font-weight:normal;">(${params.length} 个节点)</span>
          </div>`;
          html += `<div style="display:grid;grid-template-columns:${params.length > 5 ? "repeat(2, 1fr)" : "1fr"};gap:3px 12px;">`;
          params.forEach((item: any) => {
            const pr = probeRegions.find((p) => p.name === item.seriesName);
            html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11px;min-width:130px;">
              <span style="display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                <span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:${item.color};flex-shrink:0;"></span>
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.seriesName.split(" ")[0]}</span>
              </span>
              <span style="flex-shrink:0;">
                <strong style="color:${item.color};">${item.value}ms</strong>
                <span style="margin-left:4px;opacity:0.75;font-size:10px;">(${pr?.loss || "0%"})</span>
              </span>
            </div>`;
          });
          html += `</div>`;
          return html;
        }
      },
      grid: {
        top: 42,
        right: 20,
        bottom: 25,
        left: 20,
        containLabel: true
      },
      xAxis: {
        type: "category" as const,
        boundaryGap: false,
        data: timeLabels,
        axisLine: {
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"
          }
        },
        axisLabel: {
          color: isDark ? "#94a3b8" : "#64748b",
          fontSize: 10,
          fontFamily: "monospace"
        }
      },
      yAxis: {
        type: "value" as const,
        name: "延迟 (ms)",
        nameTextStyle: {
          color: isDark ? "#94a3b8" : "#64748b",
          fontSize: 11,
          fontFamily: "monospace",
          padding: [0, 0, 6, 0]
        },
        splitLine: {
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
            type: "dashed" as const
          }
        },
        axisLabel: {
          color: isDark ? "#94a3b8" : "#64748b",
          fontSize: 10,
          fontFamily: "monospace",
          formatter: "{value}ms"
        }
      },
      series
    };
  }, [isDark, probeTimeRange, hiddenProbes, probeRegions]);

  if (!server) return null;

  const isWarn = server.status === "warning";
  const isOff = server.status === "offline";

  const memTotal = server.memTotalGb || 16;
  const memUsed = server.memUsedGb || +(memTotal * (server.memory / 100)).toFixed(1);
  const diskTotal = server.diskTotalGb || 500;
  const diskUsed = server.diskUsedGb || +(diskTotal * (server.disk / 100)).toFixed(1);
  const trafficTotal = server.trafficTotalGb || 10000;
  const trafficUsed = server.trafficUsedGb || Math.round(1800 + server.cpu * 55);
  const trafficRatio = Math.min(100, Math.round((trafficUsed / trafficTotal) * 100));

  const ipv4 = server.ipv4 || (!server.ip?.includes(":") ? server.ip : "");
  const ipv6 = server.ipv6 || (server.ip?.includes(":") ? server.ip : "");
  const sshHost = ipv4 || (ipv6 ? `[${ipv6}]` : server.name);

  const globalProbes = [
    { region: "中国香港 (Hong Kong)", target: "HK-Gateway-Edge", latency: "16ms", loss: "0%", status: "up" },
    { region: "日本东京 (Tokyo)", target: "AWS AP-Northeast-1", latency: "38ms", loss: "0%", status: "up" },
    { region: "新加坡 (Singapore)", target: "GCP Asia-Southeast1", latency: "32ms", loss: "0%", status: "up" },
    { region: "美国硅谷 (San Jose)", target: "US-West Anycast Ingress", latency: "128ms", loss: "0%", status: "up" },
    { region: "德国法兰克福 (Frankfurt)", target: "EU-Central Backbone", latency: "164ms", loss: "0.2%", status: "up" }
  ];

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 bg-background/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right ${
        isExpanded ? "w-full" : "w-full sm:w-[680px] md:w-[860px] lg:w-[1020px] xl:w-[1140px] max-w-[98vw]"
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:px-6 border-b border-border/70 flex flex-wrap items-center justify-between gap-3 bg-muted/25">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold shrink-0 shadow-2xs">
            <Server className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground truncate" title={server.name}>
                {server.name}
              </h2>
              <Badge
                variant={isOff ? "danger" : isWarn ? "warning" : "success"}
                dot
                className="text-[11px] px-2 py-0.5 font-medium shrink-0"
              >
                {isOff ? "节点离线" : isWarn ? "高负载预警" : "正常在线"}
              </Badge>
              {server.group && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  {server.group}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono mt-1">
              <span className="flex items-center gap-1 text-foreground/90 font-semibold" title="主公网 IP 地址">
                <Globe className="size-3 text-cyan-400 shrink-0" />
                {ipv4 || ipv6 || "—"}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1" title="机房区域">
                <MapPin className="size-3 text-amber-400 shrink-0" />
                {server.region}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1" title="操作系统与架构">
                <Terminal className="size-3 text-indigo-400 shrink-0" />
                {server.os} ({server.arch || "x86_64"})
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className={`flex items-center gap-1 ${isOff ? "text-rose-400" : "text-emerald-400 font-medium"}`} title="系统连续运行时长 (Uptime)">
                <Clock className="size-3 shrink-0" />
                {isOff ? "已离线" : `连续运行 ${server.uptime}`}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {sshHost && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(`ssh root@${sshHost}`, "ssh", "SSH 登录命令")}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer font-mono font-medium hidden sm:inline-flex"
              title="复制 SSH 登录命令"
            >
              {copiedKey === "ssh" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              ssh root@{sshHost}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 cursor-pointer hidden md:flex"
            title={isExpanded ? "还原窗口宽度" : "全屏最大化"}
          >
            {isExpanded ? <Minimize2 className="size-4 text-muted-foreground" /> : <Maximize2 className="size-4 text-muted-foreground" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0 cursor-pointer hover:bg-rose-500/10 hover:text-rose-500"
            title="关闭抽屉"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Global Offline Machine Banner */}
      {isOff && (
        <div className="mx-4 sm:mx-6 mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-center justify-between gap-3 text-xs text-rose-300 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-400" />
            <div>
              <span className="font-bold">该主机当前处于离线状态：</span>
              <span className="opacity-90">心跳已中断，下方所呈现的数据为离线前历史快照，已禁用远程指令。</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30 shrink-0">
            离线模式
          </Badge>
        </div>
      )}

      {/* Navigation Tabs Header */}
      <div className="px-4 sm:px-6 pt-2 pb-2 border-b border-border/70 flex items-center justify-between gap-2 overflow-x-auto bg-muted/10 text-xs">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer border ${
              activeTab === "telemetry"
                ? "bg-primary/15 text-primary border-primary/30 font-semibold shadow-xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Activity className="size-3.5" /> 实时遥测与多维指标
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("network")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer border ${
              activeTab === "network"
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 font-semibold shadow-xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Globe className="size-3.5" /> 双栈网络与全球拨测
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terminal")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer border ${
              activeTab === "terminal"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold shadow-xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Terminal className="size-3.5" /> Web 终端与即时命令
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer border ${
              activeTab === "config"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold shadow-xs"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Settings className="size-3.5" /> 节点配置与运维管理
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>实时遥测已连接 (2s)</span>
        </div>
      </div>

      {/* Main Drawer Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* ===================== TAB 1: TELEMETRY ===================== */}
        {activeTab === "telemetry" && (
          <div className="space-y-5">
            {/* 6 Big Metric Gauge Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. CPU */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Cpu className="size-3.5 text-indigo-400" /> CPU 负载
                  </span>
                  <span className="text-[11px]">{server.cpuCores || 8} vCPU</span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className={`text-xl font-black tracking-tight leading-tight ${server.cpu > 80 ? "text-amber-400" : "text-foreground"}`}>
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
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="size-3.5 text-emerald-400" /> 内存占用
                  </span>
                  <span className="text-[11px]">{memUsed}G / {memTotal}G</span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className={`text-xl font-black tracking-tight leading-tight ${server.memory > 85 ? "text-amber-400" : "text-foreground"}`}>
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
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <HardDrive className="size-3.5 text-amber-400" /> 磁盘空间
                  </span>
                  <span className="text-[11px]">{diskUsed}G / {diskTotal}G</span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className={`text-xl font-black tracking-tight leading-tight ${server.disk > 85 ? "text-amber-400" : "text-foreground"}`}>
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

              {/* 4. Disk I/O */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden">
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

              {/* 5. Real-time Network */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden">
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
              <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between h-[118px] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Globe className="size-3.5 text-purple-400" /> 流量配额
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {trafficTotal >= 1024 ? `${(trafficTotal / 1024).toFixed(0)} TB` : `${trafficTotal} GB`}
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center font-mono my-0.5">
                  <div className={`text-xl font-black tracking-tight leading-tight ${trafficRatio > 85 ? "text-amber-400" : "text-foreground"}`}>
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

            {/* Agent Connection & Daemon Telemetry Module */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex size-2.5">
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                        agentStatus?.status === "offline"
                          ? "bg-rose-400"
                          : agentStatus?.status === "warning"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span
                      className={`relative inline-flex size-2.5 rounded-full ${
                        agentStatus?.status === "offline"
                          ? "bg-rose-500"
                          : agentStatus?.status === "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {agentStatus?.statusText || "Agent 守护进程连接正常"}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold border ${
                          agentStatus?.status === "offline"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : agentStatus?.status === "warning"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {agentStatus?.badgeText || "ONLINE"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {agentStatus?.subtitle || "全双工流式遥测通道已建立 · 2s 实时推流上报"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={triggerPing}
                    disabled={isPinging}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 bg-background/50 hover:bg-muted/50 text-foreground transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Zap className={`size-3 text-amber-400 ${isPinging ? "animate-spin" : ""}`} />
                    <span>{isPinging ? "测速中..." : "即时测速"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `smalux-agent daemon --status (PID: ${agentStatus?.pid || 1042}, Proto: ${agentStatus?.protocol || "gRPC/TLS1.3"}, Latency: ${agentStatus?.latencyMs || 14}ms, Uptime: ${server?.uptime || "18d4h"})`
                      );
                      setCopiedKey("agent-diag");
                      toast.success("已复制 Agent 诊断链路状态");
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 bg-background/50 hover:bg-muted/50 text-foreground transition-colors cursor-pointer"
                  >
                    {copiedKey === "agent-diag" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-muted-foreground" />}
                    <span>复制诊断</span>
                  </button>
                </div>
              </div>

              {/* 5 Compact Agent Status Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-0.5">
                {/* 1. Protocol & Transport */}
                <div className="p-2 rounded-lg border border-border/50 bg-muted/20 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Radio className="size-3.5 text-cyan-400 shrink-0" />
                    <span>传输链路</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-mono font-bold text-foreground">{agentStatus?.protocol || "gRPC / TLS 1.3"}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{agentStatus?.protocolDetail || "HTTP/2 多路复用"}</div>
                  </div>
                </div>

                {/* 2. Heartbeat Latency & Jitter */}
                <div className="p-2 rounded-lg border border-border/50 bg-muted/20 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Zap className="size-3.5 text-emerald-400 shrink-0" />
                    <span>心跳延迟</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {agentStatus?.latencyMs ? `${agentStatus.latencyMs} ms` : "--"}{" "}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {agentStatus?.jitterMs ? `(±${agentStatus.jitterMs}ms)` : ""}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      丢包率 {agentStatus?.lossRate || "0.0%"} · {agentStatus?.quality || "极佳"}
                    </div>
                  </div>
                </div>

                {/* 3. Report Interval & Last Ping */}
                <div className="p-2 rounded-lg border border-border/50 bg-muted/20 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Clock className="size-3.5 text-indigo-400 shrink-0" />
                    <span>上报周期</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-mono font-bold text-foreground">
                      {agentStatus?.interval || "2s / 次"}{" "}
                      <span className="text-[10px] text-emerald-400 font-normal">
                        {agentStatus?.status === "offline" ? "(已中断)" : "(流式)"}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">心跳: {agentStatus?.lastPing || "刚刚 (1s前)"}</div>
                  </div>
                </div>

                {/* 4. Agent Daemon Footprint */}
                <div className="p-2 rounded-lg border border-border/50 bg-muted/20 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Cpu className="size-3.5 text-purple-400 shrink-0" />
                    <span>Agent 负载</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-mono font-bold text-foreground">
                      CPU {agentStatus?.cpuUsage || "0.2%"} · {agentStatus?.memRss || "18M"}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      PID: {agentStatus?.pid || 1042} · 常驻轻量
                    </div>
                  </div>
                </div>

                {/* 5. Daemon Version & Security */}
                <div className="p-2 rounded-lg border border-border/50 bg-muted/20 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <ShieldCheck className="size-3.5 text-amber-400 shrink-0" />
                    <span>版本与权限</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-mono font-bold text-foreground">
                      {agentStatus?.version || "v1.4.2"} {agentStatus?.isLatest ? "(Latest)" : ""}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {server?.allowRemoteExec !== false ? "远端指令已授权" : "远端指令未授权"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Heartbeat Uptime Health Strip (类似监控的 60 分钟连通性绿条) */}
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Activity className="size-3 text-emerald-400" />
                    <span>最近 60 分钟连通性序列 (Heartbeat Availability)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`font-bold ${
                        agentStatus?.status === "offline"
                          ? "text-rose-400"
                          : agentStatus?.status === "warning"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {slaPercentage}
                    </span>
                  </span>
                </div>

                {/* Micro Uptime Bars */}
                <div className="flex items-center gap-[2px] sm:gap-[2.5px] h-3 w-full">
                  {(heartbeatBars?.slice(6) || Array.from({ length: 42 }).map((_, i) => ({
                    index: i,
                    minuteAgo: 42 - i,
                    status: "normal" as const,
                    latencyMs: agentStatus?.latencyMs || 14,
                    lossRate: "0%"
                  }))).map((bar) => {
                    const barColor =
                      bar.status === "offline"
                        ? "bg-rose-500/80 hover:bg-rose-400"
                        : bar.status === "warning"
                        ? "bg-amber-500/80 hover:bg-amber-400"
                        : "bg-emerald-500/80 hover:bg-emerald-400";

                    return (
                      <div
                        key={bar.index}
                        className={`flex-1 h-full rounded-xs transition-all cursor-pointer ${barColor}`}
                        title={`采样点 #${bar.index + 1} (${bar.minuteAgo} 分钟前): ${
                          bar.status === "offline"
                            ? "心跳超时 (未收到响应)"
                            : bar.status === "warning"
                            ? `网络抖动 (${bar.latencyMs}ms · 丢包 ${bar.lossRate})`
                            : `正常响应 (${bar.latencyMs}ms · 丢包 ${bar.lossRate})`
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/70 pt-0.5">
                  <span>60 分钟前</span>
                  <span>30 分钟前</span>
                  <span>刚刚</span>
                </div>
              </div>
            </div>

            {/* Performance Streams Chart Card */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">全维性能波形监控 (Telemetry Streams & I/O)</span>
                  <Badge variant="neutral" className="text-[10px] font-mono">采样率: 2s</Badge>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs overflow-x-auto">
                  {(["realtime", "1h", "6h", "24h", "3d", "7d", "30d", "90d"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTimeRange(r)}
                      className={`px-2.5 py-1 rounded font-mono font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        timeRange === r ? "bg-card text-foreground font-bold shadow-2xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r === "realtime" ? "实时" : r === "1h" ? "1小时" : r === "6h" ? "6小时" : r === "24h" ? "24小时" : r === "3d" ? "3天" : r === "7d" ? "7天" : r === "30d" ? "30天" : "90天 (季度)"}
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

            {/* Top Processes Table & System Environment Specifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Processes */}
              {(() => {
                const processMode = server?.processCollectionMode || (server?.enableProcessCollection === false ? "disable_auto" : "enabled");
                const isForbidden = processMode === "forbidden";
                const isAutoDisabled = !isForbidden && (!processCollectionEnabled || processMode === "disable_auto");

                return (
                  <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between text-xs font-bold text-foreground gap-2">
                        <div className="flex items-center gap-2">
                          <Radio className="size-3.5 text-emerald-400" />
                          <span>活跃高负载进程 (Top Processes)</span>
                          {isOff ? (
                            <Badge variant="danger" className="text-[10px]">
                              主机离线
                            </Badge>
                          ) : isForbidden ? (
                            <Badge variant="danger" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20 gap-1">
                              <Lock className="size-2.5" /> 策略已禁用
                            </Badge>
                          ) : isAutoDisabled ? (
                            <Badge variant="neutral" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1">
                              <Clock className="size-2.5" /> 按需采样模式
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              常驻自动采集
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            快照: {processSnapshotTime}
                          </span>
                          {!isOff && !isForbidden && (
                            <button
                              type="button"
                              onClick={handleSampleProcesses}
                              disabled={isSamplingProcesses}
                              className="text-[11px] font-mono flex items-center gap-1 text-primary hover:underline cursor-pointer"
                              title="触发即时单次抓取最新快照"
                            >
                              <RefreshCw className={`size-3 ${isSamplingProcesses ? "animate-spin" : ""}`} /> 即时采样
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={isOff || isForbidden ? undefined : () => setIsProcessesDrawerOpen(true)}
                            disabled={isOff || isForbidden}
                            className={`text-[11px] font-mono font-bold ml-1 flex items-center gap-1 ${
                              isOff || isForbidden
                                ? "text-muted-foreground/35 cursor-not-allowed select-none opacity-40"
                                : "text-foreground/80 hover:text-primary hover:underline cursor-pointer"
                            }`}
                            title={
                              isOff
                                ? "主机已离线，无法查看进程快照"
                                : isForbidden
                                ? "探针安全策略已硬禁用进程采集，请在遮罩中操作"
                                : "打开全量系统进程树抽屉"
                            }
                          >
                            {isForbidden ? "查看快照 →" : "查看全部 →"}
                          </button>
                        </div>
                      </div>

                      {/* Mode 1: Banner for On-Demand Sampling Mode (No Mask) */}
                      {!isOff && isAutoDisabled && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 font-mono animate-in fade-in duration-200">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-amber-400 shrink-0" />
                            <span>按需采样模式 · 呈现历史快照数据</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleEnableAutoCollection}
                            disabled={isSamplingProcesses}
                            className="px-2.5 py-0.5 rounded bg-primary/20 hover:bg-primary/30 text-primary text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            title="开启探针常驻实时轮询并立即刷新"
                          >
                            <Sparkles className={`size-3 ${isSamplingProcesses ? "animate-spin" : ""}`} />
                            开启自动采集
                          </button>
                        </div>
                      )}

                      {/* Table Container */}
                      <div className="relative rounded-lg border border-border/60 overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px]">
                            <tr>
                              <th className="px-3 py-2.5 w-16 min-w-[64px]">PID</th>
                              <th className="px-3 py-2.5 min-w-[150px]">进程命令</th>
                              <th className="px-3 py-2.5 w-20 min-w-[72px]">用户</th>
                              <th className="px-3 py-2.5 w-24 min-w-[92px] text-right whitespace-nowrap">常驻内存</th>
                              <th className="px-3 py-2.5 w-18 min-w-[68px] text-right whitespace-nowrap">CPU%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 bg-card/20">
                            {topProcesses.map((p) => {
                              const fullCmd = p.command || p.name;
                              return (
                                <tr key={p.pid} className="hover:bg-muted/30">
                                  <td className="px-3 py-2.5 font-semibold text-primary">{p.pid}</td>
                                  <td className="px-3 py-2.5 text-foreground font-medium truncate max-w-[160px]" title={fullCmd}>
                                    {fullCmd}
                                  </td>
                                  <td className="px-3 py-2.5 text-muted-foreground">{p.user}</td>
                                  <td className="px-3 py-2.5 text-right text-foreground font-mono whitespace-nowrap">
                                    {formatProcessMemory(p.resKb ?? p.resMb)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-indigo-400 font-bold whitespace-nowrap">{p.cpu}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Mask: Only for Offline or Forbidden (Mode 2) */}
                        {isOff ? (
                          <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-background/80 flex flex-col items-center justify-center p-4 text-center space-y-2 select-none">
                            <div className="p-2 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <AlertTriangle className="size-4" />
                            </div>
                            <div className="text-xs font-bold text-foreground">主机当前已离线 (Heartbeat Lost)</div>
                            <p className="text-[11px] text-muted-foreground max-w-xs">
                              探针心跳中断，实时遥测与进程采集已暂停，无法执行远程交互。
                            </p>
                          </div>
                        ) : isForbidden ? (
                          <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-background/80 flex flex-col items-center justify-center p-4 text-center space-y-2.5 select-none">
                            <div className="p-2 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <Lock className="size-5" />
                            </div>
                            <div className="text-xs font-bold text-foreground">探针安全策略已硬禁用进程采集</div>
                            <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                              宿主机配置文件中已设置 <code>disable_process_profiling = true</code>，已锁定所有实时抓取指令。
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <Button size="sm" variant="secondary" onClick={() => setIsProcessesDrawerOpen(true)} className="h-7 text-xs gap-1 cursor-pointer">
                                查看历史缓存快照
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setActiveTab("config")} className="h-7 text-xs gap-1 cursor-pointer">
                                探针运维配置指引
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Card Bottom: View All Processes */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={isOff || isForbidden ? undefined : () => setIsProcessesDrawerOpen(true)}
                      disabled={isOff || isForbidden}
                      className={`w-full h-8 text-xs font-mono gap-1.5 ${
                        isOff || isForbidden
                          ? "opacity-40 cursor-not-allowed select-none bg-muted/20 border-border/40 text-muted-foreground"
                          : "cursor-pointer bg-card/40 hover:bg-muted/40"
                      }`}
                      title={
                        isOff
                          ? "主机已离线"
                          : isForbidden
                          ? "探针安全策略已硬禁用进程采集，请在上方卡片遮罩中操作"
                          : "打开系统全量进程树抽屉"
                      }
                    >
                      {isForbidden ? "查看全量系统进程快照 (历史归档) →" : "查看全量系统进程树 →"}
                    </Button>
                  </div>
                );
              })()}

              {/* Hardware Specifications & Kernel Runtime Environment */}
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3 flex flex-col justify-between shadow-2xs">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between text-xs font-bold text-foreground gap-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="size-3.5 text-primary" />
                    <span>硬件规格与内核深度环境</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="neutral" className="text-[10px] font-mono">
                      {server.os}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {server.arch || "x86_64"}
                    </Badge>
                    <Badge variant={isOff ? "danger" : "success"} className="text-[10px] font-mono gap-1">
                      <span className={`size-1.5 rounded-full ${isOff ? "bg-rose-400" : "bg-emerald-400 animate-pulse"}`} />
                      Agent v{server.agentVersion || "1.4.2"}
                    </Badge>
                  </div>
                </div>

                {/* Table Container (Matching the exact table border & rounded style of left card) */}
                <div className="rounded-lg border border-border/60 overflow-hidden bg-card/20 text-xs font-mono">
                  <table className="w-full text-left text-xs font-mono">
                    <tbody className="divide-y divide-border/40">
                      {/* Row 1: CPU */}
                      <tr className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground w-24 whitespace-nowrap">CPU 算力</td>
                        <td className="px-3 py-2 text-foreground font-semibold">
                          {hw?.cpuCores || server.cpuCores || 8} vCPU · {hw?.cpuModel || (server.arch === "aarch64" ? "ARM Neoverse" : "AMD EPYC™")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold">
                            {hw?.cpuArch || server.arch || "x86_64"}
                          </span>
                        </td>
                      </tr>

                      {/* Row 2: Memory */}
                      <tr className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground w-24 whitespace-nowrap">物理内存</td>
                        <td className="px-3 py-2 text-foreground font-medium">
                          {hw?.memTotalGb || server.memTotalGb || 32} GB · {hw?.memType || "DDR5 ECC (4800MHz)"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 text-[10px] font-bold">
                            RAM
                          </span>
                        </td>
                      </tr>

                      {/* Row 3: Storage */}
                      <tr className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground w-24 whitespace-nowrap">磁盘存储</td>
                        <td className="px-3 py-2 text-foreground font-medium">
                          {hw?.diskTotalGb || server.diskTotalGb || 500} GB {hw?.diskType || "NVMe SSD · PCIe 4.0"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                            NVMe
                          </span>
                        </td>
                      </tr>

                      {/* Row 4: Kernel */}
                      <tr className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground w-24 whitespace-nowrap">Linux 内核</td>
                        <td className="px-3 py-2 text-foreground font-medium">
                          {hw?.kernelVersion || "6.8.0-40-generic"} ({hw?.kernelFeatures?.slice(0, 2).join(" · ") || "eBPF · cgroup v2"})
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            {hw?.kernelFeatures?.[0] || "BBR TCP"}
                          </span>
                        </td>
                      </tr>

                      {/* Row 5: Virtualization & Uptime */}
                      <tr className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground w-24 whitespace-nowrap">虚拟化系统</td>
                        <td className="px-3 py-2 text-foreground font-medium">
                          {hw?.virtSystem || "KVM / QEMU"} · 连续运行: {hw?.uptime || server.uptime || "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground text-[10px]">
                            cgroup v2
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Button matching left card */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const specs = `节点: ${server.name} (${server.ip})\nOS: ${hw?.os || server.os} (${hw?.cpuArch || server.arch})\nCPU: ${hw?.cpuCores || server.cpuCores || 8} vCPU (${hw?.cpuModel || "EPYC"})\nMemory: ${hw?.memTotalGb || server.memTotalGb || 32} GB (${hw?.memType || "DDR5 ECC"})\nDisk: ${hw?.diskTotalGb || server.diskTotalGb || 500} GB (${hw?.diskType || "NVMe"})\nKernel: ${hw?.kernelVersion || "6.8.0-40"}\nUptime: ${hw?.uptime || server.uptime}\nLoad: ${hw?.load || server.load}`;
                    navigator.clipboard.writeText(specs);
                    toast.success("已复制主机硬件与内核规格摘要");
                  }}
                  className="w-full h-8 text-xs font-mono gap-1.5 cursor-pointer bg-card/40 hover:bg-muted/40"
                  title="点击将当前节点硬件与内核规格复制到剪贴板"
                >
                  <Copy className="size-3 text-primary" /> 复制硬件与内核规格摘要
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: NETWORK & GLOBAL PROBES ===================== */}
        {activeTab === "network" && (
          <div className="space-y-5">
            {/* IP Details Card */}
            {(() => {
              const hasIpv4 = Boolean(networkDetails?.hasIpv4 ?? (server.ipv4 || (server.ip && !server.ip.includes(":"))));
              const hasIpv6 = Boolean(networkDetails?.hasIpv6 ?? server.ipv6);
              const isDualStack = Boolean(networkDetails?.isDualStack ?? (hasIpv4 && hasIpv6));
              const ipv4Val = networkDetails?.ipv4 || server.ipv4 || (!server.ip?.includes(":") ? server.ip : "");
              const ipv6Val = networkDetails?.ipv6 || server.ipv6 || (server.ip?.includes(":") ? server.ip : "");

              return (
                <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 space-y-4 font-mono text-xs shadow-2xs">
                  <div className="flex items-center justify-between font-sans">
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <Globe className="size-4 text-cyan-400" />
                      <span>网络寻址与接口参数 (IP Addressing)</span>
                    </div>
                    {isDualStack ? (
                      <Badge variant="success" dot className="text-xs">
                        双栈网络 Dual-Stack (IPv4 / IPv6)
                      </Badge>
                    ) : hasIpv4 ? (
                      <Badge variant="neutral" className="text-xs bg-sky-500/10 text-sky-400 border-sky-500/20">
                        单栈 IPv4-Only
                      </Badge>
                    ) : hasIpv6 ? (
                      <Badge variant="neutral" className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        单栈 IPv6-Only
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-xs">
                        未知网络栈
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    {/* IPv4 */}
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">公网 IPv4 地址</span>
                          {hasIpv4 ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                              已配置
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-muted/50 text-muted-foreground text-[10px] font-mono">
                              未分配
                            </span>
                          )}
                        </div>
                        {hasIpv4 && (
                          <button
                            type="button"
                            onClick={() => handleCopy(ipv4Val, "ipv4", "IPv4")}
                            className="text-primary hover:underline cursor-pointer flex items-center gap-1 text-xs"
                          >
                            {copiedKey === "ipv4" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />} 复制
                          </button>
                        )}
                      </div>
                      <div className="text-sm font-bold text-foreground select-all font-mono">
                        {hasIpv4 ? (
                          ipv4Val
                        ) : (
                          <span className="text-muted-foreground/50 text-xs font-normal">未分配公网 IPv4 地址</span>
                        )}
                      </div>
                    </div>

                    {/* IPv6 */}
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">公网 IPv6 地址</span>
                          {hasIpv6 ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                              已配置
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-muted/50 text-muted-foreground text-[10px] font-mono">
                              未分配
                            </span>
                          )}
                        </div>
                        {hasIpv6 && (
                          <button
                            type="button"
                            onClick={() => handleCopy(ipv6Val, "ipv6", "IPv6")}
                            className="text-primary hover:underline cursor-pointer flex items-center gap-1 text-xs"
                          >
                            {copiedKey === "ipv6" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />} 复制
                          </button>
                        )}
                      </div>
                      <div className="text-xs font-bold text-foreground select-all truncate font-mono" title={hasIpv6 ? ipv6Val : undefined}>
                        {hasIpv6 ? (
                          ipv6Val
                        ) : (
                          <span className="text-muted-foreground/50 text-xs font-normal">未分配公网 IPv6 地址</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Global Probes Chart Card */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Radio className="size-4 text-emerald-400" />
                  <span>全球核心分布式拨测点时序延迟 (Multi-Region Latency & Packet Loss)</span>
                </div>
                
                {/* Time Range Selector */}
                <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/50 overflow-x-auto max-w-full">
                  {PROBE_TIME_RANGES.map(({ key, label, fullLabel }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProbeTimeRange(key)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-pointer shrink-0 ${
                        probeTimeRange === key
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      title={fullLabel}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equal-sized 2-Line Square Legend Block Cards (Click to Hide/Show Line) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-0.5">
                {probeRegions.map((probe) => {
                  const isHidden = Boolean(hiddenProbes[probe.id]);
                  return (
                    <button
                      key={probe.id}
                      type="button"
                      onClick={() => toggleProbeVisibility(probe.id)}
                      className={`flex flex-col justify-between p-2 rounded-lg border text-left font-mono transition-all cursor-pointer min-w-0 ${
                        isHidden
                          ? "bg-muted/10 border-border/30 opacity-35 hover:opacity-60 grayscale"
                          : "bg-card border-border/90 shadow-xs hover:border-primary/50"
                      }`}
                      title={`${probe.name} - ${probe.target} · ${probe.isp} (点击${isHidden ? "显示" : "隐藏"}曲线)`}
                    >
                      {/* Line 1: Color square + Region Name */}
                      <div className="flex items-center gap-1.5 min-w-0 w-full">
                        <span
                          className={`size-2.5 rounded-xs shrink-0 shadow-xs transition-opacity ${
                            isHidden ? "opacity-30" : ""
                          }`}
                          style={{ backgroundColor: probe.color }}
                        />
                        <span
                          className={`font-sans font-semibold text-xs text-foreground truncate ${
                            isHidden ? "line-through text-muted-foreground" : ""
                          }`}
                          title={probe.name}
                        >
                          {probe.name}
                        </span>
                      </div>

                      {/* Line 2: Latency + Loss */}
                      <div className="flex items-center justify-between gap-1 text-[11px] mt-1 text-muted-foreground w-full pt-1 border-t border-border/40">
                        <span
                          className="font-bold shrink-0"
                          style={{ color: isHidden ? undefined : probe.color }}
                        >
                          {probe.currentLatency || probe.baseLatency}ms
                        </span>
                        <span
                          className={
                            isHidden
                              ? "text-muted-foreground shrink-0"
                              : probe.loss === "0%"
                              ? "text-emerald-400 font-medium shrink-0"
                              : "text-amber-400 font-bold shrink-0"
                          }
                        >
                          丢包 {probe.loss}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* EChart Container with Overlay Mask */}
              <div className="relative rounded-lg border border-border/60 p-2.5 bg-card/20 overflow-hidden min-h-[280px]">
                {probeRegions.length === 0 ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-5 text-center bg-background/85 backdrop-blur-md">
                    <Radio className="size-9 text-muted-foreground/40 mb-2.5 animate-pulse" />
                    <h4 className="text-sm font-bold text-foreground mb-1">暂无可用的全球拨测节点</h4>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      当前系统尚未部署任何外部探测源节点，暂无分布式往返时延与丢包率数据。
                    </p>
                  </div>
                ) : probeRegions.every((p) => hiddenProbes[p.id]) ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-5 text-center bg-background/75 backdrop-blur-xs">
                    <Radio className="size-7 text-muted-foreground/50 mb-2" />
                    <h4 className="text-sm font-semibold text-foreground mb-1">所有检测节点曲线已隐藏</h4>
                    <p className="text-xs text-muted-foreground mb-2.5">
                      您已通过上方图例关闭了全部节点的曲线显示。
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHiddenProbes({})}
                      className="h-7 text-xs cursor-pointer"
                    >
                      恢复全部节点显示
                    </Button>
                  </div>
                ) : null}

                <EChart option={probeChartOption} height={280} notMerge={true} />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: WEB TERMINAL ===================== */}
        {activeTab === "terminal" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl border border-border/70 bg-card/60 text-xs">
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
                  className="px-2 py-0.5 rounded bg-muted/60 hover:bg-primary/20 hover:text-primary border border-border/50 text-xs font-mono transition-colors cursor-pointer text-foreground/80"
                >
                  {cmd}
                </button>
              ))}
            </div>

            <div className="relative flex flex-col h-[520px] rounded-xl border border-zinc-800 bg-zinc-950 text-emerald-400 font-mono text-xs overflow-hidden shadow-2xl">
              {/* Frosted Mask Overlay when Remote Exec is Disabled */}
              {!isRemoteEnabled && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-5 text-center bg-zinc-950/85 backdrop-blur-md">
                  <div className="size-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2.5">
                    <Lock className="size-5 text-rose-400" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100 mb-1 font-sans">远程即时命令执行未开启</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mb-3 leading-relaxed font-sans">
                    {server.status === "offline"
                      ? "当前节点处于离线状态 (Offline)，无法建立远程 Web 终端通道。"
                      : "出于系统安全防护原则，该节点在启动 Agent 时未附加 `--enable-remote` 参数。该权限仅支持在目标节点本地启动时显式配置开启。"}
                  </p>
                  {server.status !== "offline" && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                      <span className="text-zinc-500">参数:</span>
                      <span className="text-emerald-400">smalux-agent --enable-remote</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("smalux-agent --enable-remote");
                          toast.success("已复制启动参数: smalux-agent --enable-remote");
                        }}
                        className="ml-1 text-primary hover:underline cursor-pointer flex items-center gap-0.5 text-[10px]"
                      >
                        <Copy className="size-2.5" /> 复制
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-400 select-none">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500 inline-block" />
                    <span className="size-2 rounded-full bg-amber-500 inline-block" />
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <span className="font-semibold text-zinc-300">
                    smalux-shell · root@{server.name} ({ipv4})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  {termStatus === "connected" ? (
                    <>
                      <span className="text-emerald-400">🟢 WSS Connected</span>
                    </>
                  ) : termStatus === "connecting" ? (
                    <>
                      <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                        <span className="size-1.5 rounded-full bg-amber-400 animate-ping inline-block" /> 正在建连...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-500 text-[11px]">🟡 待命 (等待首条命令)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 p-3.5 overflow-y-auto space-y-1.5 select-text font-mono leading-relaxed text-xs">
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
                className="border-t border-zinc-800 bg-zinc-900/90 p-2.5 flex items-center gap-2"
              >
                <span className="text-emerald-400 font-bold shrink-0 text-xs">
                  root@{server.name}:~#
                </span>
                <input
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  disabled={!isRemoteEnabled || termStatus === "connecting"}
                  placeholder={
                    !isRemoteEnabled
                      ? "远程命令执行已禁用"
                      : termStatus === "idle"
                      ? "输入 Linux 命令激活会话 (例如 top, iostat, df -h, free -m)..."
                      : "输入 Linux 命令..."
                  }
                  className="flex-1 bg-transparent text-zinc-100 text-xs outline-none font-mono placeholder:text-zinc-600 disabled:opacity-50"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  disabled={!isRemoteEnabled || termStatus === "connecting" || !termInput.trim()}
                  className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800 cursor-pointer disabled:opacity-40"
                >
                  <Send className="size-3 mr-1" /> 执行
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: CONFIGURATION & OPERATIONS ===================== */}
        {activeTab === "config" && (
          <div className="space-y-4">
            {/* Section 1: Basic Node Metadata & Orchestration */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Settings className="size-4 text-primary" />
                  <span>基本属性与集群编排 (Metadata)</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  ID: {server.id}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-border/50 text-xs">
                {/* Host Alias */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-muted-foreground font-medium">节点展示别名 (Host Name)</label>
                  <input
                    value={configForm.name}
                    onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground transition-colors"
                    placeholder="输入主机别名"
                  />
                </div>

                {/* Location & Region Option */}
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <MapPin className="size-3 text-rose-400" /> 节点地理位置与机房档案 (Location & DC)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                      <input
                        type="checkbox"
                        checked={configForm.autoLocation}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setConfigForm({
                            ...configForm,
                            autoLocation: checked,
                            location: checked ? (server.region ? `${server.region} (BGP Anycast)` : "中国 香港 (Hong Kong · BGP)") : configForm.location
                          });
                        }}
                        className="rounded border-border text-primary focus:ring-primary size-3 cursor-pointer accent-primary"
                      />
                      <span className="text-foreground font-medium text-[11px]">IP 自动识别 (GeoIP)</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {configForm.autoLocation ? (
                      <div className="flex-1 h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs flex items-center justify-between text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Globe className="size-3 text-emerald-400" />
                          <span className="font-medium">{configForm.location || server.region || "中国 香港 (Hong Kong · BGP)"}</span>
                          <span className="text-muted-foreground font-mono text-[10px]">({server.ip || "154.21.32.88"})</span>
                        </div>
                        <Badge variant="success" dot className="text-[10px]">
                          GeoIP 自动同步
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex-1 relative">
                        <input
                          value={configForm.location}
                          onChange={(e) => setConfigForm({ ...configForm, location: e.target.value })}
                          placeholder="自定义输入机房或地区，例如: 华东-上海金融云机房"
                          className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Cluster Groups (Pinned Dropdown + Horizontal Scrollable Badges/Input) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground font-medium flex items-center gap-1">
                      <Layers className="size-3 text-primary" /> 所属集群分组 (Groups · 支持多选)
                    </label>
                    <span className="text-[10px] text-muted-foreground">滚轮滑动 / 回车添加</span>
                  </div>
                  <ScrollableBadgeInputStrip
                    dropdownButtonLabel="已有分组"
                    dropdownTitle="历史与已有分组"
                    isDropdownOpen={isGroupDropdownOpen}
                    onToggleDropdown={() => setIsGroupDropdownOpen((prev) => !prev)}
                    dropdownRef={groupDropdownRef}
                    allKnownItems={allKnownGroups}
                    selectedItems={configForm.groups}
                    onAddItem={(grp) => {
                      addGroup(grp);
                      setIsGroupDropdownOpen(false);
                    }}
                    onRemoveItem={removeGroup}
                    inputValue={groupInput}
                    onInputChange={setGroupInput}
                    placeholder={configForm.groups.length === 0 ? "输入分组按回车..." : "输入新分组..."}
                    theme="primary"
                    emptyDropdownText="已添加所有分组"
                    icon={<Layers className="size-3 text-primary" />}
                  />
                </div>

                {/* Node Tags (Pinned Dropdown + Horizontal Scrollable Badges/Input) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground font-medium flex items-center gap-1">
                      <Sparkles className="size-3 text-teal-400" /> 节点标签 (Tags · 支持多选)
                    </label>
                    <span className="text-[10px] text-muted-foreground">滚轮滑动 / 回车添加</span>
                  </div>
                  <ScrollableBadgeInputStrip
                    dropdownButtonLabel="已有标签"
                    dropdownTitle="历史与已有标签"
                    isDropdownOpen={isTagDropdownOpen}
                    onToggleDropdown={() => setIsTagDropdownOpen((prev) => !prev)}
                    dropdownRef={tagDropdownRef}
                    allKnownItems={allKnownTags}
                    selectedItems={configForm.tags}
                    onAddItem={(tag) => {
                      addTag(tag);
                      setIsTagDropdownOpen(false);
                    }}
                    onRemoveItem={removeTag}
                    inputValue={tagInput}
                    onInputChange={setTagInput}
                    placeholder={configForm.tags.length === 0 ? "输入标签按回车..." : "输入新标签..."}
                    itemPrefix="#"
                    theme="teal"
                    emptyDropdownText="已添加所有标签"
                    icon={<Sparkles className="size-3 text-teal-400" />}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">公开状态页可见性 (Public Visibility)</div>
                  <div className="text-muted-foreground text-[11px]">是否在公开状态页展示该节点的健康度</div>
                </div>
                <Switch
                  checked={configForm.publicVisible}
                  onCheckedChange={(checked) => setConfigForm({ ...configForm, publicVisible: checked })}
                />
              </div>

              <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5" /> 维护模式 (Maintenance Mode)
                  </div>
                  <div className="text-muted-foreground text-[11px]">开启后将暂停针对该节点的异常告警与自动化巡检</div>
                </div>
                <Switch
                  checked={configForm.maintenanceMode}
                  onCheckedChange={(checked) => setConfigForm({ ...configForm, maintenanceMode: checked })}
                />
              </div>
            </div>

            {/* Section 2: Daemon Launch Policy & Credentials */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Key className="size-4 text-emerald-400" />
                  <span>守护进程启动策略与认证安全 (Daemon Policy)</span>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono text-emerald-400 border-emerald-500/30">
                  Agent v{server.agentVersion || "1.4.2"}
                </Badge>
              </div>

              {/* Startup Policy Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/50 text-xs">
                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Terminal className="size-3 text-primary" /> 远程即时命令执行
                    </span>
                    {configForm.allowRemoteExec ? (
                      <Badge variant="success" dot className="text-[10px]">
                        已启用 (--enable-remote)
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
                        安全未开启
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    仅可在节点本地启动时通过参数显式声明，Web 控制台不可远程篡改。
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Cpu className="size-3 text-teal-400" /> 进程资源采样策略
                    </span>
                    {processCollectionEnabled ? (
                      <Badge variant="success" dot className="text-[10px]">
                        实时采集已激活
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                        只读受限
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    控制是否在采集波形时抓取 Top 进程画像，可按需在本地启动配置。
                  </p>
                </div>
              </div>

              {/* Action Banner for Reinstall / Reconnection Command Modal */}
              <div className="pt-2.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Code2 className="size-3 text-primary" /> 节点重新安装与重连指令
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    时效性安全认证 Token 自动生成，支持多平台一键指令
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsReinstallDialogOpen(true)}
                  className="h-7.5 px-3 text-[11px] font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary cursor-pointer shadow-2xs"
                >
                  <Code2 className="size-3" /> 生成安装 / 重连命令
                </Button>
              </div>
            </div>

            {/* Section 3: Alert Thresholds & Inspection Rules */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Bell className="size-4 text-amber-400" />
                  <span>告警水位阈值与巡检判定策略 (Alert Thresholds)</span>
                </div>
                <Badge variant="outline" className="text-[11px] text-amber-400 border-amber-500/30">
                  主动巡检引擎
                </Badge>
              </div>

              {/* 4-Row Alert Thresholds & Sustained Durations */}
              <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                {/* Row 1: CPU */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/70 bg-muted/15 hover:bg-muted/30 hover:border-primary/40 transition-all shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-[160px]">
                    <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <Cpu className="size-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <span>CPU 告警水位</span>
                        <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">≥ {configForm.cpuThreshold}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">计算负载过载监控</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Threshold Capsule */}
                    <div className="flex items-center h-8 rounded-lg border border-border/80 bg-background/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xs overflow-hidden">
                      <span className="h-full px-2 bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center border-r border-border/60 select-none">
                        水位
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={configForm.cpuThreshold}
                        onChange={(e) => setConfigForm({ ...configForm, cpuThreshold: Number(e.target.value) })}
                        className="w-12 h-full bg-transparent px-1 text-center text-xs font-mono font-bold text-foreground outline-none"
                      />
                      <span className="h-full px-1.5 bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center border-l border-border/40 select-none">
                        %
                      </span>
                    </div>
                    {/* Duration Capsule */}
                    <div className="flex items-center h-8 rounded-lg border border-border/80 bg-background/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xs overflow-hidden">
                      <span className="h-full px-2 bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center border-r border-border/60 select-none">
                        持续
                      </span>
                      <input
                        type="number"
                        min={5}
                        max={3600}
                        value={configForm.cpuDurationSec}
                        onChange={(e) => setConfigForm({ ...configForm, cpuDurationSec: Number(e.target.value) })}
                        className="w-12 h-full bg-transparent px-1 text-center text-xs font-mono font-bold text-foreground outline-none"
                      />
                      <span className="h-full px-1.5 bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center border-l border-border/40 select-none">
                        秒
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Memory */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/70 bg-muted/15 hover:bg-muted/30 hover:border-purple-500/40 transition-all shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-[160px]">
                    <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <Activity className="size-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <span>内存告警水位</span>
                        <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">≥ {configForm.memThreshold}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">物理内存及缓存吃紧</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Threshold Capsule */}
                    <div className="flex items-center h-8 rounded-lg border border-border/80 bg-background/80 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all shadow-2xs overflow-hidden">
                      <span className="h-full px-2 bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center border-r border-border/60 select-none">
                        水位
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={configForm.memThreshold}
                        onChange={(e) => setConfigForm({ ...configForm, memThreshold: Number(e.target.value) })}
                        className="w-12 h-full bg-transparent px-1 text-center text-xs font-mono font-bold text-foreground outline-none"
                      />
                      <span className="h-full px-1.5 bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center border-l border-border/40 select-none">
                        %
                      </span>
                    </div>
                    {/* Duration Capsule */}
                    <div className="flex items-center h-8 rounded-lg border border-border/80 bg-background/80 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all shadow-2xs overflow-hidden">
                      <span className="h-full px-2 bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center border-r border-border/60 select-none">
                        持续
                      </span>
                      <input
                        type="number"
                        min={5}
                        max={3600}
                        value={configForm.memDurationSec}
                        onChange={(e) => setConfigForm({ ...configForm, memDurationSec: Number(e.target.value) })}
                        className="w-12 h-full bg-transparent px-1 text-center text-xs font-mono font-bold text-foreground outline-none"
                      />
                      <span className="h-full px-1.5 bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center border-l border-border/40 select-none">
                        秒
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Disk */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/70 bg-muted/15 hover:bg-muted/30 hover:border-amber-500/40 transition-all shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-[160px]">
                    <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <HardDrive className="size-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <span>磁盘空间水位</span>
                        <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">≥ {configForm.diskThreshold}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">根盘及数据卷剩余空间</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Threshold Capsule */}
                    <div className="flex items-center h-8 rounded-lg border border-border/80 bg-background/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all shadow-2xs overflow-hidden">
                      <span className="h-full px-2 bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center border-r border-border/60 select-none">
                        水位
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={configForm.diskThreshold}
                        onChange={(e) => setConfigForm({ ...configForm, diskThreshold: Number(e.target.value) })}
                        className="w-12 h-full bg-transparent px-1 text-center text-xs font-mono font-bold text-foreground outline-none"
                      />
                      <span className="h-full px-1.5 bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center border-l border-border/40 select-none">
                        %
                      </span>
                    </div>
                    {/* Duration Capsule */}
                    <div className="flex items-center h-8 rounded-lg border border-border/80 bg-background/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all shadow-2xs overflow-hidden">
                      <span className="h-full px-2 bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center border-r border-border/60 select-none">
                        持续
                      </span>
                      <input
                        type="number"
                        min={5}
                        max={86400}
                        value={configForm.diskDurationSec}
                        onChange={(e) => setConfigForm({ ...configForm, diskDurationSec: Number(e.target.value) })}
                        className="w-12 h-full bg-transparent px-1 text-center text-xs font-mono font-bold text-foreground outline-none"
                      />
                      <span className="h-full px-1.5 bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center border-l border-border/40 select-none">
                        秒
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4: Offline Timeout */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/70 bg-muted/15 hover:bg-muted/30 hover:border-rose-500/40 transition-all shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-[160px]">
                    <div className="size-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <span>节点离线断连</span>
                        <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">失联 &gt; {configForm.offlineTimeoutSec}s</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">心跳遥测连续丢失判定</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Mode Tag */}
                    <div className="flex items-center h-8 rounded-lg border border-border/80 bg-background/80 shadow-2xs overflow-hidden">
                      <span className="h-full px-2 bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center border-r border-border/60 select-none">
                        模式
                      </span>
                      <span className="h-full px-2.5 text-foreground font-medium text-[11px] flex items-center select-none">
                        心跳失联
                      </span>
                    </div>
                    {/* Duration Capsule */}
                    <div className="flex items-center h-8 rounded-lg border border-border/80 bg-background/80 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all shadow-2xs overflow-hidden">
                      <span className="h-full px-2 bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center border-r border-border/60 select-none">
                        持续
                      </span>
                      <input
                        type="number"
                        min={10}
                        max={3600}
                        value={configForm.offlineTimeoutSec}
                        onChange={(e) => setConfigForm({ ...configForm, offlineTimeoutSec: Number(e.target.value) })}
                        className="w-12 h-full bg-transparent px-1 text-center text-xs font-mono font-bold text-foreground outline-none"
                      />
                      <span className="h-full px-1.5 bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center border-l border-border/40 select-none">
                        秒
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Notification Dispatchers */}
              <div className="pt-2.5 border-t border-border/50">
                <DynamicNotifyChannels
                  channels={configForm.notifyChannels as NotifyChannelItem[]}
                  onChange={(channels) => setConfigForm((prev) => ({ ...prev, notifyChannels: channels }))}
                  compact
                />
              </div>
            </div>

            {/* Section 4: Asset Billing & Lifecycle Management */}
            <AssetBillingLifecycleSection
              form={{
                price: configForm.price,
                currency: configForm.currency,
                billingCycle: configForm.billingCycle,
                expiresAt: configForm.expiresAt,
                trafficLimitValue: configForm.trafficLimitValue,
                trafficLimitUnit: configForm.trafficLimitUnit,
                trafficLimitGb: configForm.trafficLimitGb,
                trafficCalculation: configForm.trafficCalculation,
                trafficResetDay: configForm.trafficResetDay,
                note: configForm.note,
                autoRenew: configForm.autoRenew
              }}
              onChange={(updates) => setConfigForm((prev) => ({ ...prev, ...updates }))}
              expirationInfo={expirationInfo}
              residualInfo={residualInfo}
              compact={true}
            />

            {/* Section 5: Node Operations & Danger Zone */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                  <AlertTriangle className="size-4 text-rose-400" />
                  <span>危险操作与节点解绑 (Danger Zone & Decommission)</span>
                </div>
                <Badge variant="neutral" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
                  危险受控
                </Badge>
              </div>

              {/* Unbind & Delete */}
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-rose-400 flex items-center gap-1 text-xs">
                    <Trash2 className="size-3" /> 解除绑定并注销节点
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    注销后历史时序与遥测数据将不再保留。
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDeleteNode}
                  className="shrink-0 text-xs h-7 px-3 font-bold cursor-pointer gap-1 shadow-sm"
                >
                  <Trash2 className="size-3" /> 移除节点
                </Button>
              </div>
            </div>

            {/* Save & Action Footer */}
            <div className="pt-3 border-t border-border/70 flex items-center justify-end gap-3">
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
                disabled={isSavingConfig}
                onClick={handleSaveConfig}
                className="cursor-pointer gap-1.5 text-xs font-bold px-5"
              >
                {isSavingConfig ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> 保存中...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" /> 保存节点配置
                  </>
                )}
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

      {/* Reinstall Server Command Dialog */}
      <ReinstallServerDialog
        server={server}
        open={isReinstallDialogOpen}
        onOpenChange={setIsReinstallDialogOpen}
      />
    </div>
  );
}
