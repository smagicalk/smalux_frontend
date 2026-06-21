export type SecretStatus = "encrypted" | "rotating" | "missing" | "plaintext";

export type SecretValue = {
  id: string;
  label: string;
  cipherPreview: string;
  keyVersion: number;
  status: SecretStatus;
  oneTime?: boolean;
  consumed?: boolean;
};

export type RevealPhase = "idle" | "loading" | "revealed" | "error";

export type RevealState = {
  phase: RevealPhase;
  plaintext: string | null;
  remainingSec: number;
  error: string | null;
};

export type RevealAction =
  | { type: "reveal-start" }
  | { type: "reveal-success"; plaintext: string; ttlSec: number }
  | { type: "reveal-error"; message: string }
  | { type: "tick" }
  | { type: "re-mask" }
  | { type: "reset" };

export const DEFAULT_REVEAL_TTL_SEC = 15;

export const initialRevealState: RevealState = {
  phase: "idle",
  plaintext: null,
  remainingSec: 0,
  error: null
};

type MaskOptions = {
  keepHead?: number;
  keepTail?: number;
  maxMask?: number;
};

export function maskSecret(plaintext: string, options: MaskOptions = {}): string {
  const keepHead = options.keepHead ?? 4;
  const keepTail = options.keepTail ?? 4;
  const maxMask = options.maxMask ?? 12;

  if (!plaintext) {
    return "";
  }

  if (plaintext.length <= keepHead + keepTail) {
    return "\u2022".repeat(Math.min(plaintext.length, 8));
  }

  const maskedLen = Math.min(plaintext.length - keepHead - keepTail, maxMask);
  return `${plaintext.slice(0, keepHead)}${"\u2022".repeat(maskedLen)}${plaintext.slice(-keepTail)}`;
}

export function revealReducer(state: RevealState, action: RevealAction): RevealState {
  switch (action.type) {
    case "reveal-start":
      return { phase: "loading", plaintext: null, remainingSec: 0, error: null };
    case "reveal-success":
      return {
        phase: "revealed",
        plaintext: action.plaintext,
        remainingSec: Math.max(action.ttlSec, 1),
        error: null
      };
    case "reveal-error":
      return { phase: "error", plaintext: null, remainingSec: 0, error: action.message };
    case "tick":
      if (state.phase !== "revealed") {
        return state;
      }
      return state.remainingSec <= 1 ? initialRevealState : { ...state, remainingSec: state.remainingSec - 1 };
    case "re-mask":
    case "reset":
      return initialRevealState;
    default:
      return state;
  }
}

export function secretStatusBadge(status: SecretStatus): { label: string; variant: "success" | "warning" | "danger" | "secondary" } {
  switch (status) {
    case "encrypted":
      return { label: "已加密", variant: "success" };
    case "rotating":
      return { label: "轮换中", variant: "warning" };
    case "plaintext":
      return { label: "明文", variant: "danger" };
    case "missing":
    default:
      return { label: "缺少密钥", variant: "secondary" };
  }
}