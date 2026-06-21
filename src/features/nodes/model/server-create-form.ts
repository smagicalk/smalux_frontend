export type ServerBillingCycle =
  | "free"
  | "daily"
  | "weekly"
  | "half-monthly"
  | "monthly"
  | "yearly"
  | "biennial"
  | "triennial";

export type ServerTrafficMode = "up-down" | "up" | "down";
export type ServerTrafficUnit = "GB" | "TB" | "PB";
export type ServerPriceCurrency =
  | "CNY"
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "HKD"
  | "TWD"
  | "SGD"
  | "AUD"
  | "CAD";

export type ServerCreateFormValues = {
  name: string;
  price: string;
  priceCurrency: ServerPriceCurrency;
  billingCycle: ServerBillingCycle;
  expiresAt: string;
  neverExpires: boolean;
  autoRenew: boolean;
  trafficMode: ServerTrafficMode;
  trafficAmount: string;
  trafficUnit: ServerTrafficUnit;
};

export const billingCycleOptions: readonly { label: string; value: ServerBillingCycle }[] = [
  { label: "免费", value: "free" },
  { label: "按日", value: "daily" },
  { label: "按周", value: "weekly" },
  { label: "按半月", value: "half-monthly" },
  { label: "按月", value: "monthly" },
  { label: "按年", value: "yearly" },
  { label: "按两年", value: "biennial" },
  { label: "按三年", value: "triennial" }
];

export const trafficModeOptions: readonly { label: string; value: ServerTrafficMode }[] = [
  { label: "上行 + 下行", value: "up-down" },
  { label: "只算上行", value: "up" },
  { label: "只算下行", value: "down" }
];

export const trafficUnitOptions: readonly ServerTrafficUnit[] = ["GB", "TB", "PB"];

export const priceCurrencyOptions: readonly { label: string; value: ServerPriceCurrency }[] = [
  { label: "人民币 CNY", value: "CNY" },
  { label: "美元 USD", value: "USD" },
  { label: "欧元 EUR", value: "EUR" },
  { label: "英镑 GBP", value: "GBP" },
  { label: "日元 JPY", value: "JPY" },
  { label: "港币 HKD", value: "HKD" },
  { label: "新台币 TWD", value: "TWD" },
  { label: "新加坡元 SGD", value: "SGD" },
  { label: "澳元 AUD", value: "AUD" },
  { label: "加元 CAD", value: "CAD" }
];

export const initialServerCreateFormValues: ServerCreateFormValues = {
  name: "",
  price: "0",
  priceCurrency: "CNY",
  billingCycle: "free",
  expiresAt: "",
  neverExpires: true,
  autoRenew: false,
  trafficMode: "up-down",
  trafficAmount: "0",
  trafficUnit: "GB"
};

export function validateServerCreateForm(values: ServerCreateFormValues) {
  const errors: string[] = [];
  const normalizedName = values.name.trim();
  const price = Number(values.price);
  const trafficAmount = Number(values.trafficAmount);

  if (!normalizedName) {
    errors.push("请填写服务器名称。");
  }

  if (Number.isNaN(price) || price < 0) {
    errors.push("价格必须是大于或等于 0 的数字。");
  }

  if (!values.neverExpires && !values.expiresAt) {
    errors.push("非永久服务器需要填写到期时间。");
  }

  if (Number.isNaN(trafficAmount) || trafficAmount < 0) {
    errors.push("流量额度必须是大于或等于 0 的数字。");
  }

  return errors;
}

export function getServerBillingCycleLabel(cycle: ServerBillingCycle) {
  return billingCycleOptions.find((option) => option.value === cycle)?.label ?? "未知周期";
}

export function getServerTrafficModeLabel(mode: ServerTrafficMode) {
  return trafficModeOptions.find((option) => option.value === mode)?.label ?? "未知流量规则";
}

export function getServerPriceCurrencyLabel(currency: ServerPriceCurrency) {
  return priceCurrencyOptions.find((option) => option.value === currency)?.label ?? currency;
}

export function createServerCreateSummary(values: ServerCreateFormValues) {
  const cycleLabel = getServerBillingCycleLabel(values.billingCycle);
  const trafficLabel = getServerTrafficModeLabel(values.trafficMode);
  const currencyLabel = getServerPriceCurrencyLabel(values.priceCurrency);
  const expiryLabel = values.neverExpires ? "永久" : values.expiresAt;
  const renewalLabel = values.autoRenew ? "自动续费" : "不自动续费";

  return `${values.name.trim()} · ${cycleLabel} ${values.price} ${currencyLabel} · ${expiryLabel} · ${renewalLabel} · ${trafficLabel} ${values.trafficAmount}${values.trafficUnit}`;
}
