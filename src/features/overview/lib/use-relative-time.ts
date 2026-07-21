import { useEffect, useState } from "react";

/**
 * "刚刚 / 3 分钟前 / 离线 12 分钟" — relative time for a timestamp.
 * `now` lives in state (seeded once, ticked by a 15s effect) so the render
 * stays pure — same shape as LiveClock. Refreshes every 15s rather than 1s
 * since relative phrasing only changes that fast.
 */
export function useRelativeTime(ts: number | undefined): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  if (!ts) return "未知";
  const diff = now - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}
