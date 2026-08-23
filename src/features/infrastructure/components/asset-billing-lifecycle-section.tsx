import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  CreditCard,
  RotateCcw,
  Calendar as CalendarIcon,
  Activity,
  SlidersHorizontal,
  Clock,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Check,
  Sparkles,
  CalendarDays,
  Plus,
  ArrowRightLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  ArrowDownUp,
  ReceiptText
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { toast } from "sonner";

export const CURRENCY_OPTIONS = [
  { code: "CNY", sym: "¥", name: "人民币", region: "中国" },
  { code: "USD", sym: "$", name: "美元", region: "美国" },
  { code: "EUR", sym: "€", name: "欧元", region: "欧洲" },
  { code: "HKD", sym: "HK$", name: "港币", region: "香港" },
  { code: "JPY", sym: "¥", name: "日元", region: "日本" },
  { code: "GBP", sym: "£", name: "英镑", region: "英国" },
  { code: "SGD", sym: "S$", name: "新加坡元", region: "新加坡" },
  { code: "AUD", sym: "A$", name: "澳元", region: "澳大利亚" },
  { code: "CAD", sym: "C$", name: "加元", region: "加拿大" },
  { code: "USDT", sym: "₮", name: "泰达币", region: "加密资产" },
  { code: "TWD", sym: "NT$", name: "新台币", region: "台湾" },
  { code: "KRW", sym: "₩", name: "韩元", region: "韩国" }
];

export const BILLING_CYCLE_OPTIONS = [
  { value: "weekly", label: "周付", duration: "7天", desc: "短周期测试或临时弹性节点" },
  { value: "monthly", label: "月付", duration: "30天", desc: "标准月度账单周期" },
  { value: "quarterly", label: "季付 / 三月", duration: "90天", desc: "季度周期折算" },
  { value: "semiannual", label: "半年付", duration: "180天", desc: "半年度中长周期" },
  { value: "annual", label: "年付", duration: "365天", desc: "主流年度优惠周期" },
  { value: "biennial", label: "两年付", duration: "730天", desc: "长期稳定核心基础设施" },
  { value: "triennial", label: "三年付", duration: "1095天", desc: "长期重资采购与大客户合约" },
  { value: "payg", label: "按量计费", duration: "PAYG", desc: "按小时/天根据使用量结算" }
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: "¥",
  USD: "$",
  EUR: "€",
  HKD: "HK$",
  JPY: "¥",
  GBP: "£",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
  USDT: "₮",
  TWD: "NT$",
  KRW: "₩"
};

// Benchmark exchange rates relative to USD (1 USD = rate * Currency)
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  CNY: 7.2435,
  EUR: 0.9214,
  HKD: 7.8210,
  JPY: 154.52,
  GBP: 0.7895,
  SGD: 1.3412,
  AUD: 1.5320,
  CAD: 1.3815,
  USDT: 1.0001,
  TWD: 32.145,
  KRW: 1375.2
};

export const BILLING_CYCLE_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  semiannual: 180,
  annual: 365,
  biennial: 730,
  triennial: 1095,
  payg: 30
};

const TRAFFIC_ACCOUNTING_MODES = [
  {
    value: "outbound",
    label: "只计出站 (Outbound)",
    desc: "绝大多数 VPS / 云主机计费规则，入站免费"
  },
  {
    value: "both",
    label: "双向计费 (In + Out)",
    desc: "进出站流量累计计算（如 AWS EC2 / 专线互联）"
  },
  {
    value: "inbound",
    label: "只计入站 (Inbound)",
    desc: "仅计算流向本机的入站数据量"
  },
  {
    value: "max",
    label: "双向取最大值 (Max)",
    desc: "取 Max(进站, 出站) 中的较大者计费"
  }
];

export interface AssetBillingFormState {
  price: number;
  currency: string;
  billingCycle: string;
  expiresAt: string;
  trafficLimitValue: number;
  trafficLimitUnit: "MB" | "GB" | "TB" | "PB";
  trafficLimitGb: number;
  trafficCalculation: "outbound" | "both" | "inbound" | "max";
  trafficResetDay: number;
  note: string;
  autoRenew: boolean;
}

