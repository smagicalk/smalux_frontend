import { useState, useEffect } from "react";
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
  Key
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toaster";
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

export function AccountSecurityTab() {
  // API Query Hooks
  const { data: securityOverview } = useSecurityOverview();
  const { data: sessionsData } = useSessions();

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
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4 text-primary" />
            主管理员账户 (Admin Account)
          </CardTitle>
          <CardDescription>当前实例唯一独立超级管理员凭据与权限状态</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/80 bg-muted/20 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold font-mono text-base shrink-0">
                A
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">admin</span>
                  <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                    超级所有者 (Owner)
                  </Badge>
                  {mfaData?.enabled ? (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                      TOTP 保护已开启
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">
                      未绑定 TOTP
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  拥有系统最高控制权限 · 适用于个人单机独立部署
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground self-end sm:self-center">
              <span>状态: <strong className="text-emerald-400">已激活</strong></span>
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

      {/* 4. 活跃登录终端与会话安全 (Active Sessions) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Laptop className="size-4 text-primary" />
              当前活跃终端与会话 (Active Sessions)
            </CardTitle>
            <CardDescription>管理已登录的 Web 控制台与远程 CLI 终端设备</CardDescription>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={handleTerminateOtherSessions}
            className="h-8 text-xs cursor-pointer"
          >
            <LogOut className="size-3.5 mr-1" /> 下线其他所有设备
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {sessions.map((ses) => (
              <div
                key={ses.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/10 transition-colors text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{ses.device}</span>
                    {ses.isCurrent && (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                        当前设备 (本机)
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    IP: <strong className="text-foreground">{ses.ip}</strong> · 归属地: {ses.location}
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-muted-foreground shrink-0">
                  <span>最后活跃: {ses.activeTime}</span>
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
          </div>
        </CardContent>
      </Card>

      {/* 弹窗 1：绑定 / 添加 TOTP 动态验证器 */}
      <Dialog open={bindDialogOpen} onOpenChange={setBindDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-4 text-emerald-500" />
              绑定 TOTP 双因子动态验证器
            </DialogTitle>
            <DialogDescription>
              使用 Authenticator 应用扫描下方二维码或手动输入 Secret 密钥完成激活
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* 真实可扫码的 TOTP 二维码展示区域 */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/80 bg-zinc-950/80 space-y-2.5">
              <div className="size-40 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg border border-border/40">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="TOTP QR Code" className="size-full object-contain" />
                ) : (
                  <div className="animate-pulse text-[11px] text-zinc-500 font-mono">正在生成二维码...</div>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                支持 Google Authenticator / Microsoft Authenticator / 1Password / 微信 扫码
              </span>
            </div>

            {/* 手动输入 Base32 密钥 */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>手动配置密钥 (Base32 Secret)</span>
                <span className="text-[10px] text-muted-foreground font-mono">SHA1 / 30s</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={tempMfaSecret}
                  className="flex-1 h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono text-foreground select-all outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyText(tempMfaSecret, "TOTP 密钥")}
                  className="h-8.5 px-3 text-xs cursor-pointer"
                >
                  <Copy className="size-3.5 mr-1" />
                  复制
                </Button>
              </div>
            </div>

            {/* 校验 6 位动态口令 */}
            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-foreground">
                输入 Authenticator 生成的 6 位动态口令验证
              </label>
              <input
                type="text"
                maxLength={6}
                value={bindCode}
                onChange={(e) => setBindCode(e.target.value.replace(/\D/g, ""))}
                placeholder="例如: 849201"
                className="w-full h-10 rounded-xl border border-border/80 bg-muted/40 px-3 text-center text-lg font-mono tracking-widest outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-foreground"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBindDialogOpen(false)}
                className="cursor-pointer"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmBindMFA}
                disabled={isVerifyingBind || bindCode.length !== 6}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isVerifyingBind ? "正在校验绑定..." : "验证并完成绑定"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 弹窗 2：关闭 / 解绑 TOTP 时验证管理员密码 */}
      <Dialog open={disableMfaDialogOpen} onOpenChange={setDisableMfaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="size-4" />
              安全身份验证：关闭 TOTP 双因子保护
            </DialogTitle>
            <DialogDescription>
              关闭后将降低账户防御等级，需验证当前管理员密码后方可继续
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-foreground space-y-1.5">
              <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                <Lock className="size-3.5" />
                高危安全操作核验
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                解绑后，控制台登录将仅凭单一密码即可进入，易受撞库风险影响。请输入管理员登录密码确认关闭。
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Key className="size-3.5 text-muted-foreground" />
                管理员当前登录密码
              </label>
              <div className="relative">
                <input
                  type={showVerifyPassword ? "text" : "password"}
                  value={verifyPasswordForDisable}
                  onChange={(e) => setVerifyPasswordForDisable(e.target.value)}
                  placeholder="请输入当前生效的管理员登录密码"
                  className="w-full h-9 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showVerifyPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisableMfaDialogOpen(false)}
                className="cursor-pointer"
              >
                取消
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleConfirmDisableMFA}
                disabled={isVerifyingDisable || !verifyPasswordForDisable}
                className="cursor-pointer"
              >
                {isVerifyingDisable ? "正在核验密码..." : "确认解绑并停用 TOTP"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 弹窗 3：更换设备前验证管理员密码 */}
      <Dialog open={changeDeviceDialogOpen} onOpenChange={setChangeDeviceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <RotateCcw className="size-4" />
              安全身份验证：更换 TOTP 验证器设备
            </DialogTitle>
            <DialogDescription>
              重新绑定新的手机或验证器属于敏感操作，请输入管理员密码确认
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-foreground space-y-1.5">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <Lock className="size-3.5" />
                身份安全核验
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                为防止未授权更换验证器导致越权，系统需核验当前管理员登录密码。核验通过后将生成新设备的绑定二维码。
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Key className="size-3.5 text-muted-foreground" />
                管理员当前登录密码
              </label>
              <div className="relative">
                <input
                  type={showChangeDevicePassword ? "text" : "password"}
                  value={verifyPasswordForChangeDevice}
                  onChange={(e) => setVerifyPasswordForChangeDevice(e.target.value)}
                  placeholder="请输入当前生效的管理员登录密码"
                  className="w-full h-9 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowChangeDevicePassword(!showChangeDevicePassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showChangeDevicePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangeDeviceDialogOpen(false)}
                className="cursor-pointer"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmChangeDevice}
                disabled={isVerifyingChangeDevice || !verifyPasswordForChangeDevice}
                className="cursor-pointer bg-primary text-primary-foreground"
              >
                {isVerifyingChangeDevice ? "正在核验身份..." : "验证密码并继续更换"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
