import { Server, Sliders, Shield } from "lucide-react";
import type { FormSectionSchema, FormSchemaDefinition } from "@/shared/ui/schema-form";

export const DEFAULT_DESIGNER_SECTIONS: FormSectionSchema[] = [
  {
    id: "sec-basic",
    title: "基础服务配置 (Basic Settings)",
    description: "配置服务的基本标识名称、运行环境及网络信息",
    icon: Server,
    badge: { text: "必填项", variant: "primary" },
    collapsible: true,
    fields: [
      {
        name: "serviceName",
        type: "text",
        label: "服务标识名称",
        description: "在集群内部注册的唯一服务标识",
        placeholder: "如 smalux-edge-node",
        colSpan: 6,
        validation: {
          required: true,
          min: 3,
          max: 32
        }
      },
      {
        name: "environment",
        type: "pill-select",
        label: "运行目标环境",
        description: "选择部署环境阶段",
        colSpan: 6,
        defaultValue: "production",
        align: "justify",
        options: [
          { label: "开发环境", value: "development" },
          { label: "预发测试", value: "staging" },
          { label: "生产就绪", value: "production", badge: "Live" }
        ]
      },
      {
        name: "adminEmail",
        type: "email",
        label: "运维管理员邮箱",
        description: "重要异常报警推送目标",
        placeholder: "ops@smalux.org",
        colSpan: 6,
        validation: {
          required: true
        }
      },
      {
        name: "region",
        type: "select",
        label: "数据中心可用区",
        colSpan: 6,
        defaultValue: "ap-east-1",
        options: [
          { label: "中国香港 (ap-east-1 · CN-HK)", value: "ap-east-1" },
          { label: "日本东京 (ap-northeast-1 · JP-TYO)", value: "ap-northeast-1" },
          { label: "新加坡 (ap-southeast-1 · SG-SIN)", value: "ap-southeast-1" }
        ]
      }
    ]
  },
  {
    id: "sec-performance",
    title: "性能调优与资源阈值 (Performance Tuning)",
    description: "配置并发限制、心跳检测与告警阈值滑块",
    icon: Sliders,
    badge: { text: "度量调优", variant: "neutral" },
    collapsible: true,
    fields: [
      {
        name: "maxConnections",
        type: "number",
        label: "最大并发连接数",
        defaultValue: 5000,
        unit: "conn",
        step: 500,
        colSpan: 6,
        validation: {
          min: 100,
          max: 50000
        }
      },
      {
        name: "heartbeatIntervalMs",
        type: "number",
        label: "心跳检测周期",
        defaultValue: 3000,
        unit: "ms",
        step: 500,
        colSpan: 6,
        validation: {
          min: 500,
          max: 60000
        }
      },
      {
        name: "cpuWarningThreshold",
        type: "slider",
        label: "CPU 告警触发阈值",
        description: "超过该比例时系统将触发高负载报警",
        defaultValue: 80,
        unit: "%",
        step: 5,
        colSpan: 12,
        validation: {
          min: 10,
          max: 100
        }
      }
    ]
  },
  {
    id: "sec-security",
    title: "安全防护与自定义头 (Security & Headers)",
    description: "配置 HTTPS 加密策略及全局自定义请求头",
    icon: Shield,
    badge: { text: "安全强化", variant: "warning" },
    collapsible: true,
    fields: [
      {
        name: "enableHttpsStrict",
        type: "switch",
        label: "强制启用 HTTPS (HSTS) 安全传输协议",
        description: "启用后将强制所有访问重定向至安全加密隧道",
        defaultValue: true,
        colSpan: 12
      },
      {
        name: "customHeaders",
        type: "key-value",
        label: "自定义 HTTP 请求头",
        description: "自动附带在请求中的键值对",
        defaultValue: [
          { key: "X-Smalux-Cluster", value: "cluster-alpha-01" },
          { key: "X-Trace-Sampled", value: "true" }
        ],
        colSpan: 12
      },
      {
        name: "clusterTags",
        type: "tags",
        label: "集群业务标签",
        description: "用于在节点大盘中快速检索与过滤",
        defaultValue: ["edge", "high-availability", "v2-core"],
        colSpan: 12
      }
    ]
  }
];

export const DEFAULT_FORM_DEFINITION: FormSchemaDefinition = {
  id: "edge_service_config",
  name: "边缘节点核心服务与安全基线配置",
  version: "1.0.0",
  description: "用于向集群管理节点下发统一的应用运行参数、安全防护策略与扩展头配置",
  sections: DEFAULT_DESIGNER_SECTIONS
};
