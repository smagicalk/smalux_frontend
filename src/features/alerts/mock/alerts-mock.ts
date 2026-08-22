import type { AlertRuleItem, AlertHistoryEvent, NotificationChannelItem } from "../types";

const now = Date.now();
const min = 60_000;
const hr = 3_600_000;

export const MOCK_ALERT_RULES: AlertRuleItem[] = [
  {
    id: "rule-1",
    name: "CPU 持续高负载 (>85%)",
    metric: "cpuUsage",
    operator: ">",
    threshold: 0.85,
    thresholdLabel: "> 85%",
    windowSec: 300,
    severity: "warning",
    enabled: true,
    silenced: false,
    channels: ["chan-1", "chan-2"]
  },
  {
    id: "rule-2",
    name: "内存耗尽预警 (>90%)",
    metric: "memUsed/memTotal",
    operator: ">",
    threshold: 0.90,
    thresholdLabel: "> 90%",
    windowSec: 120,
    severity: "critical",
    enabled: true,
    silenced: false,
    channels: ["chan-1", "chan-2", "chan-3"]
  },
  {
    id: "rule-3",
    name: "主机心跳丢失 (节点宕机/离线)",
    metric: "status",
    operator: "==",
    threshold: 0,
    thresholdLabel: "失联超过 60s",
    windowSec: 60,
    severity: "critical",
    enabled: true,
    silenced: false,
    channels: ["chan-1", "chan-2", "chan-3"]
  },
  {
    id: "rule-4",
    name: "根分区磁盘满载 (>90%)",
    metric: "diskUsed/diskTotal",
    operator: ">",
    threshold: 0.90,
    thresholdLabel: "> 90%",
    windowSec: 600,
    severity: "critical",
    enabled: true,
    silenced: false,
    channels: ["chan-1"]
  },
  {
    id: "rule-5",
    name: "网络突发出站流量激增 (>150MB/s)",
    metric: "netTxSpeed",
    operator: ">",
    threshold: 150_000_000,
    thresholdLabel: "> 150 MB/s",
    windowSec: 180,
    severity: "info",
    enabled: true,
    silenced: true,
    channels: ["chan-1"]
  }
];

export const MOCK_ALERT_HISTORY: AlertHistoryEvent[] = [
  {
    id: "inc-1",
    ruleId: "rule-1",
    ruleName: "CPU 持续高负载 (>85%)",
    serverId: "srv-tok-01",
    serverName: "jp-edge-pop-01 (Tokyo)",
    severity: "warning",
    value: 0.89,
    formattedValue: "89%",
    message: "CPU 使用率达到 89%，持续超过 6 分钟",
    triggeredAt: now - 6 * min
  },
  {
    id: "inc-2",
    ruleId: "rule-3",
    ruleName: "主机心跳丢失 (节点宕机/离线)",
    serverId: "srv-ctu-01",
    serverName: "cd-edge-backup-04 (Chengdu)",
    severity: "critical",
    value: 0,
    formattedValue: "Offline",
    message: "心跳包丢失超过 60 秒，节点状态置为离线",
    triggeredAt: now - 30 * min
  },
  {
    id: "inc-3",
    ruleId: "rule-4",
    ruleName: "根分区磁盘满载 (>90%)",
    serverId: "srv-fra-01",
    serverName: "eu-backup-vault-01 (Frankfurt)",
    severity: "critical",
    value: 0.92,
    formattedValue: "92%",
    message: "ZFS 存储池容量占用达 92%",
    triggeredAt: now - 24 * min
  },
  {
    id: "inc-4",
    ruleId: "rule-2",
    ruleName: "内存耗尽预警 (>90%)",
    serverId: "srv-hkg-02",
    serverName: "hk-gateway-02 (Hong Kong)",
    severity: "critical",
    value: 0.94,
    formattedValue: "94%",
    message: "应用堆内存占用超警戒阈值 (94%)",
    triggeredAt: now - 14 * min
  },
  {
    id: "inc-5",
    ruleId: "rule-5",
    ruleName: "出站网络突发流量上升",
    serverId: "srv-hkg-03",
    serverName: "hk-core-api-01 (Hong Kong)",
    severity: "warning",
    value: 180,
    formattedValue: "180 MB/s",
    message: "出站流量突发上升至 180 MB/s",
    triggeredAt: now - 2 * min
  },
  {
    id: "inc-6",
    ruleId: "rule-2",
    ruleName: "GPU 显存占用达到 95%",
    serverId: "srv-sjc-02",
    serverName: "us-ai-runner-02 (Silicon Valley)",
    severity: "critical",
    value: 0.95,
    formattedValue: "95%",
    message: "CUDA 显存分配率达到 95%，推理服务响应变慢",
    triggeredAt: now - 18 * min
  },
  {
    id: "inc-7",
    ruleId: "rule-1",
    ruleName: "TCP 连接数接近系统上限",
    serverId: "srv-bjs-01",
    serverName: "bj-edge-node-01 (Beijing)",
    severity: "warning",
    value: 48200,
    formattedValue: "48,200",
    message: "TCP 连接队列达 48,200 (警戒阈值 45,000)",
    triggeredAt: now - 10 * min
  },
  {
    id: "inc-8",
    ruleId: "rule-4",
    ruleName: "冷备同步延迟超过 15 分钟",
    serverId: "srv-gru-01",
    serverName: "sa-brazil-vault-01 (São Paulo)",
    severity: "warning",
    value: 18,
    formattedValue: "18m 40s",
    message: "跨洋异地多活冷备同步延迟达 18m 40s",
    triggeredAt: now - 32 * min
  }
];

export const MOCK_NOTIFICATION_CHANNELS: NotificationChannelItem[] = [
  {
    id: "chan-1",
    name: "SRE 核心值班飞书群",
    type: "feishu",
    endpoint: "https://open.feishu.cn/open-apis/bot/v2/hook/xxx",
    enabled: true,
    lastDeliveryAt: now - 14 * min,
    lastOk: true
  },
  {
    id: "chan-2",
    name: "运维应急钉钉机器人",
    type: "dingtalk",
    endpoint: "https://oapi.dingtalk.com/robot/send?access_token=xxx",
    enabled: true,
    lastDeliveryAt: now - 24 * min,
    lastOk: true
  },
  {
    id: "chan-3",
    name: "安全与审计邮件组",
    type: "email",
    endpoint: "sre-oncall-group@smalux.internal",
    enabled: true,
    lastDeliveryAt: now - 2 * hr,
    lastOk: true
  },
  {
    id: "chan-4",
    name: "自建 Webhook (SIEM 接入)",
    type: "webhook",
    endpoint: "https://siem.corp.internal/api/v1/alert-receiver",
    enabled: false,
    lastOk: false
  }
];
