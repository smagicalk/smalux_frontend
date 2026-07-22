import type {
  Account,
  AlertRule,
  NotificationChannel,
  PingTarget,
  Server,
  ServerMetrics,
  ServerStatus,
  Task
} from "@/shared/api/methods";
import { mockServers } from "./mock-servers";
import {
  mockAccounts,
  mockAlertHistory,
  mockAlertRules,
  mockCrons,
  mockDeploymentTargets,
  mockLogs,
  mockNotificationChannels,
  mockNotificationEvents,
  mockPingProbes,
  mockPingTargets,
  mockSettings,
  mockTaskTemplates,
  mockTasks,
  mockThemes,
  mockTokens
} from "./mock-data";

/**
 * A simulated real-time stream the mock backend can produce.
 *
 * A stream may push either one notification per tick (`sample`) or several
 * (`sampleBatch`). The transport prefers `sampleBatch` when present, calling
 * the handler once per item — used by the metrics stream so every subscribed
 * server advances every tick instead of one random server per second (which
 * left the union-axis cluster charts barely populated).
 */
export interface MockStream {
  intervalMs: number;
  sample?: () => unknown;
  sampleBatch?: () => unknown[];
  /** Optional one-shot backlog delivered immediately on subscribe, before the
   *  interval timer starts. Used by the metrics stream to seed each server's
   *  rolling history so charts have a shape on first paint instead of sitting
   *  empty until enough live ticks have landed. */
  initialBatch?: () => unknown[];
}

/**
 * The in-memory backend the MockTransport dispatches to. Mirrors what the
 * real server will implement: `handle` answers request/response calls,
 * `subscribe` returns a stream for server-push methods (or null if the
 * method is not a stream).
 */
export interface MockBackend {
  /**
   * Execute one method against in-memory fixtures. Params remain unknown at
   * this boundary because MockTransport owns the same schema-validation step as
   * real transports; the implementation narrows only after method dispatch.
   */
  handle(method: string, params: unknown): Promise<unknown>;
  /** Return a timed push source for stream methods, otherwise null. */
  subscribe(method: string, params: unknown): MockStream | null;
}

// ---------------------------------------------------------------------------
// Live metric simulation
// ---------------------------------------------------------------------------

interface ServerRuntime {
  cpu: number;
  memUsedRatio: number;
  netRx: number;
  netTx: number;
  uptime: number;
  /** Baseline ping latency (ms) per probe target; the live probe walks each
   *  around its own baseline so every line on the detail-page ping chart has a
   *  distinct, plausible shape. Offline servers time out every target (null)
   *  regardless of these baselines. */
  ping: Map<string, number>;
}

