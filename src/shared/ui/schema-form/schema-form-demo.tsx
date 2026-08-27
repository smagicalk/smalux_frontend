import { useState } from "react";
import { Server, Sliders, Shield, Terminal, Globe, Key, Bell, Database } from "lucide-react";
import { SchemaForm } from "./schema-form";
import type { FormSectionSchema } from "./types";
import { toast } from "@/shared/ui/toaster";

/**
 * 演示 Schema 架构定义
 */
export const DEMO_FORM_SCHEMA: FormSectionSchema[] = [
  {
    id: "basic-settings",
    title: "基础服务配置 (Basic Settings)",
    description: "配置节点服务的命名空间、运行环境及对外访问基础信息",
    icon: Server,
    badge: { text: "基础必填", variant: "primary" },
    collapsible: true,
    fields: [
      {
        name: "serviceName",
        type: "text",
        label: "服务标识名称 (Service Name)",
        description: "在集群内部注册的唯一服务名称",
        placeholder: "如 smalux-agent-edge",
        colSpan: 6,
        validation: {
          required: true,
          min: 3,
          max: 32,
          pattern: /^[a-z0-9-_]+$/,
          patternMessage: "仅支持小写字母、数字、下划线及连字符"
        }
      },
      {
        name: "environment",
        type: "pill-select",
        label: "部署环境 (Environment)",
        description: "选择当前服务的运行目标环境",
        colSpan: 6,
        defaultValue: "production",
        options: [
          { label: "开发环境 (Dev)", value: "development", badge: "Debug" },
          { label: "预发测试 (Staging)", value: "staging" },
          { label: "生产就绪 (Prod)", value: "production", badge: "Live" }
        ]
      },
      {
        name: "adminEmail",
        type: "email",
        label: "系统管理员邮箱 (Admin Email)",
        description: "重要服务告警与安全通知推送目标",
        placeholder: "ops@smalux.org",
        colSpan: 6,
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          patternMessage: "请输入合法的邮箱地址"
        }
      },
      {
        name: "region",
        type: "select",
        label: "计算可用区 (Region / Zone)",
        description: "服务主节点部署的地理数据中心",
        colSpan: 6,
        defaultValue: "ap-east-1",
        options: [
          { label: "中国香港 (ap-east-1 · CN-HK)", value: "ap-east-1" },
          { label: "日本东京 (ap-northeast-1 · JP-TYO)", value: "ap-northeast-1" },
          { label: "新加坡 (ap-southeast-1 · SG-SIN)", value: "ap-southeast-1" },
          { label: "美西硅谷 (us-west-1 · US-SFO)", value: "us-west-1" }
        ]
      }
    ]
  },
  {
    id: "performance-tuning",
    title: "性能调优与资源阈值 (Performance Tuning)",
    description: "设置请求并发限制、心跳超时及告警触发百分比",
    icon: Sliders,
    badge: { text: "度量调优", variant: "neutral" },
    collapsible: true,
    fields: [
      {
        name: "maxConnections",
        type: "number",
        label: "最大并发连接数 (Max Concurrency)",
        description: "单个工作节点承载的最大并发活跃连接限制",
        defaultValue: 5000,
        unit: "conn",
        step: 500,
        colSpan: 6,
        validation: {
          required: true,
          min: 100,
          max: 50000
        }
      },
      {
        name: "heartbeatIntervalMs",
        type: "number",
        label: "心跳检测探测周期 (Heartbeat Interval)",
        description: "Agent 节点向中心汇报健康指标的时间间隔",
        defaultValue: 3000,
        unit: "ms",
        step: 500,
        colSpan: 6,
        validation: {
          required: true,
          min: 500,
          max: 60000
        }
      },
      {
        name: "cpuWarningThreshold",
        type: "slider",
        label: "CPU 告警触发阈值 (CPU Threshold)",
        description: "当节点持续 CPU 占用超过此阈值时触发警告通知",
        defaultValue: 80,
        unit: "%",
        step: 5,
        colSpan: 12,
        validation: {
          min: 30,
          max: 100
        }
      }
    ]
  },
  {
    id: "security-and-headers",
    title: "安全策略与扩展键值 (Security & Headers)",
    description: "配置 SSL/TLS 强制跳转、密钥防护及全局自定义请求头",
    icon: Shield,
    badge: { text: "安全强化", variant: "warning" },
    collapsible: true,
    fields: [
      {
        name: "enableHttpsStrict",
        type: "switch",
        label: "启用 HSTS 强安全协议加密 (Strict Transport Security)",
        description: "强制所有客户端请求重定向至安全 TLS 隧道并注入 HSTS 头",
        defaultValue: true,
        colSpan: 12
      },
      {
        name: "tlsSecretKey",
        type: "password",
        label: "TLS 证书私钥口令 (Certificate Passphrase)",
        description: "用于解密服务端证书的通行密码",
        placeholder: "输入证书保护密钥...",
        colSpan: 12,
        // 💡 动态联动：仅当开启 HTTPS 严格模式时显示
        hidden: (values) => !values.enableHttpsStrict,
        validation: {
          required: true,
          min: 6,
          requiredMessage: "启用 HSTS 时必须提供证书私钥口令"
        }
      },
      {
        name: "serviceTags",
        type: "tags",
        label: "服务检索标签 (Service Tags)",
        description: "用于在自动化运维大盘中按标签快速批量过滤与调度",
        defaultValue: ["edge", "high-availability", "v2-core"],
        colSpan: 12
      },
      {
        name: "customHttpHeaders",
        type: "key-value",
        label: "全局请求头注入 (Custom HTTP Headers)",
        description: "发往后端微服务时统一附带的自定义安全或追踪头",
        defaultValue: [
          { key: "X-Smalux-Cluster", value: "cluster-alpha-01" },
          { key: "X-Trace-Sampled", value: "true" }
        ],
        colSpan: 12
      }
    ]
  }
];

export function SchemaFormDemo() {
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmittedData(data);
    setIsSubmitting(false);
    toast.success("SchemaForm 表单校验通过并成功提交！");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Terminal className="size-5 text-primary" />
          <span>Schema 驱动动态表单生成器演示</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          根据 JSON / TypeScript Schema 规范自动渲染具备毛玻璃卡片分块、丰富控件、多列栅格与条件联动的表单。
        </p>
      </div>

      <SchemaForm
        sections={DEMO_FORM_SCHEMA}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitText="提交保存配置"
        resetText="重置表单数据"
      />

      {submittedData && (
        <div className="rounded-2xl border border-emerald-500/30 bg-card p-4 space-y-2 animate-in fade-in zoom-in-95">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-2 font-mono">
            <span>● 表单输出 JSON 结构：</span>
          </div>
          <pre className="p-3 rounded-xl bg-muted/60 text-[11px] font-mono text-muted-foreground overflow-x-auto">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
