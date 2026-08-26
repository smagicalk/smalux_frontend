import { useState, useEffect, useMemo } from "react";
import {
  Send,
  Globe,
  Mail,
  Bot,
  Code2,
  Sparkles,
  Check,
  FileCode,
  Shield,
  Server,
  MessageSquare,
  Eye,
  Layers,
  Copy,
  Plus,
  KeyRound,
  Braces,
  Lock,
  Unlock,
  Inbox
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";
import { useCreateChannel } from "../hooks/use-notifications";
import type { ChannelType } from "@/shared/api/methods";

interface NotificationChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (channelName?: string) => void;
}

const JS_SAMPLE_TEMPLATE = `/**
 * Smalux 自定义告警外发分发函数
 * @param {Object} event - 包含当前告警事件全量属性的参数对象
 */
async function sendEvent(event) {
  // 1. 组装标题与详细排查正文
  const title = \`🚨 [\${event.severity.toUpperCase()}] \${event.serverName} - \${event.ruleName}\`;
  const summary = \`主机: \${event.serverName} (\${event.serverIpv4} | \${event.serverIpv6})
指标: \${event.metric} = \${event.value} (阈值: \${event.threshold})
流量: \${event.trafficUsed} / \${event.trafficTotal} (\${event.trafficUsagePercent})
时间: \${event.time}
诊断: \${event.message}\`;

  // 2. 自由发起 HTTP 请求或调用飞书/钉钉/企业微信/自建通知网关
  await fetch("https://api.yourcompany.com/v1/alert-gateway", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer your_secret_token"
    },
    body: JSON.stringify({
      title,
      summary,
      event
    })
  });
}`;

// JavaScript event 入参对象全量属性库
const JS_EVENT_PROPERTIES = [
  { prop: "event.ruleName", label: "规则名称", example: "全网 CPU 使用率超载" },
  { prop: "event.severity", label: "严重等级", example: "critical" },
  { prop: "event.metric", label: "监控指标", example: "host.cpu.usage (%)" },
  { prop: "event.threshold", label: "触发阈值", example: "> 90% (持续 5m)" },
  { prop: "event.value", label: "采样峰值", example: "94.2%" },
  { prop: "event.serverName", label: "主机名称", example: "edge-tok-01" },
  { prop: "event.serverId", label: "主机 ID", example: "srv-tok-01" },
  { prop: "event.serverGroup", label: "业务分组", example: "东京机房 · 核心网关组" },
  { prop: "event.serverIpv4", label: "IPv4 地址", example: "104.28.19.45" },
  { prop: "event.serverIpv6", label: "IPv6 地址", example: "2400:cb00:2048:1::c629:d7a2" },
  { prop: "event.trafficUsed", label: "已用流量", example: "3.42 TB" },
  { prop: "event.trafficTotal", label: "总流量配额", example: "10.00 TB" },
  { prop: "event.trafficUsagePercent", label: "流量使用率", example: "34.2%" },
  { prop: "event.time", label: "触发时间", example: "2026-08-25 17:30:00" },
  { prop: "event.message", label: "诊断正文", example: "连续 5 分钟 CPU 达到 94.2% 超出 90% 安全水位" }
];

// 常用推荐全要素消息模板 (Telegram)
const DEFAULT_MARKDOWN_TEMPLATE = `🚨 *【Smalux 基础设施告警通知】*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *告警规则*: \`{{RULE_NAME}}\`
⚠️ *严重等级*: *{{SEVERITY}}*
📊 *监控指标*: \`{{METRIC}}\` (阈值: {{THRESHOLD}} | 采样: \`{{VALUE}}\`)
━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️ *目标主机*: \`{{SERVER_NAME}}\` (\`{{SERVER_ID}}\`)
🏷️ *业务分组*: \`{{SERVER_GROUP}}\`
🌐 *主机 IPv4*: \`{{SERVER_IPV4}}\`
🌐 *主机 IPv6*: \`{{SERVER_IPV6}}\`
📶 *流量消耗*: \`{{TRAFFIC_USED}} / {{TRAFFIC_TOTAL}}\` (已用 {{TRAFFIC_USAGE_PERCENT}})
━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ *触发时间*: {{TIME}}
📝 *诊断详情*: {{MESSAGE}}`;

const COMPACT_TEMPLATE = `[告警 {{SEVERITY}}] {{RULE_NAME}} | 主机: {{SERVER_NAME}} (IPv4: {{SERVER_IPV4}} | IPv6: {{SERVER_IPV6}}) | 指标: {{METRIC}}={{VALUE}} (阈值: {{THRESHOLD}}) | 流量: {{TRAFFIC_USED}}/{{TRAFFIC_TOTAL}} ({{TRAFFIC_USAGE_PERCENT}}) | 时间: {{TIME}} | {{MESSAGE}}`;