function seedRuntimes(servers: Server[]): Map<string, ServerRuntime> {
  const map = new Map<string, ServerRuntime>();
  for (const s of servers) {
    // Seed an independent baseline per target — nearer targets (gateway/DNS)
    // read lower, public/neighbor targets higher, so the multi-line chart
    // separates visually instead of stacking on top of itself.
    const ping = new Map<string, number>();
    for (const target of mockPingProbes[s.id] ?? []) {
      const base = target.startsWith("网关") || target.startsWith("DNS")
        ? 1 + Math.random() * 6
        : 15 + Math.random() * 80;
      ping.set(target, base);
    }
    map.set(s.id, {
      cpu: 0.1 + Math.random() * 0.4,
      memUsedRatio: 0.2 + Math.random() * 0.5,
      netRx: Math.random() * 2_000_000,
      netTx: Math.random() * 1_000_000,
      uptime: Math.floor(Math.random() * 30 * 24 * 3600),
      ping
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Stateful local implementation of the public RPC contract.
 *
 * Request routing, mutations and telemetry simulation deliberately share this
 * owner because live samples depend on the same server list and runtime maps as
 * administrative commands. Splitting each switch branch into separate service
 * objects before isolating that state would add synchronization and constructor
 * plumbing without creating a real module boundary. Domain fixtures and schemas
 * are already split; this class remains the small in-process composition root.
 */
class MockBackendImpl implements MockBackend {
  private servers: Server[];
  private runtimes: Map<string, ServerRuntime>;
  private deploymentCurrent: string = "nginx";

  constructor() {
    this.servers = mockServers;
    this.runtimes = seedRuntimes(this.servers);
  }

  async handle(method: string, params: unknown): Promise<unknown> {
    // Keep method names aligned with `methods.ts`. Each branch narrows its own
    // params after dispatch, mutates shared fixtures when it represents a
    // command, and returns raw data for MockTransport to validate. Unknown
    // methods fail fast so contract drift is visible during local development.
    switch (method) {
      case "system.ping":
        return { ok: true };

      case "agent.list": {
        const p = (params ?? {}) as {
          region?: string;
          status?: ServerStatus;
          search?: string;
        };
        let servers = this.servers;
        if (p.region) {
          servers = servers.filter((s) => s.region === p.region);
        }
        if (p.status) {
          servers = servers.filter((s) => s.status === p.status);
        }
        if (p.search) {
          const q = p.search.toLowerCase();
          servers = servers.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.region.toLowerCase().includes(q) ||
              s.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return { servers, total: servers.length };
      }

      case "agent.summary.subscribe":
        // subscribe method is handled by subscribe(); nothing to return here.
        return null;

      case "agent.ping.subscribe":
        // subscribe method is handled by subscribe(); nothing to return here.
        return null;

      case "agent.ping.history": {
        const p = (params ?? {}) as { serverId: string; range: "1h" | "6h" | "24h" | "7d" };
        return this.pingHistory(p.serverId, p.range);
      }

      case "agent.register": {
        const p = (params ?? {}) as {
          name: string;
          region?: string;
          note?: string;
          publicVisible?: boolean;
          tags?: string[];
          ipv4?: string;
          os?: string;
          arch?: string;
        };
        const id = `srv-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${this.servers.length}`;
        const server: Server = {
          id,
          name: p.name,
          // The server read model still exposes a displayable region string.
          // Real Agents replace this placeholder with discovered metadata.
          region: p.region?.trim() || "未分组",
          note: p.note ?? "",
          status: "online",
          publicVisible: p.publicVisible ?? true,
          tags: p.tags ?? [],
          os: p.os,
          arch: p.arch,
          agentVersion: "1.0.0",
          ipv4: p.ipv4,
          publicIpEnabled: true,
          publicIp: p.ipv4 ?? null,
          lastSeenAt: Date.now()
        };
        this.servers = [...this.servers, server];
        this.runtimes.set(id, {
          cpu: 0.1 + Math.random() * 0.4,
          memUsedRatio: 0.2 + Math.random() * 0.5,
          netRx: Math.random() * 2_000_000,
          netTx: Math.random() * 1_000_000,
          uptime: 0,
          // A freshly-registered server has no probe targets yet; the detail
          // chart shows "未配置探测点" until the operator configures some.
          ping: new Map()
        });
        return { ok: true };
      }

      case "agent.update": {
        const p = (params ?? {}) as {
          serverId: string;
          price: number | null;
          currency: string;
          expiresAt: number | null;
          billingCycle: Server["billingCycle"];
        };
        const current = this.servers.find((server) => server.id === p.serverId);
        if (!current) throw new Error(`mock: server not found ${p.serverId}`);

        // Replace only operator-owned commercial fields. Agent-discovered
        // identity and live status remain authoritative and untouched.
        this.servers = this.servers.map((server) => server.id === p.serverId
          ? {
              ...server,
              price: p.price,
              currency: p.currency,
              expiresAt: p.expiresAt,
              billingCycle: p.billingCycle
            }
          : server);
        return { ok: true };
      }

      case "task.list": {
        const p = (params ?? {}) as { status?: string; search?: string };
        let tasks = mockTasks;
        if (p.status) tasks = tasks.filter((t) => t.status === p.status);
        if (p.search) {
          const q = p.search.toLowerCase();
          tasks = tasks.filter(
            (t) => t.command.toLowerCase().includes(q) || t.serverName.toLowerCase().includes(q)
          );
        }
        return { tasks, total: tasks.length };
      }
      case "task.template.list":
        return { templates: mockTaskTemplates };

      case "cron.list":
        return { crons: mockCrons, total: mockCrons.length };

      case "monitor.service.list":
        return { targets: mockPingTargets, total: mockPingTargets.length };

      case "alert.list":
        return { rules: mockAlertRules, history: mockAlertHistory };

      case "notification.list":
        return { channels: mockNotificationChannels, events: mockNotificationEvents };

      case "log.list": {
        const p = (params ?? {}) as { search?: string; module?: string; result?: string };
        let logs = mockLogs;
        if (p.module) logs = logs.filter((l) => l.module === p.module);
        if (p.result) logs = logs.filter((l) => l.result === p.result);
        if (p.search) {
          const q = p.search.toLowerCase();
          logs = logs.filter(
            (l) =>
              l.action.toLowerCase().includes(q) ||
              l.actor.toLowerCase().includes(q) ||
              (l.detail ?? "").toLowerCase().includes(q)
          );
        }
        return { logs, total: logs.length };
      }

      case "token.list":
        return { tokens: mockTokens };

      case "account.list":
        return { accounts: mockAccounts, total: mockAccounts.length };

      case "theme.list":
        return { themes: mockThemes };

      case "config.list":
        return { settings: mockSettings };

      case "deployment.list":
        return { targets: mockDeploymentTargets, current: this.deploymentCurrent };

      // ---------------------------------------------------------------------
      // Mutations. Each returns { ok: true } and mutates the in-memory array;
      // the caller re-fetches the list to see the new state.
      // ---------------------------------------------------------------------
      case "task.dispatch": {
        const p = (params ?? {}) as { serverId: string; command: string; risk: string; scope: string };
        const server = this.servers.find((s) => s.id === p.serverId);
        mockTasks.unshift({
          id: `t${mockTasks.length + 1}`,
          serverId: p.serverId,
          serverName: server?.name ?? p.serverId,
          command: p.command,
          status: p.risk === "high" ? "pending" : "success",
          risk: p.risk as Task["risk"],
          scope: p.scope,
          startedAt: Date.now(),
          finishedAt: p.risk === "high" ? undefined : Date.now() + 1000,
          durationMs: p.risk === "high" ? undefined : 1000,
          exitCode: p.risk === "high" ? undefined : 0
        });
        return { ok: true };
      }
      case "task.approve": {
        const p = (params ?? {}) as { id: string };
        const t = mockTasks.find((x) => x.id === p.id);
        if (t) {
          t.status = "running";
          t.startedAt = Date.now();
          t.approver = "admin";
        }
        return { ok: true };
      }

      case "cron.create": {
        const p = (params ?? {}) as { name: string; serverId: string; expression: string; command: string };
        const server = this.servers.find((s) => s.id === p.serverId);
        mockCrons.unshift({
          id: `c${mockCrons.length + 1}`,
          name: p.name,
          serverId: p.serverId,
          serverName: server?.name ?? p.serverId,
          expression: p.expression,
          command: p.command,
          enabled: true,
          nextRunAt: Date.now() + 3600_000
        });
        return { ok: true };
      }
      case "cron.update": {
        const p = (params ?? {}) as { id: string; name: string; serverId: string; expression: string; command: string };
        const server = this.servers.find((s) => s.id === p.serverId);
        const c = mockCrons.find((x) => x.id === p.id);
        if (c) {
          Object.assign(c, {
            name: p.name,
            serverId: p.serverId,
            serverName: server?.name ?? p.serverId,
            expression: p.expression,
            command: p.command
          });
        }
        return { ok: true };
      }
      case "cron.toggle": {
        const p = (params ?? {}) as { id: string; enabled: boolean };
        const c = mockCrons.find((x) => x.id === p.id);
        if (c) c.enabled = p.enabled;
        return { ok: true };
      }
      case "cron.delete": {
        const p = (params ?? {}) as { id: string };
        const i = mockCrons.findIndex((x) => x.id === p.id);
        if (i >= 0) mockCrons.splice(i, 1);
        return { ok: true };
      }

      case "monitor.service.create": {
        const p = (params ?? {}) as { name: string; address: string; protocol: string; group: string };
        mockPingTargets.unshift({
          id: `p${mockPingTargets.length + 1}`,
          name: p.name,
          address: p.address,
          protocol: p.protocol as PingTarget["protocol"],
          group: p.group as PingTarget["group"],
          enabled: true,
          latencyMs: Math.floor(Math.random() * 80) + 5,
          uptime: 1,
          lastCheckAt: Date.now(),
          lastOk: true
        });
        return { ok: true };
      }
      case "monitor.service.delete": {
        const p = (params ?? {}) as { id: string };
        const i = mockPingTargets.findIndex((x) => x.id === p.id);
        if (i >= 0) mockPingTargets.splice(i, 1);
        return { ok: true };
      }

      case "alert.create": {
        const p = (params ?? {}) as {
          name: string; metric: string; operator: string; threshold: number;
          windowSec: number; severity: string; serverId?: string;
        };
        mockAlertRules.unshift({
          id: `a${mockAlertRules.length + 1}`,
          name: p.name,
          serverId: p.serverId,
          metric: p.metric,
          operator: p.operator as AlertRule["operator"],
          threshold: p.threshold,
          windowSec: p.windowSec,
          severity: p.severity as AlertRule["severity"],
          enabled: true,
          silenced: false
        });
        return { ok: true };
      }
      case "alert.silence": {
        const p = (params ?? {}) as { id: string; silenced: boolean };
        const r = mockAlertRules.find((x) => x.id === p.id);
        if (r) r.silenced = p.silenced;
        return { ok: true };
      }
      case "alert.delete": {
        const p = (params ?? {}) as { id: string };
        const i = mockAlertRules.findIndex((x) => x.id === p.id);
        if (i >= 0) mockAlertRules.splice(i, 1);
        return { ok: true };
      }

      case "notification.create": {
        const p = (params ?? {}) as { name: string; type: string; endpoint: string };
        mockNotificationChannels.unshift({
          id: `n${mockNotificationChannels.length + 1}`,
          name: p.name,
          type: p.type as NotificationChannel["type"],
          enabled: true,
          endpoint: p.endpoint
        });
        return { ok: true };
      }
      case "notification.toggle": {
        const p = (params ?? {}) as { id: string; enabled: boolean };
        const c = mockNotificationChannels.find((x) => x.id === p.id);
        if (c) c.enabled = p.enabled;
        return { ok: true };
      }

      case "token.create": {
        const p = (params ?? {}) as { name: string; scopes: string[]; expiresAt?: number };
        mockTokens.unshift({
          id: `tk${mockTokens.length + 1}`,
          name: p.name,
          scopes: p.scopes,
          createdAt: Date.now(),
          expiresAt: p.expiresAt,
          createdBy: "admin",
          revoked: false
        });
        return { ok: true };
      }
      case "token.revoke": {
        const p = (params ?? {}) as { id: string };
        const t = mockTokens.find((x) => x.id === p.id);
        if (t) t.revoked = true;
        return { ok: true };
      }

      case "account.invite": {
        const p = (params ?? {}) as { username: string; role: string };
        mockAccounts.unshift({
          id: `u${mockAccounts.length + 1}`,
          username: p.username,
          role: p.role as Account["role"],
          status: "invited",
          mfaEnabled: false,
          passkeyEnabled: false,
          sessions: 0
        });
        return { ok: true };
      }
      case "account.lock": {
        const p = (params ?? {}) as { id: string; locked: boolean };
        const a = mockAccounts.find((x) => x.id === p.id);
        if (a) a.status = p.locked ? "locked" : "active";
        return { ok: true };
      }

      case "account.update": {
        const p = (params ?? {}) as { id: string; role: Account["role"] };
        const a = mockAccounts.find((x) => x.id === p.id);
        if (a) a.role = p.role;
        return { ok: true };
      }

      case "theme.upload": {
        const p = (params ?? {}) as { name: string; version: string };
        mockThemes.unshift({
          id: `th${mockThemes.length + 1}`,
          name: p.name,
          status: "draft",
          publicVisible: false,
          version: p.version,
          updatedAt: Date.now(),
          author: "admin"
        });
        return { ok: true };
      }
      case "theme.publish": {
        const p = (params ?? {}) as { id: string };
        const t = mockThemes.find((x) => x.id === p.id);
        if (t) { t.status = "published"; t.updatedAt = Date.now(); }
        return { ok: true };
      }
      case "theme.archive": {
        const p = (params ?? {}) as { id: string };
        const t = mockThemes.find((x) => x.id === p.id);
        if (t) { t.status = "archived"; t.updatedAt = Date.now(); }
        return { ok: true };
      }

      case "config.update": {
        const p = (params ?? {}) as { key: string; value: string };
        const s = mockSettings.find((x) => x.key === p.key);
        if (s) s.value = p.value;
        return { ok: true };
      }

      case "deployment.switch": {
        const p = (params ?? {}) as { mode: string };
        this.deploymentCurrent = p.mode;
        const t = mockDeploymentTargets.find((x) => x.mode === p.mode);
        if (t) { t.status = "building"; t.updatedAt = Date.now(); }
        return { ok: true };
      }

      default:
        throw new Error(`mock: unknown method ${method}`);
    }
  }

  subscribe(method: string, params: unknown): MockStream | null {
    // Only methods with real server-push equivalents belong here. Read methods
    // stay in handle(), which keeps hook behavior identical across mock and real
    // transports instead of introducing mock-only polling semantics.
    if (method === "agent.summary.subscribe") {
      const p = (params ?? {}) as { serverIds?: string[] };
      const targetIds = p.serverIds ?? this.servers.map((s) => s.id);
      return this.summaryStream(targetIds);
    }
    if (method === "agent.ping.subscribe") {
      const p = (params ?? {}) as { serverIds?: string[] };
      const targetIds = p.serverIds ?? this.servers.map((s) => s.id);
      return this.pingStream(targetIds);
    }
    return null;
  }

  /** The dedicated ping-latency stream. Separate from the resource metrics so a
   *  detail page can show a "延迟检测" chart of its own without coupling probe
   *  cadence to the 2s metrics tick. Offline servers time out (null) so the
   *  chart draws a gap instead of a flat 0. */
  private pingStream(serverIds: string[]): MockStream {
    return {
      intervalMs: 2000,
      sampleBatch: () => {
        const ts = Date.now();
        const out: unknown[] = [];
        for (const id of serverIds) {
          const m = this.pingSnapshot(id, ts);
          if (m) out.push(m);
        }
        return out;
      },
      initialBatch: () => this.seedPingHistory(serverIds)
    };
  }

  /** Back-dated ping history, oldest first — mirrors seedHistory so the ping
   *  chart has a shape on first paint instead of building up one tick at a time. */
  private seedPingHistory(serverIds: string[]): unknown[] {
    const steps = 30;
    const interval = 2000;
    const now = Date.now();
    const out: unknown[] = [];
    for (let i = steps; i > 0; i--) {
      const ts = now - i * interval;
      for (const id of serverIds) {
        const m = this.pingSnapshot(id, ts);
        if (m) out.push(m);
      }
    }
    return out;
  }

  /** One ping probe cycle for a server: walks each target's baseline latency
   *  with independent jitter, times out every target (null) for offline boxes.
   *  Mutates `rt.ping` per target so each line drifts on its own — a congested
   *  hop to one neighbor reads as one climbing line, not all of them. */
  private pingSnapshot(serverId: string, ts: number): { serverId: string; ts: number; probes: { target: string; latencyMs: number | null }[] } | null {
    const server = this.servers.find((s) => s.id === serverId);
    if (!server) return null;
    const rt = this.runtimes.get(serverId);
    if (!rt) return null;
    const targets = mockPingProbes[serverId] ?? [];
    // Offline → every target times out. We still emit a sample (with nulls) so
    // the store advances the timestamp axis and each line shows its gap.
    if (server.status === "offline") {
      return { serverId, ts, probes: targets.map((target) => ({ target, latencyMs: null })) };
    }
    const probes = targets.map((target) => {
      const prev = rt.ping.get(target);
      // A target with no seeded baseline (e.g. a freshly-registered server
      // whose probes were configured after seed) gets one on first probe.
      const base = prev ?? (target.startsWith("网关") || target.startsWith("DNS") ? 2 : 30);
      // Random walk around the baseline, clamped to a sane RTT band. Occasional
      // spikes (1 in ~20) simulate jitter from a congested hop.
      const spike = Math.random() < 0.05 ? Math.random() * 120 : 0;
      const next = clamp(base + (Math.random() - 0.5) * 8, 1, 300);
      rt.ping.set(target, next);
      return { target, latencyMs: Math.round(next + spike) };
    });
    return { serverId, ts, probes };
  }

  /** Downsampled historical ping series for a fixed range. Independent of the
   *  live stream: it reads each target's current baseline as a starting point
   *  and walks a *local copy* backward in time, never writing back to rt.ping,
   *  so querying history doesn't perturb the live trend. Offline boxes return
   *  all-null probes across the window. Point count is capped (~150) so a 7-day
   *  window stays a legible line, not 300k raw samples. */
  private pingHistory(
    serverId: string,
    range: "1h" | "6h" | "24h" | "7d"
  ): { serverId: string; range: "1h" | "6h" | "24h" | "7d"; intervalMs: number; samples: { serverId: string; ts: number; probes: { target: string; latencyMs: number | null }[] }[] } {
    const server = this.servers.find((s) => s.id === serverId);
    const rt = this.runtimes.get(serverId);
    const targets = mockPingProbes[serverId] ?? [];
    // Range → {span ms, bucket ms, point count}. Bucket = span / ~150 so every
    // range draws roughly the same number of points.
    const cfg: Record<typeof range, { spanMs: number; bucketMs: number }> = {
      "1h": { spanMs: 3_600_000, bucketMs: 24_000 },
      "6h": { spanMs: 21_600_000, bucketMs: 150_000 },
      "24h": { spanMs: 86_400_000, bucketMs: 600_000 },
      "7d": { spanMs: 604_800_000, bucketMs: 3_600_000 }
    };
    const { spanMs, bucketMs } = cfg[range];
    const points = Math.round(spanMs / bucketMs);
    const now = Date.now();
    const offline = server ? server.status === "offline" : false;

    // Local baseline copy per target — seeded from the live baseline so history
    // continues plausibly from where the live trend is, then walked backward.
    const base = new Map<string, number>();
    for (const target of targets) base.set(target, rt?.ping.get(target) ?? (target.startsWith("网关") || target.startsWith("DNS") ? 2 : 30));

    const samples: { serverId: string; ts: number; probes: { target: string; latencyMs: number | null }[] }[] = [];
    for (let i = points - 1; i >= 0; i--) {
      const ts = now - i * bucketMs;
      const probes = offline
        ? targets.map((target) => ({ target, latencyMs: null }))
        : targets.map((target) => {
            const prev = base.get(target) ?? 30;
            // Walk the local baseline; a wider bucket → larger step variance so
            // long windows still show movement rather than a flat line. The
            // day/week windows add a slow sinusoidal diurnal-ish component so
            // the trend reads as a load pattern over time, not uniform noise.
            const diurnal = range === "24h" || range === "7d"
              ? Math.sin((ts / (range === "7d" ? 86_400_000 : 3_600_000)) * Math.PI * 2) * prev * 0.25
              : 0;
            const next = clamp(prev + (Math.random() - 0.5) * Math.max(4, bucketMs / 1000) + diurnal * 0.05, 1, 300);
            base.set(target, next);
            const spike = Math.random() < 0.04 ? Math.random() * 100 : 0;
            return { target, latencyMs: Math.round(next + spike) };
          });
      samples.push({ serverId, ts, probes });
    }
    return { serverId, range, intervalMs: bucketMs, samples };
  }

  private summaryStream(serverIds: string[]): MockStream {
    return {
      intervalMs: 2000,
      // Push a fresh sample for EVERY subscribed server each tick. The store
      // merges by id, so this keeps every server's rolling history dense and
      // the cluster-union charts (CPU trend / throughput / KPI sparklines)
      // populate evenly instead of flickering on a single random node.
      sampleBatch: () => {
        const ts = Date.now();
        const out: unknown[] = [];
        for (const id of serverIds) {
          const m = this.snapshot(id, ts);
          if (m) out.push(m);
        }
        return out;
      },
      // Seed ~30 back-dated samples per server so the trend/sparkline charts
      // have a real shape on first paint. Each step walks the runtime slightly
      // (mirroring snapshot's random walk) so the back-history looks alive
      // rather than a flat line, then the live ticks continue from there.
      initialBatch: () => this.seedHistory(serverIds)
    };
  }

  /** Build a back-dated history for every server, oldest first. */
  private seedHistory(serverIds: string[]): unknown[] {
    const steps = 30;
    const interval = 2000;
    const now = Date.now();
    const out: unknown[] = [];
    for (let i = steps; i > 0; i--) {
      const ts = now - i * interval;
      for (const id of serverIds) {
        const m = this.snapshot(id, ts);
        if (m) out.push(m);
      }
    }
    return out;
  }

  private snapshot(serverId: string, ts: number): ServerMetrics | null {
    const server = this.servers.find((s) => s.id === serverId);
    if (!server) return null;
    const rt = this.runtimes.get(serverId);
    if (!rt) return null;

    // Random walk so the charts look alive but bounded.
    rt.cpu = clamp(rt.cpu + (Math.random() - 0.5) * 0.1, 0.02, 0.99);
    rt.memUsedRatio = clamp(rt.memUsedRatio + (Math.random() - 0.5) * 0.03, 0.05, 0.95);
    rt.netRx = Math.max(0, rt.netRx + (Math.random() - 0.5) * 400_000);
    rt.netTx = Math.max(0, rt.netTx + (Math.random() - 0.5) * 200_000);
    rt.uptime += 1;

    const memTotal = 8 * 1024 ** 3; // 8 GiB
    const diskTotal = 100 * 1024 ** 3; // 100 GiB
    const diskIoEnabled = server.id !== "srv-sha-01";
    const diskIo = diskIoEnabled
      ? {
          readSpeed: Math.random() * 50 * 1024 * 1024,
          writeSpeed: Math.random() * 30 * 1024 * 1024
        }
      : null;

    // Per-core values oscillate around cpuUsage. CPU total is an average across
    // logical cores, whereas network and disk totals below are additive sums.
    const cpuCoreCount = server.arch === "arm64" ? 8 : 4;
    const coreWave = Array.from(
      { length: cpuCoreCount },
      (_, index) => Math.sin(ts / 4_000 + index)
    );
    const waveMean = coreWave.reduce((sum, value) => sum + value, 0) / cpuCoreCount;
    const maxDelta = Math.max(...coreWave.map((value) => Math.abs(value - waveMean)), 1);
    // Center and scale the wave before adding it to the aggregate. Centering
    // makes the core average exactly cpuUsage; limiting amplitude by distance
    // to 0/1 keeps every individual core inside the valid ratio range.
    const coreAmplitude = Math.max(0, Math.min(0.12, rt.cpu - 0.01, 1 - rt.cpu));
    const cpuCores = coreWave.map((value, index) => ({
      name: `CPU ${index}`,
      usage: rt.cpu + ((value - waveMean) / maxDelta) * coreAmplitude
    }));
    const primaryNetworkRatio = 0.82;
    const networkInterfaces = [
      {
        name: "eth0",
        rxSpeed: rt.netRx * primaryNetworkRatio,
        txSpeed: rt.netTx * primaryNetworkRatio,
        rxTotal: rt.netRx * 60 * primaryNetworkRatio,
        txTotal: rt.netTx * 60 * primaryNetworkRatio
      },
      {
        name: "wg0",
        rxSpeed: rt.netRx * (1 - primaryNetworkRatio),
        txSpeed: rt.netTx * (1 - primaryNetworkRatio),
        rxTotal: rt.netRx * 60 * (1 - primaryNetworkRatio),
        txTotal: rt.netTx * 60 * (1 - primaryNetworkRatio)
      }
    ];
    const disks = [
      {
        name: "/dev/vda1",
        mountPoint: "/",
        used: 22 * 1024 ** 3,
        total: 40 * 1024 ** 3,
        readSpeed: diskIo ? diskIo.readSpeed * 0.7 : null,
        writeSpeed: diskIo ? diskIo.writeSpeed * 0.7 : null
      },
      {
        name: "/dev/vdb1",
        mountPoint: "/data",
        used: 18 * 1024 ** 3,
        total: 60 * 1024 ** 3,
        readSpeed: diskIo ? diskIo.readSpeed * 0.3 : null,
        writeSpeed: diskIo ? diskIo.writeSpeed * 0.3 : null
      }
    ];
    // Representative process snapshot for the sortable detail panel. Values
    // change on every metrics tick, while pid/name stay stable so rows do not
    // visually jump unless the selected sort metric genuinely changes rank.
    const processSeeds = [
      { pid: 812, name: "smalux-agent", cpu: 0.08, mem: 96, net: 0.18 },
      { pid: 1042, name: "postgres", cpu: 0.16, mem: 640, net: 0.28 },
      { pid: 1180, name: "nginx", cpu: 0.11, mem: 84, net: 0.38 },
      { pid: 1328, name: "redis-server", cpu: 0.07, mem: 256, net: 0.09 },
      { pid: 1464, name: "node", cpu: 0.13, mem: 384, net: 0.22 },
      { pid: 1, name: "systemd", cpu: 0.01, mem: 32, net: 0.01 }
    ];
    const processes = processSeeds.map((process, index) => {
      const activity = 0.75 + Math.abs(Math.sin(ts / 5_000 + index)) * 0.5;
      return {
        pid: process.pid,
        name: process.name,
        cpuUsage: clamp(process.cpu * activity, 0, 1),
        memUsed: process.mem * activity * 1024 ** 2,
        netRxSpeed: rt.netRx * process.net * activity,
        netTxSpeed: rt.netTx * process.net * activity
      };
    });

    return {
      serverId,
      cpuUsage: rt.cpu,
      cpuCores,
      memUsed: rt.memUsedRatio * memTotal,
      memTotal,
      swapUsed: 0,
      swapTotal: 0,
      diskUsed: 0.4 * diskTotal,
      diskTotal,
      loadOne: rt.cpu * 4,
      loadFive: rt.cpu * 3.5,
      loadFifteen: rt.cpu * 3,
      netRxSpeed: rt.netRx,
      netTxSpeed: rt.netTx,
      netRxTotal: rt.netRx * 60,
      netTxTotal: rt.netTx * 60,
      networkInterfaces,
      uptime: rt.uptime,
      processCount: 80 + Math.floor(Math.random() * 60),
      processesEnabled: true,
      processes,
      // The switchable metrics: each is gated by its own flag. A couple of
      // nodes turn collection off (UDP on sgp-02, disk IO + TCP on sha-01)
      // so the "关闭统计" empty state has live data to render against. The
      // decision is keyed on the stable server id, not a per-tick random —
      // otherwise the on/off state would flicker every snapshot.
      tcpEnabled: server.id !== "srv-sha-01",
      tcpConnections: server.id === "srv-sha-01" ? null : 20 + Math.floor(Math.random() * 200),
      udpEnabled: server.id !== "srv-sgp-02",
      udpConnections: server.id === "srv-sgp-02" ? null : 5 + Math.floor(Math.random() * 80),
      diskIoEnabled,
      diskIo,
      disks,
      ts
    };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function createMockBackend(): MockBackend {
  // Runtime metrics and deployment selection are scoped to this backend
  // instance. Imported fixture collections remain the shared demo data source.
  return new MockBackendImpl();
}
