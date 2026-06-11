export const notificationDeliveryTrend = [
  {
    name: "已发送",
    color: "var(--success)",
    values: [12, 14, 9, 16, 18, 13, 21, 20, 18, 24, 19, 22]
  },
  {
    name: "失败",
    color: "var(--danger)",
    values: [1, 0, 2, 1, 0, 3, 1, 1, 2, 0, 1, 1]
  },
  {
    name: "静默",
    color: "var(--chart-2)",
    values: [2, 3, 2, 4, 5, 4, 3, 6, 4, 5, 7, 6]
  }
];

export const notificationChannelBars = [
  { label: "Webhook", value: 18 },
  { label: "Email", value: 10 },
  { label: "Telegram", value: 3 },
  { label: "WeCom", value: 6 }
];

export const notificationSeveritySegments = [
  { label: "严重", value: 4, color: "var(--danger)" },
  { label: "警告", value: 9, color: "var(--warning)" },
  { label: "信息", value: 15, color: "var(--info)" }
];