// Webhook 专用默认 POST Body JSON 结构
const DEFAULT_WEBHOOK_JSON = `{\n  "event": "{{RULE_NAME}}",\n  "severity": "{{SEVERITY}}",\n  "metric": "{{METRIC}}",\n  "threshold": "{{THRESHOLD}}",\n  "value": "{{VALUE}}",\n  "host": {\n    "name": "{{SERVER_NAME}}",\n    "id": "{{SERVER_ID}}",\n    "group": "{{SERVER_GROUP}}",\n    "ipv4": "{{SERVER_IPV4}}",\n    "ipv6": "{{SERVER_IPV6}}",\n    "trafficUsed": "{{TRAFFIC_USED}}",\n    "trafficTotal": "{{TRAFFIC_TOTAL}}",\n    "trafficRatio": "{{TRAFFIC_USAGE_PERCENT}}"\n  },\n  "timestamp": "{{TIME}}",\n  "details": "{{MESSAGE}}"\n}`;

// 默认邮件主题与正文
const DEFAULT_EMAIL_SUBJECT = `🚨 [Smalux 故障告警] {{SERVER_NAME}} ({{SERVER_IPV4}}) - {{RULE_NAME}} [{{SEVERITY}}]`;

const DEFAULT_EMAIL_BODY = `<!DOCTYPE html>
<html>
<body style="font-family: monospace; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: #e11d48; color: #ffffff; padding: 16px 20px; font-weight: bold; font-size: 16px;">
      🚨 Smalux 节点异常告警
    </div>
    <div style="padding: 20px;">
      <p style="margin: 0 0 16px; font-size: 14px;"><strong>触发规则:</strong> {{RULE_NAME}}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">严重级别:</td><td style="padding: 8px 0; font-weight: bold; color: #e11d48;">{{SEVERITY}}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">目标节点:</td><td style="padding: 8px 0;"><strong>{{SERVER_NAME}}</strong> ({{SERVER_ID}})</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">业务分组:</td><td style="padding: 8px 0;">{{SERVER_GROUP}}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">IPv4 地址:</td><td style="padding: 8px 0;"><code>{{SERVER_IPV4}}</code></td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">IPv6 地址:</td><td style="padding: 8px 0;"><code>{{SERVER_IPV6}}</code></td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">流量消耗:</td><td style="padding: 8px 0;">{{TRAFFIC_USED}} / {{TRAFFIC_TOTAL}} ({{TRAFFIC_USAGE_PERCENT}})</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">指标读数:</td><td style="padding: 8px 0;">{{METRIC}} = <strong>{{VALUE}}</strong> (阈值: {{THRESHOLD}})</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">触发时间:</td><td style="padding: 8px 0;">{{TIME}}</td></tr>
      </table>
      <div style="background: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px; border-radius: 4px; font-size: 12px; color: #9f1239;">
        <strong>诊断详情:</strong> {{MESSAGE}}
      </div>
    </div>
  </div>
</body>
</html>`;

// 常见主流 SMTP 服务商预设列表
const SMTP_PROVIDER_PRESETS = [
  { name: "QQ 邮箱", host: "smtp.qq.com", port: 465, ssl: true, placeholder: "your_qq@qq.com", authTip: "请使用 QQ 邮箱设置中生成的 16位 POP3/SMTP 授权码" },
  { name: "163 网易", host: "smtp.163.com", port: 465, ssl: true, placeholder: "your_email@163.com", authTip: "请使用 163 邮箱设置中开启 SMTP 生成的客户端授权密码" },
  { name: "Gmail", host: "smtp.gmail.com", port: 587, ssl: false, placeholder: "your_account@gmail.com", authTip: "请在 Google 账户中开启两步验证并生成「应用专用密码」" },
  { name: "Outlook", host: "smtp.office365.com", port: 587, ssl: false, placeholder: "your_account@outlook.com", authTip: "使用微软账号密码或应用授权密码" },
  { name: "自建 SMTP", host: "smtp.yourcompany.com", port: 465, ssl: true, placeholder: "alerts@yourcompany.com", authTip: "使用自建企业邮件服务器 SMTP 账号密码" }
];

