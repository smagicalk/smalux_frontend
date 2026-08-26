import { useState, useRef, useEffect } from "react";
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Calendar,
  Clock,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Plus,
  Lock,
  Cloud,
  FileArchive,
  AlertTriangle,
  Play,
  RefreshCw,
  Server,
  FileCheck2,
  Check,
  Sparkles,
  Eraser,
  Activity,
  ScrollText,
  Bell,
  Terminal,
  Zap,
  Filter,
  Layers,
  Edit2,
  ExternalLink,
  Code2,
  ChevronDown,
  KeyRound,
  Cpu,
  Network,
  Radio,
  FileCode,
  Gauge,
  Save
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toaster";
import { TimePicker } from "@/shared/ui/time-picker";

import {
  useStorageStats,
  useBackupPlans,
  useCreateBackupPlan,
  useUpdateBackupPlan,
  useDeleteBackupPlan,
  useToggleBackupPlan,
  useRunBackupPlan,
  useBackups,
  useCreateBackup,
  useRestoreBackup,
  useDeleteBackup,
  usePruneBackups,
  useCleanData,
  useTestRemoteStorage
} from "@/features/settings/hooks/use-backup";
import { useSettings, useSaveSettings } from "@/features/settings/hooks/use-settings";
import type {
  BackupArchive,
  AutoBackupPlan,
  RemoteStorageConfig,
  StorageStats
} from "@/features/settings/mock/settings-mock";

export type { BackupArchive, AutoBackupPlan, RemoteStorageConfig, StorageStats };

interface CleanupTimeSelectorProps {
  category: "metrics" | "audit" | "alerts" | "tasks" | "apilogs";
  value: string;
  onChange: (val: string) => void;
}

/** 格式化生成人性化展示文本 */
function getCleanupDisplayLabel(value: string, category: "metrics" | "audit" | "alerts" | "tasks" | "apilogs"): string {
  if (value.startsWith("custom_")) {
    const parts = value.split("_");
    const num = parts[1] || "14";
    const unit = parts[2] === "h" ? "小时" : parts[2] === "m" ? "个月" : "天";
    return `自定义: 清理 ${num} ${unit}前`;
  }
  switch (value) {
    case "1h": return "清理 1 小时前 (保留近 1 小时)";
    case "6h": return "清理 6 小时前 (保留近 6 小时)";
    case "12h": return "清理 12 小时前 (保留近 12 小时)";
    case "1d": return "清理 1 天前 / 24h (保留近 24 小时)";
    case "3d": return "清理 3 天前 (保留近 3 天)";
    case "7": return "清理 7 天前 (保留近 1 周)";
    case "15": return "清理 15 天前 (保留近半月)";
    case "30": return `清理 30 天前 (保留近 1 个月${category === "metrics" || category === "apilogs" ? " · 推荐" : ""})`;
    case "60": return "清理 60 天前 (保留近 2 个月)";
    case "90": return `清理 90 天前 (保留近 1 季度${category === "audit" ? " · 推荐" : ""})`;
    case "180": return "清理 180 天前 (保留近半年)";
    case "365": return "清理 365 天前 (保留近 1 年 · 等保)";
    case "730": return "清理 730 天前 (保留近 2 年)";
    case "resolved_only": return "仅清理已解决告警 (推荐)";
    case "completed_all": return "清空已完成任务 (推荐)";
    case "only_revoked_tokens": return "仅清理失效Token与旧会话 (推荐)";
    case "all": return "⚠️ 清空全部历史记录";
    default: return `清理 ${value} 天前数据`;
  }
}

