import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  User,
  LogOut,
  Laptop,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  QrCode,
  RotateCcw,
  AlertTriangle,
  Key,
  Zap,
  Calendar,
  RotateCw,
  ShieldAlert,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Camera,
  Mail,
  Shield
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toaster";
import { useAdminProfileStore } from "@/shared/stores/admin-profile-store";
import {
  useSecurityOverview,
  useSetupTotp,
  useVerifyTotp,
  useDisableTotp,
  useChangePassword,
  useSessions,
  useTerminateSession,
  useTerminateOtherSessions
} from "@/features/settings/hooks/use-security";
import { useTokens, useCreateToken, useRevokeToken } from "../hooks/use-tokens";
import type { Token } from "@/shared/api/methods";

/** 令牌权限类型：只读 | 完全管理 */
type TokenPermission = "read" | "admin";

/** 权限选项配置（只读 / 管理） */
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

export function AccountSecurityTab() {
  // ─── 管理员全局档案 Store ───
  const adminProfile = useAdminProfileStore();
  const [accountUsername, setAccountUsername] = useState(adminProfile.username);
  const [accountNickname, setAccountNickname] = useState(adminProfile.nickname);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAccountUsername(adminProfile.username);
    setAccountNickname(adminProfile.nickname);
  }, [adminProfile.username, adminProfile.nickname]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("头像文件大小请不要超过 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      adminProfile.setAvatarUrl(base64);
      toast.success("管理员头像已成功更新并实时全站生效！");
    };
    reader.onerror = () => {
      toast.error("读取图片文件失败");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAccountInfo = () => {
    if (!accountUsername.trim()) {
      toast.error("管理员登录账号不能为空");
      return;
    }
    adminProfile.updateProfile({
      username: accountUsername.trim(),
      nickname: accountNickname.trim()
    });
    toast.success("管理员账号配置已成功保存！");
  };

  // ─── 账户安全 API Hooks ───
  const { data: securityOverview } = useSecurityOverview();
  const { data: sessionsData } = useSessions();

  // ─── API 访问令牌 Hooks ───
  const { data: tokensData, isLoading: isTokensLoading, refetch: refetchTokens } = useTokens();
  const createTokenMutation = useCreateToken();
  const revokeTokenMutation = useRevokeToken();

  const mfaData = securityOverview?.mfaEnabled
    ? {
        enabled: true,
        deviceName: securityOverview.mfaDeviceName || "Google / Microsoft Authenticator (主设备)",
        boundAt: securityOverview.mfaBoundAt || "2026-08-20 10:24",
        secret: securityOverview.mfaSecret || "JBSWY3DPEHPK3PXP"
      }
    : null;

  const sessions = sessionsData?.sessions || [];

  // API Mutation Hooks
  const setupTotpMutation = useSetupTotp();
  const verifyTotpMutation = useVerifyTotp();
  const disableTotpMutation = useDisableTotp();
  const changePasswordMutation = useChangePassword();
  const terminateSessionMutation = useTerminateSession();
  const terminateOtherSessionsMutation = useTerminateOtherSessions();

  // 修改密码表单
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaCodeForPassword, setMfaCodeForPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 密码可见性切换
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 绑定 MFA 弹窗状态与真实 QR Code DataURL
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [bindCode, setBindCode] = useState("");
  const [isVerifyingBind, setIsVerifyingBind] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [tempMfaSecret, setTempMfaSecret] = useState("JBSWY3DPEHPK3PXP");

  // 关闭 / 解绑 MFA 安全验证密码弹窗
  const [disableMfaDialogOpen, setDisableMfaDialogOpen] = useState(false);
  const [verifyPasswordForDisable, setVerifyPasswordForDisable] = useState("");
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [isVerifyingDisable, setIsVerifyingDisable] = useState(false);

  // 更换 MFA 设备安全验证密码弹窗
  const [changeDeviceDialogOpen, setChangeDeviceDialogOpen] = useState(false);
  const [verifyPasswordForChangeDevice, setVerifyPasswordForChangeDevice] = useState("");
  const [showChangeDevicePassword, setShowChangeDevicePassword] = useState(false);
  const [isVerifyingChangeDevice, setIsVerifyingChangeDevice] = useState(false);

  // ─── API 访问令牌 State ───
  /** 签发令牌弹窗是否打开 */
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  /** 新令牌名称输入 */
  const [tokenName, setTokenName] = useState("");
  /** 已选权限级别 */
  const [selectedPermission, setSelectedPermission] = useState<TokenPermission>("read");
  /** 有效期偏移量（毫秒），0 表示永不过期 */
  const [tokenExpireMs, setTokenExpireMs] = useState<number>(30 * 86400000);
  /** 自定义天数输入框 */
  const [customDaysInput, setCustomDaysInput] = useState("30");
  /** 新签发成功后的明文 Secret，仅展示一次 */
  const [createdTokenSecret, setCreatedTokenSecret] = useState<string | null>(null);

  /** 令牌列表（全部） */
  const allTokens: Token[] = tokensData?.tokens || [];
  /** 有效令牌 */
  const activeTokens = allTokens.filter((t) => !t.revoked && (!t.expiresAt || t.expiresAt > Date.now()));
  /** 已注销或过期令牌 */
  const revokedTokens = allTokens.filter((t) => t.revoked || (t.expiresAt && t.expiresAt <= Date.now()));

  // ─── 令牌搜索、筛选与分页 ───
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const [tokenStatusFilter, setTokenStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [tokenPage, setTokenPage] = useState(1);
  const TOKEN_PAGE_SIZE = 5;

  const filteredTokens = allTokens.filter((tok) => {
    const isRevoked = tok.revoked || (tok.expiresAt ? tok.expiresAt <= Date.now() : false);
    if (tokenStatusFilter === "active" && isRevoked) return false;
    if (tokenStatusFilter === "revoked" && !isRevoked) return false;

    if (tokenSearchQuery.trim()) {
      const q = tokenSearchQuery.trim().toLowerCase();
      const nameMatch = tok.name.toLowerCase().includes(q);
      const idMatch = tok.id.toLowerCase().includes(q);
      const creatorMatch = (tok.createdBy || "").toLowerCase().includes(q);
      const scopeMatch = (tok.scopes || []).some((s) => s.toLowerCase().includes(q));
      return nameMatch || idMatch || creatorMatch || scopeMatch;
    }
    return true;
  });

  const totalTokenPages = Math.max(1, Math.ceil(filteredTokens.length / TOKEN_PAGE_SIZE));
  const currentPageTokens = filteredTokens.slice((tokenPage - 1) * TOKEN_PAGE_SIZE, tokenPage * TOKEN_PAGE_SIZE);

  // ─── 活跃会话搜索与分页 ───
  const [sessionSearchQuery, setSessionSearchQuery] = useState("");
  const [sessionPage, setSessionPage] = useState(1);
  const SESSION_PAGE_SIZE = 5;

  const filteredSessions = sessions.filter((ses) => {
    if (sessionSearchQuery.trim()) {
      const q = sessionSearchQuery.trim().toLowerCase();
      const devMatch = ses.device.toLowerCase().includes(q);
      const ipMatch = ses.ip.toLowerCase().includes(q);
      const locMatch = ses.location.toLowerCase().includes(q);
      return devMatch || ipMatch || locMatch;
    }
    return true;
  });

  const totalSessionPages = Math.max(1, Math.ceil(filteredSessions.length / SESSION_PAGE_SIZE));
  const currentPageSessions = filteredSessions.slice((sessionPage - 1) * SESSION_PAGE_SIZE, sessionPage * SESSION_PAGE_SIZE);

  /** 打开签发令牌弹窗，重置表单 */
  const handleOpenCreateToken = () => {
    setCreatedTokenSecret(null);
    setTokenName("");
    setSelectedPermission("read");
    setTokenExpireMs(30 * 86400000);
    setCustomDaysInput("30");
    setTokenDialogOpen(true);
  };

  /** 确认签发令牌，调用 API 并展示明文 Secret */
  const handleConfirmCreateToken = async () => {
    if (!tokenName.trim()) {
      toast.error("请输入令牌名称");
      return;
    }
    try {
      const expiresAt = tokenExpireMs > 0 ? Date.now() + tokenExpireMs : undefined;
      const scopes = selectedPermission === "admin" ? ["admin", "read"] : ["read"];
      const res: any = await createTokenMutation.mutateAsync({ name: tokenName.trim(), scopes, expiresAt });
      const rawSecret = res?.rawSecret || `smalux_live_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      setCreatedTokenSecret(rawSecret);
      toast.success("API 访问令牌签发成功！");
    } catch (err: any) {
      toast.error(err?.message || "签发令牌失败");
    }
  };

  /** 注销指定令牌 */
  const handleRevokeToken = async (tok: Token) => {
    if (!window.confirm(`确定要注销 API 访问令牌「${tok.name}」吗？已集成的脚本将立刻无法调用。`)) return;
    try {
      await revokeTokenMutation.mutateAsync(tok.id);
      toast.success(`令牌「${tok.name}」已成功注销并失效`);
    } catch (err: any) {
      toast.error(err?.message || "注销令牌失败");
    }
  };

  /** 复制文本到剪贴板并提示 */
  const copyTokenText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制 ${label} 到剪贴板`);
  };

  /** 格式化相对时间（令牌最后使用时间） */
  const formatTokenTime = (ts?: number) => {
    if (!ts) return "从未";
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  /** 格式化日期（令牌有效期） */
  const formatTokenDate = (ts?: number) => {
    if (!ts) return "永久有效";
    return new Date(ts).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  /** 判断令牌是否具有管理员权限 */
  const isTokenAdmin = (scopes: string[] = []) =>
    scopes.includes("admin") || scopes.includes("admin:full") || scopes.includes("node:exec");

  useEffect(() => {
    if (bindDialogOpen) {
      setupTotpMutation.mutateAsync().then((res) => {
        setTempMfaSecret(res.secret);
        QRCode.toDataURL(res.otpauthUrl, {
          margin: 1,
          width: 180,
          color: {
            dark: "#09090b",
            light: "#ffffff"
          }
        })
          .then((url) => setQrDataUrl(url))
          .catch(() => {});
      }).catch(() => {});
    }
  }, [bindDialogOpen]);

  // 生成强密码
  const generateStrongPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    navigator.clipboard.writeText(pwd);
    toast.success("已生成 16 位强随机密码并自动复制到剪贴板！");
  };

  // 修改管理员密码（开启 TOTP 时必须校验 TOTP）
  const handlePasswordChange = async () => {
    if (!oldPassword) {
      toast.error("请输入当前旧密码");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("新密码长度不能少于 8 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }

    if (mfaData?.enabled) {
      if (!mfaCodeForPassword.trim() || mfaCodeForPassword.trim().length !== 6) {
        toast.error("当前已启用 TOTP 双因子保护，必须输入 6 位动态验证码");
        return;
      }
    }

    setIsChangingPassword(true);
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
        mfaCode: mfaCodeForPassword.trim() || undefined
      });
      setIsChangingPassword(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMfaCodeForPassword("");
      toast.success("管理员密码修改成功！下次登录请使用新密码。");
    } catch (err: any) {
      setIsChangingPassword(false);
      toast.error(err.message || "修改密码失败");
    }
  };

  // 开启/添加 TOTP 弹窗
  const handleOpenBindDialog = () => {
    setBindCode("");
    setBindDialogOpen(true);
  };

  // 确认完成绑定 TOTP
  const handleConfirmBindMFA = async () => {
    if (bindCode.trim().length !== 6) {
      toast.error("请输入 Authenticator 上的 6 位数字动态验证码");
      return;
    }

    setIsVerifyingBind(true);
    try {
      await verifyTotpMutation.mutateAsync(bindCode.trim());
      setIsVerifyingBind(false);
      setBindDialogOpen(false);
      toast.success("TOTP 双因子安全验证器绑定成功！账户已受最高等级保护。");
    } catch (err: any) {
      setIsVerifyingBind(false);
      toast.error(err.message || "校验验证码失败");
    }
  };

  // 触发解绑 / 关闭 TOTP 流程（唤起密码验证弹窗）
  const handleTriggerDisableMFA = () => {
    setVerifyPasswordForDisable("");
    setDisableMfaDialogOpen(true);
  };

  // 校验管理员密码后确认关闭 TOTP
  const handleConfirmDisableMFA = async () => {
    if (!verifyPasswordForDisable.trim()) {
      toast.error("请输入当前管理员登录密码进行安全身份确认");
      return;
    }

    setIsVerifyingDisable(true);
    try {
      await disableTotpMutation.mutateAsync(verifyPasswordForDisable.trim());
      setIsVerifyingDisable(false);
      setDisableMfaDialogOpen(false);
      setVerifyPasswordForDisable("");
      toast.success("密码身份校验通过，已成功关闭并解绑 TOTP 双因子认证");
    } catch (err: any) {
      setIsVerifyingDisable(false);
      toast.error(err.message || "关闭 TOTP 失败");
    }
  };

  // 点击「更换设备」触发密码核验
  const handleTriggerChangeDevice = () => {
    setVerifyPasswordForChangeDevice("");
    setChangeDeviceDialogOpen(true);
  };

  // 密码核验通过，继续打开绑定新设备弹窗
  const handleConfirmChangeDevice = () => {
    if (!verifyPasswordForChangeDevice.trim()) {
      toast.error("请输入当前管理员登录密码以核验身份");
      return;
    }

    setIsVerifyingChangeDevice(true);
    setTimeout(() => {
      setIsVerifyingChangeDevice(false);
      setChangeDeviceDialogOpen(false);
      setVerifyPasswordForChangeDevice("");
      toast.success("管理员身份核验通过，请使用新设备扫描二维码绑定");
      handleOpenBindDialog();
    }, 500);
  };

  const handleTerminateSingleSession = async (sessionId: string, deviceName: string) => {
    try {
      await terminateSessionMutation.mutateAsync(sessionId);
      toast.success(`已强制下线终端设备「${deviceName}」`);
    } catch (err: any) {
      toast.error("下线设备失败");
    }
  };

  const handleTerminateOtherSessions = async () => {
    try {
      const res = await terminateOtherSessionsMutation.mutateAsync();
      toast.success(`已成功强制下线其他 ${res.terminatedCount} 个外部终端会话`);
    } catch (err: any) {
      toast.error("下线其他设备失败");
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制 ${label} 到剪贴板`);
  };

  // 密码规则实时校验
  const ruleLength = newPassword.length >= 8;
  const ruleCases = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const ruleNumber = /[0-9]/.test(newPassword);
  const ruleSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, text: "未输入", color: "bg-muted", labelColor: "text-muted-foreground" };
    let score = 0;
    if (ruleLength) score += 1;
    if (ruleCases) score += 1;
    if (ruleNumber) score += 1;
    if (ruleSpecial) score += 1;

    if (score <= 1) return { score: 1, text: "较弱", color: "bg-rose-500", labelColor: "text-rose-400" };
    if (score === 2 || score === 3) return { score: 2, text: "良好", color: "bg-amber-500", labelColor: "text-amber-400" };
    if (score === 4) return { score: 3, text: "极强", color: "bg-emerald-500", labelColor: "text-emerald-400" };
    return { score: 0, text: "未输入", color: "bg-muted", labelColor: "text-muted-foreground" };
  };

  const strength = getPasswordStrength();
  const isMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  return (
    <div className="space-y-6">
      {/* 1. 主管理员身份与账户档案 (Admin Profile) */}
      <Card>
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4 text-primary" />
              主管理员账户档案 (Admin Account Profile)
            </CardTitle>
            <CardDescription>当前实例唯一独立超级管理员凭据、登录账号与自定义头像</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveAccountInfo}
              className="h-8 text-xs cursor-pointer font-bold px-4 shadow-2xs"
            >
              <Check className="size-3.5 mr-1" />
              保存账号配置
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-1 space-y-5 text-xs">
          {/* 隐藏的头像文件选择器 */}
          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={handleAvatarSelect}
          />

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 rounded-xl border border-border/80 bg-muted/20">
            {/* 头像区域 (支持点击上传 / 预览 / 移除) */}
            <div className="flex flex-col items-center sm:items-start gap-2.5 shrink-0">
              <div
                onClick={() => avatarFileInputRef.current?.click()}
                className="relative group size-18 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary bg-muted/40 flex items-center justify-center cursor-pointer transition-all overflow-hidden shadow-xs hover:shadow-md"
                title="点击上传或更换管理员头像"
              >
                {adminProfile.avatarUrl ? (
                  <img
                    src={adminProfile.avatarUrl}
                    alt={adminProfile.username}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold font-mono text-2xl">
                    {adminProfile.username.charAt(0).toUpperCase() || "A"}
                  </div>
                )}

                {/* 悬浮遮罩 */}
                <div className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-[10px] font-medium backdrop-blur-2xs">
                  <Camera className="size-4" />
                  <span>更换头像</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="h-6 px-2 text-[11px] font-mono cursor-pointer"
                >
                  <Upload className="size-2.5 mr-1" />
                  上传头像
                </Button>
                {adminProfile.avatarUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      adminProfile.setAvatarUrl(null);
                      toast.info("已重置为默认文字头像");
                    }}
                    className="h-6 px-1.5 text-[11px] font-mono text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="移除自定义头像"
                  >
                    <Trash2 className="size-2.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* 账号与身份表单 */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 登录账号名 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" />
                  管理员登录账号 (Username)
                </label>
                <input
                  type="text"
                  value={accountUsername}
                  onChange={(e) => setAccountUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-background px-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
                <div className="text-[10px] text-muted-foreground">
                  用于系统主控台登录认证凭据
                </div>
              </div>

              {/* 管理员显示昵称 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" />
                  管理员显示昵称 (Display Name)
                </label>
                <input
                  type="text"
                  value={accountNickname}
                  onChange={(e) => setAccountNickname(e.target.value)}
                  placeholder="主管理员"
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
                <div className="text-[10px] text-muted-foreground">
                  用于控制台侧栏与操作日志中的操作人展示
                </div>
              </div>

              {/* 权限级别与状态展示 */}
              <div className="sm:col-span-2 pt-1 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Shield className="size-3 text-primary" /> 身份级别:
                  </span>
                  <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                    超级所有者 (SuperAdmin · Root)
                  </Badge>
                  {mfaData?.enabled ? (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                      TOTP 保护已激活
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">
                      未绑定 TOTP
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span>支持 PNG / JPG / WebP，最大 2MB · 实时全站同步</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. TOTP 双因子安全认证 (MFA) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              TOTP 双因子安全认证 (MFA)
            </CardTitle>
            <CardDescription>使用动态身份验证器保护控制台，防范密码泄露风险</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {mfaData?.enabled ? (
              <Badge variant="success" className="text-xs px-2 py-0.5 font-mono">
                ● 已启用防护
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs px-2 py-0.5 font-mono">
                ○ 未开启保护
              </Badge>
            )}
            <Switch
              checked={Boolean(mfaData?.enabled)}
              onCheckedChange={(checked: boolean) => {
                if (checked) {
                  handleOpenBindDialog();
                } else {
                  handleTriggerDisableMFA();
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {mfaData?.enabled ? (
            /* 已绑定状态卡片 */
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                    <Smartphone className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{mfaData.deviceName}</span>
                      <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                        正常同步中
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-x-2 flex-wrap">
                      <span>算法: <strong>TOTP-SHA1</strong></span>
                      <span>·</span>
                      <span>周期: <strong>30 秒</strong></span>
                      <span>·</span>
                      <span>{mfaData.boundAt} 绑定</span>
                    </div>
                  </div>
                </div>

                {/* 仅保留更换设备操作按钮，开启/关闭由右上角 Switch 开关统一控制 */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTriggerChangeDevice}
                    className="h-8 text-xs cursor-pointer"
                  >
                    <RotateCcw className="size-3.5 mr-1" />
                    更换绑定设备
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* 未绑定状态卡片 - 带有明确的「添加 TOTP 验证器」按钮 */
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mt-0.5 shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    尚未绑定任何 TOTP 双因子动态验证器
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    强烈建议绑定 Google Authenticator、Microsoft Authenticator 或 1Password，开启后修改密码及登录均受双重保障。
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleOpenBindDialog}
                className="h-8 px-3.5 text-xs cursor-pointer shrink-0 shadow-xs bg-primary text-primary-foreground font-semibold"
              >
                <Plus className="size-3.5 mr-1" />
                添加 TOTP 验证器
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. 现代化修改管理员密码卡片 (全宽铺满) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              修改管理员登录密码
            </CardTitle>
            <CardDescription>
              定期更新高强度主控密码以保障集群基础设施安全
              {mfaData?.enabled && <span className="text-emerald-400 font-semibold ml-1.5">（已开启 TOTP 保护，提交需校验动态口令）</span>}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={generateStrongPassword}
            className="h-8 text-xs cursor-pointer bg-primary/5 hover:bg-primary/10 border-primary/30 text-primary font-medium"
            title="生成 16 位强随机密码并自动填入"
          >
            <Sparkles className="size-3.5 mr-1" />
            随机生成强密码
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-xs w-full">
          {/* 当前旧密码 */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" />
              当前旧密码
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入当前正在使用的主控台旧密码"
                className="w-full h-9 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                tabIndex={-1}
              >
                {showOldPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* 新密码与确认新密码 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-primary" />
                  新密码
                </span>
                {newPassword && (
                  <span className={`text-[11px] font-mono font-bold ${strength.labelColor}`}>
                    {strength.text}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少 8 位包含字母与数字"
                  className="w-full h-9 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-muted-foreground" />
                  确认新密码
                </span>
                {confirmPassword && (
                  <span className="text-[11px] font-mono flex items-center gap-0.5">
                    {isMatch ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Check className="size-3" /> 一致
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold">密码不一致</span>
                    )}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className={`w-full h-9 rounded-xl border bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:ring-2 text-foreground transition-all ${
                    confirmPassword && !isMatch
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-border/80 focus:border-primary focus:ring-primary/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* 若开启 TOTP，必须输入 TOTP 动态验证码 */}
          {mfaData?.enabled && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5 animate-fadeIn">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Smartphone className="size-3.5" />
                  TOTP 动态口令 (6 位验证码)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  已开启双因子保护 · 必填
                </span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={mfaCodeForPassword}
                onChange={(e) => setMfaCodeForPassword(e.target.value.replace(/\D/g, ""))}
                placeholder="请输入 Authenticator 上的 6 位实时动态验证码"
                className="w-full h-9 rounded-xl border border-emerald-500/40 bg-muted/50 px-3.5 text-xs font-mono tracking-wider outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-foreground"
              />
            </div>
          )}

          {/* 密码安全规则动态指示清单 */}
          <div className="rounded-xl border border-border/70 bg-card/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">密码强度与合规检查</span>
              <div className="flex gap-1.5 w-32">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-muted"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-muted"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-muted"}`} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
              <div className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${ruleLength ? "text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                <CheckCircle2 className={`size-3.5 ${ruleLength ? "text-emerald-400" : "text-muted-foreground/40"}`} />
                <span>8位以上</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${ruleCases ? "text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                <CheckCircle2 className={`size-3.5 ${ruleCases ? "text-emerald-400" : "text-muted-foreground/40"}`} />
                <span>大/小写字母</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${ruleNumber ? "text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                <CheckCircle2 className={`size-3.5 ${ruleNumber ? "text-emerald-400" : "text-muted-foreground/40"}`} />
                <span>包含数字</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${ruleSpecial ? "text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                <CheckCircle2 className={`size-3.5 ${ruleSpecial ? "text-emerald-400" : "text-muted-foreground/40"}`} />
                <span>特殊字符</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              onClick={handlePasswordChange}
              disabled={
                isChangingPassword ||
                !oldPassword ||
                !newPassword ||
                !isMatch ||
                (mfaData?.enabled && mfaCodeForPassword.length !== 6)
              }
              className="h-8.5 px-4 text-xs cursor-pointer shadow-xs"
            >
              {isChangingPassword ? "正在保存更新..." : "确认更新主控密码"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. API 访问令牌 (Access Tokens) - 紧凑精简设计 */}
      <Card>
        <CardHeader className="py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <KeyRound className="size-4 text-primary" />
              <CardTitle className="text-base font-bold text-foreground">
                API 访问令牌 (Access Tokens)
              </CardTitle>
              <div className="flex items-center gap-1.5 ml-1">
                <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                  {activeTokens.length} 活跃
                </Badge>
                {revokedTokens.length > 0 && (
                  <Badge variant="neutral" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                    {revokedTokens.length} 已失效
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              用于外部 CI/CD 流水线、Grafana Exporter 或自动化脚本调用 JSON-RPC API
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchTokens()}
              className="h-8 w-8 p-0 cursor-pointer"
              title="刷新令牌列表"
            >
              <RotateCw className={`size-3.5 ${isTokensLoading ? "animate-spin text-primary" : ""}`} />
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreateToken}
              className="h-8 px-3 text-xs cursor-pointer font-semibold shadow-xs"
            >
              <Plus className="size-3.5 mr-1" /> 签发新令牌
            </Button>
          </div>
        </CardHeader>

        {/* 搜索与过滤工具条 */}
        <div className="px-4 py-2.5 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          {/* 搜索输入框 */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={tokenSearchQuery}
              onChange={(e) => {
                setTokenSearchQuery(e.target.value);
                setTokenPage(1);
              }}
              placeholder="按名称、tok_ID、权限过滤..."
              className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-border/80 bg-background text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono"
            />
            {tokenSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setTokenSearchQuery("");
                  setTokenPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* 状态筛选 Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-[11px] font-mono shrink-0">
            <button
              type="button"
              onClick={() => {
                setTokenStatusFilter("all");
                setTokenPage(1);
              }}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                tokenStatusFilter === "all"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              全部 ({allTokens.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenStatusFilter("active");
                setTokenPage(1);
              }}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                tokenStatusFilter === "active"
                  ? "bg-background text-emerald-500 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              活跃 ({activeTokens.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenStatusFilter("revoked");
                setTokenPage(1);
              }}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                tokenStatusFilter === "revoked"
                  ? "bg-background text-rose-500 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              已失效 ({revokedTokens.length})
            </button>
          </div>
        </div>

        <CardContent className="p-0 flex flex-col justify-between">
          <div className="min-h-[290px] flex flex-col justify-start divide-y divide-border/60">
            {allTokens.length === 0 ? (
              <div className="min-h-[290px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground space-y-1.5 font-mono">
                <span className="text-muted-foreground/70">暂无任何 API 访问令牌记录</span>
                <button
                  type="button"
                  onClick={handleOpenCreateToken}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  + 签发第一个令牌
                </button>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="min-h-[290px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground space-y-1.5 font-mono">
                <span className="text-muted-foreground/70">
                  未匹配到相关令牌（{tokenSearchQuery || (tokenStatusFilter === "active" ? "活跃" : "已失效")}）
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTokenSearchQuery("");
                    setTokenStatusFilter("all");
                    setTokenPage(1);
                  }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  清空筛选条件
                </button>
              </div>
            ) : (
              <>
                {currentPageTokens.map((tok) => {
                  const isRevoked = tok.revoked || (tok.expiresAt ? tok.expiresAt <= Date.now() : false);
                  const isAdmin = isTokenAdmin(tok.scopes);
                  return (
                    <div
                      key={tok.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 gap-2 hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold font-mono ${isRevoked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {tok.name}
                          </span>
                          {isAdmin ? (
                            <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono">⚡ 管理</Badge>
                          ) : (
                            <Badge variant="info" className="text-[10px] px-1.5 py-0 h-4 font-mono">👁️ 只读</Badge>
                          )}
                          {isRevoked ? (
                            <Badge variant="danger" className="text-[10px] px-1.5 py-0 h-4">已注销</Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">活跃</Badge>
                          )}
                          <span className="rounded bg-muted/70 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground border border-border/50">
                            {tok.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-x-2 flex-wrap">
                          <span>创建: {formatTokenDate(tok.createdAt)}</span>
                          <span>·</span>
                          <span>有效期: {formatTokenDate(tok.expiresAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground shrink-0 self-end sm:self-center">
                        <span className="text-[11px]">最后调用: {formatTokenTime(tok.lastUsedAt)}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] cursor-pointer"
                            onClick={() => copyTokenText(`Bearer smalux_${tok.id}_token_mock_key`, "Authorization Header")}
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
                })}

                {/* 简洁小字提示已完/没有更多 */}
                {currentPageTokens.length < TOKEN_PAGE_SIZE && (
                  <div className="py-4 text-center text-[11px] text-muted-foreground/50 font-mono select-none">
                    — 没有更多数据了 —
                  </div>
                )}
              </>
            )}
          </div>

          {/* 分页控制栏 */}
          {filteredTokens.length > 0 && (
            <div className="px-4 py-2 border-t border-border/60 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground font-mono">
              <div>
                共 <strong>{filteredTokens.length}</strong> 个令牌
                {totalTokenPages > 1 && (
                  <span> · 第 <strong className="text-foreground">{tokenPage}</strong> / {totalTokenPages} 页</span>
                )}
              </div>
              {totalTokenPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={tokenPage <= 1}
                    onClick={() => setTokenPage((p) => Math.max(1, p - 1))}
                    className="h-6.5 px-2 text-[11px] cursor-pointer"
                  >
                    <ChevronLeft className="size-3 mr-0.5" /> 上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={tokenPage >= totalTokenPages}
                    onClick={() => setTokenPage((p) => Math.min(totalTokenPages, p + 1))}
                    className="h-6.5 px-2 text-[11px] cursor-pointer"
                  >
                    下一页 <ChevronRight className="size-3 ml-0.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. 活跃登录终端与会话安全 (Active Sessions) - 移至最底部 */}
      <Card>
        <CardHeader className="py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Laptop className="size-4 text-primary" />
              <CardTitle className="text-base font-bold text-foreground">
                当前活跃终端与会话 (Active Sessions)
              </CardTitle>
              <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono ml-1">
                {sessions.length} 在线
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              管理已登录的 Web 控制台与远程 CLI 终端设备
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={handleTerminateOtherSessions}
            className="h-8 text-xs cursor-pointer shrink-0 font-semibold shadow-xs"
          >
            <LogOut className="size-3.5 mr-1" /> 下线其他所有设备
          </Button>
        </CardHeader>

        {/* 搜索工具条 */}
        <div className="px-4 py-2.5 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={sessionSearchQuery}
              onChange={(e) => {
                setSessionSearchQuery(e.target.value);
                setSessionPage(1);
              }}
              placeholder="按设备名称、IP 地址、地理归属地搜索..."
              className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-border/80 bg-background text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono"
            />
            {sessionSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSessionSearchQuery("");
                  setSessionPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground font-mono">
            已连接终端: <strong className="text-foreground">{sessions.length}</strong> 台
          </div>
        </div>

        <CardContent className="p-0 flex flex-col justify-between">
          <div className="min-h-[290px] flex flex-col justify-start divide-y divide-border/60">
            {sessions.length === 0 ? (
              <div className="min-h-[290px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground space-y-1.5 font-mono">
                <span className="text-muted-foreground/70">当前暂无活跃终端会话记录</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="min-h-[290px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground space-y-1.5 font-mono">
                <span className="text-muted-foreground/70">
                  未匹配到相关终端会话（{sessionSearchQuery}）
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSessionSearchQuery("");
                    setSessionPage(1);
                  }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  清空搜索条件
                </button>
              </div>
            ) : (
              <>
                {currentPageSessions.map((ses) => (
                  <div
                    key={ses.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 gap-2 hover:bg-muted/10 transition-colors text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-xs">{ses.device}</span>
                        {ses.isCurrent && (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                            当前设备 (本机)
                          </Badge>
                        )}
                        <span className="rounded bg-muted/70 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground border border-border/50">
                          {ses.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-x-2 flex-wrap">
                        <span>IP: <strong className="text-foreground">{ses.ip}</strong></span>
                        <span>·</span>
                        <span>归属地: {ses.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-muted-foreground shrink-0 self-end sm:self-center">
                      <span className="text-[11px]">最后活跃: {ses.activeTime}</span>
                      {!ses.isCurrent ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTerminateSingleSession(ses.id, ses.device)}
                          className="h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30 cursor-pointer"
                        >
                          <LogOut className="size-3 mr-1" />
                          强制下线
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-500/80 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          在线中
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* 简洁小字提示已完/没有更多 */}
                {currentPageSessions.length < SESSION_PAGE_SIZE && (
                  <div className="py-4 text-center text-[11px] text-muted-foreground/50 font-mono select-none">
                    — 没有更多会话了 —
                  </div>
                )}
              </>
            )}
          </div>

          {/* 分页控制栏 */}
          {filteredSessions.length > 0 && (
            <div className="px-4 py-2 border-t border-border/60 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground font-mono">
              <div>
                共 <strong>{filteredSessions.length}</strong> 个终端
                {totalSessionPages > 1 && (
                  <span> · 第 <strong className="text-foreground">{sessionPage}</strong> / {totalSessionPages} 页</span>
                )}
              </div>
              {totalSessionPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sessionPage <= 1}
                    onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                    className="h-6.5 px-2 text-[11px] cursor-pointer"
                  >
                    <ChevronLeft className="size-3 mr-0.5" /> 上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sessionPage >= totalSessionPages}
                    onClick={() => setSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                    className="h-6.5 px-2 text-[11px] cursor-pointer"
                  >
                    下一页 <ChevronRight className="size-3 ml-0.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 弹窗：签发新 API 访问令牌 */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
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

          {createdTokenSecret ? (
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
                  <span>{createdTokenSecret}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="size-7 p-0 shrink-0 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                    onClick={() => copyTokenText(createdTokenSecret, "Token 密钥")}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  size="sm"
                  onClick={() => {
                    copyTokenText(createdTokenSecret, "Token 密钥");
                    setTokenDialogOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Copy className="size-3.5 mr-1" /> 复制并完成
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2 text-xs">
              {/* 令牌名称 */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">令牌标识名称 (Name)</label>
                <input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="例如: Prometheus 抓取 或 CI/CD 自动部署"
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
              </div>

              {/* 权限选择 */}
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
                          <Badge variant={opt.badge} className="text-[10px] px-1.5 py-0 h-4">{opt.scopeTag}</Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{opt.desc}</div>
                        <div className="text-[10px] text-primary/80 mt-1 font-mono">💡 {opt.examples}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 有效期 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    有效时间期限
                  </label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {tokenExpireMs === 0 ? (
                      <span className="text-amber-400 font-semibold">永久有效 (不推荐)</span>
                    ) : (
                      <span>失效时刻: <strong className="text-foreground">{new Date(Date.now() + tokenExpireMs).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })}</strong> ({Math.round(tokenExpireMs / 86400000)} 天后)</span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[{ label: "7 天", days: 7 }, { label: "30 天", days: 30 }, { label: "90 天", days: 90 }, { label: "1 年", days: 365 }, { label: "永不过期", days: 0 }].map((opt) => {
                    const isSelected = opt.days === 0 ? tokenExpireMs === 0 : tokenExpireMs === opt.days * 86400000;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          if (opt.days === 0) { setTokenExpireMs(0); setCustomDaysInput("0"); }
                          else { setTokenExpireMs(opt.days * 86400000); setCustomDaysInput(String(opt.days)); }
                        }}
                        className={`px-2 py-1.5 rounded-lg border text-xs font-mono text-center transition-all cursor-pointer ${
                          isSelected ? "border-primary bg-primary/10 text-primary font-bold shadow-xs" : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">自定义天数:</span>
                  <input
                    type="number" min="1" max="3650"
                    value={customDaysInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDaysInput(val);
                      const n = parseInt(val, 10);
                      if (!isNaN(n) && n > 0) setTokenExpireMs(n * 86400000);
                      else if (n === 0) setTokenExpireMs(0);
                    }}
                    placeholder="输入天数"
                    className="w-[120px] h-8 px-2.5 rounded-lg border border-border/80 bg-muted/40 text-xs font-mono outline-none focus:border-primary text-foreground"
                  />
                  <span className="text-xs text-muted-foreground font-mono">天</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={() => setTokenDialogOpen(false)} className="cursor-pointer">取消</Button>
                <Button size="sm" onClick={handleConfirmCreateToken} disabled={createTokenMutation.isPending} className="cursor-pointer">
                  {createTokenMutation.isPending ? "签发中..." : "确认签发"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
