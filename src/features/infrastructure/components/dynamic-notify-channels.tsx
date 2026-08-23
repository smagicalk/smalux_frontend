import React, { useState, useRef, useEffect } from "react";
import {
  Mail,
  Webhook,
  Send,
  Bot,
  MessageSquare,
  Globe,
  Radio,
  Sliders,
  Check,
  ChevronDown,
  X,
  PhoneCall,
  BellRing,
  Info
} from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";

export interface NotifyChannelItem {
  id: string;
  name: string;
  type: "email" | "webhook" | "telegram" | "feishu" | "dingtalk" | "discord" | "sms" | "custom";
  target?: string;
  enabled: boolean;
}

// Global Notifiers pool defined in Alert Center
export const GLOBAL_ALERT_NOTIFIERS: Omit<NotifyChannelItem, "enabled">[] = [
  {
    id: "nc-email",
    name: "默认运维全员组",
    type: "email",
    target: "ops-team@smalux.com"
  },
  {
    id: "nc-webhook",
    name: "生产核心告警 Webhook",
    type: "webhook",
    target: "https://api.smalux.com/webhook/alerts"
  },
  {
    id: "nc-tg",
    name: "Telegram 应急运维群",
    type: "telegram",
    target: "@SmaluxOpsBot"
  },
  {
    id: "nc-feishu",
    name: "飞书基础设施告警群",
    type: "feishu",
    target: "https://open.feishu.cn/open-apis/bot/v2/hook/..."
  },
  {
    id: "nc-dingtalk",
    name: "钉钉值班告警群",
    type: "dingtalk",
    target: "https://oapi.dingtalk.com/robot/send?..."
  },
  {
    id: "nc-sms",
    name: "全天候短信/电话高危通知器",
    type: "sms",
    target: "全时段 SRE 值班应急线路"
  },
  {
    id: "nc-discord",
    name: "Discord SRE 告警频道",
    type: "discord",
    target: "https://discord.com/api/webhooks/..."
  }
];

export const DEFAULT_NOTIFY_CHANNELS: NotifyChannelItem[] = [
  {
    id: "nc-email",
    name: "默认运维全员组",
    type: "email",
    target: "ops-team@smalux.com",
    enabled: true
  },
  {
    id: "nc-webhook",
    name: "生产核心告警 Webhook",
    type: "webhook",
    target: "https://api.smalux.com/webhook/alerts",
    enabled: true
  },
  {
    id: "nc-feishu",
    name: "飞书基础设施告警群",
    type: "feishu",
    target: "https://open.feishu.cn/open-apis/bot/v2/hook/...",
    enabled: false
  }
];

const CHANNEL_TYPE_META: Record<
  NotifyChannelItem["type"],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  email: {
    label: "邮件",
    icon: Mail,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
  },
  webhook: {
    label: "Webhook",
    icon: Webhook,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  },
  telegram: {
    label: "Telegram",
    icon: Send,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20"
  },
  feishu: {
    label: "飞书",
    icon: MessageSquare,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  },
  dingtalk: {
    label: "钉钉",
    icon: Bot,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
  },
  sms: {
    label: "短信/电话",
    icon: PhoneCall,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
  },
  discord: {
    label: "Discord",
    icon: Globe,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
  },
  custom: {
    label: "自定义",
    icon: Radio,
    color: "text-muted-foreground bg-muted/30 border-border/60"
  }
};

interface DynamicNotifyChannelsProps {
  channels: NotifyChannelItem[];
  onChange: (channels: NotifyChannelItem[]) => void;
  compact?: boolean;
}