// 动态变量库 (全量参数支持)
const TEMPLATE_VARIABLES = [
  { key: "{{RULE_NAME}}", label: "规则名称", example: "全网 CPU 使用率超载" },
  { key: "{{SEVERITY}}", label: "严重等级", example: "P0 紧急 (Critical)" },
  { key: "{{METRIC}}", label: "监控指标", example: "host.cpu.usage (%)" },
  { key: "{{THRESHOLD}}", label: "触发阈值", example: "> 90% (持续 5m)" },
  { key: "{{VALUE}}", label: "采样峰值", example: "94.2%" },
  { key: "{{SERVER_NAME}}", label: "主机名称", example: "edge-tok-01" },
  { key: "{{SERVER_ID}}", label: "主机 ID", example: "srv-tok-01" },
  { key: "{{SERVER_GROUP}}", label: "业务分组", example: "东京机房 · 核心网关组" },
  { key: "{{SERVER_IPV4}}", label: "IPv4 地址", example: "104.28.19.45" },
  { key: "{{SERVER_IPV6}}", label: "IPv6 地址", example: "2400:cb00:2048:1::c629:d7a2" },
  { key: "{{TRAFFIC_USED}}", label: "已用流量", example: "3.42 TB" },
  { key: "{{TRAFFIC_TOTAL}}", label: "总流量配额", example: "10.00 TB" },
  { key: "{{TRAFFIC_USAGE_PERCENT}}", label: "流量使用率", example: "34.2%" },
  { key: "{{TIME}}", label: "触发时间", example: "2026-08-25 17:30:00" },
  { key: "{{MESSAGE}}", label: "诊断正文", example: "连续 5 分钟 CPU 达到 94.2% 超出 90% 安全水位" }
];

const CHANNEL_PRESETS: Array<{
  type: ChannelType;
  label: string;
  sublabel: string;
  desc: string;
  defaultName: string;
  icon: typeof Globe;
}> = [
  {
    type: "email",
    label: "Email 邮件通知",
    sublabel: "SMTP · 发信服务与收件人",
    desc: "支持 QQ/163/Gmail/自建 SMTP 发信，可自定义主题、HTML/Markdown 正文与多收件人",
    defaultName: "核心服务器故障应急邮件组",
    icon: Mail
  },
  {
    type: "webhook",
    label: "HTTP Webhook",
    sublabel: "Webhook · REST API POST",
    desc: "支持自定义 POST 端点、Header Token 鉴权头与自定义 Body JSON 参数",
    defaultName: "生产环境自动化 Webhook 接口",
    icon: Globe
  },
  {
    type: "telegram",
    label: "Telegram Bot",
    sublabel: "TG Bot · 频道/私聊",
    desc: "配置 Bot Token 与 Chat ID，支持官方 API 及自建反向代理",
    defaultName: "Smalux 运维 Telegram 报警机器人",
    icon: Bot
  },
  {
    type: "js",
    label: "JavaScript 脚本",
    sublabel: "JS Handler · 自定义逻辑",
    desc: "编写动态 JavaScript 代码，自定义消息转换与多端转发分发",
    defaultName: "自定义 JS 告警转换与中转脚本",
    icon: Code2
  }
];

