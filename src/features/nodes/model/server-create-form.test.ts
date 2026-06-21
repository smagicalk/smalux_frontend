import { describe, expect, it } from "vitest";

import {
  createServerCreateSummary,
  initialServerCreateFormValues,
  validateServerCreateForm
} from "@/features/nodes/model/server-create-form";

describe("server create form", () => {
  it("requires a server name and expiry for non-permanent servers", () => {
    expect(
      validateServerCreateForm({
        ...initialServerCreateFormValues,
        neverExpires: false
      })
    ).toEqual(["请填写服务器名称。", "非永久服务器需要填写到期时间。"]);
  });

  it("rejects negative price and traffic quota", () => {
    expect(
      validateServerCreateForm({
        ...initialServerCreateFormValues,
        name: "tyo-core-02",
        price: "-1",
        trafficAmount: "-2"
      })
    ).toEqual(["价格必须是大于或等于 0 的数字。", "流量额度必须是大于或等于 0 的数字。"]);
  });

  it("creates a readable submit summary", () => {
    expect(
      createServerCreateSummary({
        ...initialServerCreateFormValues,
        name: "tyo-core-02",
        billingCycle: "monthly",
        price: "39",
        priceCurrency: "USD",
        neverExpires: false,
        expiresAt: "2026-12-31",
        autoRenew: true,
        trafficMode: "down",
        trafficAmount: "2",
        trafficUnit: "TB"
      })
    ).toBe("tyo-core-02 · 按月 39 美元 USD · 2026-12-31 · 自动续费 · 只算下行 2TB");
  });
});
