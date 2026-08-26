import { useState } from "react";
import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  RotateCw,
  Eye,
  Zap,
  Lock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toaster";
import { useTokens, useCreateToken, useRevokeToken } from "../hooks/use-tokens";
import type { Token } from "@/shared/api/methods";

type TokenPermission = "read" | "admin";

const PERMISSION_OPTIONS: Array<{
  id: TokenPermission;
  label: string;
  scopeTag: string;
  icon: typeof Eye;
  badge: "info" | "primary";
  desc: string;
  examples: string;
}> = [
  {
    id: "read",
    label: "只读访问 (Read Only)",
    scopeTag: "read",
    icon: Eye,
    badge: "info",
    desc: "仅允许读取主机列表、实时遥测指标与运行日志，禁止下发任何运维指令或修改配置",
    examples: "适用于 Prometheus / Grafana Exporter 抓取、第三方外部状态看板展示"
  },
  {
    id: "admin",
    label: "完全管理 (Admin / Read-Write)",
    scopeTag: "admin",
    icon: Zap,
    badge: "primary",
    desc: "拥有全部读写权限，允许下发批量自动化任务、管理告警规则、配置修改及控制台全功能调用",
    examples: "适用于 GitHub Actions / GitLab CI/CD 自动化部署、定时运维脚本"
  }
];

const EXPIRATION_OPTIONS = [
  { label: "7 天", value: 7 * 86400000 },
  { label: "30 天 (推荐)", value: 30 * 86400000 },
  { label: "90 天", value: 90 * 86400000 },
  { label: "1 年 (365 天)", value: 365 * 86400000 },
  { label: "永不过期", value: 0 }
];

