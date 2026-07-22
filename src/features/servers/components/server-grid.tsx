import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Settings, SquareTerminal, WandSparkles } from "lucide-react";

import { useServerMetrics, useServerHistory } from "@/features/servers/hooks/use-monitoring";
import { useMonitoringStore } from "@/features/servers/hooks/monitoring-store";
import { useUpdateServer } from "@/features/servers/hooks/use-servers";
import { Sparkline } from "@/shared/charts/sparkline";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/layout";
import { toast } from "@/shared/ui/toaster";
import { cn, formatBytes, formatCpuPercent, formatRate, formatRelativeFrom, formatUptime } from "@/shared/lib/utils";
import type { BillingCycle, Server } from "@/shared/api/methods";

import { STATUS_META, statusColor } from "../lib/server-meta";

/** The live server list. Each row subscribes to its own metrics so only that
 *  row re-renders on a tick, not the whole list. One row per server — a wider
 *  card reads the resource trio + sparkline + secondary strip at a glance. */
export function ServerGrid({ servers }: { servers: Server[] }) {
  const [settingsServer, setSettingsServer] = useState<Server | null>(null);
  const [installerServer, setInstallerServer] = useState<Server | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-1.5">
        {servers.map((server) => (
          <ServerRow
            key={server.id}
            server={server}
            onSettings={() => setSettingsServer(server)}
            onInstall={() => setInstallerServer(server)}
          />
        ))}
      </div>
      {settingsServer ? (
        <ServerSettingsDialog
          key={settingsServer.id}
          server={settingsServer}
          open
          onOpenChange={(nextOpen) => { if (!nextOpen) setSettingsServer(null); }}
        />
      ) : null}
      {installerServer ? (
        <InstallCommandDialog
          key={installerServer.id}
          server={installerServer}
          open
          onOpenChange={(nextOpen) => { if (!nextOpen) setInstallerServer(null); }}
        />
      ) : null}
    </>
  );
}

