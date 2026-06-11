export const pingLatencySeries = [
  {
    name: "公开状态页",
    color: "var(--chart-1)",
    values: [38, 40, 42, 41, 43, 42, 44, 42, 41, 42, 43, 42]
  },
  {
    name: "后台 API",
    color: "var(--chart-3)",
    values: [86, 92, 110, 128, 160, 186, 170, 146, 132, 154, 180, 186]
  },
  {
    name: "SMTP 端口",
    color: "var(--chart-2)",
    values: [58, 62, 64, 65, 63, 64, 66, 64, 62, 63, 65, 64]
  },
  {
    name: "Agent WSS",
    color: "var(--chart-4)",
    values: [49, 51, 55, 58, 57, 60, 59, 58, 56, 58, 60, 58]
  },
  {
    name: "数据库端口",
    color: "var(--chart-5)",
    values: [118, 126, 144, 168, 196, 212, 204, 190, 176, 188, 206, 212]
  }
];

export const pingAvailabilityBars = [
  { label: "状态页", value: 99.98 },
  { label: "API", value: 98.72 },
  { label: "SMTP", value: 99.91 },
  { label: "WSS", value: 99.95 },
  { label: "RPC", value: 99.87 },
  { label: "数据库", value: 97.62 },
  { label: "边缘", value: 93.4 },
  { label: "代理", value: 88.2 }
];

export const pingLossTrend = [0, 0, 0.2, 0, 1.2, 1.6, 4.8, 9.2, 100, 38, 18, 6, 1.6, 0.8, 0];
