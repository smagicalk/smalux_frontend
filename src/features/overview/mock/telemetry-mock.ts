import type { TimeRange, TelemetryPoint, TelemetrySummary } from "../types";

/**
 * Dedicated mock telemetry dataset generator.
 * Provides distinct granularities and realistic historical sinusoidal waves
 * for every supported time range (from 15m to 1y).
 */

interface RangeConfig {
  count: number;
  stepMs: number;
  format: "time" | "dayTime" | "date";
  name: string;
}

export const TIME_RANGE_CONFIGS: Record<Exclude<TimeRange, "live">, RangeConfig> = {
  "15m": { count: 15, stepMs: 60_000, format: "time", name: "最近 15 分钟 (15m)" },
  "1h": { count: 18, stepMs: 200_000, format: "time", name: "最近 1 小时 (1h)" },
  "6h": { count: 18, stepMs: 1_200_000, format: "dayTime", name: "最近 6 小时 (6h)" },
  "24h": { count: 24, stepMs: 3_600_000, format: "dayTime", name: "最近 24 小时 (24h)" },
  "7d": { count: 21, stepMs: 28_800_000, format: "date", name: "最近 7 天 (7d)" },
  "30d": { count: 30, stepMs: 86_400_000, format: "date", name: "最近 30 天 (1月)" },
  "90d": { count: 30, stepMs: 259_200_000, format: "date", name: "最近 90 天 (3月)" },
  "1y": { count: 24, stepMs: 1_314_000_000, format: "date", name: "最近 1 年 (1y)" }
};

/**
 * Generates deterministic or baseline-weighted historical telemetry series
 */
export function getMockTelemetryByRange(
  range: TimeRange,
  baseCpu = 32,
  baseMem = 55
): TelemetryPoint[] {
  const now = Date.now();

  if (range === "live") {
    // 14 real-time sliding buffer points (2s interval)
    return Array.from({ length: 14 }, (_, i) => {
      const t = new Date(now - (13 - i) * 2000);
      const timeStr = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
      return {
        time: timeStr,
        timestamp: t.getTime(),
        cpu: 30 + Math.floor(Math.random() * 8),
        memory: 56 + Math.floor(Math.random() * 4),
        ingress: 720 + Math.floor(Math.random() * 140),
        egress: 520 + Math.floor(Math.random() * 110),
        diskWrite: 210 + Math.floor(Math.random() * 40),
        diskRead: 160 + Math.floor(Math.random() * 30)
      };
    });
  }

  const { count, stepMs, format } = TIME_RANGE_CONFIGS[range];

  return Array.from({ length: count }, (_, i) => {
    const t = new Date(now - (count - 1 - i) * stepMs);
    const timeStr =
      format === "time"
        ? `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`
        : format === "dayTime"
        ? `${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")} ${String(t.getHours()).padStart(2, "0")}:00`
        : `${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;

    // Sinusoidal diurnal wave
    const wave = Math.sin((i / count) * Math.PI * 3);
    const noise = Math.sin(i * 1.7) * 4;

    const cpu = Math.min(95, Math.max(12, Math.round(baseCpu + wave * 14 + noise)));
    const memory = Math.min(92, Math.max(30, Math.round(baseMem + wave * 6 + noise * 0.5)));
    const ingress = Math.max(120, Math.round(cpu * 22 + wave * 180 + 120));
    const egress = Math.max(80, Math.round(cpu * 16 + wave * 140 + 90));
    const diskWrite = Math.max(30, Math.round(cpu * 5.8 + wave * 60 + 40));
    const diskRead = Math.max(20, Math.round(cpu * 4.2 + wave * 45 + 30));

    return {
      time: timeStr,
      timestamp: t.getTime(),
      cpu,
      memory,
      ingress,
      egress,
      diskWrite,
      diskRead
    };
  });
}

/**
 * Calculates statistical summary (average, peak, P95) for a given series and metric
 */
export function computeTelemetrySummary(
  series: TelemetryPoint[],
  metricType: "compute" | "traffic" | "disk"
): TelemetrySummary {
  if (!series.length) {
    return { avg: 0, peak: 0, p95: 0, val2Avg: 0, val2Peak: 0 };
  }

  if (metricType === "compute") {
    const cpus = series.map((s) => s.cpu);
    const mems = series.map((s) => s.memory);
    const sortedCpus = [...cpus].sort((a, b) => a - b);
    const p95Idx = Math.floor(sortedCpus.length * 0.95);
    return {
      avg: Math.round(cpus.reduce((a, b) => a + b, 0) / cpus.length),
      peak: Math.max(...cpus),
      p95: sortedCpus[p95Idx] || sortedCpus[sortedCpus.length - 1],
      val2Avg: Math.round(mems.reduce((a, b) => a + b, 0) / mems.length),
      val2Peak: Math.max(...mems)
    };
  }

  if (metricType === "traffic") {
    const ingressList = series.map((s) => s.ingress);
    const egressList = series.map((s) => s.egress);
    const sortedIngress = [...ingressList].sort((a, b) => a - b);
    const p95Idx = Math.floor(sortedIngress.length * 0.95);
    return {
      avg: Math.round(ingressList.reduce((a, b) => a + b, 0) / ingressList.length),
      peak: Math.max(...ingressList),
      p95: sortedIngress[p95Idx] || sortedIngress[sortedIngress.length - 1],
      val2Avg: Math.round(egressList.reduce((a, b) => a + b, 0) / egressList.length),
      val2Peak: Math.max(...egressList)
    };
  }

  const writes = series.map((s) => s.diskWrite);
  const reads = series.map((s) => s.diskRead);
  const sortedWrites = [...writes].sort((a, b) => a - b);
  const p95Idx = Math.floor(sortedWrites.length * 0.95);
  return {
    avg: Math.round(writes.reduce((a, b) => a + b, 0) / writes.length),
    peak: Math.max(...writes),
    p95: sortedWrites[p95Idx] || sortedWrites[sortedWrites.length - 1],
    val2Avg: Math.round(reads.reduce((a, b) => a + b, 0) / reads.length),
    val2Peak: Math.max(...reads)
  };
}
