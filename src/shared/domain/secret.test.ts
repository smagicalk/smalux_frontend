import { describe, expect, it } from "vitest";

import {
  DEFAULT_REVEAL_TTL_SEC,
  initialRevealState,
  maskSecret,
  revealReducer,
  secretStatusBadge
} from "@/shared/domain/secret";

describe("maskSecret", () => {
  it("keeps head and tail for long values", () => {
    expect(maskSecret("sk_live_abcdef0123456789")).toBe("sk_l••••••••••••6789");
  });

  it("masks fully when value is short", () => {
    expect(maskSecret("abc")).toBe("\u2022\u2022\u2022");
  });

  it("returns empty string for empty input", () => {
    expect(maskSecret("")).toBe("");
  });

  it("respects custom head and tail", () => {
    expect(maskSecret("sk_live_abcdef0123456789", { keepHead: 2, keepTail: 2 })).toBe("sk••••••••••••89");
  });

  it("caps the masked run length", () => {
    expect(maskSecret("sk_live_abcdef0123456789wxyz", { keepHead: 4, keepTail: 4, maxMask: 4 })).toBe("sk_l••••wxyz");
  });
});

describe("revealReducer", () => {
  it("moves to loading on reveal-start", () => {
    expect(revealReducer(initialRevealState, { type: "reveal-start" })).toEqual({
      phase: "loading",
      plaintext: null,
      remainingSec: 0,
      error: null
    });
  });

  it("reveals plaintext with ttl on success", () => {
    const loading = revealReducer(initialRevealState, { type: "reveal-start" });
    expect(revealReducer(loading, { type: "reveal-success", plaintext: "sk_live_secret", ttlSec: DEFAULT_REVEAL_TTL_SEC })).toEqual({
      phase: "revealed",
      plaintext: "sk_live_secret",
      remainingSec: DEFAULT_REVEAL_TTL_SEC,
      error: null
    });
  });

  it("counts down and re-masks when ttl reaches zero", () => {
    const revealed = revealReducer(initialRevealState, {
      type: "reveal-success",
      plaintext: "sk_live_secret",
      ttlSec: 1
    });
    expect(revealReducer(revealed, { type: "tick" })).toEqual(initialRevealState);
  });

  it("decrements remaining seconds on tick", () => {
    const revealed = revealReducer(initialRevealState, {
      type: "reveal-success",
      plaintext: "sk_live_secret",
      ttlSec: 3
    });
    expect(revealReducer(revealed, { type: "tick" }).remainingSec).toBe(2);
  });

  it("records an error message on reveal-error", () => {
    const errored = revealReducer(initialRevealState, { type: "reveal-error", message: "decryption denied" });
    expect(errored.phase).toBe("error");
    expect(errored.error).toBe("decryption denied");
  });

  it("resets to initial state", () => {
    const revealed = revealReducer(initialRevealState, { type: "reveal-success", plaintext: "x", ttlSec: 5 });
    expect(revealReducer(revealed, { type: "reset" })).toEqual(initialRevealState);
  });
});

describe("secretStatusBadge", () => {
  it("maps each status to a label and variant", () => {
    expect(secretStatusBadge("encrypted")).toEqual({ label: "已加密", variant: "success" });
    expect(secretStatusBadge("rotating")).toEqual({ label: "轮换中", variant: "warning" });
    expect(secretStatusBadge("plaintext")).toEqual({ label: "明文", variant: "danger" });
    expect(secretStatusBadge("missing")).toEqual({ label: "缺少密钥", variant: "secondary" });
  });
});