export function NotificationChannelDialog({ open, onOpenChange, onSuccess }: NotificationChannelDialogProps) {
  const createChannel = useCreateChannel();

  const [type, setType] = useState<ChannelType>("email");
  const [name, setName] = useState("");

  // 1. Email SMTP 结构化字段
  const [smtpHost, setSmtpHost] = useState("smtp.qq.com");
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSsl, setSmtpSsl] = useState(true);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [emailReceivers, setEmailReceivers] = useState("");
  const [emailSubject, setEmailSubject] = useState(DEFAULT_EMAIL_SUBJECT);
  const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_BODY);
  const [emailPreviewMode, setEmailPreviewMode] = useState<"visual" | "html">("visual");

  // 2. HTTP Webhook 结构化字段: 端点 + Header Token + Body JSON 参数
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookHeaderToken, setWebhookHeaderToken] = useState("");
  const [webhookBodyJson, setWebhookBodyJson] = useState(DEFAULT_WEBHOOK_JSON);

  // 3. Telegram Bot 拆分字段
  const [tgApiBase, setTgApiBase] = useState("https://api.telegram.org");
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");

  // 4. JavaScript Code
  const [jsCode, setJsCode] = useState(JS_SAMPLE_TEMPLATE);

  // 5. Telegram 通用自定义消息模板
  const [template, setTemplate] = useState(DEFAULT_MARKDOWN_TEMPLATE);

  const selectedPreset = CHANNEL_PRESETS.find((p) => p.type === type) || CHANNEL_PRESETS[0];

  useEffect(() => {
    if (open) {
      if (!name) {
        setName(selectedPreset.defaultName);
      }
    }
  }, [open, type]);

  const handleSelectType = (preset: typeof CHANNEL_PRESETS[0]) => {
    setType(preset.type);
    if (!name || CHANNEL_PRESETS.some((p) => p.defaultName === name)) {
      setName(preset.defaultName);
    }
  };

  // 一键切换 SMTP 服务商预设
  const handleApplySmtpPreset = (p: typeof SMTP_PROVIDER_PRESETS[0]) => {
    setSmtpHost(p.host);
    setSmtpPort(p.port);
    setSmtpSsl(p.ssl);
    if (!smtpUser || SMTP_PROVIDER_PRESETS.some((item) => item.placeholder === smtpUser)) {
      setSmtpUser(p.placeholder);
    }
    toast.info(`已应用 ${p.name} SMTP 发信服务器配置`);
  };

  const handleFillEmailExample = () => {
    setSmtpHost("smtp.qq.com");
    setSmtpPort(465);
    setSmtpSsl(true);
    setSmtpUser("alerts_bot@qq.com");
    setSmtpPass("abcdefghijklmnop");
    setEmailReceivers("admin@smalux.internal, sre-duty@smalux.internal");
    setEmailSubject(DEFAULT_EMAIL_SUBJECT);
    setEmailBody(DEFAULT_EMAIL_BODY);
    toast.info("已填入完整的 SMTP 邮件发信与收件人示例");
  };

  const handleFillWebhookExample = () => {
    setWebhookUrl("https://api.yourcompany.com/v1/webhook/alerts");
    setWebhookHeaderToken("Bearer sk_live_9a8b7c6d5e4f3a2b1c");
    setWebhookBodyJson(DEFAULT_WEBHOOK_JSON);
    toast.info("已填入标准 Webhook 端点与鉴权参数示例");
  };

  const handleFillTgExample = () => {
    setTgApiBase("https://api.telegram.org");
    setTgBotToken("7281928391:AAE_x9AbCdEfGhIjKlMnOpQrStUvWxYz");
    setTgChatId("-10082918234");
    toast.info("已填入 Telegram Bot 示例参数");
  };

  const handleFillJsExample = () => {
    setJsCode(JS_SAMPLE_TEMPLATE);
    toast.info("已载入 JavaScript 脚本模板");
  };

  // 插入动态变量
  const handleInsertVariable = (variableKey: string) => {
    if (type === "webhook") {
      setWebhookBodyJson((prev) => `${prev.trimEnd()}\n  // 变量: "${variableKey}"`);
    } else if (type === "email") {
      setEmailBody((prev) => `${prev}\n${variableKey}`);
    } else {
      setTemplate((prev) => `${prev} ${variableKey}`);
    }
    toast.success(`已插入变量 ${variableKey}`);
  };

  // 实时模拟渲染模板 (Telegram)
  const previewRenderedMessage = useMemo(() => {
    if (!template.trim()) return "（模板为空）";
    let res = template;
    TEMPLATE_VARIABLES.forEach((v) => {
      res = res.replaceAll(v.key, v.example);
    });
    return res;
  }, [template]);

  // 实时模拟渲染 Email 主题
  const previewRenderedEmailSubject = useMemo(() => {
    if (!emailSubject.trim()) return "（无主题）";
    let res = emailSubject;
    TEMPLATE_VARIABLES.forEach((v) => {
      res = res.replaceAll(v.key, v.example);
    });
    return res;
  }, [emailSubject]);

  // 实时模拟渲染 Email 正文 (替换全量动态变量)
  const previewRenderedEmailBody = useMemo(() => {
    if (!emailBody.trim()) return "<p style='color:#94a3b8;font-size:12px;'>（邮件正文为空）</p>";
    let res = emailBody;
    TEMPLATE_VARIABLES.forEach((v) => {
      res = res.replaceAll(v.key, v.example);
    });
    return res;
  }, [emailBody]);

  // 实时模拟渲染 Webhook Body JSON
  const previewRenderedWebhookBody = useMemo(() => {
    if (!webhookBodyJson.trim()) return "{}";
    let res = webhookBodyJson;
    TEMPLATE_VARIABLES.forEach((v) => {
      res = res.replaceAll(v.key, v.example);
    });
    return res;
  }, [webhookBodyJson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || selectedPreset.defaultName;

    let finalEndpoint = "";
    let finalHeaders: string | undefined = undefined;
    let finalTemplate: string | undefined = undefined;

    if (type === "email") {
      if (!smtpHost.trim()) {
        toast.error("请输入 SMTP 发信服务器主机");
        return;
      }
      if (!smtpUser.trim()) {
        toast.error("请输入发信人邮箱账号");
        return;
      }
      if (!smtpPass.trim()) {
        toast.error("请输入发件人授权码或密码");
        return;
      }
      if (!emailReceivers.trim()) {
        toast.error("请输入至少一个接收告警的收件人邮箱");
        return;
      }

      // 将 SMTP 发信配置结构化存储在 endpoint (JSON 或规范化配置字串)
      const smtpConfig = {
        host: smtpHost.trim(),
        port: smtpPort,
        ssl: smtpSsl,
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        receivers: emailReceivers.trim()
      };
      finalEndpoint = `smtp://${smtpUser.trim()}@${smtpHost.trim()}:${smtpPort}?to=${encodeURIComponent(emailReceivers.trim())}&ssl=${smtpSsl}`;
      finalHeaders = emailSubject.trim() || undefined; // 存储主题模板
      finalTemplate = emailBody.trim() || undefined; // 存储正文模板
    } else if (type === "webhook") {
      if (!webhookUrl.trim()) {
        toast.error("请输入有效的 Webhook POST 端点 URL");
        return;
      }
      finalEndpoint = webhookUrl.trim();
      finalHeaders = webhookHeaderToken.trim() || undefined;
      finalTemplate = webhookBodyJson.trim() || undefined;
    } else if (type === "telegram") {
      if (!tgBotToken.trim()) {
        toast.error("请输入 Telegram Bot Token");
        return;
      }
      if (!tgChatId.trim()) {
        toast.error("请输入 Telegram Chat ID");
        return;
      }
      const base = (tgApiBase.trim() || "https://api.telegram.org").replace(/\/+$/, "");
      finalEndpoint = `${base}/bot${tgBotToken.trim()}/sendMessage?chat_id=${tgChatId.trim()}`;
      finalTemplate = template.trim() || undefined;
    } else if (type === "js") {
      if (!jsCode.trim()) {
        toast.error("请输入有效的 JavaScript 脚本代码");
        return;
      }
      finalEndpoint = jsCode.trim();
    }

    try {
      await createChannel.mutateAsync({
        name: finalName,
        type,
        endpoint: finalEndpoint,
        headers: finalHeaders,
        template: finalTemplate
      });
      toast.success(`通知渠道「${finalName}」配置成功`);
      onOpenChange(false);
      onSuccess?.(finalName);
      setName("");
      setWebhookUrl("");
      setWebhookHeaderToken("");
      setTgBotToken("");
      setTgChatId("");
      setEmailReceivers("");
      setSmtpPass("");
    } catch (err: any) {
      toast.error(err?.message || "创建通知渠道失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl font-mono max-h-[92vh] flex flex-col">
        {/* 顶部 Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-xs">
              <Send className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>配置通知推送渠道</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {type.toUpperCase()}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                支持结构化 SMTP 邮件、Webhook (POST+Token+JSON)、Telegram Bot 与 JS 脚本
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 内容表单 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs select-none">
          {/* ① 选择渠道类型：4 张可视化卡片 */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span className="flex size-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white font-bold">1</span>
              <span>选择通知渠道类型 (Channel Type)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHANNEL_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = type === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleSelectType(preset)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 group ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10 text-foreground ring-1 ring-cyan-500/40 shadow-sm"
                        : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg border shrink-0 ${
                        isSelected ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-muted border-border/60 text-muted-foreground"
                      }`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <span>{preset.label}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground/80 line-clamp-2 mt-0.5 leading-relaxed">
                          {preset.desc}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="size-4 rounded-full bg-cyan-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ② 渠道可读名称 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white font-bold">2</span>
                <span>渠道名称 *</span>
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">便于识别的通知渠道标识</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedPreset.defaultName}
              className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs"
            />
          </div>

          {/* ③ 专有参数配置区域 */}
          <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-muted/20">
            {/* ─────────── ✉️ Email 邮件专属 (SMTP 发信网关 + 身份认证 + 收件人) ─────────── */}
            {type === "email" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="flex size-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white font-bold">3</span>
                    <span>SMTP 邮件发信服务配置 (Sender Gateway)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillEmailExample}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" /> 填入完整示例
                  </button>
                </div>

                {/* 1. 常用服务商一键快选 */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-muted-foreground font-semibold">常用邮件服务商一键快选:</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SMTP_PROVIDER_PRESETS.map((p) => {
                      const isMatch = smtpHost === p.host;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleApplySmtpPreset(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                            isMatch
                              ? "bg-amber-500/15 border-amber-500/50 text-amber-400 font-bold"
                              : "bg-card border-border/60 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SMTP 服务器与端口 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Server className="size-3 text-amber-400" /> SMTP 服务器主机 *
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="例如: smtp.qq.com"
                      className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-semibold flex items-center justify-between">
                      <span>端口 *</span>
                      <button
                        type="button"
                        onClick={() => setSmtpSsl(!smtpSsl)}
                        className={`text-[10px] px-1 rounded cursor-pointer ${
                          smtpSsl ? "bg-emerald-500/10 text-emerald-400 font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {smtpSsl ? "SSL 加密 (465)" : "TLS/STARTTLS (587)"}
                      </button>
                    </label>
                    <input
                      type="number"
                      required
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="465"
                      className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* 3. 发件人邮箱与授权码/密码 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Mail className="size-3 text-amber-400" /> 发件人邮箱账号 *
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="例如: alert-bot@qq.com"
                      className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <KeyRound className="size-3 text-amber-400" /> 发信授权码 / 密码 *
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-0.5"
                      >
                        {showPass ? <Unlock className="size-2.5" /> : <Lock className="size-2.5" />}
                        <span>{showPass ? "隐藏" : "显示"}</span>
                      </button>
                    </label>
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="邮箱生成的专属 SMTP 授权码"
                      className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* 4. 接收告警的目标邮箱列表 (收件人) */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <label className="text-muted-foreground font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1 text-foreground font-bold">
                      <Inbox className="size-3 text-cyan-400" /> 接收告警的目标邮箱列表 (收件人) *
                    </span>
                    <span className="text-[10px] text-muted-foreground">多个邮箱以英文逗号 (,) 分隔</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={emailReceivers}
                    onChange={(e) => setEmailReceivers(e.target.value)}
                    placeholder="admin@smalux.com, ops-duty@company.com, devops@company.com"
                    className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* 5. 自定义邮件主题与正文模板 */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground font-semibold flex items-center gap-1 text-foreground font-bold">
                      <span>邮件主题与 HTML 正文模板</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">支持动态变量插值</span>
                  </div>

                  {/* 变量快捷插入药丸 */}
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => handleInsertVariable(v.key)}
                        className="px-2 py-1 rounded-md bg-muted/40 hover:bg-cyan-500/10 border border-border/60 hover:border-cyan-500/40 text-muted-foreground hover:text-cyan-400 text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                        title={`示例值: ${v.example}`}
                      >
                        <code className="text-cyan-400 font-bold">{v.key}</code>
                        <span className="text-muted-foreground/80">({v.label})</span>
                      </button>
                    ))}
                  </div>

                  {/* 邮件主题输入 */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">邮件主题 (Subject):</div>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder={DEFAULT_EMAIL_SUBJECT}
                      className="w-full h-8 px-2.5 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* 邮件正文输入 */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">邮件正文 (HTML/Text Body):</div>
                    <textarea
                      rows={6}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder={DEFAULT_EMAIL_BODY}
                      className="w-full p-2.5 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* 实时邮件发信预览 (包含发信参数、主题与真实 HTML 正文视口) */}
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <Eye className="size-3" /> 实际发信参数与邮件正文效果预览:
                    </div>
                    <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded border border-border/60 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setEmailPreviewMode("visual")}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          emailPreviewMode === "visual" ? "bg-amber-500 text-white font-bold" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🎨 视觉渲染效果
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailPreviewMode("html")}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          emailPreviewMode === "html" ? "bg-amber-500 text-white font-bold" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        📄 HTML 源码
                      </button>
                    </div>
                  </div>

                  {/* 邮件信头元数据 */}
                  <div className="text-[11px] font-mono text-foreground/90 leading-relaxed bg-background/90 p-2.5 rounded-lg border border-border/40 space-y-1">
                    <div><span className="text-muted-foreground">发件服务器: </span><span className="text-foreground">{smtpUser || "alert-bot@qq.com"}</span> (via {smtpHost}:{smtpPort} · {smtpSsl ? "SSL" : "TLS"})</div>
                    <div><span className="text-muted-foreground">目标收件人: </span><span className="text-cyan-400 font-bold">{emailReceivers || "admin@smalux.internal"}</span></div>
                    <div><span className="text-muted-foreground">邮件主题 (Subject): </span><span className="text-amber-400 font-bold">{previewRenderedEmailSubject}</span></div>
                  </div>

                  {/* 邮件正文渲染预览视口 */}
                  <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
                    <div className="px-2.5 py-1 bg-muted/40 border-b border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
                      <span>邮件正文预览视口 (Live Email Body)</span>
                      <span>已自动插值当前主机实时参数</span>
                    </div>

                    {emailPreviewMode === "visual" ? (
                      <div className="p-3 max-h-64 overflow-y-auto bg-slate-900/40 select-text">
                        <div
                          className="prose prose-invert max-w-none text-xs"
                          dangerouslySetInnerHTML={{ __html: previewRenderedEmailBody }}
                        />
                      </div>
                    ) : (
                      <pre className="p-3 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-64 overflow-y-auto bg-background select-text">
                        {previewRenderedEmailBody}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────── 🌐 HTTP Webhook 专属 (POST 端点 + Header Token + Body JSON 参数) ─────────── */}
            {type === "webhook" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="flex size-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white font-bold">3</span>
                    <span>HTTP Webhook (POST) 参数配置</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillWebhookExample}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" /> 填入完整示例
                  </button>
                </div>

                {/* 1. POST 请求端点 URL */}
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Globe className="size-3 text-cyan-400" /> Webhook 端点 URL (POST 请求地址) *
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold">METHOD: POST</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://api.yourcompany.com/webhook/alerts"
                    className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* 2. Header Token 鉴权头 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground font-semibold flex items-center gap-1">
                      <KeyRound className="size-3 text-cyan-400" /> Header Token / 鉴权头 (可选)
                    </label>
                    <div className="flex items-center gap-1">
                      {[
                        { label: "Bearer Token", val: "Bearer " },
                        { label: "X-Token", val: "X-Webhook-Token: " }
                      ].map((h) => (
                        <button
                          key={h.label}
                          type="button"
                          onClick={() => setWebhookHeaderToken(h.val)}
                          className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground hover:text-foreground cursor-pointer border border-border/60"
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={webhookHeaderToken}
                    onChange={(e) => setWebhookHeaderToken(e.target.value)}
                    placeholder="例如: Bearer sk_live_xxxxxx 或 X-Token: my-key-123 (可留空)"
                    className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono placeholder:text-muted-foreground/50"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    系统发起 POST 时会自动携带 <code>Content-Type: application/json</code> 以及此 Header Token。
                  </div>
                </div>

                {/* 3. POST 请求参数 (Body JSON 结构) */}
                <div className="space-y-2 pt-1 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Braces className="size-3 text-cyan-400" /> POST Body 请求体参数 (JSON 格式) *
                    </label>
                    <span className="text-[10px] text-muted-foreground">支持动态变量替换</span>
                  </div>

                  {/* 变量快捷插入药丸 */}
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => handleInsertVariable(v.key)}
                        className="px-2 py-1 rounded-md bg-muted/40 hover:bg-cyan-500/10 border border-border/60 hover:border-cyan-500/40 text-muted-foreground hover:text-cyan-400 text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                        title={`示例值: ${v.example}`}
                      >
                        <code className="text-cyan-400 font-bold">{v.key}</code>
                        <span className="text-muted-foreground/80">({v.label})</span>
                      </button>
                    ))}
                  </div>

                  <textarea
                    required
                    rows={8}
                    value={webhookBodyJson}
                    onChange={(e) => setWebhookBodyJson(e.target.value)}
                    placeholder={DEFAULT_WEBHOOK_JSON}
                    className="w-full p-2.5 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
                  />
                </div>

                {/* 4. 实时 HTTP 请求模拟抓包预览 */}
                <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 space-y-1.5">
                  <div className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                    <Eye className="size-3" /> 实际外发 HTTP POST 请求预览:
                  </div>
                  <pre className="text-[11px] font-mono text-foreground/90 whitespace-pre-wrap break-all leading-relaxed bg-background/80 p-2.5 rounded border border-border/40">
                    <span className="text-cyan-400 font-bold">POST </span>{webhookUrl || "https://api.yourcompany.com/webhook/alerts"}{"\n"}
                    <span className="text-muted-foreground">Content-Type: application/json</span>{"\n"}
                    {webhookHeaderToken ? (
                      <><span className="text-sky-400 font-semibold">{webhookHeaderToken.includes(":") ? webhookHeaderToken : `Authorization: ${webhookHeaderToken}`}</span>{"\n"}</>
                    ) : null}
                    {"\n"}{previewRenderedWebhookBody}
                  </pre>
                </div>
              </div>
            )}

            {/* ─────────── 🤖 Telegram Bot 专属 ─────────── */}
            {type === "telegram" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="flex size-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white font-bold">3</span>
                    <span>Telegram Bot 专有参数配置</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillTgExample}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" /> 填入示例参数
                  </button>
                </div>

                {/* 1. API 基础端点 (支持反代) */}
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Server className="size-3 text-sky-400" /> API Base URL (端点服务地址)
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">默认为官方，国内/内网节点支持填写自建反代</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tgApiBase}
                    onChange={(e) => setTgApiBase(e.target.value)}
                    placeholder="https://api.telegram.org 或 https://tg.yourproxy.com"
                    className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500"
                  />
                </div>

                {/* 2. Bot Token & 3. Chat ID 双列 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Shield className="size-3 text-sky-400" /> Bot Token (密钥) *
                    </label>
                    <input
                      type="text"
                      required
                      value={tgBotToken}
                      onChange={(e) => setTgBotToken(e.target.value)}
                      placeholder="例如: 72819283:AAExxxxx"
                      className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-semibold flex items-center gap-1">
                      <MessageSquare className="size-3 text-sky-400" /> Chat ID (群组/频道 ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={tgChatId}
                      onChange={(e) => setTgChatId(e.target.value)}
                      placeholder="例如: -100829182 或 12345678"
                      className="w-full h-8.5 px-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* 合成预览条 */}
                <div className="p-2.5 rounded-lg bg-card/70 border border-border/60 text-[10px] text-muted-foreground font-mono truncate">
                  <span className="text-sky-400 font-bold">最终请求: </span>
                  {tgApiBase.replace(/\/+$/, "")}/bot{tgBotToken || "<TOKEN>"}/sendMessage?chat_id={tgChatId || "<CHAT_ID>"}
                </div>
              </div>
            )}

            {/* ─────────── ⚡ JavaScript 专属 (async function sendEvent(event)) ─────────── */}
            {type === "js" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="flex size-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white font-bold">3</span>
                    <span>JavaScript 自定义分发函数 (async function sendEvent(event)) *</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillJsExample}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" /> 载入标准示例
                  </button>
                </div>

                {/* event 入参结构与字段字典说明面板 */}
                <div className="space-y-1.5 p-3 rounded-lg border border-border/60 bg-card/60">
                  <div className="text-[11px] text-foreground font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="size-3.5 text-cyan-400" />
                      <span>入参 <code>event</code> 对象字段字典与类型说明</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">点击字段名可快捷复制</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-[10px] font-mono pt-1">
                    {JS_EVENT_PROPERTIES.map((p) => (
                      <div
                        key={p.prop}
                        onClick={() => {
                          navigator.clipboard.writeText(p.prop);
                          toast.success(`已复制 ${p.prop} 到剪贴板`);
                        }}
                        className="p-1.5 rounded bg-muted/40 hover:bg-cyan-500/10 border border-border/40 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between group"
                        title={`点击复制 ${p.prop} (示例: ${p.example})`}
                      >
                        <div className="truncate min-w-0">
                          <span className="text-cyan-400 font-bold group-hover:text-cyan-300">{p.prop}</span>
                          <span className="text-muted-foreground ml-1">({p.label})</span>
                        </div>
                        <Copy className="size-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* JS 代码编辑框 */}
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                    <span>JavaScript 代码编辑:</span>
                    <span>支持 ES6+ / async-await / fetch</span>
                  </div>
                  <textarea
                    required
                    rows={10}
                    value={jsCode}
                    onChange={(e) => setJsCode(e.target.value)}
                    placeholder={JS_SAMPLE_TEMPLATE}
                    className="w-full p-3 rounded-lg border border-border/80 bg-background text-foreground text-xs outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    执行环境已内置 <code>fetch</code> 等标准 API，系统在发生告警时将自动执行 <code>sendEvent(event)</code>。
                  </div>
                </div>

                {/* 实时 event 入参对象仿真预览 */}
                <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 space-y-1.5">
                  <div className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                    <Eye className="size-3" /> 运行时传入 sendEvent(event) 的完整 event 数据结构预览:
                  </div>
                  <pre className="text-[10px] font-mono text-foreground/90 whitespace-pre-wrap break-all leading-relaxed bg-background/80 p-2.5 rounded border border-border/40 max-h-48 overflow-y-auto">
{JSON.stringify(
  Object.fromEntries(
    JS_EVENT_PROPERTIES.map((p) => [p.prop.replace("event.", ""), p.example])
  ),
  null,
  2
)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ④ 自定义消息模板配置 (仅 Telegram 需要) */}
          {type === "telegram" && (
            <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-card/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="flex size-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white font-bold">4</span>
                  <span>自定义发送消息模板 (Message Template)</span>
                </label>

                {/* 快捷推荐模板切换 */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-muted-foreground text-[10px] mr-1">推荐预设:</span>
                  {[
                    { label: "Markdown 卡片", val: DEFAULT_MARKDOWN_TEMPLATE },
                    { label: "简洁单行", val: COMPACT_TEMPLATE }
                  ].map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => {
                        setTemplate(t.val);
                        toast.info(`已应用「${t.label}」模板`);
                      }}
                      className="px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-mono cursor-pointer border border-border/50"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 动态插值变量药丸选择栏 */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Plus className="size-3 text-cyan-400" /> 点击插入动态参数变量:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      className="px-2 py-1 rounded-md bg-muted/40 hover:bg-cyan-500/10 border border-border/60 hover:border-cyan-500/40 text-muted-foreground hover:text-cyan-400 text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                      title={`示例值: ${v.example}`}
                    >
                      <code className="text-cyan-400 font-bold">{v.key}</code>
                      <span className="text-muted-foreground/80">({v.label})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 模板文本编辑框 */}
              <div className="relative">
                <textarea
                  rows={6}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="输入自定义消息模板..."
                  className="w-full p-2.5 rounded-lg border border-border/80 bg-background text-foreground text-xs font-mono outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />
              </div>

              {/* 实时渲染预览框 */}
              <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 space-y-1.5">
                <div className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                  <Eye className="size-3" /> 最终推送到 {selectedPreset.label} 的实时渲染预览:
                </div>
                <pre className="text-[11px] font-mono text-foreground/90 whitespace-pre-wrap break-all leading-relaxed bg-background/60 p-2.5 rounded border border-border/40">
                  {previewRenderedMessage}
                </pre>
              </div>
            </div>
          )}
        </form>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 shrink-0 select-none">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs font-mono cursor-pointer"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createChannel.isPending}
            className="h-9 px-6 text-xs font-mono cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-sm"
          >
            {createChannel.isPending ? "创建中..." : "立即接入渠道"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
