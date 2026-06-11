import { describe, expect, it } from "vitest";

import { joinUrl } from "@/shared/api/url";

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