function ServerRow({
  server,
  onSettings,
  onInstall
}: {
  server: Server;
  onSettings: () => void;
  onInstall: () => void;
}) {
  useServerMetrics(server.id);
  const metrics = useMonitoringStore((s) => s.latest.get(server.id));
  const history = useServerHistory(server.id);
  const meta = STATUS_META[server.status];
  const status = statusColor(server.status);

  const cpuPoints = history.slice(-30).map((m) => ({ ts: m.ts, value: m.cpuUsage }));
  // Memory ratio history for a second sparkline — keeps CPU/mem visually paired
  // so a memory leak reads as a climbing line next to the CPU trace.
  const memPoints = history.slice(-30).map((m) => ({ ts: m.ts, value: m.memTotal ? m.memUsed / m.memTotal : 0 }));
  const memRatio = metrics && metrics.memTotal ? metrics.memUsed / metrics.memTotal : undefined;

  return (
    <div
      className="glass cornered group relative flex flex-col gap-2 overflow-hidden rounded-md border border-border p-3 pl-4 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_-8px_var(--primary)]"
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: status, boxShadow: `0 0 10px ${status}` }}
      />
      <span className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${status}, transparent)` }} />
      <div className="relative flex items-start gap-2">
        <Link
          to={`/admin/servers/${server.id}`}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: status, boxShadow: `0 0 8px ${status}` }}
          />
          <span className="text-sm font-medium group-hover:text-primary group-hover:underline">{server.name}</span>
          <BillingFact label="价格" value={formatServerPrice(server)} tone="cyan" />
          <BillingFact label="到期" value={formatExpiry(server.expiresAt)} tone={expiryTone(server.expiresAt)} />
          <BillingFact label="周期" value={formatBillingCycle(server.billingCycle)} tone="violet" />
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {server.tags.length > 0 ? (
            <span className="hidden items-center gap-1 lg:flex">
              {server.tags.slice(0, 3).map((tag, index) => (
                <span key={tag} className={cn("rounded px-1.5 py-0.5 text-[10px]", TAG_TONE_CLASSES[index % TAG_TONE_CLASSES.length])}>{tag}</span>
              ))}
            </span>
          ) : null}
          {server.os ? (
            <code className="hidden text-[10px] text-muted-foreground xl:inline">{server.os}/{server.arch ?? "?"}</code>
          ) : null}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-7 text-violet hover:bg-violet/10 hover:text-violet" onClick={onSettings} aria-label={`设置 ${server.name}`} title="设置">
            <Settings />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7 text-cyan hover:bg-cyan/10 hover:text-cyan" onClick={onInstall} aria-label={`生成 ${server.name} 安装命令`} title="安装命令">
            <SquareTerminal />
          </Button>
        </div>
      </div>

      <Link to={`/admin/servers/${server.id}`} className="relative flex flex-col gap-2">
        {metrics ? (
          <>
          <div className="flex items-stretch gap-3">
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
              <Metric label="CPU" value={formatCpuPercent(metrics.cpuUsage)} ratio={metrics.cpuUsage} tone="cyan" />
              <Metric
                label="内存"
                value={formatBytes(metrics.memUsed)}
                sub={`/ ${formatBytes(metrics.memTotal)}`}
                ratio={memRatio}
                tone="violet"
              />
              <Metric
                label="磁盘"
                value={formatBytes(metrics.diskUsed)}
                sub={`/ ${formatBytes(metrics.diskTotal)}`}
                ratio={metrics.diskTotal ? metrics.diskUsed / metrics.diskTotal : undefined}
                tone="magenta"
              />
            </div>
            <div className="hidden w-28 shrink-0 flex-col justify-center sm:flex">
              <span className="mb-1 text-[10px] text-muted-foreground">CPU / 内存 30s</span>
              <div className="flex items-center gap-1.5">
                <Sparkline points={cpuPoints} height={28} domain={[0, 1]} />
                <Sparkline points={memPoints} height={28} domain={[0, 1]} color="var(--violet)" />
              </div>
            </div>
          </div>

          {/* Secondary stats — network + system, no progress bars (they aren't 0..1
              ratios) so the row keeps a calm baseline under the resource trio. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <Stat label="↑上行" value={formatRate(metrics.netTxSpeed)} tone="cyan" />
            <Stat label="↓下行" value={formatRate(metrics.netRxSpeed)} tone="primary" />
            <Stat label="负载" value={metrics.loadOne?.toFixed(2) ?? "-"} />
            <Stat label="运行" value={formatUptime(metrics.uptime)} />
            {metrics.tcpEnabled && metrics.tcpConnections != null ? (
              <Stat label="TCP" value={String(metrics.tcpConnections)} />
            ) : (
              <Stat label="TCP" value="关" muted />
            )}
            {metrics.swapTotal > 0 ? <Stat label="Swap" value={`${((metrics.swapUsed / metrics.swapTotal) * 100).toFixed(0)}%`} /> : null}
            {metrics.processCount ? <Stat label="进程" value={String(metrics.processCount)} /> : null}
          </div>
          </>
        ) : (
        // No live metrics yet (offline / just registered): a calm status hint
        // instead of a row of "-" placeholders, so the card still reads as
        // intentional rather than broken.
        <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{meta.label}</span>
          <span>
            {server.status === "offline" ? "无上报数据" : "等待首次上报"}
            {server.lastSeenAt ? ` · 最后上报 ${formatRelativeFrom(server.lastSeenAt)}` : null}
          </span>
        </div>
        )}
      </Link>
    </div>
  );
}

const INPUT_CLS =
  "h-9 w-full rounded-md border border-border bg-card/60 px-2 text-sm outline-none backdrop-blur-sm transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring";

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "月付" },
  { value: "quarterly", label: "季付" },
  { value: "semiannual", label: "半年付" },
  { value: "yearly", label: "年付" },
  { value: "biennial", label: "二年付" },
  { value: "triennial", label: "三年付" },
  { value: "one_time", label: "一次性" }
];

const TAG_TONE_CLASSES = [
  "bg-primary/10 text-primary",
  "bg-violet/10 text-violet",
  "bg-cyan/10 text-cyan"
];

type BillingTone = "cyan" | "warning" | "danger" | "violet";

const BILLING_TONE_CLASSES: Record<BillingTone, string> = {
  cyan: "border-cyan/40 text-cyan",
  warning: "border-warning/40 text-warning",
  danger: "border-danger/40 text-danger",
  violet: "border-violet/40 text-violet"
};

/** Commercial facts use independent colors so price, expiry and cycle scan separately. */
function BillingFact({ label, value, tone }: { label: string; value: string; tone: BillingTone }) {
  return (
    <span className={cn("inline-flex items-center gap-1 border-l pl-1.5 text-[11px] tabular-nums", BILLING_TONE_CLASSES[tone])}>
      <span className="text-muted-foreground/70">{label}</span>
      <span className={cn("font-medium", value === "-" && "text-muted-foreground/60")}>{value}</span>
    </span>
  );
}

/** Expired or 30-day hosts require attention; later dates stay in warning amber. */
function expiryTone(expiresAt: number | null | undefined): BillingTone {
  if (expiresAt && expiresAt - Date.now() <= 30 * 24 * 60 * 60 * 1000) return "danger";
  return "warning";
}

function formatServerPrice(server: Server): string {
  if (server.price == null) return "-";
  const digits = Number.isInteger(server.price) ? 0 : 2;
  return `${server.currency ?? "CNY"} ${server.price.toFixed(digits)}`;
}

function formatExpiry(expiresAt: number | null | undefined): string {
  if (!expiresAt) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(expiresAt);
}

function formatBillingCycle(cycle: BillingCycle | null | undefined): string {
  return BILLING_CYCLES.find((item) => item.value === cycle)?.label ?? "-";
}

function dateInputValue(timestamp: number | null | undefined): string {
  return timestamp ? new Date(timestamp).toISOString().slice(0, 10) : "";
}

function ServerSettingsDialog({
  server,
  open,
  onOpenChange
}: {
  server: Server;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}) {
  const update = useUpdateServer();
  const [price, setPrice] = useState(server.price?.toString() ?? "");
  const [currency, setCurrency] = useState(server.currency ?? "CNY");
  const [expiresOn, setExpiresOn] = useState(dateInputValue(server.expiresAt));
  const [billingCycle, setBillingCycle] = useState<BillingCycle | "">(server.billingCycle ?? "");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedPrice = price.trim() === "" ? null : Number(price);
    if (parsedPrice != null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      toast.error("请输入有效价格");
      return;
    }

    update.mutate(
      {
        serverId: server.id,
        price: parsedPrice,
        currency: currency.trim().toUpperCase() || "CNY",
        // A date input has calendar semantics, not UTC-instant semantics.
        // Parse at local midnight so 2028-12-31 stays 2028-12-31 in every
        // operator timezone instead of rolling into the following day.
        expiresAt: expiresOn ? new Date(`${expiresOn}T00:00:00`).getTime() : null,
        billingCycle: billingCycle || null
      },
      {
        onSuccess: () => {
          toast.success(`已更新「${server.name}」`);
          onOpenChange(false);
        },
        onError: () => toast.error("更新失败")
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>服务器设置</DialogTitle>
          <DialogDescription className="sr-only">设置价格、到期时间和计费周期</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <Field label="价格">
              <input aria-label="价格" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="45" className={INPUT_CLS} />
            </Field>
            <Field label="币种">
              <input aria-label="币种" value={currency} onChange={(event) => setCurrency(event.target.value)} placeholder="CNY" className={`${INPUT_CLS} uppercase`} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="到期时间">
              <input aria-label="到期时间" type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} className={INPUT_CLS} />
            </Field>
            <Field label="计费周期">
              <select aria-label="计费周期" value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as BillingCycle | "")} className={INPUT_CLS}>
                <option value="">未设置</option>
                {BILLING_CYCLES.map((cycle) => <option key={cycle.value} value={cycle.value}>{cycle.label}</option>)}
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={update.isPending}>取消</Button>
            <Button type="submit" size="sm" disabled={update.isPending}>{update.isPending ? "保存中..." : "保存"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InstallCommandDialog({
  server,
  open,
  onOpenChange
}: {
  server: Server;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const [scriptUrl, setScriptUrl] = useState(`${origin}/agent/install.sh`);
  const [endpoint, setEndpoint] = useState(`${origin}/rpc`);
  const [token, setToken] = useState("");
  const [agentName, setAgentName] = useState(server.name);
  const [tags, setTags] = useState(server.tags.join(","));
  const [command, setCommand] = useState("");

  const generate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scriptUrl.trim() || !endpoint.trim() || !agentName.trim()) {
      toast.error("请填写安装脚本、控制端地址和服务器名称");
      return;
    }
    setCommand(buildInstallCommand({
      scriptUrl: scriptUrl.trim(),
      endpoint: endpoint.trim(),
      token: token.trim(),
      name: agentName.trim(),
      tags: tags.trim()
    }));
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success("安装命令已复制");
    } catch {
      toast.error("复制失败，请手动选择命令");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>生成安装命令</DialogTitle>
          <DialogDescription className="sr-only">填写 Agent 安装参数并生成 shell 命令</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={generate}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="安装脚本地址">
              <input aria-label="安装脚本地址" value={scriptUrl} onChange={(event) => setScriptUrl(event.target.value)} className={`${INPUT_CLS} font-mono`} />
            </Field>
            <Field label="控制端地址">
              <input aria-label="控制端地址" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} className={`${INPUT_CLS} font-mono`} />
            </Field>
            <Field label="服务器名称">
              <input aria-label="服务器名称" value={agentName} onChange={(event) => setAgentName(event.target.value)} className={INPUT_CLS} />
            </Field>
            <Field label="注册令牌" hint="可选">
              <input aria-label="注册令牌" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} className={`${INPUT_CLS} font-mono`} />
            </Field>
          </div>
          <Field label="标签" hint="逗号分隔">
            <input aria-label="安装标签" value={tags} onChange={(event) => setTags(event.target.value)} className={INPUT_CLS} />
          </Field>
          {command ? (
            <div className="flex flex-col gap-2">
              <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted p-3 text-xs whitespace-pre-wrap break-all" aria-label="安装命令">{command}</pre>
              <Button type="button" variant="outline" size="sm" className="self-end" onClick={copyCommand}>
                <Copy data-icon="inline-start" />复制命令
              </Button>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>关闭</Button>
            <Button type="submit" size="sm"><WandSparkles data-icon="inline-start" />生成命令</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildInstallCommand(params: {
  scriptUrl: string;
  endpoint: string;
  token: string;
  name: string;
  tags: string;
}): string {
  const args = [
    `--endpoint ${shellQuote(params.endpoint)}`,
    `--name ${shellQuote(params.name)}`,
    ...(params.token ? [`--token ${shellQuote(params.token)}`] : []),
    ...(params.tags ? [`--tags ${shellQuote(params.tags)}`] : [])
  ];
  return `curl -fsSL ${shellQuote(params.scriptUrl)} | sudo bash -s -- \\\n  ${args.join(" \\\n  ")}`;
}

/** POSIX-safe single-quote escaping for generated shell arguments. */
function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

type DetailTone = "primary" | "cyan";

const DETAIL_TONE_CLASSES: Record<DetailTone, string> = {
  primary: "text-primary",
  cyan: "text-cyan"
};

/** Compact label/value pair for the secondary (non-ratio) stat strip. */
function Stat({ label, value, muted, tone }: { label: string; value: string; muted?: boolean; tone?: DetailTone }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("text-muted-foreground/70", tone && DETAIL_TONE_CLASSES[tone])}>{label}</span>
      <span className={cn("tabular-nums", muted ? "text-muted-foreground/50" : "text-foreground/80")}>{value}</span>
    </span>
  );
}

type ResourceTone = "cyan" | "violet" | "magenta";

const RESOURCE_TONE_CLASSES: Record<ResourceTone, string> = {
  cyan: "text-cyan",
  violet: "text-violet",
  magenta: "text-magenta"
};

function Metric({
  label,
  value,
  sub,
  ratio,
  tone
}: {
  label: string;
  value: string;
  sub?: string;
  ratio?: number;
  tone: ResourceTone;
}) {
  return (
    <div className="flex flex-col">
      <span className={cn("font-medium", RESOURCE_TONE_CLASSES[tone])}>{label}</span>
      <span className="tabular-nums">
        {value}
        {sub ? <span className="text-muted-foreground"> {sub}</span> : null}
      </span>
      {ratio !== undefined && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, ratio * 100)}%`,
              background: ratio > 0.85 ? "var(--danger)" : ratio > 0.65 ? "var(--warning)" : "var(--success)",
              boxShadow: `0 0 6px ${ratio > 0.85 ? "var(--danger)" : ratio > 0.65 ? "var(--warning)" : "var(--success)"}`
            }}
          />
        </div>
      )}
    </div>
  );
}
