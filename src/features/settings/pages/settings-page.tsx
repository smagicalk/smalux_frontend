import { useState } from "react";
import {
  Settings,
  KeyRound,
  ScrollText,
  Palette,
  Save,
  Plus,
  Copy,
  Trash2,
  Moon,
  Sun,
  Monitor,
  ExternalLink,
  ShieldCheck,
  Activity
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { PageHeader } from "@/shared/ui/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { useThemeStore, type ThemeMode, type AccentColor } from "@/shared/stores/theme-store";
import { toast } from "@/shared/ui/toaster";

interface Token {
  id: string;
  name: string;
  prefix: string;
  scope: string;
  createdAt: string;
  lastUsedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  ip: string;
  time: string;
  status: "success" | "warning" | "danger";
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"access" | "audit" | "appearance" | "config">("access");
  const { mode, setMode, accent, setAccent } = useThemeStore();
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenScope, setNewTokenScope] = useState("tasks:dispatch, alerts:read");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Tokens
  const [tokens, setTokens] = useState<Token[]>([
    {
      id: "tok-1",
      name: "GitHub Actions CI/CD Pipeline",
      prefix: "smalux_live_88a9...",
      scope: "tasks:dispatch, alerts:read",
      createdAt: "2026-08-10",
      lastUsedAt: "10 分钟前"
    },
    {
      id: "tok-2",
      name: "Grafana Metrics Exporter Proxy",
      prefix: "smalux_live_41b2...",
      scope: "metrics:read, hosts:read",
      createdAt: "2026-08-01",
      lastUsedAt: "刚刚"
    },
    {
      id: "tok-3",
      name: "Agent Default Registration Key",
      prefix: "smalux_reg_99c3...",
      scope: "agent:register",
      createdAt: "2026-07-15",
      lastUsedAt: "14 分钟前"
    }
  ]);

  // Audit Logs
  const auditLogs: AuditLog[] = [
    { id: "log-1", action: "用户登录 (Web Console)", user: "admin", ip: "114.88.204.12", time: "刚刚", status: "success" },
    { id: "log-2", action: "下发远程批量任务 [TASK-4029]", user: "admin", ip: "114.88.204.12", time: "3 分钟前", status: "success" },
    { id: "log-3", action: "确认告警事件 [INC-101]", user: "admin", ip: "114.88.204.12", time: "10 分钟前", status: "success" },
    { id: "log-4", action: "更新计划任务 [每天凌晨清理日志]", user: "admin", ip: "114.88.204.12", time: "1 小时前", status: "success" },
    { id: "log-5", action: "新主机握手注册 [hk-gateway-01]", user: "Agent Daemon", ip: "43.154.210.88", time: "2 小时前", status: "success" }
  ];

  // Config parameters
  const [config, setConfig] = useState({
    publicUrl: "https://console.smalux.com",
    wsHeartbeatSec: "15",
    metricsRetentionDays: "30",
    enableAutoPrune: true,
    allowAnonymousPing: false
  });

  const copyToken = (name: string) => {
    navigator.clipboard.writeText("smalux_live_mock_secret_token_1234567890abcdef");
    toast.success(`已复制 Token 秘钥 [${name}]`);
  };

  const deleteToken = (id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
    toast.success("已注销该 Token 访问凭据");
  };

  const handleCreateToken = () => {
    if (!newTokenName.trim()) {
      toast.error("请输入令牌名称");
      return;
    }
    const secret = `smalux_live_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const newToken: Token = {
      id: `tok-${Date.now()}`,
      name: newTokenName,
      prefix: `${secret.substring(0, 15)}...`,
      scope: newTokenScope,
      createdAt: "刚刚",
      lastUsedAt: "从未"
    };
    setTokens([newToken, ...tokens]);
    setCreatedSecret(secret);
    toast.success("API Token 生成成功");
  };

  const handleSaveConfig = () => {
    toast.success("系统参数已保存并动态生效");
  };

  const accents: Array<{ key: AccentColor; label: string; bg: string }> = [
    { key: "indigo", label: "科技蓝 (Indigo)", bg: "bg-indigo-500" },
    { key: "emerald", label: "极客绿 (Emerald)", bg: "bg-emerald-500" },
    { key: "cyan", label: "天际青 (Cyan)", bg: "bg-sky-500" },
    { key: "violet", label: "星云紫 (Violet)", bg: "bg-purple-500" },
    { key: "rose", label: "烈焰红 (Rose)", bg: "bg-rose-500" }
  ];

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="系统与安全设置"
        subtitle="权限与访问凭据、审计日志、外观主题与实例系统配置"
        action={
          activeTab === "config" ? (
            <Button size="sm" onClick={handleSaveConfig}>
              <Save className="size-3.5 mr-1" /> 保存配置
            </Button>
          ) : null
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <button
            onClick={() => setActiveTab("access")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "access"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <KeyRound className="size-3.5" />
            访问控制与 API Token
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ScrollText className="size-3.5" />
            操作审计日志
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "appearance"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Palette className="size-3.5" />
            外观与主题
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "config"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Settings className="size-3.5" />
            系统配置与交付
          </button>
        </div>

        {/* Tab 1: Access & Tokens */}
        {activeTab === "access" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">API 访问令牌 (Access Tokens)</CardTitle>
                  <CardDescription>用于外部 CI/CD 流水线、Grafana Exporter 或自动化脚本调用 smalux JSON-RPC API</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setCreatedSecret(null); setNewTokenName(""); setTokenDialogOpen(true); }}>
                  <Plus className="size-3.5 mr-1" /> 生成新令牌
                </Button>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/60">
                  {tokens.map((tok) => (
                    <div
                      key={tok.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{tok.name}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground border border-border/60">
                            {tok.prefix}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          权限范围: <span className="text-foreground">{tok.scope}</span> · 创建于: {tok.createdAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                        <span>最后活跃: {tok.lastUsedAt}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7 p-0 cursor-pointer"
                            onClick={() => copyToken(tok.name)}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            onClick={() => deleteToken(tok.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === "audit" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">全局安全与操作审计</CardTitle>
              <CardDescription>记录管理员及 Agent 在控制台触发的所有敏感操作与鉴权事件</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <div>
                        <div className="font-semibold text-foreground">{log.action}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          操作者: <strong className="text-foreground">{log.user}</strong> · IP: {log.ip}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Appearance & Themes */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">外观与主题偏好</CardTitle>
                <CardDescription>自定义控制台明暗模式与设计风格</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground">明暗模式切换</label>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {[
                      { key: "dark" as ThemeMode, label: "深色模式 (Dark)", icon: Moon },
                      { key: "light" as ThemeMode, label: "浅色模式 (Light)", icon: Sun },
                      { key: "system" as ThemeMode, label: "跟随系统 (System)", icon: Monitor }
                    ].map((t) => {
                      const Icon = t.icon;
                      const active = mode === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setMode(t.key)}
                          className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all cursor-pointer ${
                            active
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                              : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="size-5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/60">
                  <label className="text-xs font-semibold text-foreground">核心品牌强调色 (Accent Color)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl">
                    {accents.map((acc) => {
                      const active = accent === acc.key;
                      return (
                        <button
                          key={acc.key}
                          onClick={() => {
                            setAccent(acc.key);
                            toast.success(`已切换强调色为: ${acc.label}`);
                          }}
                          className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium transition-all cursor-pointer ${
                            active
                              ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                              : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className={`size-3.5 rounded-full ${acc.bg} shrink-0`} />
                          <span className="truncate">{acc.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Status Page Feature Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="size-4 text-emerald-500" />
                    公开状态页 (Public Status Page)
                  </CardTitle>
                  <CardDescription>面向公众或用户的独立服务可用性大盘</CardDescription>
                </div>
                <Badge variant="success" dot>运行中</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>公开状态页支持自定义域名、独立主题上传与免登录匿名探针查看。</p>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => toast.info("公开状态页将在新窗口打开: https://status.smalux.com")}>
                    <ExternalLink className="size-3.5 mr-1" /> 预览状态页
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: System Config & Deployment */}
        {activeTab === "config" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">实例核心运行参数</CardTitle>
                <CardDescription>配置探针汇报心跳频率、数据存储周期与公开端点</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs max-w-xl">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">控制台公网访问地址 (Public URL)</label>
                  <input
                    value={config.publicUrl}
                    onChange={(e) => setConfig({ ...config, publicUrl: e.target.value })}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground">用于生成 Agent 安装脚本及告警外链回调</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">WebSocket 心跳间隔 (秒)</label>
                    <input
                      value={config.wsHeartbeatSec}
                      onChange={(e) => setConfig({ ...config, wsHeartbeatSec: e.target.value })}
                      className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">监控指标历史保留天数</label>
                    <input
                      value={config.metricsRetentionDays}
                      onChange={(e) => setConfig({ ...config, metricsRetentionDays: e.target.value })}
                      className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div>
                    <div className="font-semibold text-foreground">自动清理过期执行日志与事件</div>
                    <div className="text-[11px] text-muted-foreground">超过保留周期的指标数据将自动释放</div>
                  </div>
                  <Switch
                    checked={config.enableAutoPrune}
                    onCheckedChange={(v) => setConfig({ ...config, enableAutoPrune: v })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Architecture Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">部署交付架构</CardTitle>
                <CardDescription>当前前端构建与服务接入方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                    <div className="font-bold text-primary">1. 单独静态部署 / CDN</div>
                    <p className="text-[11px] text-muted-foreground">产物打包至 dist/，配合任意静态托管与独立后端 RPC。</p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-1">
                    <div className="font-bold text-foreground">2. Nginx 反代部署</div>
                    <p className="text-[11px] text-muted-foreground">Nginx 直接托管静态文件，并反向代理 /rpc 与 /ws。</p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-1">
                    <div className="font-bold text-foreground">3. Rust Web 单二进制内置</div>
                    <p className="text-[11px] text-muted-foreground">Rust 后端直接 embed 前端资产，单文件极简交付。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog: Create New Token */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              生成新 API 访问令牌
            </DialogTitle>
            <DialogDescription>
              创建用于自动化脚本或第三方监控集成的访问密钥
            </DialogDescription>
          </DialogHeader>

          {createdSecret ? (
            <div className="space-y-4 pt-2 text-xs">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-500">
                <div className="font-bold mb-1">令牌创建成功！请立即妥善保存：</div>
                <div className="font-mono text-xs bg-zinc-950 p-2.5 rounded text-zinc-100 break-all select-all">
                  {createdSecret}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdSecret);
                    toast.success("秘钥已复制到剪贴板");
                    setTokenDialogOpen(false);
                  }}
                >
                  <Copy className="size-3.5 mr-1" /> 复制并关闭
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">令牌标识名称</label>
                <input
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="例如: Prometheus Metrics Scraper"
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">权限范围 (Scopes)</label>
                <select
                  value={newTokenScope}
                  onChange={(e) => setNewTokenScope(e.target.value)}
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground"
                >
                  <option value="metrics:read, hosts:read">只读指标与主机 (metrics:read, hosts:read)</option>
                  <option value="tasks:dispatch, alerts:read">运维任务下发与告警 (tasks:dispatch, alerts:read)</option>
                  <option value="admin:full">完全管理员权限 (*:full)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setTokenDialogOpen(false)}>
                  取消
                </Button>
                <Button size="sm" onClick={handleCreateToken}>
                  确认生成
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
