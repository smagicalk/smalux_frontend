import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Lock,
  User,
  Smartphone,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import { useAuthModalStore } from "@/shared/stores/auth-modal-store";
import { useAdminProfileStore } from "@/shared/stores/admin-profile-store";
import { settingsMockEngine } from "@/features/settings/mock/settings-mock";

export function GlobalLoginModal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isOpen,
    mode,
    title,
    description,
    isBlocking,
    lockUsername,
    step,
    closeLoginModal,
    setStep,
    setTempAuthData,
    triggerSuccess
  } = useAuthModalStore();

  const adminProfile = useAdminProfileStore();

  // 表单状态
  const [username, setUsername] = useState(adminProfile.username || "admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // TOTP 6 位输入框状态
  const [totpDigits, setTotpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const totpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 弹窗打开时重置状态
  useEffect(() => {
    if (isOpen) {
      setUsername(adminProfile.username || "admin");
      setPassword("");
      setShowPassword(false);
      setErrorMessage("");
      setTotpDigits(["", "", "", "", "", ""]);
      setIsLoading(false);
    }
  }, [isOpen, adminProfile.username]);

  // 当进入 TOTP 阶段时，自动聚焦到第一个输入框
  useEffect(() => {
    if (isOpen && step === "totp") {
      setTimeout(() => {
        totpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, step]);

  // 监听 ESC 键关闭（非阻断模式下）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isBlocking) {
        closeLoginModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBlocking, closeLoginModal]);

  if (!isOpen || !mounted) return null;

  // 动态自适应标题与描述文案
  const isSudoReauth = lockUsername || !isBlocking || mode === "totp_only";
  const displayTitle = title || (isSudoReauth ? "管理员安全二次验证" : "smalux 控制台登录");
  const displayDescription =
    description ||
    (step === "totp"
      ? "已开启 TOTP 双因子保护，请输入 6 位动态安全口令"
      : isSudoReauth
        ? "正在执行安全敏感操作，请验证管理员密码以继续"
        : "请输入管理员账号与密码以访问控制台");

  // ─── 第一步：账号密码登录验证 ───
  const handleCredentialsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (!username.trim()) {
      setErrorMessage("请输入管理员登录账号");
      return;
    }
    if (!password) {
      setErrorMessage("请输入登录密码");
      return;
    }

    setIsLoading(true);

    try {
      // 模拟网络请求延迟
      await new Promise((res) => setTimeout(res, 400));

      // 查询系统是否开启了 TOTP 双因子保护
      const securityOverview = settingsMockEngine.getSecurityOverview();
      const isMfaEnabled = Boolean(securityOverview?.mfaEnabled);

      if (isMfaEnabled) {
        // 开启了 TOTP：暂存状态并平滑过渡到第二步
        setTempAuthData({ username: username.trim() });
        setStep("totp");
        toast.info("检测到已开启 TOTP 双因子保护，请输入 6 位动态口令");
      } else {
        // 未开启 TOTP：直接完成登录
        completeLogin(username.trim());
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "账号或密码错误，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 第二步：TOTP 动态口令校验 ───
  const handleTotpSubmit = async (fullCode?: string) => {
    const code = fullCode || totpDigits.join("");
    setErrorMessage("");

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setErrorMessage("请输入有效的 6 位数字验证码");
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((res) => setTimeout(res, 350));
      // 模拟校验成功
      completeLogin(username, true);
    } catch (err: any) {
      setErrorMessage(err?.message || "TOTP 动态口令验证失败，请核对时间后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 写入登录 Session 并触发成功
  const completeLogin = (userName: string, usedTotp = false) => {
    try {
      const mockToken = `smalux_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("smalux_auth_token", mockToken);
      localStorage.setItem(
        "smalux_user_session",
        JSON.stringify({
          username: userName,
          role: "SuperAdmin",
          loginAt: Date.now(),
          usedTotp
        })
      );
    } catch {}

    toast.success(usedTotp ? "TOTP 双因子验证成功，欢迎回来！" : "登录成功，欢迎回来！");
    triggerSuccess();
  };

  // 处理 TOTP 单格输入与自动跳转
  const handleDigitChange = (index: number, val: string) => {
    const numericVal = val.replace(/\D/g, "");
    if (!numericVal) {
      const newDigits = [...totpDigits];
      newDigits[index] = "";
      setTotpDigits(newDigits);
      return;
    }

    // 若粘贴了多个数字（如完整 6 位口令）
    if (numericVal.length > 1) {
      const splitDigits = numericVal.slice(0, 6).split("");
      const newDigits = [...totpDigits];
      splitDigits.forEach((char, i) => {
        newDigits[i] = char;
      });
      setTotpDigits(newDigits);
      const nextFocus = Math.min(splitDigits.length, 5);
      totpInputRefs.current[nextFocus]?.focus();

      if (splitDigits.length === 6) {
        handleTotpSubmit(splitDigits.join(""));
      }
      return;
    }

    // 输入单个字符
    const newDigits = [...totpDigits];
    newDigits[index] = numericVal;
    setTotpDigits(newDigits);

    // 自动聚焦下一个输入框
    if (index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }

    // 如果填满 6 位，自动触发提交
    if (index === 5 && newDigits.every((d) => d !== "")) {
      handleTotpSubmit(newDigits.join(""));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !totpDigits[index] && index > 0) {
      totpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleTotpSubmit();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* 登录卡片容器 */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
        {/* 右上角关闭按钮（仅非强制模式可用） */}
        {!isBlocking && (
          <button
            type="button"
            onClick={closeLoginModal}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="关闭窗口 (ESC)"
          >
            <X className="size-4" />
          </button>
        )}

        {/* 顶部 Logo 与系统标识 */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="relative flex size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
            {adminProfile.avatarUrl ? (
              <img
                src={adminProfile.avatarUrl}
                alt={username}
                className="size-full rounded-2xl object-cover"
              />
            ) : (
              <span>{username.charAt(0).toUpperCase() || "S"}</span>
            )}
            <span className="absolute -bottom-1 -right-1 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              <span>{displayTitle}</span>
              {!isSudoReauth && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                  Console
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {displayDescription}
            </p>
          </div>
        </div>

        {/* 错误提示条 */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-400 animate-shake">
            <AlertCircle className="size-4 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ─── Step 1: 账号与密码登录表单 ─── */}
        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {/* 账号区域：二次验证锁定当前用户，常规登录才展示输入框 */}
            {lockUsername ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono text-xs overflow-hidden shrink-0">
                    {adminProfile.avatarUrl ? (
                      <img src={adminProfile.avatarUrl} alt={username} className="size-full object-cover" />
                    ) : (
                      <span>{username.charAt(0).toUpperCase() || "A"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      <span>{username}</span>
                      <Badge variant="primary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                        当前操作员
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">
                      {adminProfile.role || "SuperAdmin · Root"}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-medium">
                  ● 身份已就绪
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" />
                    管理员账号 (Username)
                  </span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入管理员账号 (如 admin)"
                  autoFocus
                  className="w-full h-10 rounded-xl border border-border/80 bg-muted/40 px-3.5 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
              </div>
            )}


            {/* 密码输入框 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="size-3.5 text-muted-foreground" />
                  登录密码 (Password)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入主控台管理员密码"
                  className="w-full h-10 rounded-xl border border-border/80 bg-muted/40 px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* 提交登录按钮 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl text-xs font-bold shadow-md cursor-pointer mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  正在校验凭据...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  继续验证 <ArrowRight className="size-3.5" />
                </span>
              )}
            </Button>
          </form>
        ) : (
          /* ─── Step 2: TOTP 双因子动态口令 ─── */
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* TOTP 提示徽章 */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Smartphone className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>TOTP 双因子认证</span>
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">已启用</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    账号: <strong>{username}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 位分段数字输入方格 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground text-center block">
                请输入 Authenticator 上的 6 位数字验证码
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 pt-1">
                {totpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (totpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="size-11 sm:size-12 rounded-xl border border-border/80 bg-muted/40 text-center font-mono font-bold text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-foreground transition-all"
                  />
                ))}
              </div>
            </div>

            {/* 操作按钮区 */}
            <div className="flex items-center gap-2.5 pt-2">
              {mode === "totp_only" ? (
                !isBlocking && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeLoginModal}
                    className="flex-1 h-10 rounded-xl text-xs cursor-pointer font-medium"
                  >
                    取消操作
                  </Button>
                )
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("credentials");
                    setErrorMessage("");
                  }}
                  className="flex-1 h-10 rounded-xl text-xs cursor-pointer font-medium"
                >
                  <ChevronLeft className="size-3.5 mr-1" />
                  返回修改密码
                </Button>
              )}

              <Button
                type="button"
                onClick={() => handleTotpSubmit()}
                disabled={isLoading || totpDigits.some((d) => !d)}
                className="flex-1 h-10 rounded-xl text-xs font-bold shadow-md cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    校验中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-3.5" /> 确认进入
                  </span>
                )}
              </Button>
            </div>

          </div>
        )}

        {/* 底部安全保护声明 */}
        <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>Smalux 安全加密会话通道 · 端到端受保护</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