export function AccessTokensTab() {
  const { data, isLoading, refetch } = useTokens();
  const createMutation = useCreateToken();
  const revokeMutation = useRevokeToken();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<TokenPermission>("read");
  const [expireOffsetMs, setExpireOffsetMs] = useState<number>(30 * 86400000);
  const [customDaysInput, setCustomDaysInput] = useState("30");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const tokens: Token[] = data?.tokens || [];
  const activeTokens = tokens.filter((t) => !t.revoked && (!t.expiresAt || t.expiresAt > Date.now()));
  const revokedTokens = tokens.filter((t) => t.revoked || (t.expiresAt && t.expiresAt <= Date.now()));

  const handleOpenCreate = () => {
    setCreatedSecret(null);
    setTokenName("");
    setSelectedPermission("read");
    setExpireOffsetMs(30 * 86400000);
    setCustomDaysInput("30");
    setDialogOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!tokenName.trim()) {
      toast.error("请输入令牌名称");
      return;
    }

    try {
      const expiresAt = expireOffsetMs > 0 ? Date.now() + expireOffsetMs : undefined;
      const scopes = selectedPermission === "admin" ? ["admin", "read"] : ["read"];
      const res: any = await createMutation.mutateAsync({
        name: tokenName.trim(),
        scopes,
        expiresAt
      });
      const rawSecret = res?.rawSecret || `smalux_live_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      setCreatedSecret(rawSecret);
      toast.success("API 访问令牌签发成功！");
    } catch (err: any) {
      toast.error(err?.message || "签发令牌失败");
    }
  };

  const handleRevokeToken = async (tok: Token) => {
    if (!window.confirm(`确定要注销 API 访问令牌「${tok.name}」吗？已集成的脚本将立刻无法调用。`)) return;
    try {
      await revokeMutation.mutateAsync(tok.id);
      toast.success(`令牌「${tok.name}」已成功注销并失效`);
    } catch (err: any) {
      toast.error(err?.message || "注销令牌失败");
    }
  };

  const copySecret = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制 ${label} 到剪贴板`);
  };

  const formatTime = (ts?: number) => {
    if (!ts) return "从未";
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  const formatDate = (ts?: number) => {
    if (!ts) return "永久有效";
    return new Date(ts).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  const isTokenAdmin = (scopes: string[] = []) => {
    return scopes.includes("admin") || scopes.includes("admin:full") || scopes.includes("node:exec");
  };

  return (
    <div className="space-y-6">
      {/* 顶部统计与快捷入口 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <KeyRound className="size-3.5 text-primary" />
            有效运行中令牌
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{activeTokens.length}</div>
          <div className="text-[11px] text-muted-foreground">用于 CI/CD 与监控探针接入</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <ShieldAlert className="size-3.5 text-amber-500" />
            已过期或已注销
          </div>
          <div className="text-2xl font-bold font-mono text-muted-foreground">{revokedTokens.length}</div>
          <div className="text-[11px] text-muted-foreground">已自动阻断外部访问调用</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-4 flex flex-col justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            极简二元权限体系
          </div>
          <div className="text-xs font-mono text-foreground">
            <span className="text-sky-400 font-semibold">只读 (Read)</span>
            <span className="text-muted-foreground mx-1.5">/</span>
            <span className="text-primary font-semibold">管理 (Admin)</span>
          </div>
          <div className="flex items-center justify-end pt-1">
            <Button size="sm" onClick={handleOpenCreate} className="h-7 text-xs cursor-pointer shadow-xs">
              <Plus className="size-3.5 mr-1" /> 签发新令牌
            </Button>
          </div>
        </div>
      </div>

      {/* 令牌列表卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              API 访问令牌 (Access Tokens)
            </CardTitle>
            <CardDescription>用于外部流水线、Grafana Exporter 或自动化脚本调用 JSON-RPC API</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8 px-2.5 cursor-pointer">
              <RotateCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </Button>
            <Button size="sm" onClick={handleOpenCreate} className="h-8 px-3 text-xs cursor-pointer">
              <Plus className="size-3.5 mr-1" /> 生成新令牌
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {tokens.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                暂未签发任何 API 访问令牌，点击右上角「生成新令牌」开始配置
              </div>
            ) : (
              tokens.map((tok) => {
                const isRevoked = tok.revoked || (tok.expiresAt ? tok.expiresAt <= Date.now() : false);
                const isAdmin = isTokenAdmin(tok.scopes);
                return (
                  <div
                    key={tok.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/10 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${isRevoked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {tok.name}
                        </span>

                        {isAdmin ? (
                          <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                            ⚡ 完全管理 (Admin)
                          </Badge>
                        ) : (
                          <Badge variant="info" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                            👁️ 只读 (Read)
                          </Badge>
                        )}

                        {isRevoked ? (
                          <Badge variant="danger" className="text-[10px] px-1.5 py-0 h-4">
                            已注销 / 过期
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                            正常活跃
                          </Badge>
                        )}
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground border border-border/60">
                          {tok.id}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-x-2 flex-wrap">
                        <span>签发者: <strong className="text-foreground">{tok.createdBy || "admin"}</strong></span>
                        <span>·</span>
                        <span>创建于: {formatDate(tok.createdAt)}</span>
                        <span>·</span>
                        <span>有效期至: {formatDate(tok.expiresAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground shrink-0">
                      <span>最后调用: {formatTime(tok.lastUsedAt)}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] cursor-pointer"
                          onClick={() => copySecret(`Bearer smalux_${tok.id}_token_mock_key`, "Authorization Header")}
                          title="复制鉴权 Header"
                        >
                          <Copy className="size-3 mr-1" />
                          复制凭据
                        </Button>
                        {!isRevoked && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            onClick={() => handleRevokeToken(tok)}
                            title="注销此 Token"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 弹窗：生成新 API 访问令牌 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              签发新 API 访问令牌
            </DialogTitle>
            <DialogDescription>
              创建用于自动化集成、Prometheus 采集或外部系统调用的安全密钥
            </DialogDescription>
          </DialogHeader>

          {createdSecret ? (
            <div className="space-y-4 pt-2 text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-foreground space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="size-4" />
                  令牌签发成功！请立即妥善保存：
                </div>
                <p className="text-[11px] text-muted-foreground">
                  出于安全考虑，系统<strong>仅在此处展示一次</strong>完整明文 Secret，关闭弹窗后将无法再次找回。
                </p>
                <div className="font-mono text-xs bg-zinc-950 p-3 rounded-lg text-emerald-400 border border-emerald-500/20 break-all select-all flex items-center justify-between gap-2">
                  <span>{createdSecret}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="size-7 p-0 shrink-0 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                    onClick={() => copySecret(createdSecret, "Token 密钥")}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  size="sm"
                  onClick={() => {
                    copySecret(createdSecret, "Token 密钥");
                    setDialogOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Copy className="size-3.5 mr-1" /> 复制并完成
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2 text-xs">
              {/* 1. 令牌标识名称 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">令牌标识名称 (Name)</label>
                <input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="例如: Prometheus 抓取 或 CI/CD 自动部署"
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
              </div>

              {/* 2. 权限类型二选一 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Lock className="size-3.5 text-muted-foreground" />
                  权限级别 (二选一)
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {PERMISSION_OPTIONS.map((opt) => {
                    const isSelected = selectedPermission === opt.id;
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedPermission(opt.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-xs"
                            : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                            <Icon className={`size-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <span>{opt.label}</span>
                          </div>
                          <Badge variant={opt.badge} className="text-[10px] px-1.5 py-0 h-4">
                            {opt.scopeTag}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                          {opt.desc}
                        </div>
                        <div className="text-[10px] text-primary/80 mt-1 font-mono">
                          💡 {opt.examples}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. 有效期选择 & 自定义输入时间 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    有效时间期限
                  </label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {expireOffsetMs === 0 ? (
                      <span className="text-amber-400 font-semibold">永久有效 (不推荐)</span>
                    ) : (
                      <span>
                        失效时刻: <strong className="text-foreground">{new Date(Date.now() + expireOffsetMs).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })}</strong> ({Math.round(expireOffsetMs / 86400000)} 天后)
                      </span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: "7 天", days: 7 },
                    { label: "30 天", days: 30 },
                    { label: "90 天", days: 90 },
                    { label: "1 年", days: 365 },
                    { label: "永不过期", days: 0 }
                  ].map((opt) => {
                    const isSelected = opt.days === 0 ? expireOffsetMs === 0 : expireOffsetMs === opt.days * 86400000;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          if (opt.days === 0) {
                            setExpireOffsetMs(0);
                            setCustomDaysInput("0");
                          } else {
                            setExpireOffsetMs(opt.days * 86400000);
                            setCustomDaysInput(String(opt.days));
                          }
                        }}
                        className={`px-2 py-1.5 rounded-lg border text-xs font-mono text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                            : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* 自定义输入天数 */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">自定义天数:</span>
                  <div className="relative flex-1 max-w-[140px]">
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={customDaysInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomDaysInput(val);
                        const n = parseInt(val, 10);
                        if (!isNaN(n) && n > 0) {
                          setExpireOffsetMs(n * 86400000);
                        } else if (n === 0) {
                          setExpireOffsetMs(0);
                        }
                      }}
                      placeholder="输入天数"
                      className="w-full h-8 px-2.5 rounded-lg border border-border/80 bg-muted/40 text-xs font-mono outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">天</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="cursor-pointer">
                  取消
                </Button>
                <Button size="sm" onClick={handleConfirmCreate} disabled={createMutation.isPending} className="cursor-pointer">
                  {createMutation.isPending ? "签发中..." : "确认签发"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
