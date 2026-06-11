export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatLatency(value: number) {
  return `${Math.round(value)} ms`;
}

export function formatMbps(value: number) {
  return `${value.toFixed(1)} Mbps`;
}
