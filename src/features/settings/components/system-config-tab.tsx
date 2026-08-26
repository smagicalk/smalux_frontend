import { useState, useEffect, useRef } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Server,
  Database,
  Lock,
  Layers,
  CheckCircle2,
  Cpu,
  Globe,
  Zap,
  Shield,
  Rocket,
  Copy,
  LayoutGrid,
  Check,
  Activity,
  Terminal,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Trash2,
  Clock,
  HardDrive,
  Radio,
  FileCode,
  Network,
  Bell,
  Gauge,
  AlertTriangle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import { useSettings, useSaveSettings } from "../hooks/use-settings";
import type { Setting } from "@/shared/api/methods";

// 系统预设图标选项
const PRESET_ICONS = [
  { id: "zap", label: "极速闪电", icon: Zap },
  { id: "server", label: "核心主机", icon: Server },
  { id: "shield", label: "安全堡垒", icon: Shield },
  { id: "activity", label: "实时脉冲", icon: Activity },
  { id: "terminal", label: "终端矩阵", icon: Terminal },
  { id: "rocket", label: "集群分发", icon: Rocket }
];

export function SystemConfigTab() {
  const { data, isLoading, refetch } = useSettings();
  const saveMutation = useSaveSettings();

  const configs: Setting[] = data?.settings || [];

  // Local Form State
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 图标选择方式选项卡：'preset' | 'url' | 'upload'
  const [iconMode, setIconMode] = useState<"preset" | "url" | "upload">("preset");
  const [remoteUrlInput, setRemoteUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 固定 Agent 端点（系统动态生成，不可手动篡改）
  const fixedAgentIngressUrl = typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/agent`
    : "wss://smalux.example.com/ws/agent";

  useEffect(() => {
    if (configs.length > 0) {
      const init: Record<string, string> = {};
      for (const c of configs) {
        init[c.key] = c.value;
      }
      if (!init["site.icon"]) {
        init["site.icon"] = "zap";
      }
      setFormValues(init);
      setHasChanges(false);

      // 判断初始图标模式
      const currentIcon = init["site.icon"] || "zap";
      if (currentIcon.startsWith("data:")) {
        setIconMode("upload");
      } else if (currentIcon.startsWith("http://") || currentIcon.startsWith("https://") || currentIcon.startsWith("/")) {
        setIconMode("url");
        setRemoteUrlInput(currentIcon);
      } else {
        setIconMode("preset");
      }
    }
  }, [configs]);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const changes = Object.entries(formValues).map(([key, value]) => ({ key, value }));
    try {
      await saveMutation.mutateAsync(changes);
      toast.success("站点基本信息与全量存储配置已成功保存并下发生效！");
      setHasChanges(false);
    } catch (err: any) {
      toast.error(err?.message || "保存配置失败");
    }
  };

  const handleReset = () => {
    refetch();
    toast.info("已重置为服务器当前配置");
    setHasChanges(false);
  };

  // 本地文件上传转 Base64 DataURL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("上传的图标文件不能超过 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        handleChange("site.icon", base64Url);
        toast.success(`已成功载入本地图标「${file.name}」！`);
      }
    };
    reader.readAsDataURL(file);
  };

  // 应用远程图片 URL
  const handleApplyRemoteUrl = () => {
    if (!remoteUrlInput.trim()) {
      toast.error("请输入有效的远程图片或 SVG 链接");
      return;
    }
    handleChange("site.icon", remoteUrlInput.trim());
    toast.success("已应用远程图片为站点图标！");
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制 ${label} 到剪贴板`);
  };

  const currentIconValue = formValues["site.icon"] || "zap";
  const isCustomImage =
    currentIconValue.startsWith("data:") ||
    currentIconValue.startsWith("http://") ||
    currentIconValue.startsWith("https://") ||
    currentIconValue.startsWith("/");

  const selectedPreset = PRESET_ICONS.find((p) => p.id === currentIconValue) || PRESET_ICONS[0];
  const IconComponent = selectedPreset.icon;

  return (
    <div className="space-y-6 w-full pb-10">
      {/* 1. 站点基本信息与图标 (Site Identity & Branding) */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="size-4 text-primary" />
            站点标识与品牌图标 (Site Identity & Branding)
          </CardTitle>
          <CardDescription>
            定制控制台顶栏品牌名称、副标及系统视觉图标（支持内置预设、本地文件上传与远程图片）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-xs w-full">
          {/* 第一行：站点名称与 1:1 顶栏/侧栏实时预览（50/50 对半分，高度对齐） */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <div className="h-5 font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="size-3.5 text-primary" />
                  平台站点主名称与副标
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">主名称 + 副标</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={formValues["site.name"] || "smalux"}
                  onChange={(e) => handleChange("site.name", e.target.value)}
                  placeholder="主名称，如: smalux"
                  className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all flex items-center"
                />
                <input
                  value={formValues["site.subTitle"] || "Console"}
                  onChange={(e) => handleChange("site.subTitle", e.target.value)}
                  placeholder="副标，如: Console / v0.2.0"
                  className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all flex items-center"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">主名称与副标将同步展示于顶栏品牌区及系统各模块抬头</p>
            </div>

            {/* 顶栏/侧栏真实主题一致性预览 */}
            <div className="space-y-1.5">
              <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                <span>顶栏/侧栏主题效果预览</span>
                <span className="text-[10px] text-muted-foreground font-mono">1:1 实装渲染</span>
              </label>
              <div className="h-11 px-3.5 rounded-xl border border-sidebar-border bg-sidebar flex items-center justify-between shadow-xs transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm transition-transform shrink-0 overflow-hidden">
                    {isCustomImage ? (
                      <img
                        src={currentIconValue}
                        alt="Logo"
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <IconComponent className="size-4" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold tracking-tight text-sidebar-foreground font-mono truncate">
                      {formValues["site.name"] || "smalux"}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono leading-none truncate">
                      {formValues["site.subTitle"] || "Console"}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500 font-mono shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">图标与背景无缝应用当前系统主题配色</p>
            </div>
          </div>

          {/* 第二行：图标来源模式切换与配置 */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <label className="font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" />
                选择站点视觉图标来源
              </label>

              {/* 模式选择胶囊 */}
              <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-border/60 gap-1 text-[11px] self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setIconMode("preset")}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    iconMode === "preset"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="size-3" /> 内置预设
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIconMode("upload")}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    iconMode === "upload"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Upload className="size-3" /> 本地上传
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIconMode("url")}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    iconMode === "url"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LinkIcon className="size-3" /> 远程图片
                  </span>
                </button>
              </div>
            </div>

            {/* 模式 1: 内置预设图标 */}
            {iconMode === "preset" && (
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-1">
                {PRESET_ICONS.map((preset) => {
                  const ItemIcon = preset.icon;
                  const isSelected = !isCustomImage && currentIconValue === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleChange("site.icon", preset.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-primary shadow-xs"
                          : "border-border/70 bg-muted/20 hover:border-border hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`size-7 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        <ItemIcon className="size-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className={`font-semibold text-[11px] truncate ${isSelected ? "text-foreground font-bold" : "text-foreground/80"}`}>
                          {preset.label}
                        </div>
                      </div>
                      {isSelected && <Check className="size-3.5 text-primary ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 模式 2: 本地图片上传 */}
            {iconMode === "upload" && (
              <div className="space-y-3 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-border/80 bg-muted/20">
                  <div className="size-16 rounded-xl border border-border/80 bg-background flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {currentIconValue.startsWith("data:") ? (
                      <img src={currentIconValue} alt="Uploaded Logo" className="size-full object-cover" />
                    ) : (
                      <Upload className="size-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <div className="font-semibold text-foreground text-xs">
                      上传本地 Logo / Favicon 图像文件
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      支持 PNG、SVG、ICO、WebP 格式图片，文件体积不超过 1MB（自动存储为 DataURL）
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8.5 px-3.5 text-xs cursor-pointer shadow-xs"
                    >
                      <Upload className="size-3.5 mr-1" /> 选择本地图片
                    </Button>
                    {currentIconValue.startsWith("data:") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChange("site.icon", "zap")}
                        className="h-8.5 px-2.5 text-xs text-rose-500 hover:text-rose-600 cursor-pointer"
                        title="清除自定义图片并恢复默认图标"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 模式 3: 远程图片链接 */}
            {iconMode === "url" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <LinkIcon className="size-3.5 text-primary" />
                    远程 Logo / Favicon 图片地址 (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={remoteUrlInput}
                      onChange={(e) => setRemoteUrlInput(e.target.value)}
                      placeholder="https://example.com/assets/logo.png 或 /favicon.ico"
                      className="flex-1 h-9 rounded-xl border border-border/80 bg-muted/40 px-3.5 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                    />
                    <Button
                      size="sm"
                      onClick={handleApplyRemoteUrl}
                      className="h-9 px-4 text-xs cursor-pointer shadow-xs shrink-0"
                    >
                      应用此链接
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    输入外部 CDN 图片直链或站内相对路径，可即时在顶栏预览中加载渲染
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. 基础网络与端点服务 (Network & Endpoint) */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="size-4 text-sky-500" />
            基础网络与端点服务 (Network & Ingress)
          </CardTitle>
          <CardDescription>
            查看探针长连接通信网关端点，并配置反向代理真实客户端 IP 解析头
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Agent 探针通信端点：彻底作为固定系统只读端点展示，不允许修改 */}
            <div className="space-y-1.5">
              <div className="h-5 font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Server className="size-3.5 text-emerald-400" />
                  Agent 探针长连接网关 (Agent Ingress URL)
                </span>
                <Badge variant="neutral" className="text-[10px] px-1.5 py-0 h-4 font-mono flex items-center gap-1">
                  <Lock className="size-2.5 text-muted-foreground" />
                  动态生成 · 禁止修改
                </Badge>
              </div>
              <div className="h-11 px-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between gap-2 shadow-xs">
                <code className="text-xs font-mono text-emerald-400 font-semibold select-all truncate">
                  {fixedAgentIngressUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyText(fixedAgentIngressUrl, "Agent 通信网关端点")}
                  className="h-7 px-2.5 text-[11px] cursor-pointer shrink-0 font-medium"
                >
                  <Copy className="size-3 mr-1" /> 复制
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                依据当前控制台访问域名与协议自动动态生成（<code>{typeof window !== "undefined" ? (window.location.protocol === "https:" ? "wss://" : "ws://") : "wss://"}当前域名/ws/agent</code>），探针自动对接，不可手动修改
              </p>
            </div>

            {/* 反向代理真实客户端 IP 请求头 */}
            <div className="space-y-1.5">
              <label className="h-5 font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-400" />
                反向代理真实客户端 IP 获取头 (Real-IP Header)
              </label>
              <select
                value={formValues["network.realIpHeader"] || "X-Forwarded-For"}
                onChange={(e) => handleChange("network.realIpHeader", e.target.value)}
                className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all cursor-pointer flex items-center"
              >
                <option value="X-Forwarded-For">X-Forwarded-For (通用反向代理标准)</option>
                <option value="CF-Connecting-IP">CF-Connecting-IP (Cloudflare CDN 代理专用)</option>
                <option value="X-Real-IP">X-Real-IP (Nginx / Caddy 单层反向代理)</option>
                <option value="Remote-Addr">Remote-Addr (TCP 直连无反向代理)</option>
              </select>
              <p className="text-[11px] text-muted-foreground">用于精准解析并记录管理员登录终端、审计日志及 Web SSH 会话公网 IP</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. 时序数据存储、留存周期与执行保护 (Storage & Lifecycle) */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="size-4 text-emerald-500" />
            存储配额、单项指标留存与执行保护 (Storage & Retention)
          </CardTitle>
          <CardDescription>
            设定全局数据库使用上限、按 CPU/内存/磁盘/网络单项细化留存时长、管理探针生命周期与执行保护
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-xs w-full">
          {/* 第一组：💾 全局数据库磁盘容量上限 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <HardDrive className="size-3.5 text-emerald-400" />
              <span className="font-bold text-foreground">全局数据库存储容量上限</span>
              <span className="text-[11px] text-muted-foreground font-mono">（通用数据库配额保护，超限自动按 FIFO 淘汰最老切片）</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="size-3.5 text-primary" />
                    全局数据库磁盘使用配额上限 (Global Storage Quota)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">推荐: 10 ~ 100 GB</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={2}
                    max={500}
                    value={formValues["storage.maxDbSizeGb"] || "20"}
                    onChange={(e) => handleChange("storage.maxDbSizeGb", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none font-bold">
                    GB
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  当数据库存储体积达到此水位时，后端引擎将自动触发清理机制，优先回收已超出单项保留周期的历史切片
                </p>
              </div>
            </div>
          </div>

          {/* 第二组：📊 单项监控指标与日志保存时长 (8项细分矩阵) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <Activity className="size-3.5 text-sky-400" />
              <span className="font-bold text-foreground">单项指标与业务数据保存时长</span>
              <span className="text-[11px] text-muted-foreground font-mono">（按数据类型独立设置保留天数）</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. CPU 负载 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate">
                    <Cpu className="size-3 text-sky-400 shrink-0" />
                    CPU 负载与利用率
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formValues["storage.cpuRetentionDays"] || "30"}
                    onChange={(e) => handleChange("storage.cpuRetentionDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">CPU 使用率与 Load 负载</p>
              </div>

              {/* 2. 内存占用 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate">
                    <Layers className="size-3 text-emerald-400 shrink-0" />
                    内存与 Swap 占用
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formValues["storage.memoryRetentionDays"] || "30"}
                    onChange={(e) => handleChange("storage.memoryRetentionDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">物理内存与虚拟 Swap 历史</p>
              </div>

              {/* 3. 磁盘 I/O */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate">
                    <HardDrive className="size-3 text-amber-400 shrink-0" />
                    磁盘 I/O 与容量
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formValues["storage.diskRetentionDays"] || "30"}
                    onChange={(e) => handleChange("storage.diskRetentionDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">分区用量与磁盘读写吞吐</p>
              </div>

              {/* 4. 网络带宽 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate">
                    <Network className="size-3 text-indigo-400 shrink-0" />
                    网络带宽与流量
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formValues["storage.networkRetentionDays"] || "30"}
                    onChange={(e) => handleChange("storage.networkRetentionDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">网卡进出流量与实时速率</p>
              </div>

              {/* 5. Ping 延时 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate">
                    <Activity className="size-3 text-rose-400 shrink-0" />
                    网络拨测与延时
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formValues["storage.pingRetentionDays"] || "30"}
                    onChange={(e) => handleChange("storage.pingRetentionDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">ICMP/TCP 延时与丢包历史</p>
              </div>

              {/* 6. 进程快照 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate">
                    <Terminal className="size-3 text-purple-400 shrink-0" />
                    进程状态快照
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">3~30天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={formValues["storage.processRetentionDays"] || "7"}
                    onChange={(e) => handleChange("storage.processRetentionDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">Top 进程资源占用快照</p>
              </div>

              {/* 7. 审计日志 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate">
                    <FileCode className="size-3 text-emerald-400 shrink-0" />
                    系统操作审计日志
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">30~180天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={formValues["storage.auditRetentionDays"] || "90"}
                    onChange={(e) => handleChange("storage.auditRetentionDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">管理操作与登录鉴权记录</p>
              </div>

              {/* 8. 告警事件 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate">
                    <Bell className="size-3 text-amber-400 shrink-0" />
                    历史告警事件记录
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~90天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={3}
                    max={180}
                    value={formValues["storage.alertRetentionDays"] || "30"}
                    onChange={(e) => handleChange("storage.alertRetentionDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">规则触发与恢复通知历史</p>
              </div>
            </div>
          </div>

          {/* 第三组：📡 探针生命周期与入网鉴权时效 */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <Radio className="size-3.5 text-indigo-400" />
              <span className="font-bold text-foreground">探针入网鉴权与节点失联管理</span>
              <span className="text-[11px] text-muted-foreground font-mono">（探针安全认证与废弃实例自动维护）</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Agent 注册 Token 有效期 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span>探针注册 Token 有效期</span>
                  <span className="text-[10px] text-muted-foreground font-mono">推荐: 180 ~ 600</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={60}
                    max={3600}
                    value={formValues["limits.agentRegisterTokenTtl"] || "300"}
                    onChange={(e) => handleChange("limits.agentRegisterTokenTtl", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">
                    秒
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">一键安装脚本中携带的入网临时鉴权密钥时效</p>
              </div>

              {/* 探针失联离线超时判定 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span>探针心跳失联超时</span>
                  <span className="text-[10px] text-muted-foreground font-mono">推荐: 30 ~ 120</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={15}
                    max={300}
                    value={formValues["storage.agentOfflineTimeoutSec"] || "60"}
                    onChange={(e) => handleChange("storage.agentOfflineTimeoutSec", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">
                    秒
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">连续未收到探针心跳上报判定节点处于离线状态</p>
              </div>

              {/* 长期离线废弃节点自动清理 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span>废弃离线节点自动清理</span>
                  <span className="text-[10px] text-muted-foreground font-mono">0 为不清理</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formValues["storage.inactiveNodePruneDays"] || "30"}
                    onChange={(e) => handleChange("storage.inactiveNodePruneDays", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">
                    天
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">已销毁/长期失联机器自动从实例列表注销</p>
              </div>
            </div>
          </div>

          {/* 第四组：🤖 自动化任务执行保护 */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <Cpu className="size-3.5 text-primary" />
              <span className="font-bold text-foreground">自动化任务执行与输出保护</span>
              <span className="text-[11px] text-muted-foreground font-mono">（保障主控调度引擎吞吐与前端内存平稳）</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 单任务最长超时时间 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span>单个任务执行超时</span>
                  <span className="text-[10px] text-muted-foreground font-mono">推荐: 60 ~ 600</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={3600}
                    value={formValues["limits.taskTimeoutSec"] || "300"}
                    onChange={(e) => handleChange("limits.taskTimeoutSec", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">
                    秒
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">防止异常脚本死循环，超时自动向进程发送 SIGKILL 终止</p>
              </div>

              {/* 单任务输出日志行数上限 */}
              <div className="space-y-1.5">
                <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span>单任务输出日志上限</span>
                  <span className="text-[10px] text-muted-foreground font-mono">推荐: 1000 ~ 5000</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={200}
                    max={20000}
                    value={formValues["limits.taskLogMaxLines"] || "2000"}
                    onChange={(e) => handleChange("limits.taskLogMaxLines", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">
                    行
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">捕获的 stdout/stderr 输出最大保留行数，超限自动截断</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. 安全防御基线与高危操作提权策略 (Security Baseline & Step-up Auth) */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            安全防御基线与高危操作提权策略 (Security Baseline & Step-up Auth)
          </CardTitle>
          <CardDescription>
            配置管理控制台 IP 访问白名单、高危/非安全操作二次验证机制与客户端 IP 提权安全窗口时效
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-xs w-full">
          {/* 第一组：IP 访问白名单 与 提权时效窗口 (左右 50/50 对半) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* IP 访问白名单 */}
            <div className="space-y-1.5">
              <div className="h-5 font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="size-3.5 text-primary" />
                  控制台 IP 访问控制白名单 (IP Whitelist)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">留空允许全部公网 IP</span>
              </div>
              <div className="space-y-1">
                <textarea
                  rows={3}
                  value={formValues["security.ipWhitelist"] || ""}
                  onChange={(e) => handleChange("security.ipWhitelist", e.target.value)}
                  placeholder="例如: 127.0.0.1, 192.168.1.0/24, 10.0.0.0/8 (支持逗号或换行分隔)"
                  className="w-full rounded-xl border border-border/80 bg-muted/40 p-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all resize-none"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>仅白名单内的源 IP 允许访问管理端，防止公网端口扫描与爆破</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = formValues["security.ipWhitelist"] ? `${formValues["security.ipWhitelist"]}, 127.0.0.1` : "127.0.0.1";
                    handleChange("security.ipWhitelist", current);
                  }}
                  className="text-primary hover:underline text-[10px] cursor-pointer"
                >
                  + 添加本机 IP
                </button>
              </div>
            </div>

            {/* 高危操作二次验证与 IP 提权时效 */}
            <div className="space-y-3">
              {/* 提权时效 */}
              <div className="space-y-1.5">
                <div className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-amber-400" />
                    高危操作提权安全窗口时效 (Step-up Auth TTL)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">推荐: 5 ~ 30 分钟</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={formValues["security.stepUpSessionTtlMinutes"] || "15"}
                    onChange={(e) => handleChange("security.stepUpSessionTtlMinutes", e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-14 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">
                    分钟
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  执行敏感操作（改密、批量重启、危险执行）提权成功后，允许当前 IP 在该时长内免重复验证
                </p>
              </div>

              {/* 提权验证模式选择与 TOTP 开启状态联动校验 */}
              <div className="space-y-1.5">
                <div className="h-5 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="size-3.5 text-emerald-400" />
                    高危非安全操作提权验证策略
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formValues["security.totpEnabled"] !== "false" ? (
                      <span className="text-emerald-500 font-bold">● TOTP 已开启</span>
                    ) : (
                      <span className="text-amber-500 font-bold">○ TOTP 未绑定</span>
                    )}
                  </span>
                </div>
                <select
                  value={formValues["security.stepUpVerificationMode"] || "totp_or_password"}
                  onChange={(e) => {
                    const nextMode = e.target.value;
                    const isTotpActive = formValues["security.totpEnabled"] !== "false";
                    if (nextMode === "totp_only" && !isTotpActive) {
                      toast.warning(
                        "当前管理员账号尚未开启 TOTP 双因子认证！请先前往「账号与认证安全」完成绑定，否则高危操作将因无法获取动态码而受阻。"
                      );
                    }
                    handleChange("security.stepUpVerificationMode", nextMode);
                  }}
                  className="w-full h-11 rounded-xl border border-border/80 bg-muted/40 px-3.5 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all cursor-pointer flex items-center"
                >
                  <option value="totp_or_password">优先 TOTP 动态口令 (开启 TOTP 必验 TOTP，未开启验管理员密码)</option>
                  <option value="password_only">强制仅验证管理员登录密码 (Password Only)</option>
                  <option value="totp_only">强制仅验证 TOTP 双因子动态口令 (TOTP Only)</option>
                </select>

                {/* 动态安全状态与未开启 TOTP 警示条 */}
                {formValues["security.stepUpVerificationMode"] === "totp_only" && (
                  formValues["security.totpEnabled"] !== "false" ? (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span>已检测到有效 TOTP 绑定，执行高危敏感操作时将强制校验 6 位动态口令。</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <div className="font-bold">⚠️ 未检测到已绑定的 TOTP 设备！</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          请先前往「<strong>账号与认证安全</strong>」选项卡开启并绑定 Authenticator，否则触发高危操作时将无法通过验证。
                        </div>
                      </div>
                    </div>
                  )
                )}

                {formValues["security.stepUpVerificationMode"] === "totp_or_password" && (
                  <p className="text-[11px] text-muted-foreground">
                    智能自适应提权：若管理员已绑定 TOTP 则优先验证动态口令，未绑定时自动回退为验证登录密码。
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 第二组：防暴力破解与连续鉴权失败锁定 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 gap-3">
            <div className="space-y-0.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" />
                防暴力破解与连续错误 IP 临时锁定
              </div>
              <div className="text-[11px] text-muted-foreground">
                连续输入错误管理员密码或 TOTP 达到阈值时，自动封禁该客户端 IP 15 分钟
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-32">
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={formValues["security.maxFailedAttempts"] || "5"}
                  onChange={(e) => handleChange("security.maxFailedAttempts", e.target.value)}
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 pr-10 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">
                  次失败
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部保存与重置操作栏 */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          {hasChanges ? (
            <Badge variant="warning" className="text-[11px] px-2 py-0.5 font-mono">
              ● 有未保存的系统配置更改
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground font-mono">
              全部参数已与系统服务端保持同步
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            className="h-8.5 px-3 text-xs cursor-pointer"
          >
            <RotateCcw className="size-3 mr-1.5" /> 重置修改
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasChanges}
            className="h-8.5 px-4 text-xs cursor-pointer shadow-xs font-semibold"
          >
            <Save className="size-3.5 mr-1.5" />
            {saveMutation.isPending ? "正在保存..." : "保存全部修改"}
          </Button>
        </div>
      </div>
    </div>
  );
}