/** 美化的高性能分组 Tab 式弹层选择与自定义时段控制器 */
function CleanupTimeSelector({ category, value, onChange }: CleanupTimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tab: "short" | "standard" | "long" | "custom" | "all"
  const [activeTab, setActiveTab] = useState<"short" | "standard" | "long" | "custom" | "all">(() => {
    if (value.startsWith("custom_")) return "custom";
    if (["1h", "6h", "12h", "1d", "3d"].includes(value)) return "short";
    if (["180", "365", "730"].includes(value)) return "long";
    if (value === "all") return "all";
    return "standard";
  });

  const [customNum, setCustomNum] = useState(() => {
    if (value.startsWith("custom_")) return value.split("_")[1] || "14";
    return "14";
  });
  const [customUnit, setCustomUnit] = useState<"h" | "d" | "m">(() => {
    if (value.startsWith("custom_")) return (value.split("_")[2] as "h" | "d" | "m") || "d";
    return "d";
  });

  // 点击外部自动收起弹层
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectOption = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const applyCustom = (num: string, unit: "h" | "d" | "m") => {
    const clean = num.replace(/[^\d]/g, "") || "1";
    onChange(`custom_${clean}_${unit}`);
    setIsOpen(false);
  };

  const currentLabel = getCleanupDisplayLabel(value, category);
  const isCustom = value.startsWith("custom_");

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* 触发按钮 (Trigger Button) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8.5 w-full rounded-xl border transition-all px-3 flex items-center justify-between text-xs font-mono text-left cursor-pointer shadow-2xs ${
          isOpen
            ? "border-primary bg-background ring-2 ring-primary/20 text-foreground"
            : "border-border/80 bg-background/90 hover:border-primary/40 hover:bg-background text-foreground"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-1">
          {isCustom ? (
            <Sparkles className="size-3 text-primary shrink-0" />
          ) : ["1h", "6h", "12h", "1d", "3d"].includes(value) ? (
            <Zap className="size-3 text-amber-500 shrink-0" />
          ) : value === "all" ? (
            <AlertTriangle className="size-3 text-rose-500 shrink-0" />
          ) : (
            <Clock className="size-3 text-sky-500 shrink-0" />
          )}
          <span className="truncate text-xs font-medium" title={currentLabel}>
            {currentLabel}
          </span>
        </div>
        <ChevronDown
          className={`size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* 浮动选项弹层 (Floating Tabbed Popover Picker) */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-[330px] sm:w-[360px] z-50 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl p-2.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          {/* 顶栏分类 Tab 切换器 */}
          <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-muted/60 text-[11px] font-mono font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("short")}
              className={`py-1 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-0.5 ${
                activeTab === "short"
                  ? "bg-background text-amber-500 font-bold shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="size-2.5" /> 短期
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("standard")}
              className={`py-1 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-0.5 ${
                activeTab === "standard"
                  ? "bg-background text-sky-500 font-bold shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="size-2.5" /> 常规
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("long")}
              className={`py-1 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-0.5 ${
                activeTab === "long"
                  ? "bg-background text-indigo-500 font-bold shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="size-2.5" /> 长期
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`py-1 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-0.5 ${
                activeTab === "custom"
                  ? "bg-background text-primary font-bold shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-2.5" /> 自定义
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`py-1 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-0.5 ${
                activeTab === "all"
                  ? "bg-background text-rose-500 font-bold shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trash2 className="size-2.5" /> 全量
            </button>
          </div>

          {/* 分类内容区 (Tab Content) */}
          <div className="min-h-[115px] flex flex-col justify-center">
            {/* 1. 短期 Tab */}
            {activeTab === "short" && (
              <div className="space-y-1.5">
                <div className="text-[10px] text-muted-foreground px-1 font-mono">⚡ 适合突发产生的大量瞬时日志与打点时序：</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "1h", label: "1 小时前", desc: "保留近 1 小时" },
                    { id: "6h", label: "6 小时前", desc: "保留近 6 小时" },
                    { id: "12h", label: "12 小时前", desc: "保留近 12 小时" },
                    { id: "1d", label: "1 天前 / 24h", desc: "保留近 24 小时" },
                    { id: "3d", label: "3 天前", desc: "保留近 3 天数据" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectOption(item.id)}
                      className={`p-1.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between group ${
                        value === item.id
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                          : "border-border/60 hover:border-amber-500/30 hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-medium">{item.label}</div>
                        <div className="text-[9px] text-muted-foreground">{item.desc}</div>
                      </div>
                      {value === item.id && <Check className="size-3 text-amber-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 常规 Tab */}
            {activeTab === "standard" && (
              <div className="space-y-1.5">
                {category === "alerts" && (
                  <button
                    type="button"
                    onClick={() => selectOption("resolved_only")}
                    className={`w-full p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between group ${
                      value === "resolved_only"
                        ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                        : "border-border/60 hover:border-primary/30 hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-primary flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-primary" /> 仅清理已解决告警 (推荐)
                      </div>
                      <div className="text-[9px] text-muted-foreground">消除所有已解决流水，持续保留当前触发中的未决告警</div>
                    </div>
                    {value === "resolved_only" && <Check className="size-3 text-primary" />}
                  </button>
                )}

                {category === "tasks" && (
                  <button
                    type="button"
                    onClick={() => selectOption("completed_all")}
                    className={`w-full p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between group ${
                      value === "completed_all"
                        ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                        : "border-border/60 hover:border-primary/30 hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-primary flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-primary" /> 清空已完成任务 (推荐)
                      </div>
                      <div className="text-[9px] text-muted-foreground">清理已成功结束的历史任务日志，保留运行中或异常失败任务</div>
                    </div>
                    {value === "completed_all" && <Check className="size-3 text-primary" />}
                  </button>
                )}

                {category === "apilogs" && (
                  <button
                    type="button"
                    onClick={() => selectOption("only_revoked_tokens")}
                    className={`w-full p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between group ${
                      value === "only_revoked_tokens"
                        ? "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold"
                        : "border-border/60 hover:border-violet-500/30 hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-violet-500" /> 仅清理失效Token与旧会话 (推荐)
                      </div>
                      <div className="text-[9px] text-muted-foreground">保留活跃令牌的近期调用，仅清理已注销/过期Token流水与离线会话</div>
                    </div>
                    {value === "only_revoked_tokens" && <Check className="size-3 text-violet-500" />}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "7", label: "7 天前", desc: "保留最近 1 周" },
                    { id: "15", label: "15 天前", desc: "保留最近半个月" },
                    { id: "30", label: "30 天前 (推荐)", desc: "保留最近 1 个月" },
                    { id: "60", label: "60 天前", desc: "保留最近 2 个月" },
                    { id: "90", label: "90 天前 (1季度)", desc: "保留最近 1 季度" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectOption(item.id)}
                      className={`p-1.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between group ${
                        value === item.id
                          ? "border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold"
                          : "border-border/60 hover:border-sky-500/30 hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-medium">{item.label}</div>
                        <div className="text-[9px] text-muted-foreground">{item.desc}</div>
                      </div>
                      {value === item.id && <Check className="size-3 text-sky-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. 长期 Tab */}
            {activeTab === "long" && (
              <div className="space-y-1.5">
                <div className="text-[10px] text-muted-foreground px-1 font-mono">🏛️ 长期存档与超期合规审计日志清理：</div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: "180", label: "180 天前 (半年)", desc: "清理半年以上老旧数据，保留近 6 个月历史" },
                    { id: "365", label: "365 天前 (1 年 · 等保合规推荐)", desc: "满足网络安全等保 2.0 对日志保留 6 个月~1 年的合规要求" },
                    { id: "730", label: "730 天前 (2 年)", desc: "仅清理 2 年以上已归档的陈旧深冷历史流水" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectOption(item.id)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between group ${
                        value === item.id
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                          : "border-border/60 hover:border-indigo-500/30 hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-medium">{item.label}</div>
                        <div className="text-[9px] text-muted-foreground">{item.desc}</div>
                      </div>
                      {value === item.id && <Check className="size-3.5 text-indigo-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 自定义 Tab */}
            {activeTab === "custom" && (
              <div className="space-y-2 p-1">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex items-center flex-1 min-w-0">
                    <span className="absolute left-2.5 text-[10px] font-medium text-muted-foreground font-mono">清理</span>
                    <input
                      type="number"
                      min="1"
                      max="9999"
                      value={customNum}
                      onChange={(e) => setCustomNum(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="数值"
                      className="h-8 w-full pl-10 pr-2 py-1 text-xs font-mono font-semibold rounded-xl border border-primary/50 bg-background text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as "h" | "d" | "m")}
                    className="h-8 px-2 rounded-xl border border-border/80 bg-background text-xs font-mono font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                  >
                    <option value="h">小时前</option>
                    <option value="d">天前</option>
                    <option value="m">个月前</option>
                  </select>

                  <Button
                    size="sm"
                    onClick={() => applyCustom(customNum, customUnit)}
                    className="h-8 text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
                  >
                    应用
                  </Button>
                </div>

                {/* 快捷微标签 */}
                <div className="flex items-center gap-1 flex-wrap text-[9px] font-mono text-muted-foreground pt-0.5">
                  <span className="text-[9px] text-muted-foreground/70">快速填入:</span>
                  {[
                    { num: "6", unit: "h" as const, label: "6小时" },
                    { num: "12", unit: "h" as const, label: "12小时" },
                    { num: "3", unit: "d" as const, label: "3天" },
                    { num: "14", unit: "d" as const, label: "14天" },
                    { num: "45", unit: "d" as const, label: "45天" },
                    { num: "180", unit: "d" as const, label: "180天" }
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setCustomNum(chip.num);
                        setCustomUnit(chip.unit);
                        applyCustom(chip.num, chip.unit);
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-muted hover:bg-primary/15 hover:text-primary border border-border/50 transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. 全量清理 Tab */}
            {activeTab === "all" && (
              <div className="p-2 space-y-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <div className="text-xs font-bold text-rose-500 flex items-center justify-center gap-1">
                  <AlertTriangle className="size-3.5 text-rose-500" /> 高危操作：清空全部历史数据
                </div>
                <p className="text-[9px] text-muted-foreground">
                  将不保留任何历史条目，仅保留基础配置与空库结构。此操作无法撤销。
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectOption("all")}
                  className="w-full h-7.5 text-xs font-bold text-rose-500 border-rose-500/40 hover:bg-rose-500 hover:text-white cursor-pointer"
                >
                  <Trash2 className="size-3 mr-1" /> 确认选择清空全部
                </Button>
              </div>
            )}
          </div>

          {/* 底部信息条 */}
          <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span className="truncate">当前选择: <strong className="text-foreground">{currentLabel}</strong></span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground text-[10px] cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DataBackupTab() {
  // API Query Hooks (彻底脱离写死，统一走标准 RESTful 接口)
  const { data: storageStatsData } = useStorageStats();
  const { data: backupPlansData } = useBackupPlans();
  const { data: backupsData } = useBackups();

  const storageStats = storageStatsData || {
    dbSizeMb: 38.4,
    metricsSizeMb: 112.6,
    themesSizeMb: 4.8,
    auditSizeMb: 18.2,
    alertsSizeMb: 8.4,
    tasksSizeMb: 14.6
  };
  const backupPlans = backupPlansData?.plans || [];
  const backups = backupsData?.backups || [];

  // API Mutation Hooks
  const createPlanMutation = useCreateBackupPlan();
  const updatePlanMutation = useUpdateBackupPlan();
  const deletePlanMutation = useDeleteBackupPlan();
  const togglePlanMutation = useToggleBackupPlan();
  const runPlanMutation = useRunBackupPlan();
  const createBackupMutation = useCreateBackup();
  const restoreBackupMutation = useRestoreBackup();
  const deleteBackupMutation = useDeleteBackup();
  const pruneBackupsMutation = usePruneBackups();
  const cleanDataMutation = useCleanData();
  const testRemoteMutation = useTestRemoteStorage();

  // 系统全局存储与留存配置 (Settings API)
  const { data: settingsData, isLoading: isSettingsLoading } = useSettings();
  const saveSettingsMutation = useSaveSettings();
  const [retentionForm, setRetentionForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settingsData?.settings) {
      const map: Record<string, string> = {};
      settingsData.settings.forEach((s) => {
        map[s.key] = s.value;
      });
      setRetentionForm(map);
    }
  }, [settingsData]);

  const handleRetentionChange = (key: string, val: string) => {
    setRetentionForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveRetentionSettings = async () => {
    try {
      const updates = Object.entries(retentionForm).map(([key, value]) => ({
        key,
        value
      }));
      await saveSettingsMutation.mutateAsync(updates);
      toast.success("已成功保存数据保存时长与存储治理策略！");
    } catch (err: any) {
      toast.error(err.message || "保存留存策略失败");
    }
  };

  const handleResetRetentionSettings = () => {
    if (settingsData?.settings) {
      const map: Record<string, string> = {};
      settingsData.settings.forEach((s) => {
        map[s.key] = s.value;
      });
      setRetentionForm(map);
      toast.info("已重置为当前服务端保存的留存策略");
    }
  };

  // 左侧选中的任务过滤 ("manual" | plan.id)
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>("plan_daily_main");

  // 添加/编辑备份计划弹窗状态
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // 备份计划表单字段
  const [planName, setPlanName] = useState("");
  const [planStorageTarget, setPlanStorageTarget] = useState<"local" | "remote">("local"); // 本地/远程 二选一
  const [planTimeType, setPlanTimeType] = useState<"fixed" | "cron">("fixed");
  const [planFixedMode, setPlanFixedMode] = useState<"daily" | "interval" | "weekly">("daily");
  const [planFixedTime, setPlanFixedTime] = useState("03:00");
  const [planFixedIntervalHours, setPlanFixedIntervalHours] = useState("12");
  const [planWeeklyDays, setPlanWeeklyDays] = useState<string[]>(["0"]); // 支持周几多选，默认周日
  const [planCronExpr, setPlanCronExpr] = useState("0 3 * * *");
  const [planRetentionCount, setPlanRetentionCount] = useState<string>("14");
  const [planScope, setPlanScope] = useState<"all" | "core_only" | "core_and_audit" | "custom">("all");
  const [planCustomModules, setPlanCustomModules] = useState<string[]>([
    "core",
    "metrics",
    "audit",
    "alerts",
    "tasks",
    "apilogs",
    "themes"
  ]);
  const [planEncrypt, setPlanEncrypt] = useState(true);
  const [planRemoteType, setPlanRemoteType] = useState<"s3" | "webdav">("s3");

  // S3 远程配置字段
  const [s3Endpoint, setS3Endpoint] = useState("");
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3AccessKey, setS3AccessKey] = useState("");
  const [s3SecretKey, setS3SecretKey] = useState("");
  const [s3Prefix, setS3Prefix] = useState("/smalux-backups/");

  // WebDAV 远程配置字段
  const [webdavUrl, setWebdavUrl] = useState("");
  const [webdavUsername, setWebdavUsername] = useState("");
  const [webdavPassword, setWebdavPassword] = useState("");
  const [webdavPath, setWebdavPath] = useState("/backups/smalux/");

  const [isTestingRemote, setIsTestingRemote] = useState(false);

  // 切换星期多选
  const toggleWeeklyDay = (day: string) => {
    setPlanWeeklyDays((prev) => {
      const isSelected = prev.includes(day);
      let nextDays: string[];
      if (isSelected) {
        nextDays = prev.filter((d) => d !== day);
        if (nextDays.length === 0) {
          toast.info("已取消所有选中星期，已自动保留该天");
          return [day];
        }
      } else {
        nextDays = [...prev, day].sort();
      }
      const [h, m] = planFixedTime.split(":");
      setPlanCronExpr(`${parseInt(m, 10) || 0} ${parseInt(h, 10) || 4} * * ${nextDays.join(",")}`);
      return nextDays;
    });
  };

  // 手动创建备份弹窗
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [backupScope, setBackupScope] = useState<"all" | "core_only" | "core_and_audit" | "custom">("all");
  const [backupCustomModules, setBackupCustomModules] = useState<string[]>([
    "core",
    "metrics",
    "audit",
    "alerts",
    "tasks",
    "apilogs",
    "themes"
  ]);
  const [encryptBackup, setEncryptBackup] = useState(true);
  const [backupPassword, setBackupPassword] = useState("");
  const [backupNotes, setBackupNotes] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);

  // 还原确认弹窗
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupArchive | null>(null);
  const [restoreVerifyPassword, setRestoreVerifyPassword] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  // 清理备份弹窗
  const [pruneBackupDialogOpen, setPruneBackupDialogOpen] = useState(false);
  const [pruneBackupRule, setPruneBackupRule] = useState<"older_7d" | "older_30d" | "only_scheduled" | "all">("older_30d");

  // 手动数据清理状态
  const [cleaningMetricDays, setCleaningMetricDays] = useState<string>("30");
  const [cleaningAuditDays, setCleaningAuditDays] = useState<string>("90");
  const [cleaningAlertRule, setCleaningAlertRule] = useState<string>("resolved_only");
  const [cleaningTaskRule, setCleaningTaskRule] = useState<string>("30");
  const [cleaningApiLogsRule, setCleaningApiLogsRule] = useState<string>("30");

  const [activeCleaningKey, setActiveCleaningKey] = useState<string | null>(null);

  // 本地恢复上传文件引用
  const restoreFileRef = useRef<HTMLInputElement>(null);

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 打开新建备份计划弹窗
  const handleOpenCreatePlanDialog = () => {
    setEditingPlanId(null);
    setPlanName("");
    setPlanStorageTarget("local");
    setPlanTimeType("fixed");
    setPlanFixedMode("daily");
    setPlanFixedTime("03:00");
    setPlanFixedIntervalHours("12");
    setPlanWeeklyDays(["0"]);
    setPlanCronExpr("0 3 * * *");
    setPlanRetentionCount("14");
    setPlanScope("all");
    setPlanCustomModules(["core", "metrics", "audit", "alerts", "tasks", "apilogs", "themes"]);
    setPlanEncrypt(true);
    setPlanRemoteType("s3");
    setS3Endpoint("");
    setS3Bucket("");
    setS3AccessKey("");
    setS3SecretKey("");
    setS3Prefix("/smalux-backups/");
    setWebdavUrl("");
    setWebdavUsername("");
    setWebdavPassword("");
    setWebdavPath("/backups/smalux/");
    setPlanDialogOpen(true);
  };

  // 打开编辑备份计划弹窗
  const handleOpenEditPlanDialog = (plan: AutoBackupPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanStorageTarget(plan.enableRemote ? "remote" : "local");
    setPlanTimeType(plan.timeType);
    setPlanFixedMode(plan.fixedMode);
    setPlanFixedTime(plan.fixedTime);
    setPlanFixedIntervalHours(plan.fixedTime);
    setPlanCronExpr(plan.cronExpr);

    // 解析星期列表
    const cronParts = (plan.cronExpr || "").split(" ");
    if (cronParts.length === 5 && cronParts[4] !== "*") {
      const days = cronParts[4].split(",").map((s) => s.trim()).filter(Boolean);
      setPlanWeeklyDays(days.length > 0 ? days : ["0"]);
    } else {
      setPlanWeeklyDays(["0"]);
    }

    setPlanRetentionCount(String(plan.retentionCount));
    setPlanScope(
      plan.scope === "configs_only"
        ? "core_only"
        : (plan.scope as any) || "all"
    );
    setPlanCustomModules(
      plan.customModules || ["core", "metrics", "audit", "alerts", "tasks", "apilogs", "themes"]
    );
    setPlanEncrypt(plan.encrypt);

    if (plan.remoteConfig) {
      setPlanRemoteType(plan.remoteConfig.type);
      setS3Endpoint(plan.remoteConfig.endpoint || "");
      setS3Bucket(plan.remoteConfig.bucket || "");
      setS3AccessKey(plan.remoteConfig.accessKey || "");
      setS3SecretKey(plan.remoteConfig.secretKey || "");
      setS3Prefix(plan.remoteConfig.prefix || "/smalux-backups/");
      setWebdavUrl(plan.remoteConfig.serverUrl || "");
      setWebdavUsername(plan.remoteConfig.username || "");
      setWebdavPassword(plan.remoteConfig.password || "");
      setWebdavPath(plan.remoteConfig.remotePath || "/backups/smalux/");
    }

    setPlanDialogOpen(true);
  };

  // 测试远程存储
  const handleTestRemoteConnection = async () => {
    const isRemote = planStorageTarget === "remote";
    if (!isRemote) {
      toast.info("当前为本地存储模式，无需进行远程联通性校验");
      return;
    }

    if (planRemoteType === "s3") {
      if (!s3Bucket.trim()) {
        toast.error("请填写 S3 存储桶 Bucket 名称");
        return;
      }
    } else {
      if (!webdavUrl.trim()) {
        toast.error("请填写 WebDAV 服务器地址");
        return;
      }
    }

    setIsTestingRemote(true);
    try {
      const res = await testRemoteMutation.mutateAsync(
        planRemoteType === "s3"
          ? {
              type: "s3",
              endpoint: s3Endpoint.trim(),
              bucket: s3Bucket.trim(),
              accessKey: s3AccessKey.trim(),
              secretKey: s3SecretKey.trim(),
              prefix: s3Prefix.trim()
            }
          : {
              type: "webdav",
              serverUrl: webdavUrl.trim(),
              username: webdavUsername.trim(),
              password: webdavPassword.trim(),
              remotePath: webdavPath.trim()
            }
      );
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || "远程存储校验失败");
    } finally {
      setIsTestingRemote(false);
    }
  };

  // 保存备份计划 (新建或更新)
  const handleSavePlan = async () => {
    if (!planName.trim()) {
      toast.error("请输入备份计划名称");
      return;
    }

    const retentionNum = parseInt(planRetentionCount, 10) || 7;
    const isRemote = planStorageTarget === "remote";

    const remoteConfigObj: RemoteStorageConfig | undefined = isRemote
      ? planRemoteType === "s3"
        ? {
            type: "s3",
            endpoint: s3Endpoint.trim(),
            bucket: s3Bucket.trim(),
            accessKey: s3AccessKey.trim(),
            secretKey: s3SecretKey.trim(),
            prefix: s3Prefix.trim()
          }
        : {
            type: "webdav",
            serverUrl: webdavUrl.trim(),
            username: webdavUsername.trim(),
            password: webdavPassword.trim(),
            remotePath: webdavPath.trim()
          }
      : undefined;

    let computedCron = planCronExpr.trim();
    if (planTimeType === "fixed") {
      const [h, m] = planFixedTime.split(":");
      const hr = parseInt(h, 10) || 0;
      const min = parseInt(m, 10) || 0;
      if (planFixedMode === "daily") {
        computedCron = `${min} ${hr} * * *`;
      } else if (planFixedMode === "interval") {
        const intervalNum = parseInt(planFixedIntervalHours, 10) || 12;
        computedCron = `0 */${intervalNum} * * *`;
      } else if (planFixedMode === "weekly") {
        computedCron = `${min} ${hr} * * ${planWeeklyDays.join(",")}`;
      }
    }

    const planPayload = {
      name: planName.trim(),
      enabled: true,
      timeType: planTimeType,
      fixedMode: planFixedMode,
      fixedTime: planFixedMode === "interval" ? planFixedIntervalHours : planFixedTime,
      cronExpr: computedCron,
      retentionCount: retentionNum,
      enableRemote: isRemote,
      remoteConfig: remoteConfigObj,
      scope: planScope,
      customModules: planScope === "custom" ? planCustomModules : undefined,
      encrypt: planEncrypt
    };

    try {
      if (editingPlanId) {
        await updatePlanMutation.mutateAsync({ id: editingPlanId, plan: planPayload });
        toast.success(`已更新备份计划「${planPayload.name}」！`);
      } else {
        await createPlanMutation.mutateAsync(planPayload);
        toast.success(`已创建新自动备份计划「${planPayload.name}」！`);
      }
      setPlanDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "保存备份计划失败");
    }
  };

  // 切换计划开关
  const handleTogglePlan = async (id: string, enabled: boolean) => {
    try {
      await togglePlanMutation.mutateAsync({ id, enabled });
      toast.info(enabled ? "已启用该定时备份计划" : "已暂停该定时备份计划");
    } catch (err: any) {
      toast.error("更新计划状态失败");
    }
  };

  // 删除计划
  const handleDeletePlan = async (id: string) => {
    try {
      await deletePlanMutation.mutateAsync(id);
      toast.info("已删除该自动备份计划");
    } catch (err: any) {
      toast.error("删除备份计划失败");
    }
  };

  // 立即执行一次计划
  const handleRunPlanImmediately = async (plan: AutoBackupPlan) => {
    toast.loading(`正在触发执行计划「${plan.name}」...`);
    try {
      const res = await runPlanMutation.mutateAsync(plan.id);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || "执行备份计划失败");
    }
  };

  // 1. 创建即时备份快照
  const handleStartCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const created = await createBackupMutation.mutateAsync({
        scope: backupScope,
        customModules: backupScope === "custom" ? backupCustomModules : undefined,
        encrypt: encryptBackup,
        notes: backupNotes.trim() || "管理员手动快照"
      });
      setIsBackingUp(false);
      setCreateDialogOpen(false);
      setBackupNotes("");
      setBackupPassword("");
      toast.success(`备份快照「${created.filename}」创建成功并已归档！`);
    } catch (err: any) {
      setIsBackingUp(false);
      toast.error(err.message || "创建备份快照失败");
    }
  };

  // 2. 触发数据还原
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    setIsRestoring(true);
    try {
      await restoreBackupMutation.mutateAsync({
        id: selectedBackupForRestore.id,
        verifyKey: restoreVerifyPassword
      });
      setIsRestoring(false);
      setRestoreDialogOpen(false);
      setRestoreVerifyPassword("");
      toast.success(`系统已成功根据快照「${selectedBackupForRestore.filename}」完成数据全量还原！`);
    } catch (err: any) {
      setIsRestoring(false);
      toast.error(err.message || "还原数据失败");
    }
  };

  // 3. 执行清理备份文件
  const handleExecutePruneBackups = async () => {
    try {
      const res = await pruneBackupsMutation.mutateAsync(pruneBackupRule);
      setPruneBackupDialogOpen(false);
      toast.success(`已清理 ${res.removedCount} 份历史快照，成功释放磁盘空间！`);
    } catch (err: any) {
      toast.error(err.message || "清理备份快照失败");
    }
  };

  // 4. 手动清理系统各类业务数据
  const handleManualDataCleanup = async (type: "metrics" | "audit" | "alerts" | "tasks" | "apilogs") => {
    setActiveCleaningKey(type);
    try {
      const rule =
        type === "metrics"
          ? cleaningMetricDays
          : type === "audit"
          ? cleaningAuditDays
          : type === "alerts"
          ? cleaningAlertRule
          : type === "tasks"
          ? cleaningTaskRule
          : cleaningApiLogsRule;
      const res = await cleanDataMutation.mutateAsync({
        type,
        rule
      });
      setActiveCleaningKey(null);
      toast.success(`清理完成！已释放约 ${res.freedMb.toFixed(1)} MB 磁盘空间。`);
    } catch (err: any) {
      setActiveCleaningKey(null);
      toast.error(err.message || "数据清理失败");
    }
  };

  // 下载备份
  const handleDownloadBackup = (b: BackupArchive) => {
    toast.info(`正在打包并下载备份文件: ${b.filename}`);
  };

  // 删除单项备份记录
  const handleDeleteBackup = async (id: string) => {
    try {
      await deleteBackupMutation.mutateAsync(id);
      toast.info("已删除该历史备份归档");
    } catch (err: any) {
      toast.error(err.message || "删除备份记录失败");
    }
  };

  // 上传本地备份包恢复
  const handleUploadLocalRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedBackup: BackupArchive = {
      id: `bak_uploaded_${Date.now()}`,
      filename: file.name,
      sizeBytes: file.size,
      createdAt: Date.now(),
      type: "manual",
      scope: "外部导入备份文件",
      isEncrypted: true,
      notes: "从本地计算机上传的备份包"
    };

    setSelectedBackupForRestore(uploadedBackup);
    setRestoreDialogOpen(true);

    if (restoreFileRef.current) {
      restoreFileRef.current.value = "";
    }
  };

  const totalOccupiedMb =
    storageStats.dbSizeMb +
    storageStats.metricsSizeMb +
    storageStats.themesSizeMb +
    storageStats.auditSizeMb +
    storageStats.alertsSizeMb +
    storageStats.tasksSizeMb +
    (storageStats.apiLogsSizeMb || 0);

  const maxQuotaGb = parseFloat(retentionForm["storage.maxDbSizeGb"] || "20") || 20;
  const maxQuotaMb = maxQuotaGb * 1024;

  return (
    <div className="space-y-6">
      {/* 1. 存储空间水位与数据分布 (Apple/Stripe Minimalist Storage Capsule) */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* 上半部：两端数据指标与状态 (Header Readout) */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <HardDrive className="size-3.5 text-primary" />
                存储空间水位
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
                {totalOccupiedMb.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">MB</span>
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                / {maxQuotaGb.toFixed(1)} GB 配额
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
              <span className="text-muted-foreground">
                已使用 <strong className="text-foreground font-semibold">{((totalOccupiedMb / maxQuotaMb) * 100).toFixed(2)}%</strong>
              </span>
              <span className="text-border">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                剩余 {Math.max(0, maxQuotaGb - totalOccupiedMb / 1024).toFixed(2)} GB
              </span>
            </div>
          </div>

          {/* 胶囊多色分段进度条 (Ultra-smooth Segmented Capsule Bar) */}
          <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden flex shadow-inner border border-border/50">
            {/* 1. 探针时序监控 */}
            <div
              style={{ width: `${Math.max(1.5, (storageStats.metricsSizeMb / totalOccupiedMb) * 100)}%` }}
              className="h-full bg-sky-500 hover:brightness-110 transition-all cursor-help"
              title={`探针时序与监控指标: ${storageStats.metricsSizeMb.toFixed(1)} MB (${((storageStats.metricsSizeMb / totalOccupiedMb) * 100).toFixed(1)}%)`}
            />
            {/* 2. 系统主数据库 */}
            <div
              style={{ width: `${Math.max(1.5, (storageStats.dbSizeMb / totalOccupiedMb) * 100)}%` }}
              className="h-full bg-primary hover:brightness-110 transition-all cursor-help"
              title={`系统核心数据库: ${storageStats.dbSizeMb.toFixed(1)} MB (${((storageStats.dbSizeMb / totalOccupiedMb) * 100).toFixed(1)}%)`}
            />
            {/* 3. 操作与安全审计 */}
            <div
              style={{ width: `${Math.max(1.5, (storageStats.auditSizeMb / totalOccupiedMb) * 100)}%` }}
              className="h-full bg-amber-500 hover:brightness-110 transition-all cursor-help"
              title={`操作与安全审计: ${storageStats.auditSizeMb.toFixed(1)} MB (${((storageStats.auditSizeMb / totalOccupiedMb) * 100).toFixed(1)}%)`}
            />
            {/* 4. 任务执行与脚本日志 */}
            <div
              style={{ width: `${Math.max(1.5, (storageStats.tasksSizeMb / totalOccupiedMb) * 100)}%` }}
              className="h-full bg-emerald-500 hover:brightness-110 transition-all cursor-help"
              title={`任务执行与脚本日志: ${storageStats.tasksSizeMb.toFixed(1)} MB (${((storageStats.tasksSizeMb / totalOccupiedMb) * 100).toFixed(1)}%)`}
            />
            {/* 5. 告警事件与通知流水 */}
            <div
              style={{ width: `${Math.max(1.5, (storageStats.alertsSizeMb / totalOccupiedMb) * 100)}%` }}
              className="h-full bg-rose-500 hover:brightness-110 transition-all cursor-help"
              title={`告警事件与通知流水: ${storageStats.alertsSizeMb.toFixed(1)} MB (${((storageStats.alertsSizeMb / totalOccupiedMb) * 100).toFixed(1)}%)`}
            />
            {/* 6. API 访问与鉴权流水 */}
            <div
              style={{ width: `${Math.max(1.5, ((storageStats.apiLogsSizeMb || 0) / totalOccupiedMb) * 100)}%` }}
              className="h-full bg-violet-500 hover:brightness-110 transition-all cursor-help"
              title={`API 访问与鉴权流水: ${(storageStats.apiLogsSizeMb || 0).toFixed(1)} MB (${(((storageStats.apiLogsSizeMb || 0) / totalOccupiedMb) * 100).toFixed(1)}%)`}
            />
            {/* 7. 主页展示页模板包 */}
            <div
              style={{ width: `${Math.max(1, (storageStats.themesSizeMb / totalOccupiedMb) * 100)}%` }}
              className="h-full bg-indigo-500 hover:brightness-110 transition-all cursor-help"
              title={`展示大盘模板包: ${storageStats.themesSizeMb.toFixed(1)} MB (${((storageStats.themesSizeMb / totalOccupiedMb) * 100).toFixed(1)}%)`}
            />
          </div>

          {/* 下半部：极简图例 (Minimalist Legend Row) */}
          <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap text-[11px] text-muted-foreground font-mono pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-500" />
              <span>探针时序 <strong>{storageStats.metricsSizeMb.toFixed(1)} MB</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span>系统主库 <strong>{storageStats.dbSizeMb.toFixed(1)} MB</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>安全审计 <strong>{storageStats.auditSizeMb.toFixed(1)} MB</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>任务日志 <strong>{storageStats.tasksSizeMb.toFixed(1)} MB</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              <span>告警记录 <strong>{storageStats.alertsSizeMb.toFixed(1)} MB</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-violet-500" />
              <span>API 访问 <strong>{(storageStats.apiLogsSizeMb || 0).toFixed(1)} MB</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-indigo-500" />
              <span>大盘模板 <strong>{storageStats.themesSizeMb.toFixed(1)} MB</strong></span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. 数据生命周期与自动留存治理策略 (Data Lifecycle & Retention Governance) */}
      <Card id="retention-policy-section">
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4 text-sky-500" />
                单项指标与业务数据保存时长 (Data Retention & Lifecycle Policies)
              </CardTitle>
              <CardDescription>
                按时序指标与业务数据类型独立设定保留天数，超期切片由后台引擎自动按 FIFO 滚动回收
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetRetentionSettings}
                disabled={isSettingsLoading || saveSettingsMutation.isPending}
                className="h-8 text-xs cursor-pointer gap-1.5"
              >
                <RotateCcw className="size-3.5" /> 重置
              </Button>
              <Button
                size="sm"
                onClick={handleSaveRetentionSettings}
                disabled={isSettingsLoading || saveSettingsMutation.isPending}
                className="h-8 px-4 text-xs cursor-pointer font-semibold gap-1.5 shadow-xs"
              >
                {saveSettingsMutation.isPending ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                保存留存策略
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 text-xs">
          {/* A. 上半部：全局数据库存储容量上限 与 离线废弃节点清理 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/80 bg-muted/10">
            {/* 全局数据库配额上限 */}
            <div className="space-y-1.5">
              <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gauge className="size-3.5 text-primary" />
                  全局数据库存储容量上限 (Global Storage Quota)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">推荐: 10 ~ 100 GB</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={2}
                  max={500}
                  value={retentionForm["storage.maxDbSizeGb"] || "20"}
                  onChange={(e) => handleRetentionChange("storage.maxDbSizeGb", e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none font-bold">
                  GB
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">当实际存储达到此水位时触发后台自动回收机制，按各单项保留周期淘汰超期切片</p>
            </div>

            {/* 长期离线废弃节点自动注销 */}
            <div className="space-y-1.5">
              <label className="h-5 font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="size-3.5 text-amber-500" />
                  废弃离线节点自动清理周期
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">0 为不自动清理</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={retentionForm["storage.inactiveNodePruneDays"] || "30"}
                  onChange={(e) => handleRetentionChange("storage.inactiveNodePruneDays", e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background px-3.5 pr-10 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-mono pointer-events-none">
                  天
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">已销毁/长期连续未收到探针心跳的服务器自动从资产大盘与时序拓扑中注销</p>
            </div>
          </div>

          {/* B. 下半部：10 项细分指标与业务数据保存时长矩阵 */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Activity className="size-3 text-sky-500" />
              <span>细分指标与业务流水自动保留周期 (保留天数设置)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. CPU 负载 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <Cpu className="size-3 text-sky-400 shrink-0" />
                    CPU 负载
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={retentionForm["storage.cpuRetentionDays"] || "30"}
                    onChange={(e) => handleRetentionChange("storage.cpuRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">使用率与 Load 负载</p>
              </div>

              {/* 2. 内存占用 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <Layers className="size-3 text-emerald-400 shrink-0" />
                    内存占用
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={retentionForm["storage.memoryRetentionDays"] || "30"}
                    onChange={(e) => handleRetentionChange("storage.memoryRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">物理内存与 Swap 历史</p>
              </div>

              {/* 3. 磁盘 I/O */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <HardDrive className="size-3 text-amber-400 shrink-0" />
                    磁盘 I/O
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={retentionForm["storage.diskRetentionDays"] || "30"}
                    onChange={(e) => handleRetentionChange("storage.diskRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">分区用量与读写吞吐</p>
              </div>

              {/* 4. 网络带宽 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <Network className="size-3 text-indigo-400 shrink-0" />
                    网络带宽
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={retentionForm["storage.networkRetentionDays"] || "30"}
                    onChange={(e) => handleRetentionChange("storage.networkRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">网卡进出流量与实时速率</p>
              </div>

              {/* 5. Ping 延时 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <Activity className="size-3 text-rose-400 shrink-0" />
                    网络延时
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~60天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={retentionForm["storage.pingRetentionDays"] || "30"}
                    onChange={(e) => handleRetentionChange("storage.pingRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">ICMP/TCP 延时与丢包历史</p>
              </div>

              {/* 6. 进程快照 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <Terminal className="size-3 text-purple-400 shrink-0" />
                    进程快照
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">3~30天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={retentionForm["storage.processRetentionDays"] || "7"}
                    onChange={(e) => handleRetentionChange("storage.processRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">Top 进程资源占用快照</p>
              </div>

              {/* 7. 任务执行与脚本日志 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <ScrollText className="size-3 text-emerald-400 shrink-0" />
                    任务执行日志
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~90天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={3}
                    max={180}
                    value={retentionForm["storage.taskRetentionDays"] || "30"}
                    onChange={(e) => handleRetentionChange("storage.taskRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">定时任务与批量执行流</p>
              </div>

              {/* 8. 告警事件 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <Bell className="size-3 text-amber-400 shrink-0" />
                    告警事件记录
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~90天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={3}
                    max={180}
                    value={retentionForm["storage.alertRetentionDays"] || "30"}
                    onChange={(e) => handleRetentionChange("storage.alertRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">规则触发与通知历史</p>
              </div>

              {/* 9. API 访问与登录鉴权流水 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <KeyRound className="size-3 text-violet-400 shrink-0" />
                    API 访问流水
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">15~90天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={3}
                    max={180}
                    value={retentionForm["storage.apiLogRetentionDays"] || "30"}
                    onChange={(e) => handleRetentionChange("storage.apiLogRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">Token 请求与会话流水</p>
              </div>

              {/* 10. 审计日志 */}
              <div className="p-3 rounded-xl border border-border/70 bg-background space-y-1.5 shadow-2xs">
                <label className="h-4 font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 text-foreground truncate text-xs">
                    <FileCode className="size-3 text-sky-400 shrink-0" />
                    安全操作审计
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">30~180天</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={retentionForm["storage.auditRetentionDays"] || "90"}
                    onChange={(e) => handleRetentionChange("storage.auditRetentionDays", e.target.value)}
                    className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/20 px-2.5 pr-8 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-mono pointer-events-none">天</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">管理操作与登录记录</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. 手动清理系统数据与磁盘空间维护专区 (Manual Data Cleanup) */}
      <Card id="manual-data-cleanup-section">
        <CardHeader className="py-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Eraser className="size-4 text-sky-500" />
              手动数据清理 (Manual Data Cleanup)
            </CardTitle>
            <CardDescription>
              支持按需手动清理时序监控、操作审计、告警历史与任务日志，按需释放存储空间
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 清理项 1: 探针时序与监控指标 */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Activity className="size-4 text-sky-500" />
                    探针时序监控数据
                  </span>
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    约 {storageStats.metricsSizeMb.toFixed(1)} MB
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  包含全网探针节点的 Ping 延迟、丢包率与网络拓扑历史打点时序数据。
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
                <CleanupTimeSelector
                  category="metrics"
                  value={cleaningMetricDays}
                  onChange={setCleaningMetricDays}
                />

                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeCleaningKey === "metrics"}
                  onClick={() => handleManualDataCleanup("metrics")}
                  className="h-8.5 text-xs cursor-pointer text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 font-semibold shrink-0 shadow-2xs"
                >
                  {activeCleaningKey === "metrics" ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="size-3.5 mr-1 text-rose-500/80" /> 执行清理
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 清理项 2: 操作审计日志 */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <ScrollText className="size-4 text-amber-500" />
                    操作与安全审计日志
                  </span>
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    约 {storageStats.auditSizeMb.toFixed(1)} MB
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  包含管理员登录历史、安全提权校验记录、主机修改与系统参数变动审计。
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
                <CleanupTimeSelector
                  category="audit"
                  value={cleaningAuditDays}
                  onChange={setCleaningAuditDays}
                />

                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeCleaningKey === "audit"}
                  onClick={() => handleManualDataCleanup("audit")}
                  className="h-8.5 text-xs cursor-pointer text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 font-semibold shrink-0 shadow-2xs"
                >
                  {activeCleaningKey === "audit" ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="size-3.5 mr-1 text-rose-500/80" /> 执行清理
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 清理项 3: 告警历史与推送记录 */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Bell className="size-4 text-rose-500" />
                    告警事件与通知记录
                  </span>
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    约 {storageStats.alertsSizeMb.toFixed(1)} MB
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  包含已触发并恢复的告警事件流水、Webhook/Telegram/邮件推送投递历史。
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
                <CleanupTimeSelector
                  category="alerts"
                  value={cleaningAlertRule}
                  onChange={setCleaningAlertRule}
                />

                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeCleaningKey === "alerts"}
                  onClick={() => handleManualDataCleanup("alerts")}
                  className="h-8.5 text-xs cursor-pointer text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 font-semibold shrink-0 shadow-2xs"
                >
                  {activeCleaningKey === "alerts" ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="size-3.5 mr-1 text-rose-500/80" /> 执行清理
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 清理项 4: 任务执行与脚本日志 */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Terminal className="size-4 text-emerald-500" />
                    任务执行与脚本日志
                  </span>
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    约 {storageStats.tasksSizeMb.toFixed(1)} MB
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  包含定时任务触发历史、自动化批量脚本执行终端输出流与完成状态记录。
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
                <CleanupTimeSelector
                  category="tasks"
                  value={cleaningTaskRule}
                  onChange={setCleaningTaskRule}
                />

                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeCleaningKey === "tasks"}
                  onClick={() => handleManualDataCleanup("tasks")}
                  className="h-8.5 text-xs cursor-pointer text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 font-semibold shrink-0 shadow-2xs"
                >
                  {activeCleaningKey === "tasks" ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="size-3.5 mr-1 text-rose-500/80" /> 执行清理
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 清理项 5: API 访问与登录鉴权流水 */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3 flex flex-col justify-between hover:border-violet-500/30 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <KeyRound className="size-4 text-violet-500" />
                    API 访问与登录鉴权流水
                  </span>
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    约 {(storageStats.apiLogsSizeMb || 0).toFixed(1)} MB
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  包含外部自动化 Token 接口请求/响应、鉴权日志、登录历史与已离线终端会话记录。
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40">
                <CleanupTimeSelector
                  category="apilogs"
                  value={cleaningApiLogsRule}
                  onChange={setCleaningApiLogsRule}
                />

                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeCleaningKey === "apilogs"}
                  onClick={() => handleManualDataCleanup("apilogs")}
                  className="h-8.5 text-xs cursor-pointer text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 font-semibold shrink-0 shadow-2xs"
                >
                  {activeCleaningKey === "apilogs" ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="size-3.5 mr-1 text-rose-500/80" /> 执行清理
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. 自动备份计划与多端异地容灾 (Multi-Plan Schedule & Remote Mirror) */}
      <Card id="backup-plans-section">
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4 text-sky-500" />
                自动备份计划与多端异地容灾 (Scheduled Plans & Remote Mirror)
              </CardTitle>
              <CardDescription>
                支持多套定时备份计划、Cron 表达式/固定时刻灵活配置、自定义保留天数与 S3 / WebDAV 异地冷备推送
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={handleOpenCreatePlanDialog}
              className="h-8 text-xs cursor-pointer font-semibold shadow-xs shrink-0"
            >
              <Plus className="size-3.5 mr-1" /> 添加备份计划
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {backupPlans.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
              暂无已配置的自动备份计划，点击右上角「添加备份计划」即可创建
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {backupPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between group ${
                    plan.enabled
                      ? "border-border/80 bg-card hover:border-primary/40 shadow-2xs"
                      : "border-border/40 bg-muted/20 opacity-70"
                  }`}
                >
                  <div className="space-y-2">
                    {/* 头部：名称与状态开关 */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-foreground truncate" title={plan.name}>
                          {plan.name}
                        </span>
                        {plan.enableRemote ? (
                          <Badge variant="success" className="text-[8px] px-1.5 py-0 font-mono flex items-center gap-0.5 shrink-0">
                            <Cloud className="size-2.5" />
                            {plan.remoteConfig?.type === "s3" ? "S3" : "WebDAV"}
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[8px] px-1.5 py-0 font-mono flex items-center gap-0.5 shrink-0">
                            <HardDrive className="size-2.5" />
                            本地
                          </Badge>
                        )}
                      </div>
                      <Switch
                        checked={plan.enabled}
                        onCheckedChange={(val) => handleTogglePlan(plan.id, val)}
                        className="scale-85 shrink-0"
                      />
                    </div>

                    {/* 紧凑指标徽章条 (单行微排版) */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/40 text-foreground font-semibold flex items-center gap-1">
                        <Clock className="size-2.5 text-sky-500" />
                        {plan.timeType === "fixed"
                          ? plan.fixedMode === "daily"
                            ? `每天 ${plan.fixedTime}`
                            : plan.fixedMode === "interval"
                            ? `每隔 ${plan.fixedTime}h`
                            : `每周 ${plan.fixedTime}`
                          : plan.cronExpr}
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/40 text-muted-foreground">
                        保留 {plan.retentionCount} 份
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/40 text-muted-foreground">
                        {plan.scope === "all"
                          ? "全量数据"
                          : plan.scope === "core_only" || (plan.scope as string) === "configs_only"
                          ? "核心配置"
                          : plan.scope === "core_and_audit"
                          ? "配置+审计"
                          : `自定义 (${plan.customModules?.length || 0}项)`}
                      </span>

                      {plan.encrypt && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-0.5">
                          <Lock className="size-2.5" />
                          AES
                        </span>
                      )}
                    </div>

                    {/* 远程路径微提示 */}
                    {plan.enableRemote && plan.remoteConfig && (
                      <div className="text-[9px] font-mono text-muted-foreground truncate bg-sky-500/5 px-2 py-1 rounded border border-sky-500/20">
                        {plan.remoteConfig.type === "s3"
                          ? `s3://${plan.remoteConfig.bucket || "bucket"}${plan.remoteConfig.prefix || ""}`
                          : plan.remoteConfig.serverUrl}
                      </div>
                    )}
                  </div>

                  {/* 底部极简操作栏 */}
                  <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRunPlanImmediately(plan)}
                      className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="size-2.5" />
                      立即执行
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPlanDialog(plan)}
                        title="编辑此计划"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id)}
                        title="删除此计划"
                        className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. 备份列表 (左边 任务名称 ➔ 右边 该任务的备份快照列表) */}
      <Card id="backup-list-section">
        <CardHeader className="py-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileArchive className="size-4 text-primary" />
                备份列表 (Backups)
              </CardTitle>
              <CardDescription>
                左侧选择备份任务，右侧查看并管理该任务名下的所有历史快照归档
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={restoreFileRef}
                type="file"
                accept=".tar.gz,.bak,.zip,.json"
                className="hidden"
                onChange={handleUploadLocalRestore}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPruneBackupDialogOpen(true)}
                className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-rose-500 font-semibold shadow-2xs"
              >
                <Trash2 className="size-3.5 mr-1" /> 清理备份
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => restoreFileRef.current?.click()}
                className="h-8 text-xs cursor-pointer font-semibold shadow-2xs"
              >
                <Upload className="size-3.5 mr-1" /> 导入恢复
              </Button>

              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="h-8 text-xs cursor-pointer font-semibold shadow-xs"
              >
                <Plus className="size-3.5 mr-1" /> 创建备份
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row min-h-[380px]">
            {/* 左侧：任务名称列表 (Left Column: Tasks Navigation) */}
            <div className="w-full md:w-64 lg:w-72 border-r border-border/60 p-3 space-y-1.5 bg-muted/10 shrink-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center justify-between">
                <span>备份任务列表</span>
                <span className="font-mono text-[9px]">{backupPlans.length + 1} 个任务</span>
              </div>

              {/* 各自动计划任务项 */}
              {backupPlans.map((plan) => {
                const planBackupsCount = backups.filter(
                  (b) => b.planId === plan.id || b.notes?.includes(plan.name)
                ).length;
                const isSelected = selectedTaskFilter === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedTaskFilter(plan.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-background text-primary font-bold shadow-xs border border-primary/30 ring-1 ring-primary/20"
                        : "text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1 rounded-md ${isSelected ? "bg-sky-500/15 text-sky-500" : "bg-muted text-muted-foreground"}`}>
                        <Clock className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-xs" title={plan.name}>
                          {plan.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          {plan.timeType === "fixed" ? `每天 ${plan.fixedTime}` : "Cron"} · {plan.enableRemote ? "远程冷备" : "本地存储"}
                        </div>
                      </div>
                    </div>
                    <Badge variant={isSelected ? "primary" : "neutral"} className="text-[9px] px-1.5 py-0 font-mono shrink-0">
                      {planBackupsCount} 份
                    </Badge>
                  </button>
                );
              })}

              {/* 手动任务项 */}
              {(() => {
                const manualBackupsCount = backups.filter((b) => b.type === "manual").length;
                const isSelected = selectedTaskFilter === "manual";
                return (
                  <button
                    type="button"
                    onClick={() => setSelectedTaskFilter("manual")}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-background text-amber-600 dark:text-amber-400 font-bold shadow-xs border border-amber-500/30 ring-1 ring-amber-500/20"
                        : "text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1 rounded-md ${isSelected ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                        <HardDrive className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-xs">管理员手动快照</div>
                        <div className="text-[10px] text-muted-foreground font-mono">即时手动备份</div>
                      </div>
                    </div>
                    <Badge variant="neutral" className="text-[9px] px-1.5 py-0 font-mono shrink-0">
                      {manualBackupsCount} 份
                    </Badge>
                  </button>
                );
              })()}
            </div>

            {/* 右侧：所选任务的备份列表 (Right Column: Snapshots Table of Selected Task) */}
            <div className="flex-1 p-4 space-y-3 overflow-x-auto flex flex-col justify-between">
              <div>
                {/* 顶部当前任务状态条 */}
                <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {selectedTaskFilter === "all"
                        ? "全部快照列表"
                        : selectedTaskFilter === "manual"
                        ? "管理员手动快照列表"
                        : `计划「${backupPlans.find((p) => p.id === selectedTaskFilter)?.name || "指定任务"}」的备份快照`}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      (共 {
                        (selectedTaskFilter === "all"
                          ? backups
                          : selectedTaskFilter === "manual"
                          ? backups.filter((b) => b.type === "manual")
                          : backups.filter((b) => b.planId === selectedTaskFilter || b.notes?.includes(backupPlans.find((p) => p.id === selectedTaskFilter)?.name || ""))
                        ).length
                      } 份归档)
                    </span>
                  </div>

                  {/* 快捷触发按钮 */}
                  {selectedTaskFilter !== "all" && selectedTaskFilter !== "manual" && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetPlan = backupPlans.find((p) => p.id === selectedTaskFilter);
                        if (targetPlan) handleRunPlanImmediately(targetPlan);
                      }}
                      className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="size-2.5" />
                      立即为此任务生成快照
                    </button>
                  )}
                </div>

                {/* 快照表格 */}
                {(() => {
                  const filteredBackups = selectedTaskFilter === "all"
                    ? backups
                    : selectedTaskFilter === "manual"
                    ? backups.filter((b) => b.type === "manual")
                    : backups.filter((b) => b.planId === selectedTaskFilter || b.notes?.includes(backupPlans.find((p) => p.id === selectedTaskFilter)?.name || ""));

                  if (filteredBackups.length === 0) {
                    return (
                      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl my-4">
                        当前任务暂无快照归档，点击右上角「创建备份」或触发任务即可生成
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground">
                          <th className="py-2.5 px-3 font-semibold">备份文件名</th>
                          <th className="py-2.5 px-3 font-semibold">备份数据范围</th>
                          <th className="py-2.5 px-3 font-semibold">大小</th>
                          <th className="py-2.5 px-3 font-semibold">创建时间</th>
                          <th className="py-2.5 px-3 font-semibold">加密状态</th>
                          <th className="py-2.5 px-3 font-semibold text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredBackups.map((b) => (
                          <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                            {/* 备份文件名 */}
                            <td className="py-3 px-3 font-mono text-foreground">
                              <div className="flex items-center gap-1.5 font-medium">
                                <FileCheck2 className="size-3.5 text-primary shrink-0 opacity-85" />
                                <span className="truncate max-w-[240px]" title={b.filename}>{b.filename}</span>
                              </div>
                            </td>

                            {/* 备份范围 */}
                            <td className="py-3 px-3 font-sans text-muted-foreground">
                              <div className="text-foreground font-medium text-xs truncate max-w-[180px]">{b.scope}</div>
                            </td>

                            {/* 大小 */}
                            <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                              <span className="font-semibold text-foreground">{formatSize(b.sizeBytes)}</span>
                            </td>

                            {/* 创建时间 */}
                            <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                              {new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>

                            {/* 加密状态 */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {b.isEncrypted ? (
                                <Badge variant="success" className="text-[9px] px-1.5 py-0 font-mono flex items-center gap-1 w-fit">
                                  <Lock className="size-2.5" /> AES-256
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">明文归档</span>
                              )}
                            </td>

                            {/* 操作栏 */}
                            <td className="py-3 px-3 text-right space-x-1.5 font-sans whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDownloadBackup(b)}
                                title="下载备份文件到本地"
                                className="px-2 py-1 rounded-lg border border-border/80 bg-background text-foreground hover:bg-muted transition-colors cursor-pointer"
                              >
                                <Download className="size-3 inline mr-1" />
                                下载
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBackupForRestore(b);
                                  setRestoreDialogOpen(true);
                                }}
                                title="使用此快照覆盖还原系统数据"
                                className="px-2 py-1 rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="size-3 inline mr-1" />
                                恢复
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBackup(b.id)}
                                title="删除此备份记录"
                                className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. 添加/编辑自动备份计划弹窗 (Add / Edit Plan Dialog - Premium Modern SaaS Aesthetic) */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-border/80 shadow-2xl flex flex-col max-h-[85vh] rounded-2xl">
          {/* 顶栏 Header - 现代渐变微光 */}
          <div className="px-6 py-4 border-b border-border/60 bg-gradient-to-r from-sky-500/10 via-primary/5 to-transparent flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/30 shadow-xs">
                <Clock className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  {editingPlanId ? "编辑备份计划" : "添加自动备份计划"}
                  <Badge variant="neutral" className="text-[10px] font-mono font-normal">
                    {planTimeType === "fixed" ? (planFixedMode === "daily" ? "每日定时" : planFixedMode === "weekly" ? "每周冷备" : "间隔循环") : "Cron 定时"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                  全自动调度生成系统快照、滚动保留与异地容灾冷备推送
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
            {/* 1. 计划名称 (现代半透明输入框 + 快捷标签) */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border/60 bg-muted/15">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  计划名称
                </label>
                <div className="flex items-center gap-1">
                  {["每日核心备份", "周末异地冷备", "每12h双频快照"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPlanName(preset)}
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-background/80"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="例如: 全站核心每日备份 / 周末冷备归档"
                className="w-full h-9 rounded-lg border border-border/80 bg-background/80 px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground transition-all shadow-2xs font-medium"
              />
            </div>

            {/* 2. 触发时间调度面板 (4 选项卡片 + 现代化时间拨盘) */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/15">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-sky-500" />
                  执行调度周期
                </label>
                {/* 4 选项分段微卡片 */}
                <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/60 text-[11px]">
                  {[
                    { key: "daily", label: "每日固定", type: "fixed" as const, mode: "daily" as const },
                    { key: "interval", label: "间隔循环", type: "fixed" as const, mode: "interval" as const },
                    { key: "weekly", label: "每周定制", type: "fixed" as const, mode: "weekly" as const },
                    { key: "cron", label: "Cron", type: "cron" as const, mode: "daily" as const }
                  ].map((tab) => {
                    const isActive =
                      tab.key === "cron"
                        ? planTimeType === "cron"
                        : planTimeType === "fixed" && planFixedMode === tab.mode;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setPlanTimeType(tab.type);
                          if (tab.type === "fixed") {
                            setPlanFixedMode(tab.mode);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-background text-primary shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 动态时间参数配置卡片 */}
              <div className="p-3 rounded-xl border border-border/80 bg-background shadow-2xs space-y-3">
                {/* A. 每日模式 (现代交互式 TimePicker Popover) */}
                {planTimeType === "fixed" && planFixedMode === "daily" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium">设定执行时刻:</span>
                      <TimePicker
                        value={planFixedTime}
                        onChange={setPlanFixedTime}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: "02:00", val: "02:00" },
                        { label: "03:00 (推荐)", val: "03:00" },
                        { label: "04:30", val: "04:30" }
                      ].map((t) => (
                        <button
                          key={t.val}
                          type="button"
                          onClick={() => setPlanFixedTime(t.val)}
                          className={`px-2 py-1 rounded-md border text-[10px] font-mono transition-all cursor-pointer ${
                            planFixedTime === t.val
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                              : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* B. 间隔模式 (支持键盘自由输入数字 + 步进器 + 后置单位标签) */}
                {planTimeType === "fixed" && planFixedMode === "interval" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-muted-foreground font-medium">执行循环间隔:</span>
                      <div className="flex items-center rounded-lg border border-border/80 bg-muted/30 overflow-hidden shadow-2xs font-mono text-xs h-8">
                        <button
                          type="button"
                          onClick={() => setPlanFixedIntervalHours(String(Math.max(1, (parseInt(planFixedIntervalHours, 10) || 12) - 1)))}
                          className="px-2.5 py-1 hover:bg-muted text-muted-foreground font-bold cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={planFixedIntervalHours}
                          onChange={(e) => setPlanFixedIntervalHours(e.target.value)}
                          className="w-10 text-center bg-transparent border-none outline-none font-mono text-xs font-bold text-primary"
                        />
                        <span className="text-[11px] text-muted-foreground pr-2 font-sans select-none">小时</span>
                        <button
                          type="button"
                          onClick={() => setPlanFixedIntervalHours(String(Math.min(168, (parseInt(planFixedIntervalHours, 10) || 12) + 1)))}
                          className="px-2.5 py-1 hover:bg-muted text-muted-foreground font-bold cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {["4", "6", "12", "24"].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setPlanFixedIntervalHours(hrs)}
                          className={`px-2 py-1 rounded-md border text-[10px] font-mono transition-all cursor-pointer ${
                            planFixedIntervalHours === hrs
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                              : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          每 {hrs}h
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* C. 每周模式 (7 颗星期自由多选药丸 + 快捷预设 + TimePicker Popover) */}
                {planTimeType === "fixed" && planFixedMode === "weekly" && (
                  <div className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-medium">执行星期 (多选):</span>
                        <span className="text-[10px] text-primary font-mono font-semibold">
                          已选 {planWeeklyDays.length} 天
                        </span>
                      </div>

                      {/* 快捷多选组合 */}
                      <div className="flex items-center gap-1">
                        {[
                          { label: "仅周末", days: ["6", "0"] },
                          { label: "工作日", days: ["1", "2", "3", "4", "5"] },
                          { label: "每天", days: ["1", "2", "3", "4", "5", "6", "0"] }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setPlanWeeklyDays(preset.days);
                              const [h, m] = planFixedTime.split(":");
                              setPlanCronExpr(`${parseInt(m, 10) || 0} ${parseInt(h, 10) || 4} * * ${preset.days.join(",")}`);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-primary border border-border/40 hover:bg-muted cursor-pointer transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 7 颗星期药丸按钮 (支持自由多选与反选) */}
                    <div className="grid grid-cols-7 gap-1">
                      {[
                        { day: "1", label: "周一" },
                        { day: "2", label: "周二" },
                        { day: "3", label: "周三" },
                        { day: "4", label: "周四" },
                        { day: "5", label: "周五" },
                        { day: "6", label: "周六" },
                        { day: "0", label: "周日" }
                      ].map((d) => {
                        const isSelected = planWeeklyDays.includes(d.day);
                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => toggleWeeklyDay(d.day)}
                            className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? "bg-primary text-primary-foreground font-bold shadow-xs ring-1 ring-primary/30"
                                : "border border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-medium">执行时刻:</span>
                        <TimePicker
                          value={planFixedTime}
                          onChange={(val) => {
                            setPlanFixedTime(val);
                            const [h, m] = val.split(":");
                            setPlanCronExpr(`${parseInt(m, 10) || 0} ${parseInt(h, 10) || 4} * * ${planWeeklyDays.join(",")}`);
                          }}
                        />
                      </div>

                      {/* 快捷推荐时刻 */}
                      <div className="flex items-center gap-1.5">
                        {["03:00", "04:00 (推荐)"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              const cleanTime = t.replace(" (推荐)", "");
                              setPlanFixedTime(cleanTime);
                              const [h, m] = cleanTime.split(":");
                              setPlanCronExpr(`${parseInt(m, 10) || 0} ${parseInt(h, 10) || 4} * * ${planWeeklyDays.join(",")}`);
                            }}
                            className={`px-2 py-1 rounded-md border text-[10px] font-mono transition-all cursor-pointer ${
                              planFixedTime === t.replace(" (推荐)", "")
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* D. Cron 模式 (终端代码微卡片) */}
                {planTimeType === "cron" && (
                  <div className="space-y-2">
                    <input
                      value={planCronExpr}
                      onChange={(e) => setPlanCronExpr(e.target.value)}
                      placeholder="0 3 * * *"
                      className="w-full h-8.5 rounded-lg border border-border/80 bg-zinc-950 text-sky-400 px-3 font-mono text-xs font-bold outline-none focus:border-sky-500 shadow-inner text-center tracking-widest"
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-mono">分 时 日 月 周</span>
                      <div className="flex gap-1.5">
                        {["0 3 * * *", "0 */6 * * *", "0 4 * * 0"].map((exp) => (
                          <button
                            key={exp}
                            type="button"
                            onClick={() => setPlanCronExpr(exp)}
                            className="font-mono hover:text-primary underline cursor-pointer"
                          >
                            {exp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. 存储目标选择 (本地 vs 远程 二选一，选择远程就没有本地) */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/15">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <HardDrive className="size-3.5 text-primary" />
                  备份存储目标 (二选一)
                </label>
                {/* 本地 / 远程 二选一分段微卡片 */}
                <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/60 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPlanStorageTarget("local")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      planStorageTarget === "local"
                        ? "bg-background text-primary shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <HardDrive className="size-3" />
                    本地存储 (默认)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanStorageTarget("remote")}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      planStorageTarget === "remote"
                        ? "bg-background text-sky-500 shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Cloud className="size-3" />
                    远程存储 (异地冷备)
                  </button>
                </div>
              </div>

              {/* A. 默认本地存储提示 */}
              {planStorageTarget === "local" && (
                <div className="p-2.5 rounded-lg border border-border/60 bg-background text-[11px] text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>快照将保存在本机服务器磁盘中，超出保留份数时自动循环滚动覆盖清理。</span>
                </div>
              )}

              {/* B. 远程异地容灾冷备设置 (选择远程就没有本地) */}
              {planStorageTarget === "remote" && (
                <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-3 animate-in fade-in duration-200 text-xs">
                  <div className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1.5 font-medium pb-2 border-b border-sky-500/20">
                    <Cloud className="size-3.5 shrink-0" />
                    快照生成后将直接推送至远端异地冷备存储，本地不保留副本，节省本地磁盘空间。
                  </div>

                  {/* 存储协议切换 */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">存储协议</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPlanRemoteType("s3")}
                        className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer font-medium ${
                          planRemoteType === "s3"
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border border-border/60 bg-background text-muted-foreground"
                        }`}
                      >
                        S3 对象存储
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanRemoteType("webdav")}
                        className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer font-medium ${
                          planRemoteType === "webdav"
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border border-border/60 bg-background text-muted-foreground"
                        }`}
                      >
                        WebDAV 网盘
                      </button>
                    </div>
                  </div>

                  {/* S3 表单 */}
                  {planRemoteType === "s3" ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={s3Endpoint}
                          onChange={(e) => setS3Endpoint(e.target.value)}
                          placeholder="Endpoint URL (如 https://s3.amazonaws.com)"
                          className="h-8.5 rounded-lg border border-border/80 bg-background px-3 font-mono text-xs outline-none focus:border-primary text-foreground shadow-2xs"
                        />
                        <input
                          value={s3Bucket}
                          onChange={(e) => setS3Bucket(e.target.value)}
                          placeholder="Bucket (存储桶名称)"
                          className="h-8.5 rounded-lg border border-border/80 bg-background px-3 font-mono text-xs outline-none focus:border-primary text-foreground shadow-2xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={s3AccessKey}
                          onChange={(e) => setS3AccessKey(e.target.value)}
                          placeholder="Access Key ID"
                          className="h-8.5 rounded-lg border border-border/80 bg-background px-3 font-mono text-xs outline-none focus:border-primary text-foreground shadow-2xs"
                        />
                        <input
                          type="password"
                          value={s3SecretKey}
                          onChange={(e) => setS3SecretKey(e.target.value)}
                          placeholder="Secret Access Key"
                          className="h-8.5 rounded-lg border border-border/80 bg-background px-3 font-mono text-xs outline-none focus:border-primary text-foreground shadow-2xs"
                        />
                      </div>
                    </div>
                  ) : (
                    /* WebDAV 表单 */
                    <div className="space-y-2 pt-1">
                      <input
                        value={webdavUrl}
                        onChange={(e) => setWebdavUrl(e.target.value)}
                        placeholder="WebDAV Server URL"
                        className="w-full h-8.5 rounded-lg border border-border/80 bg-background px-3 font-mono text-xs outline-none focus:border-primary text-foreground shadow-2xs"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={webdavUsername}
                          onChange={(e) => setWebdavUsername(e.target.value)}
                          placeholder="用户名"
                          className="h-8.5 rounded-lg border border-border/80 bg-background px-3 font-mono text-xs outline-none focus:border-primary text-foreground shadow-2xs"
                        />
                        <input
                          type="password"
                          value={webdavPassword}
                          onChange={(e) => setWebdavPassword(e.target.value)}
                          placeholder="密码 / Token"
                          className="h-8.5 rounded-lg border border-border/80 bg-background px-3 font-mono text-xs outline-none focus:border-primary text-foreground shadow-2xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* 测试连接按钮 */}
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isTestingRemote}
                      onClick={handleTestRemoteConnection}
                      className="h-7.5 px-3 text-xs cursor-pointer font-semibold shadow-2xs"
                    >
                      {isTestingRemote ? (
                        <>
                          <RefreshCw className="size-3 mr-1 animate-spin" />
                          正在校验...
                        </>
                      ) : (
                        <>
                          <Zap className="size-3 mr-1 text-primary" />
                          测试远程连接
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. 备份数据范围与模块组合 (Where to Backup) */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/15">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <Database className="size-3.5 text-primary" />
                  备份数据范围 (Where to Backup)
                </label>
                <Badge variant="neutral" className="text-[10px] font-mono">
                  {planScope === "all"
                    ? "全量归档 (7 项)"
                    : planScope === "core_only"
                    ? "核心配置 (1 项)"
                    : planScope === "core_and_audit"
                    ? "配置 + 审计 (2 项)"
                    : `自定义组合 (${planCustomModules.length} 项)`}
                </Badge>
              </div>

              {/* 4 种预设模式卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 选项 A: 全量业务数据 */}
                <button
                  type="button"
                  onClick={() => {
                    setPlanScope("all");
                    setPlanCustomModules(["core", "metrics", "audit", "alerts", "tasks", "apilogs", "themes"]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    planScope === "all"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      <Sparkles className="size-3 text-primary" /> 全量业务数据
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-primary/20 text-primary font-mono font-medium">推荐 · 完整还原</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-normal mt-1 leading-relaxed">
                    系统核心配置、探针时序监控、安全审计、告警历史、任务脚本日志与 API 访问流水全量归档。
                  </p>
                </button>

                {/* 选项 B: 仅系统核心配置 */}
                <button
                  type="button"
                  onClick={() => {
                    setPlanScope("core_only");
                    setPlanCustomModules(["core"]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    planScope === "core_only"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      <Zap className="size-3 text-amber-500" /> 仅核心配置与资产
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-medium">极速 · 体积最小</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-normal mt-1 leading-relaxed">
                    仅备份主机节点列表、探针定义、全局配置字典、API 令牌、管理员账号权限与告警规则字典。
                  </p>
                </button>

                {/* 选项 C: 核心配置 + 安全审计 */}
                <button
                  type="button"
                  onClick={() => {
                    setPlanScope("core_and_audit");
                    setPlanCustomModules(["core", "audit", "apilogs"]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    planScope === "core_and_audit"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      <ShieldCheck className="size-3 text-emerald-500" /> 配置 + 安全审计
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-medium">等保合规归档</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-normal mt-1 leading-relaxed">
                    包含核心资产配置及管理员登录、提权操作、配置变更与 API 鉴权审计日志流水。
                  </p>
                </button>

                {/* 选项 D: 自定义模块组合 */}
                <button
                  type="button"
                  onClick={() => setPlanScope("custom")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    planScope === "custom"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      <Layers className="size-3 text-indigo-500" /> 自定义模块组合
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-medium">自由定制</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-normal mt-1 leading-relaxed">
                    自由按需勾选需要打包的子模块（支持剔除高占用时序以缩减备份体积）。
                  </p>
                </button>
              </div>

              {/* 自定义模块展开列表 (当选择 custom 时展示) */}
              {planScope === "custom" && (
                <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2 animate-in fade-in duration-200">
                  <div className="text-[10px] text-muted-foreground font-medium pb-1 border-b border-indigo-500/20 flex items-center justify-between">
                    <span>勾选需要纳入备份归档包的业务数据：</span>
                    <span className="font-mono text-primary font-semibold">已选 {planCustomModules.length} 个模块</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: "core", label: "核心配置与主机资产", desc: "主机/探针/账号/规则/令牌", size: "3.2 MB", required: true, icon: Database },
                      { id: "metrics", label: "探针时序监控数据", desc: "延迟/丢包/硬件历史采样", size: "112.6 MB", required: false, icon: Activity },
                      { id: "audit", label: "操作与安全审计日志", desc: "管理员登录/变更记录", size: "18.2 MB", required: false, icon: ScrollText },
                      { id: "alerts", label: "告警事件与推送记录", desc: "告警触发/通知推送流水", size: "8.4 MB", required: false, icon: Bell },
                      { id: "tasks", label: "任务执行与脚本日志", desc: "批量脚本终端输出流", size: "14.6 MB", required: false, icon: Terminal },
                      { id: "apilogs", label: "API 访问与鉴权流水", desc: "自动化 Token 调用记录", size: "24.6 MB", required: false, icon: KeyRound },
                      { id: "themes", label: "大盘主题与展示模板", desc: "公开状态页前端配置", size: "4.8 MB", required: false, icon: Layers }
                    ].map((m) => {
                      const isChecked = m.required || planCustomModules.includes(m.id);
                      const IconComp = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={m.required}
                          onClick={() => {
                            if (m.required) return;
                            setPlanCustomModules((prev) =>
                              prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                            );
                          }}
                          className={`p-2 rounded-lg border text-left transition-all flex items-center justify-between ${
                            m.required
                              ? "border-border/40 bg-muted/40 text-foreground cursor-not-allowed opacity-90"
                              : isChecked
                              ? "border-primary bg-background text-foreground shadow-2xs cursor-pointer"
                              : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`size-6 rounded-md flex items-center justify-center shrink-0 ${isChecked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                              <IconComp className="size-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate flex items-center gap-1">
                                <span>{m.label}</span>
                                {m.required && <span className="text-[9px] text-muted-foreground font-mono">(基础必选)</span>}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">{m.desc}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pl-1">
                            <span className="text-[10px] font-mono text-muted-foreground">{m.size}</span>
                            <div className={`size-4 rounded flex items-center justify-center text-[10px] font-bold ${isChecked ? "bg-primary text-primary-foreground" : "border border-border/80"}`}>
                              {isChecked && <Check className="size-2.5" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. 本地保留份数与 AES-256 加密安全设置 */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/15">
              <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <Lock className="size-3.5 text-primary" />
                保留周期与安全加密
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 滚动保留份数 */}
                <div className="p-3 rounded-xl border border-border/80 bg-background space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">滚动保留份数</span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {planRetentionCount} 份
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {["7", "14", "30", "60"].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setPlanRetentionCount(cnt)}
                        className={`flex-1 py-1 rounded-md border text-[10px] font-mono transition-all cursor-pointer text-center ${
                          planRetentionCount === cnt
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                            : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cnt} 份
                      </button>
                    ))}
                  </div>
                </div>

                {/* AES 加密开关 */}
                <div className="p-3 rounded-xl border border-border/80 bg-background flex flex-col justify-between space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">AES-256 数据加密</span>
                    <Switch checked={planEncrypt} onCheckedChange={setPlanEncrypt} className="scale-90" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {planEncrypt
                      ? "🔒 自动使用实例安全密钥对快照归档包进行端到端加密保护"
                      : "⚠️ 明文归档包，还原时无需解密密钥"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 底部保存操作 Footer */}
          <div className="flex justify-end gap-2.5 px-6 py-3.5 border-t border-border/60 bg-muted/10 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlanDialogOpen(false)}
              className="h-8.5 text-xs cursor-pointer px-4"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSavePlan}
              className="h-8.5 px-5 text-xs cursor-pointer font-semibold shadow-xs"
            >
              保存备份计划
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7. 创建即时快照弹窗 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
          <div className="px-6 py-4 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-background flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/40 shadow-xs">
              <Database className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                创建系统即时数据快照
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                对当前实例进行一致性数据快照归档并打包
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">备份快照范围 (Scope)</label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {backupScope === "all"
                    ? "全量完整 (7 项)"
                    : backupScope === "core_only"
                    ? "核心配置 (1 项)"
                    : backupScope === "core_and_audit"
                    ? "配置 + 审计 (2 项)"
                    : `自定义 (${backupCustomModules.length} 项)`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBackupScope("all");
                    setBackupCustomModules(["core", "metrics", "audit", "alerts", "tasks", "apilogs", "themes"]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    backupScope === "all"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1">
                    <Sparkles className="size-3 text-primary" /> 全量业务数据
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">全站配置/时序/审计/告警/任务</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBackupScope("core_only");
                    setBackupCustomModules(["core"]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    backupScope === "core_only"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1">
                    <Zap className="size-3 text-amber-500" /> 仅系统核心配置
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">主机资产/探针/账号/规则/令牌</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBackupScope("core_and_audit");
                    setBackupCustomModules(["core", "audit", "apilogs"]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    backupScope === "core_and_audit"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1">
                    <ShieldCheck className="size-3 text-emerald-500" /> 配置 + 安全审计
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">主机配置与全部操作/登录审计</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBackupScope("custom")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    backupScope === "custom"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1">
                    <Layers className="size-3 text-indigo-500" /> 自定义模块组合
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">自由按需勾选归档子模块</div>
                </button>
              </div>

              {/* 自定义模块组合勾选 */}
              {backupScope === "custom" && (
                <div className="p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-1.5 mt-2 animate-in fade-in duration-200">
                  <div className="text-[10px] text-muted-foreground font-medium pb-1 border-b border-indigo-500/20 flex items-center justify-between">
                    <span>勾选本次快照包含的子模块：</span>
                    <span className="font-mono text-primary font-semibold">已选 {backupCustomModules.length} 个</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: "core", label: "核心配置与主机资产", required: true },
                      { id: "metrics", label: "探针时序监控数据", required: false },
                      { id: "audit", label: "操作与安全审计日志", required: false },
                      { id: "alerts", label: "告警事件与推送记录", required: false },
                      { id: "tasks", label: "任务执行与脚本日志", required: false },
                      { id: "apilogs", label: "API 访问与鉴权流水", required: false },
                      { id: "themes", label: "大盘主题与展示模板", required: false }
                    ].map((m) => {
                      const isChecked = m.required || backupCustomModules.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={m.required}
                          onClick={() => {
                            if (m.required) return;
                            setBackupCustomModules((prev) =>
                              prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                            );
                          }}
                          className={`p-1.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                            m.required
                              ? "border-border/40 bg-muted/40 text-foreground cursor-not-allowed opacity-90"
                              : isChecked
                              ? "border-primary bg-background text-foreground shadow-2xs cursor-pointer"
                              : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground cursor-pointer"
                          }`}
                        >
                          <span className="truncate text-[11px]">{m.label}</span>
                          <div className={`size-3.5 rounded flex items-center justify-center text-[9px] font-bold ${isChecked ? "bg-primary text-primary-foreground" : "border border-border/80"}`}>
                            {isChecked && <Check className="size-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">快照备注说明</label>
              <input
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                placeholder="例如: 升级 v0.2.1 前手动快照"
                className="w-full h-9 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="size-3.5 text-primary" />
                  AES-256 安全密码加密
                </span>
                <Switch checked={encryptBackup} onCheckedChange={setEncryptBackup} />
              </div>
              {encryptBackup && (
                <input
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="请输入备份归档解密密钥 (留空使用主控内置密钥)"
                  className="w-full h-9 rounded-lg border border-border/80 bg-background px-3 text-xs font-mono outline-none focus:border-primary text-foreground mt-1"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-3.5 border-t border-border/60 bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isBackingUp}
              className="h-8.5 text-xs cursor-pointer"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleStartCreateBackup}
              disabled={isBackingUp}
              className="h-8.5 px-4 text-xs cursor-pointer font-semibold shadow-xs"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="size-3.5 mr-1 animate-spin" />
                  正在打包快照...
                </>
              ) : (
                "立即创建快照"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 8. 数据还原高危确认弹窗 */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
          <div className="px-6 py-4 border-b border-rose-500/20 bg-rose-500/5 flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/40 shadow-xs">
              <AlertTriangle className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                确认执行系统数据还原？
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-500/90 mt-0.5">
                高危操作：系统数据将被所选快照完全覆盖
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="size-4 shrink-0" />
                即将覆盖当前全部主机与系统配置数据
              </div>
              <div className="text-[11px] leading-relaxed space-y-0.5 pt-0.5 text-foreground/90">
                <div>还原目标：<strong className="font-mono">{selectedBackupForRestore?.filename}</strong></div>
                <div>数据范围：<span className="text-muted-foreground">{selectedBackupForRestore?.scope || "全量数据"}</span></div>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-rose-500/20">
                系统在执行还原前将自动为你生成一份当前状态的安全回滚点，建议在业务低峰期操作。
              </p>
            </div>

            {selectedBackupForRestore?.isEncrypted ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    <Lock className="size-3 text-emerald-500" /> 解密密钥 / 保护密码
                  </label>
                  <span className="text-[10px] text-muted-foreground font-normal">（如未设密码可直接留空）</span>
                </div>
                <input
                  type="password"
                  value={restoreVerifyPassword}
                  onChange={(e) => setRestoreVerifyPassword(e.target.value)}
                  placeholder="如备份未设置密码请直接留空"
                  className="w-full h-9 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
                <p className="text-[10px] text-muted-foreground">
                  提示：如果创建此备份时密码为空，无需输入任何密码，直接点击下方「确认覆盖并还原」即可。
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center gap-2 text-muted-foreground text-xs">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>该快照为明文归档包，无需输入密码，可直接确认还原。</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-6 py-3.5 border-t border-border/60 bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRestoreDialogOpen(false);
                setRestoreVerifyPassword("");
              }}
              disabled={isRestoring}
              className="h-8.5 text-xs cursor-pointer"
            >
              取消
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="h-8.5 px-4 text-xs cursor-pointer font-semibold shadow-xs"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="size-3.5 mr-1 animate-spin" />
                  正在恢复数据...
                </>
              ) : (
                "确认覆盖并还原"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 9. 批量清理历史备份弹窗 */}
      <Dialog open={pruneBackupDialogOpen} onOpenChange={setPruneBackupDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
          <div className="px-6 py-4 border-b border-border/60 bg-gradient-to-r from-rose-500/10 via-background to-background flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/40 shadow-xs">
              <Trash2 className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                批量清理备份归档
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                按规则清理冗余的历史快照文件以释放磁盘存储空间
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="space-y-2">
              <label className="font-semibold text-foreground">选择清理规则</label>
              <div className="space-y-2">
                {[
                  { key: "older_30d" as const, label: "清理 30 天前的旧快照 (保留近一月)", desc: "推荐策略，保留近期的应急恢复点" },
                  { key: "older_7d" as const, label: "清理 7 天前的旧快照 (仅保留近一周)", desc: "磁盘空间紧张时适用" },
                  { key: "only_scheduled" as const, label: "仅清理所有「定时自动备份」快照", desc: "保留全部手动备份，仅清理定时副本" },
                  { key: "all" as const, label: "清空全部备份文件 (0 份保留)", desc: "彻底清空所有本地快照包" }
                ].map((rule) => {
                  const active = pruneBackupRule === rule.key;
                  return (
                    <button
                      key={rule.key}
                      type="button"
                      onClick={() => setPruneBackupRule(rule.key)}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? "border-rose-500 bg-rose-500/10 text-foreground font-bold shadow-2xs"
                          : "border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">{rule.label}</span>
                        {active && <Check className="size-3.5 text-rose-500" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-normal mt-0.5">{rule.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-3.5 border-t border-border/60 bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPruneBackupDialogOpen(false)}
              className="h-8.5 text-xs cursor-pointer"
            >
              取消
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleExecutePruneBackups}
              className="h-8.5 px-4 text-xs cursor-pointer font-semibold shadow-xs"
            >
              确认清理
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
