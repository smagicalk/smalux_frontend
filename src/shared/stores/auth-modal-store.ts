import { create } from "zustand";

export type AuthModalMode = "full" | "totp_only" | "credentials_only";

export interface OpenLoginModalOptions {
  /** 认证模式："full"（两步完整流程，默认） | "totp_only"（直接仅验证 TOTP 动态口令） | "credentials_only"（仅密码验证） */
  mode?: AuthModalMode;
  /** 弹窗主标题（如 "管理员安全二次验证"） */
  title?: string;
  /** 提示文案说明（如 "正在执行敏感操作，请验证管理员身份以继续"） */
  description?: string;
  /** 是否为全屏强制阻断模式（不可通过 ESC 或 X 按钮随意关闭） */
  isBlocking?: boolean;
  /** 是否锁定当前用户名（不展示用户名输入框，只展示身份卡片直接输入密码/TOTP） */
  lockUsername?: boolean;
  /** 登录/验权成功后的自定义回调函数 */
  onSuccess?: () => void;
}

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  title: string;
  description: string;
  isBlocking: boolean;
  lockUsername: boolean;
  step: "credentials" | "totp";
  onSuccessCallback: (() => void) | null;
  /** 第一步通过后暂存的用户名与临时信息 */
  tempAuthData: {
    username: string;
    tokenTemp?: string;
  } | null;

  openLoginModal: (options?: OpenLoginModalOptions) => void;
  closeLoginModal: () => void;
  setStep: (step: "credentials" | "totp") => void;
  setTempAuthData: (data: { username: string; tokenTemp?: string } | null) => void;
  triggerSuccess: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set, get) => ({
  isOpen: false,
  mode: "full",
  title: "",
  description: "",
  isBlocking: false,
  lockUsername: false,
  step: "credentials",
  onSuccessCallback: null,
  tempAuthData: null,

  openLoginModal: (options = {}) => {
    const targetMode = options.mode || "full";
    const initialStep = targetMode === "totp_only" ? "totp" : "credentials";
    const isBlocking = options.isBlocking ?? false;
    // 如果是二次验证（非阻断或明确传了lockUsername或totp_only），默认锁定当前用户名
    const lockUsername = options.lockUsername ?? (!isBlocking || targetMode === "totp_only");

    set({
      isOpen: true,
      mode: targetMode,
      title: options.title || "",
      description: options.description || "",
      isBlocking,
      lockUsername,
      step: initialStep,
      onSuccessCallback: options.onSuccess || null,
      tempAuthData: null
    });
  },

  closeLoginModal: () => {
    const { isBlocking } = get();
    if (isBlocking) return;
    set({
      isOpen: false,
      mode: "full",
      title: "",
      description: "",
      lockUsername: false,
      step: "credentials",
      tempAuthData: null,
      onSuccessCallback: null
    });
  },

  setStep: (step) => set({ step }),
  setTempAuthData: (data) => set({ tempAuthData: data }),

  triggerSuccess: () => {
    const { onSuccessCallback } = get();
    set({
      isOpen: false,
      mode: "full",
      title: "",
      description: "",
      lockUsername: false,
      step: "credentials",
      tempAuthData: null,
      onSuccessCallback: null
    });
    if (onSuccessCallback) {
      try {
        onSuccessCallback();
      } catch (err) {
        console.error("Auth success callback execution error:", err);
      }
    }
  }
}));

/**
 * 便捷使用全局登录/验权弹窗的 React Hook
 */
export function useAuthModal() {
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const mode = useAuthModalStore((s) => s.mode);
  const title = useAuthModalStore((s) => s.title);
  const description = useAuthModalStore((s) => s.description);
  const isBlocking = useAuthModalStore((s) => s.isBlocking);
  const lockUsername = useAuthModalStore((s) => s.lockUsername);
  const step = useAuthModalStore((s) => s.step);
  const openLoginModal = useAuthModalStore((s) => s.openLoginModal);
  const closeLoginModal = useAuthModalStore((s) => s.closeLoginModal);

  return {
    isOpen,
    mode,
    title,
    description,
    isBlocking,
    lockUsername,
    step,
    openLoginModal,
    closeLoginModal
  };
}