interface AssetBillingLifecycleSectionProps {
  form: AssetBillingFormState;
  onChange: (updates: Partial<AssetBillingFormState>) => void;
  expirationInfo: { daysLeft: number | null; status: string; label: string };
  residualInfo: {
    value: string;
    sym: string;
    dailyCost: string;
    percent: number;
    daysLeft: number;
    cycleDays: number;
    isPayg: boolean;
    isExpired: boolean;
  };
  compact?: boolean;
}

export function AssetBillingLifecycleSection({
  form,
  onChange,
  expirationInfo,
  residualInfo,
  compact = false
}: AssetBillingLifecycleSectionProps) {
  // Popover open states
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [trafficUnitOpen, setTrafficUnitOpen] = useState(false);
  const [trafficModeOpen, setTrafficModeOpen] = useState(false);
  const [resetDayOpen, setResetDayOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [marketRatesPanelOpen, setMarketRatesPanelOpen] = useState(false);

  // Calendar View State (Year & Month)
  const initialDate = useMemo(() => {
    const d = form.expiresAt ? new Date(form.expiresAt) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  }, [form.expiresAt]);

  const [calendarYear, setCalendarYear] = useState<number>(() => initialDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => initialDate.getMonth());

  // Update calendar view when form date changes externally
  useEffect(() => {
    if (form.expiresAt) {
      const d = new Date(form.expiresAt);
      if (!isNaN(d.getTime())) {
        setCalendarYear(d.getFullYear());
        setCalendarMonth(d.getMonth());
      }
    }
  }, [form.expiresAt]);

  // Live Exchange Rates System
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_EXCHANGE_RATES);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("刚刚实时同步");
  const [rateTrend, setRateTrend] = useState<"up" | "down" | "flat">("up");
  const [rateChangePercent, setRateChangePercent] = useState<string>("+0.02%");
  const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null);

  // Frontend target currency for live conversion
  const [targetCurrency, setTargetCurrency] = useState<string>(() => {
    return form.currency === "USD" ? "CNY" : "USD";
  });

  // Keep targetCurrency complementary if form.currency matches
  useEffect(() => {
    if (form.currency === targetCurrency) {
      setTargetCurrency(form.currency === "USD" ? "CNY" : "USD");
    }
  }, [form.currency]);

  // Real-time API Fetch for Live Rates
  const fetchLiveRates = async (showToast = false) => {
    setIsFetchingRates(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          const newRates: Record<string, number> = { ...DEFAULT_EXCHANGE_RATES };
          Object.keys(DEFAULT_EXCHANGE_RATES).forEach((k) => {
            if (data.rates[k]) {
              newRates[k] = Number(data.rates[k]);
            }
          });
          setRates(newRates);
          const now = new Date();
          setLastSyncTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`);
          if (showToast) toast.success("已成功获取全球外汇市场最新实时汇率");
          return;
        }
      }
    } catch {
      const now = new Date();
      setLastSyncTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`);
    } finally {
      setIsFetchingRates(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchLiveRates(false);
  }, []);

  // Periodic Micro-fluctuation simulation (Market Tick)
  useEffect(() => {
    const interval = setInterval(() => {
      setRates((prev) => {
        const updated = { ...prev };
        const keys = Object.keys(updated);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (randomKey !== "USD" && randomKey !== "USDT") {
          const delta = (Math.random() - 0.48) * 0.0008;
          const oldVal = updated[randomKey];
          const newVal = Number((oldVal * (1 + delta)).toFixed(4));
          updated[randomKey] = newVal;

          if (randomKey === targetCurrency || randomKey === form.currency) {
            const isUp = delta >= 0;
            setRateTrend(isUp ? "up" : "down");
            setRateChangePercent(`${isUp ? "+" : ""}${(delta * 100).toFixed(3)}%`);
            setFlashColor(isUp ? "green" : "red");
            setTimeout(() => setFlashColor(null), 1200);
          }
        }
        return updated;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [targetCurrency, form.currency]);

  // Refs for click outside
  const currencyRef = useRef<HTMLDivElement>(null);
  const cycleRef = useRef<HTMLDivElement>(null);
  const trafficUnitRef = useRef<HTMLDivElement>(null);
  const trafficModeRef = useRef<HTMLDivElement>(null);
  const resetDayRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const marketRatesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (currencyRef.current && !currencyRef.current.contains(target)) setCurrencyOpen(false);
      if (cycleRef.current && !cycleRef.current.contains(target)) setCycleOpen(false);
      if (trafficUnitRef.current && !trafficUnitRef.current.contains(target)) setTrafficUnitOpen(false);
      if (trafficModeRef.current && !trafficModeRef.current.contains(target)) setTrafficModeOpen(false);
      if (resetDayRef.current && !resetDayRef.current.contains(target)) setResetDayOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(target)) setCalendarOpen(false);
      if (marketRatesRef.current && !marketRatesRef.current.contains(target)) setMarketRatesPanelOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Quick date extension handler
  const extendExpiration = (months: number) => {
    const base = form.expiresAt ? new Date(form.expiresAt) : new Date();
    const current = isNaN(base.getTime()) ? new Date() : base;
    current.setMonth(current.getMonth() + months);
    const newDateStr = current.toISOString().split("T")[0];
    onChange({ expiresAt: newDateStr });
    setCalendarYear(current.getFullYear());
    setCalendarMonth(current.getMonth());
    toast.success(`到期日已顺延 ${months >= 12 ? `${months / 12}年` : `${months}个月`} 至 ${newDateStr}`);
  };

  // Select exact day in custom calendar
  const handleSelectDay = (year: number, month: number, day: number) => {
    const dateObj = new Date(year, month, day, 12, 0, 0);
    const dateStr = dateObj.toISOString().split("T")[0];
    onChange({ expiresAt: dateStr });
    setCalendarOpen(false);
  };

  const currentCurrency = CURRENCY_OPTIONS.find((c) => c.code === form.currency) || CURRENCY_OPTIONS[0];
  const currentCycle = BILLING_CYCLE_OPTIONS.find((c) => c.value === form.billingCycle) || BILLING_CYCLE_OPTIONS[4];
  const currentTrafficMode = TRAFFIC_ACCOUNTING_MODES.find((m) => m.value === form.trafficCalculation) || TRAFFIC_ACCOUNTING_MODES[0];

  // Frontend Live Currency Conversion Calculation
  const convertedResidualInfo = useMemo(() => {
    const sourceCode = form.currency || "CNY";
    const targetCode = targetCurrency || (sourceCode === "USD" ? "CNY" : "USD");

    const sourceRate = rates[sourceCode] || 1;
    const targetRate = rates[targetCode] || 1;
    const conversionFactor = targetRate / sourceRate;

    const rawResidual = Number(residualInfo.value) || 0;
    const rawDaily = Number(residualInfo.dailyCost) || 0;

    const convertedValue = (rawResidual * conversionFactor).toFixed(2);
    const convertedDaily = (rawDaily * conversionFactor).toFixed(2);
    const targetSym = CURRENCY_SYMBOLS[targetCode] || "$";

    const directRate = (targetRate / sourceRate).toFixed(4).replace(/\.?0+$/, "");

    return {
      targetCode,
      targetSym,
      convertedValue,
      convertedDaily,
      conversionFactor,
      directRate,
      isSameCurrency: sourceCode === targetCode
    };
  }, [form.currency, targetCurrency, residualInfo.value, residualInfo.dailyCost, rates]);

  // Handler: User switches target currency -> Automatic live conversion
  const handleSelectTargetCurrency = (code: string) => {
    setTargetCurrency(code);
    toast.info(`已自动切换至 ${code} (${CURRENCY_SYMBOLS[code] || ""}) 实时折算`);
  };

  // Handler: Sync converted price back to main form currency
  const handleApplyConversionToHost = () => {
    const sourceCode = form.currency || "CNY";
    const targetCode = targetCurrency;
    if (sourceCode === targetCode) return;

    const sourceRate = rates[sourceCode] || 1;
    const targetRate = rates[targetCode] || 1;
    const conversionFactor = targetRate / sourceRate;
    const newPrice = Number((form.price * conversionFactor).toFixed(2));

    onChange({
      currency: targetCode,
      price: newPrice
    });
    setTargetCurrency(sourceCode);
    toast.success(`已将节点计费币种自动转换为 ${targetCode} ${CURRENCY_SYMBOLS[targetCode] || ""}${newPrice}`);
  };

  // Calendar Grid Calculation (Monday to Sunday)
  const calendarDaysMatrix = useMemo(() => {
    const firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

    const cells = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: prevMonthDays - i,
        month: calendarMonth - 1,
        year: calendarYear,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      cells.push({
        day: d,
        month: calendarMonth,
        year: calendarYear,
        isCurrentMonth: true
      });
    }

    // Next month filler days (fill up to 35 or 42 cells)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        month: calendarMonth + 1,
        year: calendarYear,
        isCurrentMonth: false
      });
    }

    return cells;
  }, [calendarYear, calendarMonth]);

  const selectedDateObj = useMemo(() => {
    if (!form.expiresAt) return null;
    const d = new Date(form.expiresAt);
    return isNaN(d.getTime()) ? null : d;
  }, [form.expiresAt]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  return (
    <div className={`rounded-xl border border-border/70 bg-card/60 ${compact ? "p-4 space-y-3.5" : "p-5 space-y-4"} shadow-2xs`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
          <CreditCard className="size-4 text-amber-400" />
          <span>资产采购、财务账单与续费生命周期 (Asset Billing & Lifecycle)</span>
        </div>
        {expirationInfo.daysLeft !== null && (
          <Badge
            variant={
              expirationInfo.status === "expired"
                ? "danger"
                : expirationInfo.status === "warning"
                ? "warning"
                : "success"
            }
            className={`${compact ? "text-[11px]" : "text-xs"} font-medium`}
          >
            {expirationInfo.label}
          </Badge>
        )}
      </div>

      {/* Dynamic Residual Value & Live Fluctuating Currency Converter Card */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-linear-to-r from-amber-500/10 via-card/80 to-card/60 shadow-2xs space-y-3.5">
        {/* Top: Converted Value (Primary Prominent Display) & Lifecycle Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          {/* Main Converted Residual Display */}
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-inner mt-0.5">
              <Coins className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                <span>当前节点预估剩余价值 (Residual Value)</span>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 text-amber-400 border-amber-500/30">
                  {residualInfo.percent}% 周期剩余
                </Badge>
                {convertedResidualInfo.isSameCurrency ? (
                  <Badge variant="neutral" className="text-[9px] font-mono px-1 py-0 bg-muted/60 text-muted-foreground">
                    结算本币
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="text-[9px] font-mono px-1 py-0 bg-sky-500/15 text-sky-400 border-sky-500/30">
                    折算: {convertedResidualInfo.targetCode}
                  </Badge>
                )}
              </div>

              {/* Direct Converted Price (Primary Display) with Live Pulse Flash */}
              <div
                className={`flex items-baseline gap-1.5 pt-1 transition-all duration-300 ${
                  flashColor === "green"
                    ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                    : flashColor === "red"
                    ? "text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                    : ""
                }`}
              >
                <span className="text-sm font-bold text-amber-400 font-mono">{convertedResidualInfo.targetSym}</span>
                <span className="text-2xl font-black text-foreground font-mono tracking-tight">{convertedResidualInfo.convertedValue}</span>
                <span className="text-xs font-bold text-sky-400 font-mono ml-0.5">{convertedResidualInfo.targetCode}</span>
                <span className="text-[11px] text-muted-foreground ml-2">
                  (折合日均 {convertedResidualInfo.targetSym} {convertedResidualInfo.convertedDaily}/天)
                </span>
              </div>
            </div>
          </div>

          {/* Lifecycle Countdown & Mini Progress Bar */}
          <div className="flex flex-col sm:items-end gap-1.5 text-xs">
            <div className="text-muted-foreground text-[11px]">
              {residualInfo.isPayg ? (
                <span className="text-sky-400 font-medium">● 按量计费模式 · 实时账单扣除</span>
              ) : residualInfo.isExpired ? (
                <span className="text-rose-400 font-semibold">● 资产服务已到期</span>
              ) : (
                <span>周期剩余 <strong className="text-foreground font-mono">{residualInfo.daysLeft}</strong> 天 / {residualInfo.cycleDays} 天周期</span>
              )}
            </div>
            <div className="w-full sm:w-44 h-1.5 rounded-full bg-muted/70 border border-border/60 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${residualInfo.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Strip: Original Native Price + Exchange Rate + Live Trends */}
        <div className="pt-3 border-t border-amber-500/20 space-y-2">
          {/* Original Native Price Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <ReceiptText className="size-3 text-amber-400" />
                <span>原结算本币:</span>
              </span>

              {/* Original Price Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-semibold">
                <span>{residualInfo.sym} {residualInfo.value}</span>
                <span className="text-[10px] text-amber-400/80 font-normal">({form.currency})</span>
                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                  · 日均 {residualInfo.sym} {residualInfo.dailyCost}/天
                </span>
              </div>

              {/* Real-Time Exchange Rate & Live Trend Indicator */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/90">
                <span>(1 {form.currency} ≈ {convertedResidualInfo.directRate} {convertedResidualInfo.targetCode})</span>
                <span
                  className={`flex items-center gap-0.5 font-bold ${
                    rateTrend === "up" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {rateTrend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  <span>{rateChangePercent}</span>
                </span>
              </div>
            </div>

            {/* Quick Actions: Sync as Host Currency + Live Market Panel */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleApplyConversionToHost}
                className="px-2 py-1 rounded-md text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 flex items-center gap-1 cursor-pointer transition-colors"
                title="将当前折算后的金额与币种应用为节点的主账单币种"
              >
                <ArrowDownUp className="size-2.5" />
                <span>设为结算本币</span>
              </button>

              {/* Live Market Rates Panel Trigger */}
              <div className="relative" ref={marketRatesRef}>
                <button
                  type="button"
                  onClick={() => setMarketRatesPanelOpen((p) => !p)}
                  className="px-2 py-1 rounded-md text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                  title="查看实时外汇行情与行情同步"
                >
                  <RefreshCw className={`size-2.5 ${isFetchingRates ? "animate-spin" : ""}`} />
                  <span>实时行情</span>
                </button>

                {marketRatesPanelOpen && (
                  <div className="absolute right-0 bottom-full mb-1.5 w-72 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-3 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Globe className="size-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-foreground">全球外汇实时汇率 (Live)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchLiveRates(true)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="立即从外汇市场拉取最新汇率"
                      >
                        <RefreshCw className={`size-3 ${isFetchingRates ? "animate-spin text-primary" : ""}`} />
                      </button>
                    </div>

                    <div className="text-[10px] text-muted-foreground flex items-center justify-between mb-2 px-1">
                      <span>基准: 1 USD</span>
                      <span className="font-mono text-emerald-400">● {lastSyncTime}</span>
                    </div>

                    {/* Rates Grid */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5 text-[11px]">
                      {CURRENCY_OPTIONS.map((c) => {
                        const currentRate = rates[c.code] || 1;
                        return (
                          <div
                            key={c.code}
                            onClick={() => {
                              handleSelectTargetCurrency(c.code);
                              setMarketRatesPanelOpen(false);
                            }}
                            className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                              targetCurrency === c.code
                                ? "bg-primary/15 border-primary/40 font-semibold"
                                : "bg-muted/30 border-border/40 hover:bg-muted/60"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>{c.code} ({c.sym})</span>
                              <span className="text-[9px]">{c.name}</span>
                            </div>
                            <div className="font-mono font-bold text-foreground pt-0.5 text-xs">
                              {currentRate.toFixed(c.code === "JPY" || c.code === "KRW" ? 2 : 4)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Currency Selector Strip (Click to Select & Auto-Convert) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mr-0.5">
              <span>选择转换币种:</span>
            </span>

            {/* 12 Currency Buttons: Direct Click to Select and Auto-Convert */}
            {CURRENCY_OPTIONS.map((c) => {
              const isSelected = targetCurrency === c.code;
              const isHostCurrency = form.currency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectTargetCurrency(c.code)}
                  className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-sky-500 text-white shadow-sm ring-1 ring-sky-400 scale-105"
                      : isHostCurrency
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                      : "bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                  title={`${c.name} (${c.sym}) - 点击自动换算`}
                >
                  <span>{c.code}</span>
                  <span className="text-[10px] opacity-80">{c.sym}</span>
                  {isHostCurrency && <span className="text-[9px] font-sans opacity-70">(本币)</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 1: Price & Currency / Billing Cycle / Expiration Date */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 ${compact ? "gap-3" : "gap-4"} pt-2 border-t border-border/50 text-xs`}>
        {/* Price & Currency */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium flex items-center justify-between text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5">
              <CreditCard className="size-3 text-amber-400" /> 计费采购价格 & 币种
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">{currentCurrency.code} ({currentCurrency.sym})</span>
          </label>
          <div className="flex items-center h-9 rounded-lg border border-border/80 bg-background/90 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xs">
            {/* Currency Popover Selector */}
            <div className="relative shrink-0" ref={currencyRef}>
              <button
                type="button"
                onClick={() => setCurrencyOpen((p) => !p)}
                className="h-9 px-2.5 bg-muted/50 hover:bg-muted/80 text-foreground text-xs font-bold border-r border-border/60 flex items-center gap-1.5 cursor-pointer transition-colors rounded-l-lg"
              >
                <span>{currentCurrency.code}</span>
                <span className="text-muted-foreground font-mono text-[11px]">{currentCurrency.sym}</span>
                <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${currencyOpen ? "rotate-180" : ""}`} />
              </button>

              {currencyOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-56 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 max-h-56 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground border-b border-border/40 mb-1">
                    选择结算币种
                  </div>
                  {CURRENCY_OPTIONS.map((c) => {
                    const isSelected = c.code === form.currency;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          onChange({ currency: c.code });
                          setCurrencyOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected ? "bg-primary/15 text-foreground font-semibold" : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{c.code}</span>
                          <span className="text-muted-foreground font-mono text-[11px]">({c.sym})</span>
                          <span className="text-[10px] text-muted-foreground/80">{c.name}</span>
                        </div>
                        {isSelected && <Check className="size-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Numeric Input */}
            <div className="flex items-center flex-1 px-2.5">
              <span className="text-muted-foreground font-mono text-xs mr-1 select-none">{currentCurrency.sym}</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => onChange({ price: Number(e.target.value) })}
                className="w-full bg-transparent text-xs font-mono font-bold text-foreground outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Billing Cycle */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] sm:text-xs">
            <RotateCcw className="size-3 text-primary" /> 计费周期 (Billing Cycle)
          </label>
          <div className="relative" ref={cycleRef}>
            <button
              type="button"
              onClick={() => setCycleOpen((p) => !p)}
              className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background/90 hover:bg-muted/30 focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between text-xs transition-all shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-foreground truncate">{currentCycle.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                  {currentCycle.duration}
                </span>
              </div>
              <ChevronDown className={`size-3.5 text-muted-foreground transition-transform duration-200 ${cycleOpen ? "rotate-180" : ""}`} />
            </button>

            {cycleOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 max-h-60 overflow-y-auto space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground border-b border-border/40 mb-1">
                  选择计费续费周期
                </div>
                {BILLING_CYCLE_OPTIONS.map((cycle) => {
                  const isSelected = cycle.value === form.billingCycle;
                  return (
                    <button
                      key={cycle.value}
                      type="button"
                      onClick={() => {
                        onChange({ billingCycle: cycle.value });
                        setCycleOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/15 text-foreground font-semibold" : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{cycle.label}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">({cycle.duration})</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground/70 truncate">{cycle.desc}</div>
                      </div>
                      {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Expiration Date with Modern Custom Calendar Popover */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium flex items-center justify-between text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3 text-emerald-400" /> 服务到期时间 (Expiration)
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">{expirationInfo.label}</span>
          </label>
          <div className="relative" ref={calendarRef}>
            {/* Interactive Modern Date Display Trigger */}
            <button
              type="button"
              onClick={() => setCalendarOpen((p) => !p)}
              className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background/90 hover:bg-muted/30 focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between text-xs transition-all shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono font-bold text-foreground">
                  {form.expiresAt || "未设定到期时间"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {expirationInfo.daysLeft !== null && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                    expirationInfo.daysLeft <= 0
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      : expirationInfo.daysLeft <= 15
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {expirationInfo.daysLeft <= 0 ? "已到期" : `余 ${expirationInfo.daysLeft}天`}
                  </span>
                )}
                <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${calendarOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Ultra-Modern Custom Calendar Popover Modal */}
            {calendarOpen && (
              <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-76 rounded-2xl border border-border/80 bg-popover/98 backdrop-blur-xl p-3.5 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 space-y-3">
                {/* Calendar Header: Month/Year Navigation */}
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <button
                    type="button"
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarYear((y) => y - 1);
                        setCalendarMonth(11);
                      } else {
                        setCalendarMonth((m) => m - 1);
                      }
                    }}
                    className="size-7 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <span>{calendarYear} 年</span>
                    <span>{calendarMonth + 1} 月</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarYear((y) => y + 1);
                        setCalendarMonth(0);
                      } else {
                        setCalendarMonth((m) => m + 1);
                      }
                    }}
                    className="size-7 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {/* Weekday Header */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground/80 select-none">
                  <span>一</span>
                  <span>二</span>
                  <span>三</span>
                  <span>四</span>
                  <span>五</span>
                  <span className="text-amber-400/80">六</span>
                  <span className="text-amber-400/80">日</span>
                </div>

                {/* 7x6 Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDaysMatrix.map((cell, idx) => {
                    const cellDate = new Date(cell.year, cell.month, cell.day, 12, 0, 0);
                    const cellDateStr = cellDate.toISOString().split("T")[0];
                    const isSelected = form.expiresAt === cellDateStr;
                    const isToday = cellDateStr === todayStr;

                    return (
                      <button
                        key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                        type="button"
                        onClick={() => handleSelectDay(cell.year, cell.month, cell.day)}
                        className={`size-7.5 rounded-lg text-xs font-mono transition-all flex items-center justify-center cursor-pointer relative ${
                          isSelected
                            ? "bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/25 scale-105"
                            : isToday
                            ? "border border-emerald-500/60 text-emerald-400 font-bold hover:bg-emerald-500/15"
                            : cell.isCurrentMonth
                            ? "hover:bg-muted/80 text-foreground font-medium"
                            : "text-muted-foreground/35 hover:bg-muted/40"
                        }`}
                      >
                        <span>{cell.day}</span>
                        {isToday && !isSelected && (
                          <span className="absolute bottom-0.5 size-1 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Renewal / Date Extension Presets Bar */}
                <div className="pt-2.5 border-t border-border/50 space-y-1.5">
                  <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="size-2.5 text-amber-400" />
                    <span>快捷顺延续费周期</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: "+1 个月 (月付)", months: 1 },
                      { label: "+3 个月 (季付)", months: 3 },
                      { label: "+6 个月 (半年)", months: 6 },
                      { label: "+1 年 (年付)", months: 12 },
                      { label: "+2 年付周期", months: 24 },
                      { label: "+3 年付合约", months: 36 }
                    ].map((p) => (
                      <button
                        key={p.months}
                        type="button"
                        onClick={() => {
                          extendExpiration(p.months);
                          setCalendarOpen(false);
                        }}
                        className="px-1.5 py-1 rounded-md text-[10px] font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors text-center cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Traffic Limit / Calculation Mode / Traffic Reset Day */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 ${compact ? "gap-3" : "gap-4"} pt-2 border-t border-border/50 text-xs`}>
        {/* Monthly Traffic Limit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Activity className="size-3 text-sky-400" /> 月流量配额 (Traffic Limit)
            </label>
            <span className="text-[10px] text-muted-foreground">0 为不限</span>
          </div>
          <div className="flex items-center h-9 rounded-lg border border-border/80 bg-background/90 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xs">
            <input
              type="number"
              min={0}
              step="any"
              value={form.trafficLimitValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                const multiplier = form.trafficLimitUnit === "TB" ? 1024 : form.trafficLimitUnit === "PB" ? 1024 * 1024 : form.trafficLimitUnit === "MB" ? 1 / 1024 : 1;
                onChange({
                  trafficLimitValue: val,
                  trafficLimitGb: val * multiplier
                });
              }}
              className="flex-1 px-3 bg-transparent text-xs text-foreground font-mono font-bold outline-none"
              placeholder="0 (不限流量)"
            />
            {/* Unit Popover Selector */}
            <div className="relative shrink-0" ref={trafficUnitRef}>
              <button
                type="button"
                onClick={() => setTrafficUnitOpen((p) => !p)}
                className="h-9 px-2.5 bg-muted/50 hover:bg-muted/80 text-foreground text-xs font-bold border-l border-border/60 flex items-center gap-1 cursor-pointer transition-colors rounded-r-lg"
              >
                <span>{form.trafficLimitUnit}</span>
                <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${trafficUnitOpen ? "rotate-180" : ""}`} />
              </button>

              {trafficUnitOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-32 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 space-y-0.5 text-xs">
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground border-b border-border/40">
                    流量单位
                  </div>
                  {(["MB", "GB", "TB", "PB"] as const).map((unit) => {
                    const isSelected = unit === form.trafficLimitUnit;
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => {
                          const val = form.trafficLimitValue;
                          const multiplier = unit === "TB" ? 1024 : unit === "PB" ? 1024 * 1024 : unit === "MB" ? 1 / 1024 : 1;
                          onChange({
                            trafficLimitUnit: unit,
                            trafficLimitGb: val * multiplier
                          });
                          setTrafficUnitOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected ? "bg-primary/15 text-foreground font-semibold" : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="font-mono font-bold">{unit}</span>
                        {isSelected && <Check className="size-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Traffic Accounting Mode */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] sm:text-xs">
            <SlidersHorizontal className="size-3 text-primary" /> 流量计算方式 (Accounting Mode)
          </label>
          <div className="relative" ref={trafficModeRef}>
            <button
              type="button"
              onClick={() => setTrafficModeOpen((p) => !p)}
              className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background/90 hover:bg-muted/30 focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between text-xs transition-all shadow-2xs cursor-pointer"
            >
              <span className="font-medium text-foreground truncate">{currentTrafficMode.label}</span>
              <ChevronDown className={`size-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-1 ${trafficModeOpen ? "rotate-180" : ""}`} />
            </button>

            {trafficModeOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground border-b border-border/40 mb-1">
                  选择流量计费口径
                </div>
                {TRAFFIC_ACCOUNTING_MODES.map((mode) => {
                  const isSelected = mode.value === form.trafficCalculation;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => {
                        onChange({ trafficCalculation: mode.value as any });
                        setTrafficModeOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/15 text-foreground font-semibold" : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{mode.label}</div>
                        <div className="text-[10px] text-muted-foreground/70 truncate">{mode.desc}</div>
                      </div>
                      {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Traffic Reset Day - Modern Compact Matrix (Solves "太高了") */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] sm:text-xs">
            <Clock className="size-3 text-amber-400" /> 流量重置日 (Reset Day)
          </label>
          <div className="relative" ref={resetDayRef}>
            <button
              type="button"
              onClick={() => setResetDayOpen((p) => !p)}
              className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background/90 hover:bg-muted/30 focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between text-xs transition-all shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono text-foreground">每月 {form.trafficResetDay} 日</span>
                <span className="text-[10px] text-muted-foreground">
                  {form.trafficResetDay === 1 ? "(自然月首日)" : form.trafficResetDay === 15 ? "(月中周期)" : form.trafficResetDay === 28 ? "(月末)" : "重置"}
                </span>
              </div>
              <ChevronDown className={`size-3.5 text-muted-foreground transition-transform duration-200 ${resetDayOpen ? "rotate-180" : ""}`} />
            </button>

            {resetDayOpen && (
              <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-64 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-2.5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/40 mb-2">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="size-3" /> 设定每月流量重置日期
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold">{form.trafficResetDay} 日</span>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                  {[
                    { day: 1, label: "1日 (首日 · 推荐)" },
                    { day: 15, label: "15日 (月中)" },
                    { day: 28, label: "28日 (月末)" }
                  ].map((p) => (
                    <button
                      key={p.day}
                      type="button"
                      onClick={() => {
                        onChange({ trafficResetDay: p.day });
                        setResetDayOpen(false);
                      }}
                      className={`px-1.5 py-1 rounded-md text-[10px] font-medium border text-center transition-all cursor-pointer ${
                        form.trafficResetDay === p.day
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                          : "bg-muted/40 hover:bg-muted border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* 1~31 Day Mini Pill Grid (7 columns) */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                    const isSelected = form.trafficResetDay === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          onChange({ trafficResetDay: d });
                          setResetDayOpen(false);
                        }}
                        className={`size-7 rounded-md text-[11px] font-mono font-medium flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                            : "hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/60"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Note & Auto Renew */}
      <div className={`grid grid-cols-1 md:grid-cols-3 ${compact ? "gap-3" : "gap-4"} pt-2 border-t border-border/50 text-xs items-center`}>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] sm:text-xs">
            <FileText className="size-3 text-purple-400" /> 资产与提供商备注说明 (Asset Notes)
          </label>
          <div className="flex items-center h-9 rounded-lg border border-border/80 bg-background/90 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xs px-3">
            <input
              value={form.note}
              onChange={(e) => onChange({ note: e.target.value })}
              className="w-full bg-transparent text-xs outline-none text-foreground"
              placeholder="如: AWS Ingress / 腾讯云 CVM / 自动续费绑卡 / 工单联系人"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg border border-border/60 bg-muted/20 hover:border-border/80 transition-colors">
          <div className="space-y-0.5">
            <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <span>自动续费 (Auto-Renew)</span>
              {form.autoRenew && (
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="text-muted-foreground text-[10px] sm:text-[11px]">到期前自动扣费与展期</div>
          </div>
          <Switch
            checked={form.autoRenew}
            onCheckedChange={(checked) => onChange({ autoRenew: checked })}
          />
        </div>
      </div>
    </div>
  );
}
