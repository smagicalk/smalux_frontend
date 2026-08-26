import { useState, useEffect } from "react";
import {
  BellRing,
  ShieldAlert,
  Sliders,
  Send,
  Plus,
  RotateCw
} from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { useAlerts } from "../hooks/use-alerts";
import { useNotifications } from "../hooks/use-notifications";
import {
  AlertsStatsBar,
  AlertIncidentsTab,
  AlertRulesTab,
  AlertRuleDialog,
  NotificationChannelsTab,
  NotificationChannelDialog
} from "../components";
import type { AlertRule } from "@/shared/api/methods";

export function AlertsPage() {
  const [activeTab, setActiveTab] = useState<"incidents" | "rules" | "channels">(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "channels" || tab === "rules" || tab === "incidents") return tab;
    return "incidents";
  });

  // Dialog states
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [channelDialogOpen, setChannelDialogOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("create") === "1" || params.get("createChannel") === "1";
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "channels" || tab === "rules" || tab === "incidents") {
        setActiveTab(tab);
      }
      if (params.get("create") === "1" || params.get("createChannel") === "1") {
        setChannelDialogOpen(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Queries
  const {
    data: alertsData,
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts
  } = useAlerts();

  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications
  } = useNotifications();

  const rules = alertsData?.rules ?? [];
  const history = alertsData?.history ?? [];
  const channels = notificationsData?.channels ?? [];
  const events = notificationsData?.events ?? [];

  const handleOpenCreateRule = () => {
    setEditingRule(null);
    setRuleDialogOpen(true);
  };

  const handleOpenEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setRuleDialogOpen(true);
  };

  const handleOpenCreateChannel = () => {
    setChannelDialogOpen(true);
  };

  const handleRefreshAll = () => {
    refetchAlerts();
    refetchNotifications();
  };

  // 未决告警数量角标
  const activeIncidentsCount = history.filter((h) => !h.resolvedAt).length;

  return (
    <div className="flex flex-col min-h-full">
      {/* 顶部 Page Header */}
      <PageHeader
        title="告警中心"
        subtitle="全集群指标阈值策略引擎、未决异常突发事件流与多渠道通知网关"
        icon={<BellRing className="size-4 text-primary" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshAll}
              className="h-8 px-3 text-xs font-mono cursor-pointer"
              title="刷新告警中心数据"
            >
              <RotateCw className={`size-3.5 mr-1.5 ${isLoadingAlerts || isLoadingNotifications ? "animate-spin text-primary" : ""}`} />
              <span>刷新</span>
            </Button>

            {activeTab === "channels" ? (
              <Button
                size="sm"
                onClick={handleOpenCreateChannel}
                className="h-8 px-3.5 text-xs font-mono cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>配置新渠道</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleOpenCreateRule}
                className="h-8 px-3.5 text-xs font-mono cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>新建策略规则</span>
              </Button>
            )}
          </div>
        }
      />

      {/* 主页面主体容器：增加标准全局边距 p-6 */}
      <div className="flex-1 space-y-6 p-6">
        {/* 1. 告警态势 HUD 统计卡片栏 */}
        <AlertsStatsBar
          rules={rules}
          history={history}
          channels={channels}
          events={events}
        />

        {/* 2. 现代 Segmented Tabs 选项卡导航 */}
        <div className="flex items-center rounded-xl border border-border/80 bg-muted/30 p-1 font-mono w-full sm:w-auto self-start">
          {[
            {
              key: "incidents" as const,
              label: "实时告警事件",
              icon: ShieldAlert,
              badge: activeIncidentsCount > 0 ? `${activeIncidentsCount} 待恢复` : undefined,
              badgeVariant: activeIncidentsCount > 0 ? "rose" : undefined
            },
            {
              key: "rules" as const,
              label: "告警策略规则",
              icon: Sliders,
              badge: `${rules.length} 规则`
            },
            {
              key: "channels" as const,
              label: "通知推送渠道",
              icon: Send,
              badge: `${channels.length} 渠道`
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-card text-foreground shadow-sm font-bold border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    tab.badgeVariant === "rose"
                      ? "bg-rose-500/20 text-rose-400 font-bold animate-pulse"
                      : isActive
                      ? "bg-muted text-foreground"
                      : "bg-muted/60 text-muted-foreground"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Tab 页面内容 */}
        {activeTab === "incidents" && (
          <AlertIncidentsTab
            history={history}
            isLoading={isLoadingAlerts}
            onRefresh={refetchAlerts}
          />
        )}

        {activeTab === "rules" && (
          <AlertRulesTab
            rules={rules}
            isLoading={isLoadingAlerts}
            onRefresh={refetchAlerts}
            onOpenCreate={handleOpenCreateRule}
            onOpenEdit={handleOpenEditRule}
          />
        )}

        {activeTab === "channels" && (
          <NotificationChannelsTab
            channels={channels}
            events={events}
            rules={rules}
            isLoading={isLoadingNotifications}
            onRefresh={refetchNotifications}
            onOpenCreate={handleOpenCreateChannel}
          />
        )}
      </div>

      {/* 4. 新建/编辑告警规则弹窗 */}
      <AlertRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        editingRule={editingRule}
      />

      {/* 5. 新建通知渠道弹窗 */}
      <NotificationChannelDialog
        open={channelDialogOpen}
        onOpenChange={setChannelDialogOpen}
      />
    </div>
  );
}
