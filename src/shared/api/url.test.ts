import { describe, expect, it } from "vitest";

import { isSafeRuntimeEndpoint, joinUrl } from "@/shared/api/url";

describe("joinUrl", () => {
  it("joins relative base and path without duplicate slashes", () => {
    expect(joinUrl("/api/", "/nodes")).toBe("/api/nodes");
  });

  it("joins absolute base and path without changing the origin", () => {
    expect(joinUrl("https://api.example.test/v1/", "/nodes")).toBe(
      "https://api.example.test/v1/nodes"
    );
  });

  it("returns root when base and path are empty", () => {
    expect(joinUrl("", "")).toBe("/");
  });
});

describe("isSafeRuntimeEndpoint", () => {
  it("allows relative paths and http websocket endpoints", () => {
    expect(isSafeRuntimeEndpoint("/api")).toBe(true);
    expect(isSafeRuntimeEndpoint("https://api.example.test")).toBe(true);
    expect(isSafeRuntimeEndpoint("wss://api.example.test/ws")).toBe(true);
  });

  it("rejects protocol-relative, javascript and empty endpoints", () => {
    expect(isSafeRuntimeEndpoint("//evil.example")).toBe(false);
    expect(isSafeRuntimeEndpoint("javascript:alert(1)")).toBe(false);
    expect(isSafeRuntimeEndpoint("")).toBe(false);
  });
});
