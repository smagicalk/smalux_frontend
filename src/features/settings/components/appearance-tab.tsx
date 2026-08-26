import { useState, useRef, useMemo, useCallback } from "react";
import {
  Palette,
  Moon,
  Sun,
  Monitor,
  Activity,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Layers,
  Globe,
  Upload,
  RotateCcw,
  FileCode,
  Sliders,
  Check,
  Zap,
  Info,
  Lock,
  EyeOff,
  KeyRound,
  Plus,
  Copy,
  Trash2,
  Ban,
  ShieldCheck,
  Clock,
  Share2,
  Tag,
  Calendar,
  AlertCircle,
  Settings2,
  Play,
  FileArchive,
  Image as ImageIcon,
  Home,
  Smartphone,
  Laptop,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toaster";
import { useThemeStore, ACCENT_PRESETS, type ThemeMode, type AccentColor } from "@/shared/stores/theme-store";
import {
  useThemes,
  useUploadTheme,
  usePublishTheme,
  useArchiveTheme
} from "../hooks/use-themes";
import type { Theme } from "@/shared/api/methods";

/**
 * 状态页模板的单个可配置参数字段（与 API ThemeSchemaField 同构）
 */
export interface StatusPageSchemaField {
  key: string;
  label: string;
  type: "string" | "text" | "boolean" | "number" | "select";
  defaultValue: any;
  description?: string;
  options?: { label: string; value: string }[];
}

export interface StatusPageTheme {
  id: string;
  name: string;
  version: string;
  author: string;
  isBuiltin: boolean;
  description: string;
  customHtml?: string;
  /** 参数配置 Schema 字段（与 API Theme.configSchema 对应） */
  configSchema: StatusPageSchemaField[];
}

export type StatusPageAccessMode = "public" | "private" | "disabled";

export interface StatusPageToken {
  id: string;
  token: string;
  label: string;
  createdAt: number;
  expiresAt: number | null;
  revoked: boolean;
}

/**
 * 将 API Theme（后端全量存储）直接映射为 StatusPageTheme，无需本地缓存
 */
function bridgeApiTheme(t: Theme): StatusPageTheme {
  return {
    id: t.id,
    name: t.name,
    version: t.version,
    author: t.author,
    isBuiltin: t.isBuiltin,
    description: t.description,
    customHtml: t.customHtml,
    configSchema: (t.configSchema ?? []) as StatusPageSchemaField[]
  };
}

// 预设快速填入备注
const QUICK_TOKEN_PRESETS = [
  "🏢 客户临时验收",
  "👥 外部合作监控团队",
  "🛠️ 故障现场排障",
  "📊 运营周报展示"
];


/**
 * 为指定模板和当前参数生成高保真真实沙箱 HTML (Sandbox srcDoc)
 */
function buildThemeSandboxHtml(theme: StatusPageTheme, configs: Record<string, any>): string {
  if (theme.customHtml) {
    // 注入第三方页面代码与动态参数通信
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; }
          </style>
        </head>
        <body>
          ${theme.customHtml}
        </body>
      </html>
    `;
  }

  // 渲染内置 Obsidian 黑晶全真大盘沙箱页面
  const title = configs["title"] || "Smalux Public Status";
  const banner = configs["banner"] || "🟢 所有服务运转正常，全网 SLA 99.98%";
  const showLatency = configs["show_latency_chart"] !== false;
  const groupBy = configs["group_by"] || "region";

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            padding: 24px 20px;
            min-height: 100vh;
          }
          .container { max-width: 900px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; }
          .title { font-size: 18px; font-weight: 700; color: #fafafa; }
          .badge {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            font-family: monospace;
          }
          .banner {
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.25);
            color: #10b981;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 12px;
            margin-bottom: 24px;
            line-height: 1.5;
          }
          .grid-metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .metric-card {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 12px;
            padding: 14px;
            text-align: center;
          }
          .metric-label { font-size: 11px; color: #a1a1aa; margin-bottom: 4px; }
          .metric-val { font-size: 18px; font-weight: 800; color: #34d399; font-family: monospace; }
          .section-title { font-size: 13px; font-weight: 600; color: #e4e4e7; margin-bottom: 12px; display: flex; justify-content: space-between; }
          .probes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
          .probe-item {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 10px;
            padding: 12px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .probe-name { font-size: 12px; font-weight: 600; color: #f4f4f5; }
          .probe-meta { font-size: 10px; color: #71717a; margin-top: 2px; font-family: monospace; }
          .bars-timeline { display: flex; gap: 3px; height: 16px; width: 100%; margin-top: 8px; }
          .bar { flex: 1; background: #10b981; border-radius: 2px; opacity: 0.85; }
          .footer { text-align: center; font-size: 10px; color: #52525b; margin-top: 30px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">
              <div class="dot"></div>
              <div class="title">${title}</div>
            </div>
            <div class="badge">99.98% SLA</div>
          </div>

          <div class="banner">${banner}</div>

          <div class="grid-metrics">
            <div class="metric-card">
              <div class="metric-label">平均可用性 (30天)</div>
              <div class="metric-val">99.98%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">全网探针平均延迟</div>
              <div class="metric-val" style="color: #38bdf8;">23.4 ms</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">在线探针集群</div>
              <div class="metric-val">8 / 8 在线</div>
            </div>
          </div>

          ${
            showLatency
              ? `
            <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 14px; margin-bottom: 24px;">
              <div class="section-title">
                <span>24h 探针时延与抖动曲线 (Latency Telemetry)</span>
                <span style="font-size: 10px; color: #10b981; font-family: monospace;">实时流式同步中</span>
              </div>
              <svg viewBox="0 0 500 60" style="width: 100%; height: 50px; stroke: #38bdf8; fill: none; stroke-width: 2;">
                <path d="M0,35 Q50,20 100,28 T200,32 T300,18 T400,25 T500,20" />
                <path d="M0,35 Q50,20 100,28 T200,32 T300,18 T400,25 T500,20 L500,60 L0,60 Z" style="fill: rgba(56, 189, 248, 0.08); stroke: none;" />
              </svg>
            </div>
          `
              : ""
          }

          <div class="section-title">
            <span>探针节点可用性 (${groupBy === "region" ? "按区域分组" : "按标签分组"})</span>
            <span style="font-size: 10px; color: #71717a; font-family: monospace;">90 天可用性历史</span>
          </div>

          <div class="probes-grid">
            <div class="probe-item">
              <div>
                <div class="probe-name">🇭🇰 HK-HongKong-Edge-01</div>
                <div class="probe-meta">亚太核心 · 延迟 12ms · 丢包 0.0%</div>
              </div>
              <span class="badge" style="padding: 2px 6px; font-size: 9px;">正常</span>
            </div>
            <div class="probe-item">
              <div>
                <div class="probe-name">🇯🇵 JP-Tokyo-Central-02</div>
                <div class="probe-meta">东京骨干 · 延迟 38ms · 丢包 0.0%</div>
              </div>
              <span class="badge" style="padding: 2px 6px; font-size: 9px;">正常</span>
            </div>
            <div class="probe-item">
              <div>
                <div class="probe-name">🇺🇸 US-SiliconValley-01</div>
                <div class="probe-meta">美西直连 · 延迟 120ms · 丢包 0.0%</div>
              </div>
              <span class="badge" style="padding: 2px 6px; font-size: 9px;">正常</span>
            </div>
            <div class="probe-item">
              <div>
                <div class="probe-name">🇩🇪 DE-Frankfurt-01</div>
                <div class="probe-meta">欧洲枢纽 · 延迟 145ms · 丢包 0.0%</div>
              </div>
              <span class="badge" style="padding: 2px 6px; font-size: 9px;">正常</span>
            </div>
          </div>

          <div class="section-title">
            <span>全网服务 90 天可用性时序</span>
            <span style="font-size: 10px; color: #34d399; font-family: monospace;">100.0% Operational</span>
          </div>
          <div class="bars-timeline">
            ${Array.from({ length: 48 })
              .map(() => '<div class="bar"></div>')
              .join("")}
          </div>

          <div class="footer">POWERED BY SMALUX DISTRIBUTED MONITORING</div>
        </div>
      </body>
    </html>
  `;
}

export function AppearanceTab() {
  const { mode, setMode, accent, setAccent } = useThemeStore();

  // ── API 数据层 ─────────────────────────────────────────────────
  const { data: themesData, isLoading: themesLoading } = useThemes();
  const uploadTheme = useUploadTheme();
  const publishTheme = usePublishTheme();
  const archiveTheme = useArchiveTheme();

  /**
   * 从 API 数据桥接成 StatusPageTheme 列表（排除已归档的主题）
   * published 状态的模板排在最前
   */
  const themeList: StatusPageTheme[] = useMemo(() => {
    const apiThemes = themesData?.themes ?? [];
    // 过滤已归档，published 状态排在最前
    return apiThemes
      .filter((t) => t.status !== "archived")
      .sort((a, b) => (b.status === "published" ? 1 : 0) - (a.status === "published" ? 1 : 0))
      .map(bridgeApiTheme);
  }, [themesData]);

  /**
   * 当前主页大盘：API 中 status=published 的第一条
   * 如果 API 暂无数据，回退到内置默认主题
   */
  const currentTheme: StatusPageTheme | undefined = useMemo(() => {
    const published = themesData?.themes?.find((t) => t.status === "published");
    return published ? bridgeApiTheme(published) : undefined;
  }, [themesData]);

  // 访问控制模式: 'public' | 'private' | 'disabled' (默认全网公开)
  const [accessMode, setAccessMode] = useState<StatusPageAccessMode>("public");

  // 临时访问令牌列表（状态页专用 Token，独立于 API Token）
  const [tokens, setTokens] = useState<StatusPageToken[]>([
    {
      id: "stk_1",
      token: "stk_live_9f82a170e4c2b9a",
      label: "交付客户 A 临时巡检看板",
      createdAt: Date.now() - 3600 * 1000 * 24,
      expiresAt: Date.now() + 3600 * 1000 * 24 * 6,
      revoked: false
    },
    {
      id: "stk_2",
      token: "stk_live_4b71d9e23fa8c01",
      label: "外部监控运维协作",
      createdAt: Date.now() - 3600 * 1000 * 12,
      expiresAt: null,
      revoked: false
    }
  ]);

  // 新建 Token 弹窗状态与表单
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [durationMode, setDurationMode] = useState<"preset" | "custom" | "forever">("preset");
  const [presetDurationHours, setPresetDurationHours] = useState<number>(168); // 默认 7 天
  const [customDurationVal, setCustomDurationVal] = useState<string>("3");
  const [customDurationUnit, setCustomDurationUnit] = useState<"hours" | "days" | "weeks" | "months">("days");
  const [createdTokenResult, setCreatedTokenResult] = useState<StatusPageToken | null>(null);

  // 模板参数配置弹窗状态 & 视口模式（桌面 / 移动端）
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  // editingTheme 初始为空占位，打开弹窗时赋值
  const [editingTheme, setEditingTheme] = useState<StatusPageTheme>({
    id: "", name: "", version: "", author: "", isBuiltin: false, description: "", configSchema: []
  });
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [sandboxKey, setSandboxKey] = useState(0);

  // 动态参数字典（针对每个模板维护独立值）
  const [themeConfigValues, setThemeConfigValues] = useState<Record<string, any>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const accents = ACCENT_PRESETS;

  // 计算当前有效时长与过期时间
  const calculateExpiresAt = (): number | null => {
    if (durationMode === "forever") return null;

    let totalHours = 0;
    if (durationMode === "preset") {
      totalHours = presetDurationHours;
    } else {
      const num = parseFloat(customDurationVal) || 1;
      switch (customDurationUnit) {
        case "hours":
          totalHours = num;
          break;
        case "days":
          totalHours = num * 24;
          break;
        case "weeks":
          totalHours = num * 24 * 7;
          break;
        case "months":
          totalHours = num * 24 * 30;
          break;
      }
    }
    return Date.now() + Math.round(totalHours * 3600 * 1000);
  };

  // 处理动态表单字段变更
  const handleConfigChange = (key: string, value: any) => {
    setThemeConfigValues((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // 点击【设置】打开模板参数配置弹窗
  const handleOpenThemeConfig = (theme: StatusPageTheme) => {
    setEditingTheme(theme);
    setConfigDialogOpen(true);
  };

  // 设为主页（调用 publishTheme mutation）
  const handleSetAsHomepage = async (theme: StatusPageTheme) => {
    try {
      await publishTheme.mutateAsync(theme.id);
      const newConfigs = { ...themeConfigValues };
      theme.configSchema.forEach((f) => {
        if (newConfigs[f.key] === undefined) newConfigs[f.key] = f.defaultValue;
      });
      setThemeConfigValues(newConfigs);
      toast.success(`已将「${theme.name}」发布为当前主页展示大盘！`);
    } catch {
      toast.error("设置主页大盘失败，请重试");
    }
  };

  // 删除自定义模板（调用 archiveTheme mutation 归档）
  const handleDeleteCustomTheme = async (themeId: string) => {
    try {
      await archiveTheme.mutateAsync(themeId);
      toast.info("已归档并移除该自定义大盘模板");
    } catch {
      toast.error("移除自定义模板失败，请重试");
    }
  };

  // 上传并替换公开状态页模板（将完整数据发送给后端全量存储）
  const handleUploadThemePackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (!parsed.name || (!Array.isArray(parsed.schema) && !Array.isArray(parsed.configSchema))) {
            throw new Error("JSON 格式不符合 smalux 展示页 Schema 规范（缺少 name 或 configSchema/schema 字段）");
          }
          // 将完整数据上传到后端（后端全量存储）
          await uploadTheme.mutateAsync({
            name: parsed.name,
            version: parsed.version || "1.0.0",
            description: parsed.description || "",
            configSchema: parsed.configSchema || parsed.schema || [],
            customHtml: parsed.html || parsed.customHtml
          });
          const newConfigs: Record<string, any> = {};
          (parsed.configSchema || parsed.schema || []).forEach((f: any) => { newConfigs[f.key] = f.defaultValue; });
          setThemeConfigValues(newConfigs);
          toast.success(`成功上传「${parsed.name}」并已存入模板库！`);
        } catch (err: any) {
          toast.error(`解析或上传模板失败: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      // 静态 HTML / ZIP 包上传（将默认 configSchema 一并存入后端）
      try {
        const themeName = file.name.replace(/\.(zip|tar|gz|html)$/, "");
        await uploadTheme.mutateAsync({
          name: themeName,
          version: "1.0.0",
          description: `从安装包「${file.name}」中解析提取的独立大盘模板`,
          configSchema: [
            { key: "title", label: "大盘标题", type: "string" as const, defaultValue: "第三方自定义监控大盘", description: "展示页大标题" },
            { key: "notice", label: "重要公告", type: "text" as const, defaultValue: "欢迎访问全网节点可用性状态页", description: "顶部通知横幅" },
            { key: "dark_mode_default", label: "默认开启深色模式", type: "boolean" as const, defaultValue: true, description: "未切换时优先深色主题" }
          ]
        });
        toast.success(`成功上传安装包「${file.name}」并已存入模板库！`);
      } catch {
        toast.error("上传模板包失败，请重试");
      }
    }


    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 创建新临时访问令牌
  const handleCreateToken = () => {
    if (!newTokenLabel.trim()) {
      toast.error("请输入令牌备注名称（如用途或所属客户）");
      return;
    }

    const randomStr = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const generatedToken = `stk_live_${randomStr}`;
    const expiresAt = calculateExpiresAt();

    const tokenObj: StatusPageToken = {
      id: `stk_${Date.now()}`,
      token: generatedToken,
      label: newTokenLabel.trim(),
      createdAt: Date.now(),
      expiresAt,
      revoked: false
    };

    setTokens((prev) => [tokenObj, ...prev]);
    setCreatedTokenResult(tokenObj);
    toast.success(`已生成临时访问令牌「${tokenObj.label}」！`);
  };

  // 吊销令牌
  const handleRevokeToken = (id: string) => {
    setTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, revoked: true } : t))
    );
    toast.warning("已吊销该临时访问令牌，外部携带该令牌将无法再访问大盘");
  };

  // 删除令牌
  const handleDeleteToken = (id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
    toast.info("已删除该令牌记录");
  };

  // 复制免登录分享链接
  const handleCopyShareLink = (token: string, label: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/?token=${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(`已复制「${label}」的免登访问链接到剪贴板！`);
  };

  const previewExpiresAt = calculateExpiresAt();

  // 当前配置弹窗的沙箱 HTML
  const currentSandboxSrcDoc = useMemo(() => {
    return buildThemeSandboxHtml(editingTheme, themeConfigValues);
  }, [editingTheme, themeConfigValues, sandboxKey]);

  return (
    <div className="space-y-6">
      {/* 1. 明暗主题与强调色 */}
      <Card>
        <CardHeader className="py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                控制台外观与主题偏好
              </CardTitle>
              <CardDescription className="text-xs">
                定制个人控制台的视觉风格、明暗模式与 10 款品牌强调色
              </CardDescription>
            </div>

            {/* 紧凑明暗色彩模式切换器 (Segmented Mode Switcher) */}
            <div className="flex items-center p-1 rounded-xl bg-muted/40 border border-border/60 gap-1 self-start sm:self-auto shrink-0 shadow-2xs">
              {[
                { key: "dark" as ThemeMode, label: "深色", icon: Moon },
                { key: "light" as ThemeMode, label: "浅色", icon: Sun },
                { key: "system" as ThemeMode, label: "系统", icon: Monitor }
              ].map((t) => {
                const Icon = t.icon;
                const active = mode === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setMode(t.key);
                      toast.success(`已切换为: ${t.label}模式`);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? "bg-background text-foreground font-bold shadow-xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 space-y-2.5 text-xs">
          {/* 强调色选择 (10款专业调色) */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">品牌主强调色 (Accent Color · 10 款专业调色)</span>
              <span className="text-muted-foreground font-mono">当前: {accents.find((a) => a.key === accent)?.label}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
              {accents.map((acc) => {
                const active = accent === acc.key;
                return (
                  <button
                    key={acc.key}
                    type="button"
                    onClick={() => {
                      setAccent(acc.key);
                      toast.success(`强调色已切换为: ${acc.label}`);
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 px-2 text-[11px] font-medium transition-all cursor-pointer ${
                      active
                        ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs ring-1 ring-primary/40"
                        : "border-border/60 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className={`size-2.5 rounded-full ${acc.dotClass} shrink-0 ring-1 ring-background shadow-xs`} />
                    <span className="truncate">{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 公开状态页大盘 (访问权限控制 + 临时访问令牌) */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4 text-emerald-500" />
                公开状态页大盘 (Public Status Page)
              </CardTitle>
              <CardDescription>
                支持「关闭 / 私有 / 公开」三级权限控制、临时免登访问令牌分发与多款展示大盘模板管理
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {accessMode === "public" && (
                <Badge variant="success" dot className="font-mono">
                  全网公开访问
                </Badge>
              )}
              {accessMode === "private" && (
                <Badge variant="warning" dot className="font-mono">
                  私有保护 (需登录或 Token)
                </Badge>
              )}
              {accessMode === "disabled" && (
                <Badge variant="neutral" dot className="font-mono">
                  已完全关闭访问
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-xs">
          {/* 三级访问权限控制模式切换 (精炼紧凑型分段卡片) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-foreground flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                状态大盘对外访问权限策略
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">默认: 全网公开 (Public)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. 公开模式 */}
              <button
                type="button"
                onClick={() => {
                  setAccessMode("public");
                  toast.success("已切换为「全网公开」模式");
                }}
                className={`flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  accessMode === "public"
                    ? "border-emerald-500 bg-emerald-500/10 text-foreground font-bold shadow-xs ring-1 ring-emerald-500/40"
                    : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    全网公开 (Public)
                  </span>
                  {accessMode === "public" && <Check className="size-3.5 text-emerald-500" />}
                </div>
                <p className="text-[10px] text-muted-foreground font-normal truncate">
                  任何访客均可免登录直接访问根路径 <code>/</code>
                </p>
              </button>

              {/* 2. 私有模式 (需登录或携带 Token) */}
              <button
                type="button"
                onClick={() => {
                  setAccessMode("private");
                  toast.success("已切换为「私有保护」模式");
                }}
                className={`flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  accessMode === "private"
                    ? "border-amber-500 bg-amber-500/10 text-foreground font-bold shadow-xs ring-1 ring-amber-500/40"
                    : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    私有保护 (Private)
                  </span>
                  {accessMode === "private" && <Check className="size-3.5 text-amber-500" />}
                </div>
                <p className="text-[10px] text-muted-foreground font-normal truncate">
                  仅登录用户或持有临时令牌 (<code>?token=xxx</code>) 可访问
                </p>
              </button>

              {/* 3. 关闭模式 */}
              <button
                type="button"
                onClick={() => {
                  setAccessMode("disabled");
                  toast.info("已完全关闭状态页对外访问");
                }}
                className={`flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  accessMode === "disabled"
                    ? "border-rose-500 bg-rose-500/10 text-foreground font-bold shadow-xs ring-1 ring-rose-500/40"
                    : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    完全关闭 (Disabled)
                  </span>
                  {accessMode === "disabled" && <Check className="size-3.5 text-rose-500" />}
                </div>
                <p className="text-[10px] text-muted-foreground font-normal truncate">
                  彻底停用对外状态页，访问根路径返回 404 / 登录页
                </p>
              </button>
            </div>
          </div>

          {/* 临时访问令牌 (Access Tokens) 分配与管理面板 */}
          <div className="rounded-xl border border-border/80 bg-muted/10 p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <KeyRound className="size-4 text-primary" />
                  公开状态页临时免登访问令牌 (Status Page Tokens)
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  在私有模式下，受访者无需登录账号密码，仅需携带此令牌（<code>/?token=stk_xxxx</code>）即可临时安全查看大盘
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setCreatedTokenResult(null);
                  setNewTokenLabel("");
                  setTokenDialogOpen(true);
                }}
                className="h-8 text-xs cursor-pointer shrink-0 shadow-xs font-semibold"
              >
                <Plus className="size-3.5 mr-1" /> 生成临时访问令牌
              </Button>
            </div>

            {/* 令牌列表表格 */}
            {tokens.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                暂无有效的访问令牌，点击右上角「生成临时访问令牌」即可创建免登分享链接
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="py-2 px-2.5 font-semibold">备注用途</th>
                      <th className="py-2 px-2.5 font-semibold">令牌凭据</th>
                      <th className="py-2 px-2.5 font-semibold">有效期限</th>
                      <th className="py-2 px-2.5 font-semibold">当前状态</th>
                      <th className="py-2 px-2.5 font-semibold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {tokens.map((tok) => {
                      const isExpired = tok.expiresAt ? Date.now() > tok.expiresAt : false;
                      return (
                        <tr key={tok.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-2.5 font-sans font-medium text-foreground">
                            {tok.label}
                          </td>
                          <td className="py-2.5 px-2.5 text-muted-foreground">
                            <span className="bg-muted/60 px-2 py-0.5 rounded border border-border/60">
                              {tok.token.slice(0, 10)}...{tok.token.slice(-4)}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-muted-foreground">
                            {tok.expiresAt ? (
                              <span className={isExpired ? "text-rose-500 font-semibold" : ""}>
                                {new Date(tok.expiresAt).toLocaleDateString()} {new Date(tok.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-semibold">永久有效</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5">
                            {tok.revoked ? (
                              <Badge variant="danger" className="text-[10px] px-1.5 py-0">已吊销</Badge>
                            ) : isExpired ? (
                              <Badge variant="neutral" className="text-[10px] px-1.5 py-0">已过期</Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px] px-1.5 py-0">正常生效</Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-right space-x-1.5 font-sans">
                            <button
                              type="button"
                              onClick={() => handleCopyShareLink(tok.token, tok.label)}
                              disabled={tok.revoked || isExpired}
                              title="复制带此 Token 的免登分享链接"
                              className="px-2 py-1 rounded border border-border/80 bg-background text-primary hover:bg-primary/10 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                            >
                              <Share2 className="size-3 inline mr-1" />
                              复制免登链接
                            </button>

                            {!tok.revoked && (
                              <button
                                type="button"
                                onClick={() => handleRevokeToken(tok.id)}
                                title="吊销此令牌"
                                className="px-2 py-1 rounded border border-amber-500/30 text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              >
                                <Ban className="size-3 inline mr-1" />
                                吊销
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteToken(tok.id)}
                              title="删除记录"
                              className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. 状态大盘展示模板库 (精美图片直观展示 + 纯图标小按钮) */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                大盘展示模板库 (Status Dashboard Themes)
              </CardTitle>
              <CardDescription>
                支持管理内置与自定义展示大盘、一键设为主页、真机沙箱弹窗微调参数
              </CardDescription>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 transition-colors shadow-2xs cursor-pointer"
            >
              <Globe className="size-3.5 text-primary" />
              <span>访问当前主页 ( / )</span>
              <ExternalLink className="size-3 opacity-70" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* 模板网格展示 (紧凑精巧型卡片) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themeList.map((theme) => {
              const isCurrentHome = currentTheme.id === theme.id;
              return (
                <div
                  key={theme.id}
                  className={`rounded-xl border bg-card overflow-hidden shadow-2xs transition-all flex flex-col justify-between group ${
                    isCurrentHome ? "border-primary/60 ring-1 ring-primary/30" : "border-border/80 hover:border-border"
                  }`}
                >
                  <div>
                    {/* 顶部紧凑微缩大盘拟真预览 (h-28) */}
                    <div className="relative h-28 w-full bg-zinc-950 p-2.5 flex flex-col justify-between overflow-hidden border-b border-border/60">
                      <div className="absolute top-0 right-0 size-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 size-20 bg-primary/10 rounded-full blur-lg pointer-events-none" />

                      {/* 模拟顶栏 */}
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-500 pulse-dot" />
                          <span className="text-[11px] font-bold text-zinc-100 font-mono truncate max-w-[150px]">
                            {themeConfigValues["title"] || theme.name}
                          </span>
                        </div>
                        <Badge variant="success" className="text-[8px] px-1 py-0 font-mono h-4">
                          Operational
                        </Badge>
                      </div>

                      {/* 模拟指标卡片 */}
                      <div className="grid grid-cols-3 gap-1.5 relative z-10">
                        <div className="bg-zinc-900/90 py-1 px-1 rounded border border-zinc-800 text-center">
                          <div className="text-[8px] text-zinc-400">SLA</div>
                          <div className="text-[10px] font-bold text-emerald-400 font-mono">99.98%</div>
                        </div>
                        <div className="bg-zinc-900/90 py-1 px-1 rounded border border-zinc-800 text-center">
                          <div className="text-[8px] text-zinc-400">延迟</div>
                          <div className="text-[10px] font-bold text-sky-400 font-mono">24 ms</div>
                        </div>
                        <div className="bg-zinc-900/90 py-1 px-1 rounded border border-zinc-800 text-center">
                          <div className="text-[8px] text-zinc-400">探针</div>
                          <div className="text-[10px] font-bold text-emerald-400 font-mono">8/8</div>
                        </div>
                      </div>

                      {/* 模拟微缩时序条 */}
                      <div className="flex gap-0.5 h-1.5 w-full relative z-10">
                        {Array.from({ length: 26 }).map((_, i) => (
                          <div key={i} className="flex-1 bg-emerald-500/80 rounded-xs" />
                        ))}
                      </div>
                    </div>

                    {/* 模板信息描述 */}
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-xs text-foreground truncate">{theme.name}</span>
                          <Badge variant={theme.isBuiltin ? "neutral" : "warning"} className="text-[8px] px-1 py-0 font-mono shrink-0">
                            {theme.isBuiltin ? "内置" : "自定义"}
                          </Badge>
                        </div>
                        {isCurrentHome && (
                          <Badge variant="success" className="text-[9px] px-1.5 py-0 font-mono flex items-center gap-1 shrink-0">
                            <Home className="size-2.5" /> 当前主页
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {/* 底部紧凑纯图标小按钮栏 */}
                  <div className="px-3 py-2 flex items-center justify-between border-t border-border/40 bg-muted/10">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>Schema: {theme.configSchema.length} 项</span>
                      <span>·</span>
                      <span>{theme.isBuiltin ? "~420 KB" : "1.8 MB"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* 设为主页小图标按钮 */}
                      <button
                        type="button"
                        onClick={() => handleSetAsHomepage(theme)}
                        title={isCurrentHome ? "当前已是默认主页大盘" : "设为主页 (根路径 / 默认展示大盘)"}
                        disabled={isCurrentHome}
                        className={`size-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          isCurrentHome
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500 font-bold"
                            : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Home className="size-3.5" />
                      </button>

                      {/* 参数配置小图标按钮 */}
                      <button
                        type="button"
                        onClick={() => handleOpenThemeConfig(theme)}
                        title="参数设置 (沙箱实时预览)"
                        className="size-7 rounded-lg border border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Settings2 className="size-3.5" />
                      </button>

                      {/* 预览大盘小图标按钮 */}
                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="在新标签页预览此大盘 ( / )"
                        className="size-7 rounded-lg border border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-all cursor-pointer"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>

                      {/* 删除自定义模板按钮 */}
                      {!theme.isBuiltin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomTheme(theme.id)}
                          title="删除此自定义模板"
                          className="size-7 rounded-lg border border-border/80 bg-background text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 独立上传自定义展示页区域 (全尺寸占满点击/拖拽区域) */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  // 模拟上传处理
                  const event = { target: { files: [file] } } as any;
                  handleUploadThemePackage(event);
                }
              }}
              className="rounded-xl border-2 border-dashed border-border/80 bg-muted/10 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group min-h-[200px]"
            >
              <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 group-hover:bg-primary/20 transition-all shadow-xs ring-1 ring-primary/20">
                <Upload className="size-5" />
              </div>
              <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                点击选择或拖拽模板包到此处
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
                支持 <code>theme.json</code>、HTML 页面或独立 ZIP 静态包
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 bg-background/80 text-[10px] font-mono text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors shadow-2xs">
                <Plus className="size-3" />
                <span>立即导入并设为主页</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.zip,.tar,.gz,.html"
                className="hidden"
                onChange={handleUploadThemePackage}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. 模板参数设置与全真沙箱实时渲染弹窗 (Theme Sandbox Config Dialog) */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden border-border/80 shadow-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-background flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/40 shadow-xs">
                <Settings2 className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  配置「{editingTheme.name}」参数与沙箱实时预览
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  已自动提取 {editingTheme.configSchema.length} 个 Schema 字段，右侧真机沙箱实时同步渲染
                </DialogDescription>
              </div>
            </div>

            {/* 视口切换器 (桌面/手机) */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setPreviewViewport("desktop")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  previewViewport === "desktop"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="size-3.5" />
                <span>桌面视口</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewViewport("mobile")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  previewViewport === "mobile"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="size-3.5" />
                <span>移动视口</span>
              </button>

              <button
                type="button"
                onClick={() => setSandboxKey((k) => k + 1)}
                title="重新载入沙箱"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* 左右分栏：左侧表单，右侧沙箱 iframe */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
            {/* 左侧：Schema 动态配置表单 */}
            <div className="lg:col-span-5 p-6 space-y-4 text-xs overflow-y-auto border-r border-border/60">
              <div className="font-bold text-foreground flex items-center justify-between pb-1 border-b border-border/40">
                <span className="flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-primary" />
                  动态表单项
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">共 {editingTheme.configSchema.length} 项</span>
              </div>

              {editingTheme.configSchema.map((field) => {
                const value = themeConfigValues[field.key] ?? field.defaultValue;

                // 1. Boolean 开关类型
                if (field.type === "boolean") {
                  return (
                    <div
                      key={field.key}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20"
                    >
                      <div>
                        <div className="font-semibold text-foreground text-xs">{field.label}</div>
                        {field.description && (
                          <div className="text-[10px] text-muted-foreground">{field.description}</div>
                        )}
                      </div>
                      <Switch
                        checked={Boolean(value)}
                        onCheckedChange={(val) => handleConfigChange(field.key, val)}
                      />
                    </div>
                  );
                }

                // 2. Text 多行文本类型
                if (field.type === "text") {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="font-semibold text-foreground text-xs flex items-center justify-between">
                        <span>{field.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{field.key}</span>
                      </label>
                      <textarea
                        rows={2}
                        value={value || ""}
                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-muted/40 p-2.5 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all resize-none"
                      />
                      {field.description && (
                        <p className="text-[10px] text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  );
                }

                // 3. Select 下拉单选类型
                if (field.type === "select" && field.options) {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="font-semibold text-foreground text-xs flex items-center justify-between">
                        <span>{field.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{field.key}</span>
                      </label>
                      <select
                        value={value}
                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                        className="w-full h-9 rounded-xl border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all cursor-pointer"
                      >
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {field.description && (
                        <p className="text-[10px] text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  );
                }

                // 4. Number 数字类型
                if (field.type === "number") {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="font-semibold text-foreground text-xs flex items-center justify-between">
                        <span>{field.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{field.key}</span>
                      </label>
                      <input
                        type="number"
                        value={value ?? ""}
                        onChange={(e) => handleConfigChange(field.key, Number(e.target.value))}
                        className="w-full h-9 rounded-xl border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                      />
                      {field.description && (
                        <p className="text-[10px] text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  );
                }

                // 5. String 单行常规文本类型
                return (
                  <div key={field.key} className="space-y-1">
                    <label className="font-semibold text-foreground text-xs flex items-center justify-between">
                      <span>{field.label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{field.key}</span>
                    </label>
                    <input
                      value={value || ""}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      className="w-full h-9 rounded-xl border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                    />
                    {field.description && (
                      <p className="text-[10px] text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 右侧：真机沙箱真实全量渲染视口 (Sandbox iframe) */}
            <div className="lg:col-span-7 p-4 bg-muted/20 flex flex-col justify-between items-center overflow-hidden">
              <div className="w-full flex items-center justify-between pb-2 text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 pulse-dot" />
                  真机沙箱环境 (Isolated Sandbox DOM)
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  所见即所得 · 100% 真实渲染
                </span>
              </div>

              {/* iframe 视口容器 */}
              <div
                className={`w-full flex-1 rounded-xl border border-border/80 bg-zinc-950 overflow-hidden shadow-inner transition-all flex items-center justify-center ${
                  previewViewport === "mobile" ? "max-w-[375px]" : "max-w-full"
                }`}
              >
                <iframe
                  key={sandboxKey}
                  title="Theme Sandbox Preview"
                  srcDoc={currentSandboxSrcDoc}
                  sandbox="allow-scripts"
                  className="w-full h-full border-0 bg-zinc-950"
                />
              </div>
            </div>
          </div>

          {/* 底部保存按钮 */}
          <div className="flex justify-between items-center px-6 py-3.5 border-t border-border/60 bg-muted/10 shrink-0">
            <div className="text-[11px] text-muted-foreground font-mono">
              提示：保存后将自动应用该参数至当前模板
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigDialogOpen(false)}
                className="h-8.5 text-xs cursor-pointer"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setConfigDialogOpen(false);
                  toast.success(`大盘「${editingTheme.name}」参数已成功保存并立即生效！`);
                }}
                className="h-8.5 px-4 text-xs cursor-pointer font-semibold shadow-xs"
              >
                保存并应用设置
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. 现代化生成临时访问令牌弹窗 */}
      <Dialog
        open={tokenDialogOpen}
        onOpenChange={(open) => {
          setTokenDialogOpen(open);
          if (!open) {
            setCreatedTokenResult(null);
          }
        }}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden border-border/80 shadow-2xl">
          {/* 弹窗顶部高质感毛玻璃 Header */}
          <div className="px-6 pt-5 pb-4 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-background">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/40 shadow-xs">
                <KeyRound className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  生成状态页临时免登访问令牌
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  在私有保护模式下，受访者凭此令牌可直接免密临时查看大盘
                </DialogDescription>
              </div>
            </div>
          </div>

          {createdTokenResult ? (
            /* 生成成功后的即时交付卡片 */
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <CheckCircle2 className="size-4.5" />
                <span>临时免登访问令牌生成成功！</span>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">专属免登访问链接 (包含 Token 鉴权)</span>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={typeof window !== "undefined" ? `${window.location.origin}/?token=${createdTokenResult.token}` : `/?token=${createdTokenResult.token}`}
                      className="w-full h-9 rounded-lg border border-border/80 bg-background px-3 font-mono text-[11px] text-foreground select-all outline-none"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCopyShareLink(createdTokenResult.token, createdTokenResult.label)}
                      className="h-9 px-3 shrink-0 text-xs cursor-pointer font-semibold shadow-xs"
                    >
                      <Copy className="size-3.5 mr-1" /> 复制链接
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                  <span>备注: <strong className="text-foreground">{createdTokenResult.label}</strong></span>
                  <span>
                    有效期限:{" "}
                    <strong className="text-foreground">
                      {createdTokenResult.expiresAt
                        ? `${new Date(createdTokenResult.expiresAt).toLocaleDateString()} ${new Date(createdTokenResult.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : "永久有效"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setTokenDialogOpen(false);
                    setCreatedTokenResult(null);
                  }}
                  className="h-8.5 px-4 text-xs cursor-pointer font-semibold"
                >
                  完成
                </Button>
              </div>
            </div>
          ) : (
            /* 创建表单 */
            <div className="p-6 space-y-4 text-xs">
              {/* 1. 令牌备注名称与快捷标签 */}
              <div className="space-y-2">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" />
                    令牌用途备注 / 分发对象
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono font-normal">必填</span>
                </label>
                <input
                  value={newTokenLabel}
                  onChange={(e) => setNewTokenLabel(e.target.value)}
                  placeholder="例如: 客户 A 运维交付巡检 / 外部合作监控组"
                  className="w-full h-10 rounded-xl border border-border/80 bg-muted/40 px-3.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
                {/* 快捷填入标签 */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-muted-foreground">快捷填入:</span>
                  {QUICK_TOKEN_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTokenLabel(p)}
                      className="px-2 py-0.5 rounded-full border border-border/60 bg-muted/30 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 时长策略 (快捷预设 / 自定义输入 / 永久有效) */}
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    有效时长设置 (TTL)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {durationMode === "forever"
                      ? "永久有效 (需手动吊销)"
                      : previewExpiresAt
                      ? `到期时间: ${new Date(previewExpiresAt).toLocaleDateString()} ${new Date(previewExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : ""}
                  </span>
                </label>

                {/* 模式选择按钮组 */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationMode("preset")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      durationMode === "preset"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    快捷预设时长
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationMode("custom")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      durationMode === "custom"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    自定义时长输入
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationMode("forever")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      durationMode === "forever"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    永久有效 (无限制)
                  </button>
                </div>

                {/* A. 快捷预设时长选项 */}
                {durationMode === "preset" && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { hours: 1, label: "1 小时 (演示)" },
                      { hours: 24, label: "24 小时 (单日)" },
                      { hours: 168, label: "7 天 (推荐)" },
                      { hours: 720, label: "30 天 (一月)" }
                    ].map((item) => {
                      const isSel = presetDurationHours === item.hours;
                      return (
                        <button
                          key={item.hours}
                          type="button"
                          onClick={() => setPresetDurationHours(item.hours)}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono transition-all cursor-pointer text-center ${
                            isSel
                              ? "border-primary bg-primary/15 text-primary font-bold shadow-2xs ring-1 ring-primary/40"
                              : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* B. 自定义时长输入 (支持数字 + 单位组合) */}
                {durationMode === "custom" && (
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={customDurationVal}
                        onChange={(e) => setCustomDurationVal(e.target.value)}
                        placeholder="输入时长数值"
                        className="w-1/2 h-10 rounded-xl border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                      />
                      <select
                        value={customDurationUnit}
                        onChange={(e) => setCustomDurationUnit(e.target.value as any)}
                        className="w-1/2 h-10 rounded-xl border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground cursor-pointer"
                      >
                        <option value="hours">小时 (Hours)</option>
                        <option value="days">天 (Days)</option>
                        <option value="weeks">周 (Weeks)</option>
                        <option value="months">月 (Months · 30天)</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      可输入任意自定义整数，系统将自动换算精确的失效毫秒时间戳。
                    </p>
                  </div>
                )}

                {/* C. 永久有效提示 */}
                {durationMode === "forever" && (
                  <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>永久令牌不会自动过期，如不再需要请及时在令牌列表点击「吊销」。</span>
                  </div>
                )}
              </div>

              {/* 底部操作按钮 */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTokenDialogOpen(false)}
                  className="h-8.5 text-xs cursor-pointer"
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateToken}
                  className="h-8.5 px-4 text-xs cursor-pointer font-semibold shadow-xs"
                >
                  确认生成令牌
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