export function DynamicNotifyChannels({
  channels,
  onChange,
  compact = false
}: DynamicNotifyChannelsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleToggleEnable = (id: string, enabled: boolean) => {
    const updated = channels.map((c) => (c.id === id ? { ...c, enabled } : c));
    onChange(updated);
  };

  const handleSelectNotifier = (notifier: (typeof GLOBAL_ALERT_NOTIFIERS)[number]) => {
    const existingIndex = channels.findIndex((c) => c.id === notifier.id);
    if (existingIndex >= 0) {
      // Toggle off / remove from selection
      const updated = channels.filter((c) => c.id !== notifier.id);
      onChange(updated);
      toast.info(`已取消关联通知器「${notifier.name}」`);
    } else {
      // Add to selection and enable by default
      const newChannel: NotifyChannelItem = {
        ...notifier,
        enabled: true
      };
      onChange([...channels, newChannel]);
      toast.success(`已关联并开启通知器「${notifier.name}」`);
    }
  };

  const handleRemoveNotifier = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = channels.filter((c) => c.id !== id);
    onChange(updated);
    toast.info(`已取消关联通知器「${name}」`);
  };

  const activeCount = channels.filter((c) => c.enabled).length;

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground font-medium text-xs flex items-center gap-1.5">
            <Sliders className="size-3.5 text-primary" /> 告警通知器关联与派发策略 (Notifiers Dispatch)
          </label>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
            {activeCount}/{channels.length} 开启
          </Badge>
        </div>

        {/* Notifier Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="h-8 px-3 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            <BellRing className="size-3.5" />
            <span>选择关联通知器</span>
            <ChevronDown className={`size-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1.5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border/50 flex items-center justify-between">
                <span>告警中心已注册通知器</span>
                <span className="text-[10px] text-muted-foreground/70">点击选择/取消</span>
              </div>
              <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                {GLOBAL_ALERT_NOTIFIERS.map((notifier) => {
                  const isSelected = channels.some((c) => c.id === notifier.id);
                  const meta = CHANNEL_TYPE_META[notifier.type] || CHANNEL_TYPE_META.custom;
                  const Icon = meta.icon;

                  return (
                    <button
                      key={notifier.id}
                      type="button"
                      onClick={() => handleSelectNotifier(notifier)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/15 text-foreground font-medium"
                          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`size-6 rounded-md border flex items-center justify-center shrink-0 ${meta.color}`}>
                          <Icon className="size-3" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{notifier.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">{notifier.target || meta.label}</div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="size-4.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="size-3" />
                          </div>
                        ) : (
                          <div className="size-4.5 rounded-full border border-border/80" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Notifiers Cards */}
      {channels.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/10 text-center space-y-1.5">
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Info className="size-3.5 text-muted-foreground/80" />
            <span>当前主机未关联任何告警通知器</span>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            请点击右上角「选择关联通知器」从告警中心预设的通知器中选取，并在下方开启派发开关。
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-2.5 ${
            compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          }`}
        >
          {channels.map((channel) => {
            const meta = CHANNEL_TYPE_META[channel.type] || CHANNEL_TYPE_META.custom;
            const Icon = meta.icon;

            return (
              <div
                key={channel.id}
                className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all ${
                  channel.enabled
                    ? "border-primary/40 bg-card/90 shadow-2xs hover:border-primary/60"
                    : "border-border/60 bg-muted/15 opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`size-8 rounded-lg border flex items-center justify-center shrink-0 shadow-inner ${meta.color}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground truncate flex items-center gap-1.5">
                        <span className="truncate">{channel.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {channel.target || meta.label}
                      </div>
                    </div>
                  </div>

                  {/* Switch & Unbind Button */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={(checked) => handleToggleEnable(channel.id, checked)}
                    />
                    <button
                      type="button"
                      onClick={(e) => handleRemoveNotifier(channel.id, channel.name, e)}
                      className="size-6 rounded flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="取消关联此通知器"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground font-medium">{meta.label}</span>
                  <span
                    className={`font-mono font-medium ${
                      channel.enabled ? "text-emerald-400" : "text-muted-foreground"
                    }`}
                  >
                    {channel.enabled ? "● 派发中" : "○ 已静音 / 关闭"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
