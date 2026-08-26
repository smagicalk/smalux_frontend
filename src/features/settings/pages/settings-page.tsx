import { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  ScrollText,
  Settings,
  Palette,
  Database
} from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import {
  AccessTokensTab,
  AccountSecurityTab,
  AuditLogsTab,
  SystemConfigTab,
  AppearanceTab,
  DataBackupTab
} from "../components";

type SettingsTab = "access" | "account" | "audit" | "config" | "appearance" | "backup";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("access");

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="系统与安全设置"
        subtitle="统一管理 API 访问令牌、多因素认证与身份安全、全站审计日志、实例运行参数、公开状态大盘与数据备份"
      />

      <div className="flex-1 space-y-6 p-6">
        {/* 顶部现代化 Tab 导航栏 */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/80 pb-3">
          {[
            { key: "access" as const, label: "API 访问令牌", icon: KeyRound, desc: "Tokens & CI/CD" },
            { key: "account" as const, label: "账号与身份安全", icon: ShieldCheck, desc: "MFA & Passkey" },
            { key: "audit" as const, label: "操作审计日志", icon: ScrollText, desc: "Audit & Security" },
            { key: "config" as const, label: "系统配置与安全基线", icon: Settings, desc: "Configs & Baseline" },
            { key: "appearance" as const, label: "外观与公开状态页", icon: Palette, desc: "Themes & Status Page" },
            { key: "backup" as const, label: "数据与备份", icon: Database, desc: "Snapshots & Backups" }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-mono transition-all cursor-pointer select-none whitespace-nowrap ${isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  }`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: API 访问令牌 */}
        {activeTab === "access" && <AccessTokensTab />}

        {/* Tab 2: 账号与身份安全 */}
        {activeTab === "account" && <AccountSecurityTab />}

        {/* Tab 3: 操作审计日志 */}
        {activeTab === "audit" && <AuditLogsTab />}

        {/* Tab 4: 系统配置与安全基线 */}
        {activeTab === "config" && <SystemConfigTab />}

        {/* Tab 5: 外观与公开状态页 */}
        {activeTab === "appearance" && <AppearanceTab />}

        {/* Tab 6: 数据与备份 */}
        {activeTab === "backup" && <DataBackupTab />}
      </div>
    </div>
  );
}
